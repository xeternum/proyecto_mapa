from pydantic import BaseModel

class Token(BaseModel):
    """Schema para el token de acceso"""
    access_token: str
    token_type: str

class TokenData(BaseModel):
    """Schema para los datos del token"""
    email: str | None = None
