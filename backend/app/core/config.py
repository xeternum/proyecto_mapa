import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    # Se debe generar un secreto seguro, por ejemplo con: openssl rand -hex 32
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    SQLALCHEMY_DATABASE_URL: str = "sqlite:///./map_project.db"

    class Config:
        case_sensitive = True

settings = Settings()
