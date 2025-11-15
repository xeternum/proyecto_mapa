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
    engine = create_engine(
        settings.SQLALCHEMY_DATABASE_URL,
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
