import os
import re
from datetime import timedelta
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

# Locate .env in server directory or current working directory
SERVER_DIR = Path(__file__).resolve().parent.parent.parent
ENV_PATH = SERVER_DIR / ".env"


class Settings(BaseSettings):
    # Server settings
    PORT: int = 5050
    ENVIRONMENT: str = os.getenv("NODE_ENV", "development")

    # Database
    MONGODB_URI: str = "mongodb://localhost:27017/buildnest"

    # Security & Auth (with fallback for test/dev environments)
    JWT_SECRET: str = "buildnest_default_development_jwt_secret_key_change_in_production"
    JWT_EXPIRES_IN: str = "7d"

    # AI Service & Automated Model Cascading
    GEMINI_API_KEY: str = ""
    PRIMARY_GEMINI_MODEL: str = "gemini-2.5-flash-lite"
    FALLBACK_GEMINI_MODEL: str = "gemini-2.5-flash"

    # Frontend / CORS
    CLIENT_URL: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=(str(ENV_PATH), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins(self) -> List[str]:
        origins = [self.CLIENT_URL.strip().rstrip("/")]
        # Always allow localhost variants for easy local development
        for fallback in ["http://localhost:5173", "http://127.0.0.1:5173"]:
            if fallback not in origins:
                origins.append(fallback)
        return origins

    @property
    def token_expiration_delta(self) -> timedelta:
        """Parse human-friendly durations like '7d', '24h', or seconds."""
        raw = self.JWT_EXPIRES_IN.strip().lower()
        match = re.match(r"^(\d+)([dhm])?$", raw)
        if not match:
            return timedelta(days=7)

        val, unit = match.groups()
        val = int(val)
        if unit == "d":
            return timedelta(days=val)
        elif unit == "h":
            return timedelta(hours=val)
        elif unit == "m":
            return timedelta(minutes=val)
        return timedelta(seconds=val)


settings = Settings()
