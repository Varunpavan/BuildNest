import logging
from datetime import datetime, timezone
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo import DESCENDING

from app.api.deps import get_current_user
from app.core.concurrency import concurrency_manager
from app.core.database import get_projects_collection
from app.schemas.project import serialize_project, serialize_project_summary
from app.services.gemini_service import generate_page

logger = logging.getLogger("buildnest.projects")

router = APIRouter(prefix="/projects", tags=["projects"])


def parse_object_id(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except (InvalidId, TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID format."
        )


@router.get("")
async def get_projects(current_user: dict = Depends(get_current_user)):
    """
    Returns all projects belonging to the logged-in user, sorted by most recently edited.
    """
    projects_coll = get_projects_collection()
    cursor = projects_coll.find(
        {"user": current_user["_id"]},
        projection={"title": 1, "code": 1, "updatedAt": 1}
    ).sort("updatedAt", DESCENDING)

    projects = await cursor.to_list(length=500)
    return {
        "success": True,
        "projects": [serialize_project_summary(p) for p in projects]
    }


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_project(payload: dict = None, current_user: dict = Depends(get_current_user)):
    """
    Creates a new empty project for the user.
    """
    payload = payload or {}
    raw_title = payload.get("title")
    title = str(raw_title).strip()[:80] if raw_title else "Untitled project"

    now = datetime.now(timezone.utc)
    new_doc = {
        "user": current_user["_id"],
        "title": title or "Untitled project",
        "code": "",
        "messages": [],
        "createdAt": now,
        "updatedAt": now
    }

    projects_coll = get_projects_collection()
    result = await projects_coll.insert_one(new_doc)
    new_doc["_id"] = result.inserted_id

    return {
        "success": True,
        "project": serialize_project(new_doc)
    }


@router.get("/{id}")
async def get_project(id: str, current_user: dict = Depends(get_current_user)):
    """
    Fetches a single project with its code and full chat messages.
    """
    project_oid = parse_object_id(id)
    projects_coll = get_projects_collection()

    project = await projects_coll.find_one({"_id": project_oid, "user": current_user["_id"]})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found."
        )

    return {
        "success": True,
        "project": serialize_project(project)
    }


@router.put("/{id}")
async def update_project(id: str, payload: dict = None, current_user: dict = Depends(get_current_user)):
    """
    Updates the title or code of an existing project.
    """
    project_oid = parse_object_id(id)
    payload = payload or {}
    projects_coll = get_projects_collection()

    project = await projects_coll.find_one({"_id": project_oid, "user": current_user["_id"]})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found."
        )

    update_fields = {"updatedAt": datetime.now(timezone.utc)}

    if "title" in payload and isinstance(payload["title"], str):
        clean_title = payload["title"].strip()
        update_fields["title"] = clean_title[:80] if clean_title else "Untitled project"

    if "code" in payload and isinstance(payload["code"], str):
        update_fields["code"] = payload["code"]

    await projects_coll.update_one({"_id": project_oid}, {"$set": update_fields})

    # Merge updated fields for response
    project.update(update_fields)

    return {
        "success": True,
        "project": serialize_project(project)
    }


@router.delete("/{id}")
async def delete_project(id: str, current_user: dict = Depends(get_current_user)):
    """
    Permanently deletes a project owned by the user.
    """
    project_oid = parse_object_id(id)
    projects_coll = get_projects_collection()

    result = await projects_coll.delete_one({"_id": project_oid, "user": current_user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found."
        )

    return {
        "success": True,
        "message": "Project deleted."
    }


@router.post("/{id}/generate")
async def generate_project(id: str, payload: dict = None, current_user: dict = Depends(get_current_user)):
    """
    Sends user prompt and existing code to Gemini to generate or refine the page.
    """
    project_oid = parse_object_id(id)
    payload = payload or {}

    prompt = payload.get("prompt")
    if not prompt or not isinstance(prompt, str) or not prompt.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Describe what you want to build or change first."
        )

    clean_prompt = prompt.strip()
    if len(clean_prompt) > 2000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="That prompt is too long. Keep it under 2000 characters."
        )

    # Concurrency guard: Ensure one build at a time per project
    lock_acquired = await concurrency_manager.acquire(id)
    if not lock_acquired:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A build is already in progress for this project. Please wait a moment."
        )

    projects_coll = get_projects_collection()

    try:
        project = await projects_coll.find_one({"_id": project_oid, "user": current_user["_id"]})
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found."
            )

        # Send recent history for conversational continuity
        existing_messages = project.get("messages", [])
        recent_history = existing_messages[-6:]

        result = await generate_page(
            prompt=clean_prompt,
            current_code=project.get("code", ""),
            history=recent_history
        )

        now = datetime.now(timezone.utc)
        user_msg = {
            "_id": ObjectId(),
            "role": "user",
            "text": clean_prompt,
            "createdAt": now
        }
        ai_msg = {
            "_id": ObjectId(),
            "role": "ai",
            "text": result["summary"],
            "createdAt": now
        }

        updated_messages = list(existing_messages)
        updated_messages.extend([user_msg, ai_msg])

        update_data = {
            "code": result["html"],
            "messages": updated_messages,
            "updatedAt": now
        }

        # Auto-name project if currently untitled
        if project.get("title") == "Untitled project" and result.get("title"):
            update_data["title"] = result["title"][:80]

        await projects_coll.update_one({"_id": project_oid}, {"$set": update_data})
        project.update(update_data)

        return {
            "success": True,
            "project": serialize_project(project)
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Generation error on project {id}: {exc}")
        error_str = str(exc).lower()

        # Check for quota or rate limit exhaustion
        if "429" in error_str or "quota" in error_str or "resource_exhausted" in error_str:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="The AI is busy right now. Wait a minute and try again."
            )

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The AI could not build that. Try again, or word the request a little differently."
        )
    finally:
        await concurrency_manager.release(id)
