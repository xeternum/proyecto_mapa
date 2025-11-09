from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional
from app.schemas.user import UserPublic

# Propiedades compartidas
class ReviewBase(BaseModel):
    """Schema base de Reseña"""
    rating: float
    
    @field_validator('rating')
    @classmethod
    def rating_must_be_valid(cls, v):
        if v < 1.0 or v > 5.0:
            raise ValueError('El rating debe estar entre 1.0 y 5.0')
        return v

# Propiedades para crear una reseña
class ReviewCreate(ReviewBase):
    """Schema para crear una reseña"""
    service_id: int

# Propiedades para actualizar una reseña
class ReviewUpdate(BaseModel):
    """Schema para actualizar una reseña"""
    rating: Optional[float] = None
    
    @field_validator('rating')
    @classmethod
    def rating_must_be_valid(cls, v):
        if v and (v < 1.0 or v > 5.0):
            raise ValueError('El rating debe estar entre 1.0 y 5.0')
        return v

# Propiedades para devolver a través de la API
class Review(ReviewBase):
    """Schema de Reseña completo"""
    id: int
    service_id: int
    reviewer_user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Schema con información pública del reviewer
class ReviewWithReviewer(Review):
    """Schema de Reseña con información pública del reviewer"""
    reviewer: UserPublic  # Solo expone ID y nombre completo
