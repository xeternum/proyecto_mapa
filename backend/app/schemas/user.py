from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime

# Propiedades compartidas
class UserBase(BaseModel):
    """Schema base de Usuario"""
    email: EmailStr
    full_name: str
    phone: Optional[str] = None

# Propiedades para crear un usuario
class UserCreate(UserBase):
    """Schema para crear un usuario"""
    password: str

# Propiedades para actualizar un usuario
class UserUpdate(BaseModel):
    """Schema para actualizar un usuario"""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None

# Propiedades para devolver a través de la API
class User(UserBase):
    """Schema de Usuario completo (solo para el propio usuario)"""
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Schema público (sin información sensible)
class UserPublic(BaseModel):
    """Schema público de Usuario (sin email ni teléfono)"""
    id: int
    full_name: str
    
    class Config:
        from_attributes = True

# Propiedades almacenadas en DB
class UserInDB(User):
    """Schema de Usuario en la base de datos"""
    password_hash: str
