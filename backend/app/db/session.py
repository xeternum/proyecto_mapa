from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Configuración condicional según el motor de base de datos
if settings.SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    # SQLite: requiere check_same_thread=False para FastAPI
    engine = create_engine(
        settings.SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    # PostgreSQL: usa pool_pre_ping para reconexiones automáticas
    # Forzar uso de psycopg (v3) en lugar de psycopg2
    db_url = settings.SQLALCHEMY_DATABASE_URL
    if db_url.startswith("postgresql://") and "+psycopg" not in db_url:
        db_url = db_url.replace("postgresql://", "postgresql+psycopg://")
    
    engine = create_engine(
        db_url,
        pool_pre_ping=True
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Dependencia para obtener la sesión de base de datos"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
