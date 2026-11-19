from fastapi import Header, HTTPException, status
from bson import ObjectId
import jwt
from app.core.security import decode_access_token
from app.core.database import get_users_collection


async def get_current_user(authorization: str = Header(None)) -> dict:
    """
    FastAPI dependency validating the Authorization header and retrieving the authenticated user.
    Maintains exact status codes and error messages for client compatibility.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please log in to continue."
        )

    token = authorization.split(" ")[1].strip()

    try:
        payload = decode_access_token(token)
        user_id_str = payload.get("id")
        if not user_id_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Your session has expired. Please log in again."
            )
        user_id = ObjectId(user_id_str)
    except (jwt.PyJWTError, Exception):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session has expired. Please log in again."
        )

    users_collection = get_users_collection()
    user = await users_collection.find_one({"_id": user_id})

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This account no longer exists."
        )

    return user
