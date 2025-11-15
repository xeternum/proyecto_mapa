import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    # Se debe generar un secreto seguro, por ejemplo con: openssl rand -hex 32
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
    ALGORITHM: str = "HS256"
    ENVIRONMENT: str = os.environ.get("ENVIRONMENT", "development")
    # En desarrollo se prolonga la sesión (8h) salvo override.
    # En producción se mantiene corta (30 min) para seguridad.
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.environ.get(
            "ACCESS_TOKEN_EXPIRE_MINUTES",
            480 if os.environ.get("ENVIRONMENT", "development") == "development" else 30
        )
    )
    SQLALCHEMY_DATABASE_URL: str = "sqlite:///./map_project.db"
    # Orígenes permitidos para CORS en producción (separados por coma)
    CORS_ORIGINS: list[str] = [
        o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()
    ]

    class Config:
        case_sensitive = True

settings = Settings()
