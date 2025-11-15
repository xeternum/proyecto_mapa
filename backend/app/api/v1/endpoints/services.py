from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.v1.endpoints.login import get_current_active_user
from app.crud import crud_service
from app.db.session import get_db
from app.db.base import Service as ServiceModel
from app.schemas.service import Service, ServiceCreate, ServiceUpdate, ServiceWithOwner
from app.schemas.user import User

router = APIRouter()

@router.post("/", response_model=Service, status_code=201)
def create_service(
    *,
    db: Annotated[Session, Depends(get_db)],
    service_in: ServiceCreate,
    current_user: Annotated[User, Depends(get_current_active_user)]
) -> Service:
    """
    Crear un nuevo servicio (requiere autenticación)
    """
    service = crud_service.service.create_with_owner(
        db, obj_in=service_in, owner_id=current_user.id
    )
    return service

@router.get("/", response_model=List[ServiceWithOwner])
def read_services(
    db: Annotated[Session, Depends(get_db)],
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    active_only: bool = True
) -> List[ServiceWithOwner]:
    """
    Obtener lista de servicios con filtros opcionales
    - **category**: Filtrar por categoría (case-insensitive)
    - **search**: Buscar en nombre y descripción
    - **active_only**: Solo servicios activos (default: True)
    
    Los filtros se pueden combinar (search + category)
    """
    # Construir query base
    query = db.query(ServiceModel)
    
    # Aplicar filtros
    if active_only:
        query = query.filter(ServiceModel.is_active == True)
    
    if category:
        # Filtro de categoría case-insensitive
        query = query.filter(ServiceModel.category.ilike(category))
    
    if search:
        # Buscar en nombre, descripción y categoría
        search_term = f"%{search}%"
        query = query.filter(
            (ServiceModel.service_name.ilike(search_term)) |
            (ServiceModel.description.ilike(search_term)) |
            (ServiceModel.category.ilike(search_term))
        )
    
    # Aplicar paginación y ejecutar
    services = query.offset(skip).limit(limit).all()
    
    return services

@router.get("/me", response_model=List[Service])
def read_my_services(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    skip: int = 0,
    limit: int = 100
) -> List[Service]:
    """
    Obtener servicios del usuario actual
    """
    services = crud_service.service.get_by_user(
        db, user_id=current_user.id, skip=skip, limit=limit
    )
    return services

@router.get("/{service_id}", response_model=ServiceWithOwner)
def read_service(
    service_id: int,
    db: Annotated[Session, Depends(get_db)]
) -> ServiceWithOwner:
    """
    Obtener servicio por ID
    """
    service = crud_service.service.get(db, id=service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    return service

@router.put("/{service_id}", response_model=Service)
def update_service(
    *,
    db: Annotated[Session, Depends(get_db)],
    service_id: int,
    service_in: ServiceUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)]
) -> Service:
    """
    Actualizar un servicio (solo el propietario)
    """
    service = crud_service.service.get(db, id=service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    if service.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permisos para actualizar este servicio")
    
    service = crud_service.service.update(db, db_obj=service, obj_in=service_in)
    return service

@router.delete("/{service_id}", response_model=Service)
def delete_service(
    *,
    db: Annotated[Session, Depends(get_db)],
    service_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)]
) -> Service:
    """
    Eliminar un servicio (solo el propietario)
    """
    service = crud_service.service.get(db, id=service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    if service.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permisos para eliminar este servicio")
    
    service = crud_service.service.remove(db, id=service_id)
    return service
