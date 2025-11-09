from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from app.crud.base import CRUDBase
from app.db.base import Review
from app.schemas.review import ReviewCreate, ReviewUpdate

class CRUDReview(CRUDBase[Review, ReviewCreate, ReviewUpdate]):
    """Operaciones CRUD para Reseña"""
    
    def get_by_service(
        self, db: Session, *, service_id: int, skip: int = 0, limit: int = 100
    ) -> List[Review]:
        """Obtener todas las reseñas de un servicio"""
        return (
            db.query(Review)
            .filter(Review.service_id == service_id)
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def get_by_user(
        self, db: Session, *, user_id: int, skip: int = 0, limit: int = 100
    ) -> List[Review]:
        """Obtener todas las reseñas hechas por un usuario"""
        return (
            db.query(Review)
            .filter(Review.reviewer_user_id == user_id)
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def get_user_review_for_service(
        self, db: Session, *, service_id: int, user_id: int
    ) -> Optional[Review]:
        """Obtener la reseña de un usuario específico para un servicio"""
        return (
            db.query(Review)
            .filter(
                Review.service_id == service_id,
                Review.reviewer_user_id == user_id
            )
            .first()
        )
    
    def create_with_user(
        self, db: Session, *, obj_in: ReviewCreate, user_id: int
    ) -> Review:
        """Crear reseña con usuario reviewer"""
        # Verificar si ya existe una reseña
        existing_review = self.get_user_review_for_service(
            db, service_id=obj_in.service_id, user_id=user_id
        )
        
        if existing_review:
            raise HTTPException(
                status_code=400,
                detail="Ya has creado una reseña para este servicio"
            )
        
        obj_in_data = obj_in.model_dump()
        db_obj = Review(**obj_in_data, reviewer_user_id=user_id)
        db.add(db_obj)
        
        try:
            db.commit()
            db.refresh(db_obj)
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=400,
                detail="Ya existe una reseña para este servicio"
            )
        
        return db_obj
    
    def update_user_review(
        self, db: Session, *, service_id: int, user_id: int, rating: float
    ) -> Review:
        """Actualizar la reseña de un usuario para un servicio"""
        review = self.get_user_review_for_service(
            db, service_id=service_id, user_id=user_id
        )
        
        if not review:
            raise HTTPException(
                status_code=404,
                detail="No tienes una reseña para este servicio"
            )
        
        review.rating = rating
        db.add(review)
        db.commit()
        db.refresh(review)
        return review

review = CRUDReview(Review)
