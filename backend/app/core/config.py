import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    
    # SECRET_KEY: DEBE definirse en variable de entorno en producción
    # En desarrollo usa el valor por defecto solo si no está definido
    SECRET_KEY: str = os.environ.get(
        "SECRET_KEY",
        "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"  # Solo desarrollo
    )
    
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
    
    # DATABASE_URL: usar variable de entorno (Postgres en producción)
    # Si no existe, fallback a SQLite local para desarrollo
    SQLALCHEMY_DATABASE_URL: str = os.environ.get(
        "DATABASE_URL",
        "sqlite:///./map_project.db"
    )
    
    # Orígenes permitidos para CORS en producción (separados por coma)
    CORS_ORIGINS: list[str] = [
        o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()
    ]

    class Config:
        case_sensitive = True

settings = Settings()
