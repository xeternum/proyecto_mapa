from pydantic import BaseModel
from typing import Optional

class CategoryBase(BaseModel):
    """Schema base de Categoría"""
    name: str
    parent_category: Optional[str] = None
    display_order: int = 0

class Category(CategoryBase):
    """Schema de Categoría completo"""
    id: int
    is_active: bool
    
    class Config:
        from_attributes = True
