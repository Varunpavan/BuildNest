from fastapi import APIRouter
from app.core.database import db_state

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """
    Liveness and readiness health check for monitoring and load balancers.
    """
    db_status = "connected" if db_state.client is not None else "disconnected"
    return {
        "success": True,
        "message": "NxtBuild server is running",
        "database": db_status
    }
