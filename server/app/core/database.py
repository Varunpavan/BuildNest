import logging
import certifi
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING
from app.core.config import settings

logger = logging.getLogger("nxtbuild.database")


class Database:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None


db_state = Database()


async def connect_to_database():
    """Initializes MongoDB connection pool and ensures required indexes."""
    logger.info("Connecting to MongoDB...")
    db_state.client = AsyncIOMotorClient(
        settings.MONGODB_URI,
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=5000,
        maxPoolSize=50,
        minPoolSize=5
    )
    # Ping database to verify connection
    await db_state.client.admin.command("ping")
    db_state.db = db_state.client.get_default_database()
    logger.info(f"Connected to MongoDB database: {db_state.db.name}")

    # Ensure indexes for performance and security
    await ensure_indexes()


async def close_database_connection():
    """Gracefully closes MongoDB connection pool."""
    if db_state.client:
        logger.info("Closing MongoDB connection...")
        db_state.client.close()
        logger.info("MongoDB connection closed.")


async def ensure_indexes():
    """Create indexes for users and projects if they don't already exist."""
    try:
        users = get_users_collection()
        await users.create_index([("email", ASCENDING)], unique=True)

        projects = get_projects_collection()
        await projects.create_index([("user", ASCENDING)])
        await projects.create_index([("updatedAt", DESCENDING)])
        logger.info("Database indexes verified.")
    except Exception as e:
        logger.warning(f"Could not verify database indexes: {e}")


def get_database() -> AsyncIOMotorDatabase:
    if db_state.db is None:
        raise RuntimeError("Database not initialized. Please call connect_to_database() first.")
    return db_state.db


def get_users_collection():
    return get_database()["users"]


def get_projects_collection():
    return get_database()["projects"]
