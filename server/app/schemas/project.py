import re
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class MessageOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(None, alias="_id")
    role: str
    text: str
    createdAt: Optional[str] = None


class ProjectOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(..., alias="_id")
    user: Optional[str] = None
    title: str = "Untitled project"
    code: str = ""
    messages: List[MessageOut] = []
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None


class ProjectListItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(..., alias="_id")
    title: str
    code: str = ""
    updatedAt: Optional[str] = None


class ProjectCreateRequest(BaseModel):
    title: Optional[str] = Field(None, max_length=80)


class ProjectUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, max_length=80)
    code: Optional[str] = None


class GenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000, description="Page description or modification request")


def serialize_message(msg: dict) -> dict:
    created = msg.get("createdAt")
    created_str = created.isoformat() if isinstance(created, datetime) else (str(created) if created else "")
    res = {
        "role": msg.get("role", "user"),
        "text": msg.get("text", ""),
        "createdAt": created_str
    }
    if "_id" in msg and msg["_id"]:
        res["_id"] = str(msg["_id"])
    return res


def serialize_project(doc: dict) -> dict:
    created = doc.get("createdAt")
    updated = doc.get("updatedAt")
    code = doc.get("code", "")
    if code and re.search(r"nxt\s*[-_]?\s*build", code, re.IGNORECASE):
        code = re.sub(r"nxt\s*[-_]?\s*build", "BuildNest", code, flags=re.IGNORECASE)
    return {
        "_id": str(doc["_id"]),
        "user": str(doc.get("user", "")),
        "title": doc.get("title", "Untitled project"),
        "code": code,
        "messages": [serialize_message(m) for m in doc.get("messages", [])],
        "createdAt": created.isoformat() if isinstance(created, datetime) else (str(created) if created else ""),
        "updatedAt": updated.isoformat() if isinstance(updated, datetime) else (str(updated) if updated else "")
    }


def serialize_project_summary(doc: dict) -> dict:
    updated = doc.get("updatedAt")
    return {
        "_id": str(doc["_id"]),
        "title": doc.get("title", "Untitled project"),
        "code": doc.get("code", ""),
        "updatedAt": updated.isoformat() if isinstance(updated, datetime) else (str(updated) if updated else "")
    }
