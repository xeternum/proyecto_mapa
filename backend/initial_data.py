#!/usr/bin/env python3
"""
Script para inicializar la base de datos con datos de prueba
Crea las tablas, categorías, usuarios y servicios de ejemplo

NUEVO: Compatible con SQLite (desarrollo) y PostgreSQL (producción)
NOTA: Este script ahora es un wrapper de app.db.init_db para mantener compatibilidad.

Puedes usar directamente: python -m app.db.init_db
"""

import os
from app.db.init_db import init_db
from app.db.session import SessionLocal
from app.crud import crud_user, crud_service
from app.schemas.user import UserCreate
from app.schemas.service import ServiceCreate
from app.db.base import User, Service  # modelos para conteos

def delete_all_data(db):
    """(OBSOLETO) Ya no se borran datos para mantener persistencia. Se deja por compatibilidad."""
    print("\n⚠️  delete_all_data() está deshabilitado: no se eliminan datos.")

def create_test_users(db):
    """Crea usuarios de prueba de forma idempotente (solo si no existen)."""
    print("\n👥 Creando usuarios de prueba (idempotente)...")
    test_users = [
        {"email": "juan@example.com", "password": "123456", "full_name": "Juan Pérez", "phone": "+56912345678"},
        {"email": "maria@example.com", "password": "123456", "full_name": "María González", "phone": "+56987654321"},
        {"email": "pedro@example.com", "password": "123456", "full_name": "Pedro Ramírez", "phone": "+56911223344"},
    ]
    created_or_existing = []
    for user_data in test_users:
        existing = crud_user.user.get_by_email(db, email=user_data["email"])
        if existing:
            print(f"   ↺ Usuario ya existe: {existing.email}")
            created_or_existing.append(existing)
            continue
        user_in = UserCreate(**user_data)
        user = crud_user.user.create(db, obj_in=user_in)
        print(f"   ✅ Usuario creado: {user.email}")
        created_or_existing.append(user)
    return created_or_existing

