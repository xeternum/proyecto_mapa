from typing import List, Optional
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.db.base import Service
from app.schemas.service import ServiceCreate, ServiceUpdate

class CRUDService(CRUDBase[Service, ServiceCreate, ServiceUpdate]):
    """Operaciones CRUD para Servicio"""
    
    def get_by_user(
        self, db: Session, *, user_id: int, skip: int = 0, limit: int = 100
    ) -> List[Service]:
        """Obtener servicios de un usuario específico"""
        return (
            db.query(Service)
            .filter(Service.user_id == user_id)
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def get_by_category(
        self, db: Session, *, category: str, skip: int = 0, limit: int = 100
    ) -> List[Service]:
        """Obtener servicios por categoría (case-insensitive)"""
        return (
            db.query(Service)
            .filter(
                Service.category.ilike(category),  # Case-insensitive match
                Service.is_active == True
            )
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def get_active_services(
        self, db: Session, *, skip: int = 0, limit: int = 100
    ) -> List[Service]:
        """Obtener solo servicios activos"""
        return (
            db.query(Service)
            .filter(Service.is_active == True)
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def search(
        self, db: Session, *, query: str, skip: int = 0, limit: int = 100
    ) -> List[Service]:
        """Buscar servicios por nombre o descripción"""
        search_term = f"%{query}%"
        return (
            db.query(Service)
            .filter(
                Service.is_active == True,
                (Service.service_name.ilike(search_term) | 
                 Service.description.ilike(search_term))
            )
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def create_with_owner(
        self, db: Session, *, obj_in: ServiceCreate, owner_id: int
    ) -> Service:
        """Crear servicio con propietario"""
        obj_in_data = obj_in.model_dump()
        db_obj = Service(**obj_in_data, user_id=owner_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

service = CRUDService(Service)
