from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router
from app.core.config import settings

app = FastAPI(
    title="Mapa de Servicios API",
    version="1.0.0",
    description="API REST para el sistema de mapa de servicios locales"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Por ahora permite todos los orígenes
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir router de API v1
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    """Endpoint raíz para verificar que la API está funcionando"""
    return {
        "message": "API está funcionando correctamente",
        "version": "1.0.0",
        "docs": "/docs",
        "api": settings.API_V1_STR
    }

@app.get("/health")
def health_check():
    """Endpoint de health check"""
    return {"status": "healthy"}
