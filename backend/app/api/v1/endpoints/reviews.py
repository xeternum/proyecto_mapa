from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.v1.endpoints.login import get_current_active_user
from app.crud import crud_review, crud_service
from app.db.session import get_db
from app.schemas.review import Review, ReviewCreate, ReviewUpdate
from app.schemas.user import User

router = APIRouter()

@router.post("/", response_model=Review, status_code=201)
def create_review(
    *,
    db: Annotated[Session, Depends(get_db)],
    review_in: ReviewCreate,
    current_user: Annotated[User, Depends(get_current_active_user)]
) -> Review:
    """
    Crear una nueva reseña para un servicio (requiere autenticación)
    - Solo se permite 1 reseña por usuario por servicio
    """
    # Verificar que el servicio existe
    service = crud_service.service.get(db, id=review_in.service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    
    # No permitir que el propietario reseñe su propio servicio
    if service.user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="No puedes crear una reseña de tu propio servicio"
        )
    
    review = crud_review.review.create_with_user(
        db, obj_in=review_in, user_id=current_user.id
    )
    return review

@router.get("/service/{service_id}", response_model=List[Review])
def read_service_reviews(
    service_id: int,
    db: Annotated[Session, Depends(get_db)],
    skip: int = 0,
    limit: int = 100
) -> List[Review]:
    """
    Obtener todas las reseñas de un servicio
    """
    reviews = crud_review.review.get_by_service(
        db, service_id=service_id, skip=skip, limit=limit
    )
    return reviews

@router.get("/me", response_model=List[Review])
def read_my_reviews(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    skip: int = 0,
    limit: int = 100
) -> List[Review]:
    """
    Obtener todas las reseñas creadas por el usuario actual
    """
    reviews = crud_review.review.get_by_user(
        db, user_id=current_user.id, skip=skip, limit=limit
    )
    return reviews

@router.get("/{review_id}", response_model=Review)
def read_review(
    review_id: int,
    db: Annotated[Session, Depends(get_db)]
) -> Review:
    """
    Obtener una reseña por ID
    """
    review = crud_review.review.get(db, id=review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Reseña no encontrada")
    return review

@router.put("/{review_id}", response_model=Review)
def update_review(
    *,
    db: Annotated[Session, Depends(get_db)],
    review_id: int,
    review_in: ReviewUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)]
) -> Review:
    """
    Actualizar una reseña (solo el autor)
    """
    review = crud_review.review.get(db, id=review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Reseña no encontrada")
    if review.reviewer_user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="No tienes permisos para actualizar esta reseña"
        )
    
    review = crud_review.review.update(db, db_obj=review, obj_in=review_in)
    return review

@router.delete("/{review_id}", response_model=Review)
def delete_review(
    *,
    db: Annotated[Session, Depends(get_db)],
    review_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)]
) -> Review:
    """
    Eliminar una reseña (solo el autor)
    """
    review = crud_review.review.get(db, id=review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Reseña no encontrada")
    if review.reviewer_user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="No tienes permisos para eliminar esta reseña"
        )
    
    review = crud_review.review.remove(db, id=review_id)
    return review
