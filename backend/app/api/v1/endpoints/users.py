from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.v1.endpoints.login import get_current_active_user
from app.crud import crud_user
from app.db.session import get_db
from app.schemas.user import User, UserCreate, UserUpdate

router = APIRouter()

@router.post("/", response_model=User, status_code=201)
def create_user(
    *,
    db: Annotated[Session, Depends(get_db)],
    user_in: UserCreate
) -> User:
    """
    Crear un nuevo usuario (registro público)
    """
    user = crud_user.user.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="Ya existe un usuario con este email"
        )
    user = crud_user.user.create(db, obj_in=user_in)
    return user

@router.get("/me", response_model=User)
def read_user_me(
    current_user: Annotated[User, Depends(get_current_active_user)]
) -> User:
    """
    Obtener información del usuario actual (requiere autenticación)
    """
    return current_user

@router.put("/me", response_model=User)
def update_user_me(
    *,
    db: Annotated[Session, Depends(get_db)],
    user_in: UserUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)]
) -> User:
    """
    Actualizar usuario actual
    """
    user = crud_user.user.update(db, db_obj=current_user, obj_in=user_in)
    return user

@router.delete("/me", response_model=User)
def delete_user_me(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)]
) -> User:
    """
    Eliminar usuario actual
    """
    user = crud_user.user.remove(db, id=current_user.id)
    return user
