from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router
from app.core.config import settings

app = FastAPI(
    title="Mapa de Servicios API",
    version="1.0.0",
    description="API REST para el sistema de mapa de servicios locales"
)

# Seguridad mínima para MVP:
# - CORS abierto solo en desarrollo; restringido en producción a CORS_ORIGINS
if settings.ENVIRONMENT == "development":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"]
    )
else:
    if not settings.CORS_ORIGINS:
        raise RuntimeError("CORS_ORIGINS vacío en producción. Define la variable de entorno CORS_ORIGINS.")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
        expose_headers=["Content-Type"],
        max_age=600
    )

# Cabeceras de seguridad básicas
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=()"
    # CSP mínima; ajusta si cargas scripts/estilos externos
    response.headers["Content-Security-Policy"] = "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self';"
    return response

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
