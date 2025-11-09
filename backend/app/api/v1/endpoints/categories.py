from typing import Annotated, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.base import Category
from app.db.session import get_db
from app.schemas.category import Category as CategorySchema

router = APIRouter()

@router.get("/", response_model=List[CategorySchema])
def read_categories(
    db: Annotated[Session, Depends(get_db)],
    skip: int = 0,
    limit: int = 100
) -> List[Category]:
    """
    Obtener lista de categorías
    """
    categories = db.query(Category).offset(skip).limit(limit).all()
    return categories

@router.get("/{category_id}", response_model=CategorySchema)
def read_category(
    category_id: int,
    db: Annotated[Session, Depends(get_db)]
) -> Category:
    """
    Obtener categoría por ID
    """
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return category