def create_test_services(db, users):
    """Crea servicios de prueba de forma idempotente (solo si no existen por nombre)."""
    print("\n🛠️  Creando servicios de prueba (idempotente)...")
    print("   📊 Distribución: 3 Electricistas + 3 Gasfíters + 4 categorías variadas")
    
    # Santiago Centro, Chile
    santiago_coords = {
        "latitude": -33.4372,
        "longitude": -70.6506
    }
    
    test_services = [
        # --- 3 SERVICIOS DE ELECTRICISTA ---
        {
            "service_name": "Electricista profesional - Instalaciones",
            "description": "Instalaciones eléctricas, reparaciones y mantención. 15 años de experiencia.",
            "category": "Electricista",
            "price": 15000.0,
            "price_modality": "por_hora",
            "schedule": "Lunes a Viernes 9:00-18:00",
            "address": "Av. Libertador Bernardo O'Higgins, Santiago Centro",
            "latitude": santiago_coords["latitude"],
            "longitude": santiago_coords["longitude"],
            "contact_method": "email",
            "contact_email": "juan@example.com",
            "user_id": users[0].id
        },
        {
            "service_name": "Electricista emergencias 24/7",
            "description": "Servicio de emergencia eléctrica disponible las 24 horas. Cortes de luz, cortocircuitos.",
            "category": "Electricista",
            "price": 25000.0,
            "price_modality": "por_servicio",
            "schedule": "Disponible 24/7",
            "address": "Barrio Yungay, Santiago",
            "latitude": santiago_coords["latitude"] - 0.004,
            "longitude": santiago_coords["longitude"] + 0.008,
            "contact_method": "phone",
            "contact_phone": users[1].phone,
            "contact_country_code": "+56",
            "whatsapp_available": True,
            "user_id": users[1].id
        },
        {
            "service_name": "Electricista domiciliario",
            "description": "Especialista en instalaciones domiciliarias, cambio de enchufes, interruptores y lámparas.",
            "category": "Electricista",
            "price": 12000.0,
            "price_modality": "por_hora",
            "schedule": "Lunes a Sábado 8:00-20:00",
            "address": "Providencia, Santiago",
            "latitude": santiago_coords["latitude"] + 0.010,
            "longitude": santiago_coords["longitude"] - 0.015,
            "contact_method": "email",
            "contact_email": "pedro@example.com",
            "user_id": users[2].id
        },
        
        # --- 3 SERVICIOS DE GASFÍTER ---
        {
            "service_name": "Gasfíter certificado SEC",
            "description": "Reparación de cañerías, instalación de grifería, destape de desagües. Certificado SEC.",
            "category": "Gasfíter",
            "price": 20000.0,
            "price_modality": "por_servicio",
            "schedule": "Lunes a Viernes 9:00-19:00",
            "address": "Paseo Ahumada, Santiago Centro",
            "latitude": santiago_coords["latitude"] + 0.005,
            "longitude": santiago_coords["longitude"] + 0.005,
            "contact_method": "phone",
            "contact_phone": users[0].phone,
            "contact_country_code": "+56",
            "whatsapp_available": True,
            "user_id": users[0].id
        },
        {
            "service_name": "Gasfíter urgencias y mantención",
            "description": "Atención de urgencias gasfiteriles, fugas de agua, cambio de llaves, destape WC.",
            "category": "Gasfíter",
            "price": 18000.0,
            "price_modality": "por_servicio",
            "schedule": "Lunes a Sábado 8:00-22:00",
            "address": "Barrio Italia, Ñuñoa",
            "latitude": santiago_coords["latitude"] + 0.015,
            "longitude": santiago_coords["longitude"] - 0.012,
            "contact_method": "phone",
            "contact_phone": users[1].phone,
            "contact_country_code": "+56",
            "whatsapp_available": True,
            "user_id": users[1].id
        },
        {
            "service_name": "Instalaciones de agua y gas",
            "description": "Instalación y reparación de redes de agua potable y gas. Trabaja con cobre y PVC.",
            "category": "Gasfíter",
            "price": 22000.0,
            "price_modality": "por_hora",
            "schedule": "Lunes a Viernes 9:00-18:00",
            "address": "Las Condes, Santiago",
            "latitude": santiago_coords["latitude"] + 0.020,
            "longitude": santiago_coords["longitude"] - 0.025,
            "contact_method": "email",
            "contact_email": "pedro@example.com",
            "user_id": users[2].id
        },
        
        # --- 4 SERVICIOS DE CATEGORÍAS DIFERENTES ---
        {
            "service_name": "Desarrollo web profesional",
            "description": "Desarrollo de sitios web, aplicaciones y sistemas a medida. React, Node.js, Python.",
            "category": "Programador web",
            "price": 25000.0,
            "price_modality": "por_hora",
            "schedule": "Lunes a Sábado 10:00-20:00",
            "address": "Plaza de Armas, Santiago Centro",
            "latitude": santiago_coords["latitude"] - 0.003,
            "longitude": santiago_coords["longitude"] - 0.003,
            "contact_method": "email",
            "contact_email": "juan@example.com",
            "user_id": users[0].id
        },
        {
            "service_name": "Carpintería fina y muebles a medida",
            "description": "Fabricación de muebles a medida, reparación y restauración de muebles antiguos.",
            "category": "Carpintero",
            "price": 35000.0,
            "price_modality": "por_proyecto",
            "schedule": "Lunes a Viernes 9:00-17:00",
            "address": "Barrio Franklin, Santiago",
            "latitude": santiago_coords["latitude"] - 0.012,
            "longitude": santiago_coords["longitude"] + 0.005,
            "contact_method": "phone",
            "contact_phone": users[1].phone,
            "contact_country_code": "+56",
            "whatsapp_available": True,
            "user_id": users[1].id
        },
        {
            "service_name": "Peluquería profesional a domicilio",
            "description": "Cortes de cabello, peinados, tratamientos capilares. Servicio a domicilio con todo el equipo.",
            "category": "Peluquero",
            "price": 15000.0,
            "price_modality": "por_servicio",
            "schedule": "Martes a Sábado 10:00-19:00",
            "address": "Barrio Bellavista, Santiago",
            "latitude": santiago_coords["latitude"] + 0.008,
            "longitude": santiago_coords["longitude"] - 0.007,
            "contact_method": "phone",
            "contact_phone": users[2].phone,
            "contact_country_code": "+56",
            "whatsapp_available": True,
            "user_id": users[2].id
        },
        {
            "service_name": "Pintura de casas y departamentos",
            "description": "Pintura interior y exterior, empapelado, reparación de muros. Presupuesto sin costo.",
            "category": "Pintor",
            "price": 28000.0,
            "price_modality": "por_dia",
            "schedule": "Lunes a Viernes 8:00-18:00",
            "address": "Barrio Brasil, Santiago Centro",
            "latitude": santiago_coords["latitude"] - 0.007,
            "longitude": santiago_coords["longitude"] + 0.004,
            "contact_method": "email",
            "contact_email": "juan@example.com",
            "user_id": users[0].id
        }
    ]
    
    for service_data in test_services:
        user_id = service_data["user_id"]
        name = service_data["service_name"]
        # Verificar si ya existe un servicio con el mismo nombre
        existing = db.query(Service).filter(Service.service_name == name).first()
        if existing:
            print(f"   ↺ Servicio ya existe: {name} ({existing.category})")
            continue
        # Crear (no mutar service_data original para futuras comprobaciones)
        service_payload = {k: v for k, v in service_data.items() if k != "user_id"}
        service_in = ServiceCreate(**service_payload)
        service = crud_service.service.create_with_owner(db, obj_in=service_in, owner_id=user_id)
        print(f"   ✅ Servicio creado: {service.service_name} ({service.category})")

def main():
    """Inicializa la base de datos de forma idempotente (no borra lo existente)."""
    print("=" * 60)
    print("🚀 SEED DE BASE DE DATOS (IDEMPOTENTE)")
    print("=" * 60)
    env = os.environ.get("ENVIRONMENT", "development").lower()
    seed_force = os.environ.get("SEED_FORCE") == "1"
    db = SessionLocal()
    try:
        # 1. Crear tablas y categorías (idempotente dentro de init_db)
        init_db(db)
        # 2. Comprobar si ya hay datos clave
        user_count = db.query(User).count()
        service_count = db.query(Service).count()
        print(f"   📦 Estado actual: {user_count} usuarios, {service_count} servicios")
        if env == "production" and (user_count > 0 or service_count > 0) and not seed_force:
            print("\n🔒 Producción con datos existentes y SEED_FORCE no activo. No se crean datos de prueba.")
        else:
            users = create_test_users(db)
            create_test_services(db, users)
        # 3. Resumen final
        final_users = db.query(User).count()
        final_services = db.query(Service).count()
        print("\n" + "=" * 60)
        print("✅ SEED COMPLETADO (IDEMPOTENTE)")
        print("=" * 60)
        print("\n📊 RESUMEN DE DATOS:")
        print(f"   👥 Usuarios totales: {final_users}")
        print(f"   🛠️  Servicios totales: {final_services}")
        print("\n📝 CREDENCIALES DE PRUEBA (si fueron creadas):")
        print("   juan@example.com | 123456")
        print("   maria@example.com | 123456")
        print("   pedro@example.com | 123456")
        print("\n🎯 Usa estas credenciales para login inicial.")
        print("=" * 60)
    except Exception as e:
        print(f"\n❌ Error al inicializar la base de datos: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
