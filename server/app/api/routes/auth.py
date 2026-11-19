import re
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_user
from app.core.database import get_users_collection
from app.core.security import create_access_token, hash_password, verify_password
from app.schemas.auth import LoginRequest, SignupRequest

router = APIRouter(prefix="/auth", tags=["auth"])

EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(payload: dict):
    """
    Creates a new user account with hashed password and returns an auth session.
    """
    name = payload.get("name")
    email = payload.get("email")
    password = payload.get("password")

    if not name or not email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name, email and password are all required."
        )

    clean_email = str(email).strip().lower()
    if not EMAIL_REGEX.match(clean_email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter a valid email address."
        )

    if len(str(password)) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password needs at least 6 characters."
        )

    users = get_users_collection()
    existing_user = await users.find_one({"email": clean_email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists. Try logging in."
        )

    now = datetime.now(timezone.utc)
    hashed_pwd = hash_password(str(password))

    new_user = {
        "name": str(name).strip()[:50],
        "email": clean_email,
        "password": hashed_pwd,
        "createdAt": now,
        "updatedAt": now
    }

    result = await users.insert_one(new_user)
    user_id = str(result.inserted_id)

    return {
        "success": True,
        "token": create_access_token(user_id),
        "user": {
            "id": user_id,
            "name": new_user["name"],
            "email": new_user["email"]
        }
    }


@router.post("/login")
async def login(payload: dict):
    """
    Authenticates user credentials and returns an active JWT token.
    """
    email = payload.get("email")
    password = payload.get("password")

    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter your email and password."
        )

    clean_email = str(email).strip().lower()
    users = get_users_collection()
    user = await users.find_one({"email": clean_email})

    invalid_msg = "Email or password is incorrect."

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=invalid_msg
        )

    if not verify_password(str(password), user.get("password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=invalid_msg
        )

    user_id = str(user["_id"])
    return {
        "success": True,
        "token": create_access_token(user_id),
        "user": {
            "id": user_id,
            "name": user["name"],
            "email": user["email"]
        }
    }


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Returns profile information for the currently authenticated session.
    """
    return {
        "success": True,
        "user": {
            "id": str(current_user["_id"]),
            "name": current_user["name"],
            "email": current_user["email"]
        }
    }
