from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text, UniqueConstraint, event
)
from sqlalchemy.orm import relationship, declarative_base, Session
from sqlalchemy.sql import func

Base = declarative_base()

class User(Base):
    """Modelo de Usuario"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    phone = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    
    # Relaciones
    services = relationship("Service", back_populates="owner", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="reviewer", cascade="all, delete-orphan")


class Category(Base):
    """Modelo de Categoría"""
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    parent_category = Column(String, index=True)
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)


class Service(Base):
    """Modelo de Servicio"""
    __tablename__ = "services"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    service_name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String, index=True, nullable=False)
    price = Column(Float, nullable=False)
    price_modality = Column(String, nullable=False)
    schedule = Column(String)
    address = Column(Text, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    # Información de contacto
    contact_method = Column(String, nullable=False)  # 'email' o 'phone'
    contact_email = Column(String, nullable=True)
    contact_phone = Column(String, nullable=True)
    contact_country_code = Column(String, nullable=True)
    whatsapp_available = Column(Boolean, default=False)
    
    # Métricas
    rating = Column(Float, default=0.0)
    total_reviews = Column(Integer, default=0)
    
    # Estado
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relaciones
    owner = relationship("User", back_populates="services")
    reviews = relationship("Review", back_populates="service", cascade="all, delete-orphan")


class Review(Base):
    """Modelo de Reseña"""
    __tablename__ = "reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    reviewer_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relaciones
    service = relationship("Service", back_populates="reviews")
    reviewer = relationship("User", back_populates="reviews")
    
    # Constraint: solo 1 review por usuario por servicio
    __table_args__ = (
        UniqueConstraint('service_id', 'reviewer_user_id', name='_service_user_uc'),
    )


# ============================================
# Eventos para actualizar ratings automáticamente
# ============================================

def update_service_rating_after_insert(mapper, connection, target):
    """Actualiza el rating del servicio después de insertar una review"""
    from sqlalchemy import text
    
    service_id = target.service_id
    
    # Calcular nuevo rating y total
    result = connection.execute(
        text("SELECT AVG(rating), COUNT(*) FROM reviews WHERE service_id = :service_id"),
        {"service_id": service_id}
    ).fetchone()
    
    avg_rating, total = result
    
    # Actualizar servicio
    connection.execute(
        text("UPDATE services SET rating = :rating, total_reviews = :total WHERE id = :service_id"),
        {"rating": float(avg_rating or 0.0), "total": int(total), "service_id": service_id}
    )


def update_service_rating_after_update(mapper, connection, target):
    """Actualiza el rating del servicio después de actualizar una review"""
    update_service_rating_after_insert(mapper, connection, target)


def update_service_rating_after_delete(mapper, connection, target):
    """Actualiza el rating del servicio después de eliminar una review"""
    from sqlalchemy import text
    
    service_id = target.service_id
    
    # Calcular nuevo rating y total
    result = connection.execute(
        text("SELECT AVG(rating), COUNT(*) FROM reviews WHERE service_id = :service_id"),
        {"service_id": service_id}
    ).fetchone()
    
    avg_rating, total = result
    
    # Actualizar servicio
    connection.execute(
        text("UPDATE services SET rating = :rating, total_reviews = :total WHERE id = :service_id"),
        {"rating": float(avg_rating or 0.0), "total": int(total), "service_id": service_id}
    )


# Registrar eventos
event.listen(Review, 'after_insert', update_service_rating_after_insert)
event.listen(Review, 'after_update', update_service_rating_after_update)
event.listen(Review, 'after_delete', update_service_rating_after_delete)
