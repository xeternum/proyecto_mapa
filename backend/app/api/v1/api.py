from fastapi import APIRouter
from app.api.v1.endpoints import login, users, services, reviews, categories

api_router = APIRouter()

# Incluir todos los routers
api_router.include_router(login.router, prefix="/login", tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(services.router, prefix="/services", tags=["services"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
