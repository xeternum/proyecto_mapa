from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime
from app.schemas.user import UserPublic

# Propiedades compartidas
class ServiceBase(BaseModel):
    """Schema base de Servicio"""
    service_name: str
    description: str
    category: str
    price: float
    price_modality: str  # por_hora, por_dia, por_servicio, etc.
    schedule: Optional[str] = None
    address: str
    latitude: float
    longitude: float
    
    # Información de contacto
    contact_method: str  # 'email' o 'phone'
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    contact_country_code: Optional[str] = None
    whatsapp_available: bool = False
    
    @field_validator('price')
    @classmethod
    def price_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('El precio debe ser mayor a 0')
        return v

# Propiedades para crear un servicio
class ServiceCreate(ServiceBase):
    """Schema para crear un servicio"""
    pass

# Propiedades para actualizar un servicio
class ServiceUpdate(BaseModel):
    """Schema para actualizar un servicio"""
    service_name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    price_modality: Optional[str] = None
    schedule: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    contact_method: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    contact_country_code: Optional[str] = None
    whatsapp_available: Optional[bool] = None
    is_active: Optional[bool] = None

# Propiedades para devolver a través de la API
class Service(ServiceBase):
    """Schema de Servicio completo"""
    id: int
    user_id: int
    rating: float
    total_reviews: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    @field_validator('rating')
    @classmethod
    def rating_must_be_valid(cls, v):
        if v < 0 or v > 5:
            raise ValueError('El rating debe estar entre 0 y 5')
        return v
    
    class Config:
        from_attributes = True

# Schema con información del propietario (solo nombre público)
class ServiceWithOwner(Service):
    """Schema de Servicio con información pública del propietario"""
    owner: UserPublic  # Solo expone ID y nombre completo
