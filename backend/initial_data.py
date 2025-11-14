#!/usr/bin/env python3
"""
Script para inicializar la base de datos con datos de prueba
Crea las tablas, categorías, usuarios y servicios de ejemplo
"""

from app.db.init_db import init_db
from app.db.session import SessionLocal
from app.crud import crud_user, crud_service
from app.schemas.user import UserCreate
from app.schemas.service import ServiceCreate

def create_test_users(db):
    """Crea usuarios de prueba"""
    print("\n👥 Creando usuarios de prueba...")
    
    test_users = [
        {
            "email": "juan@example.com",
            "password": "123456",
            "full_name": "Juan Pérez",
            "phone": "+56912345678"
        },
        {
            "email": "maria@example.com",
            "password": "123456",
            "full_name": "María González",
            "phone": "+56987654321"
        },
        {
            "email": "pedro@example.com",
            "password": "123456",
            "full_name": "Pedro Ramírez",
            "phone": "+56911223344"
        }
    ]
    
    created_users = []
    for user_data in test_users:
        # Verificar si el usuario ya existe
        existing_user = crud_user.user.get_by_email(db, email=user_data["email"])
        if existing_user:
            print(f"   ⚠️  Usuario {user_data['email']} ya existe")
            created_users.append(existing_user)
        else:
            user_in = UserCreate(**user_data)
            user = crud_user.user.create(db, obj_in=user_in)
            print(f"   ✅ Usuario creado: {user.email}")
            created_users.append(user)
    
    return created_users

def create_test_services(db, users):
    """Crea servicios de prueba"""
    print("\n🛠️  Creando servicios de prueba...")
    
    # Santiago Centro, Chile
    santiago_coords = {
        "latitude": -33.4372,
        "longitude": -70.6506
    }
    
    test_services = [
        {
            "service_name": "Electricista profesional",
            "description": "Instalaciones eléctricas, reparaciones y mantención. 15 años de experiencia.",
            "category": "Electricista",
            "price": 15000.0,
            "price_modality": "por_hora",
            "schedule": "Lunes a Viernes 9:00-18:00",
            "address": "Av. Libertador Bernardo O'Higgins, Santiago Centro",
            "latitude": santiago_coords["latitude"],
            "longitude": santiago_coords["longitude"],
            "contact_method": "email",
            "contact_email": users[0].email,
            "contact_phone": None,
            "contact_country_code": None,
            "whatsapp_available": False
        },
        {
            "service_name": "Gasfíter certificado",
            "description": "Reparación de cañerías, instalación de grifería, destape de desagües.",
            "category": "Gasfíter",
            "price": 20000.0,
            "price_modality": "por_servicio",
            "schedule": "Disponible 24/7",
            "address": "Paseo Ahumada, Santiago Centro",
            "latitude": santiago_coords["latitude"] + 0.005,
            "longitude": santiago_coords["longitude"] + 0.005,
            "contact_method": "phone",
            "contact_email": None,
            "contact_phone": users[1].phone,
            "contact_country_code": "+56",
            "whatsapp_available": True
        },
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
            "contact_email": users[2].email,
            "contact_phone": None,
            "contact_country_code": None,
            "whatsapp_available": False
        },
        {
            "service_name": "Servicio de limpieza del hogar",
            "description": "Limpieza profunda de casas y departamentos. Productos incluidos.",
            "category": "Aseador de hogar",
            "price": 10000.0,
            "price_modality": "por_hora",
            "schedule": "Lunes a Sábado 8:00-17:00",
            "address": "Barrio Lastarria, Santiago Centro",
            "latitude": santiago_coords["latitude"] + 0.008,
            "longitude": santiago_coords["longitude"] - 0.002,
            "contact_method": "phone",
            "contact_email": None,
            "contact_phone": users[0].phone,
            "contact_country_code": "+56",
            "whatsapp_available": True
        },
        {
            "service_name": "Instalación de pisos laminados",
            "description": "Instalación profesional de pisos laminados, flotantes y vinílicos.",
            "category": "Instalador de pisos y cerámicas",
            "price": 30000.0,
            "price_modality": "por_dia",
            "schedule": "Lunes a Viernes 8:00-18:00",
            "address": "Barrio Brasil, Santiago Centro",
            "latitude": santiago_coords["latitude"] - 0.007,
            "longitude": santiago_coords["longitude"] + 0.004,
            "contact_method": "email",
            "contact_email": users[1].email,
            "contact_phone": None,
            "contact_country_code": None,
            "whatsapp_available": False
        }
    ]
    
    for service_data in test_services:
        # Buscar el owner_id correspondiente
        owner_email = service_data.pop("contact_email", None) or users[0].email
        owner = next((u for u in users if u.email == owner_email), users[0])
        
        # Verificar si el servicio ya existe (por nombre)
        existing_services = crud_service.service.get_by_user(db, user_id=owner.id)
        if any(s.service_name == service_data["service_name"] for s in existing_services):
            print(f"   ⚠️  Servicio '{service_data['service_name']}' ya existe")
            continue
        
        # Recrear contact_email si es necesario
        if service_data["contact_method"] == "email":
            service_data["contact_email"] = owner.email
        
        service_in = ServiceCreate(**service_data)
        service = crud_service.service.create_with_owner(db, obj_in=service_in, owner_id=owner.id)
        print(f"   ✅ Servicio creado: {service.service_name}")

def main():
    """Función principal para inicializar la base de datos"""
    print("=" * 60)
    print("🚀 INICIALIZANDO BASE DE DATOS CON DATOS DE PRUEBA")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        # 1. Crear tablas y categorías
        init_db(db)
        
        # 2. Crear usuarios de prueba
        users = create_test_users(db)
        
        # 3. Crear servicios de prueba
        create_test_services(db, users)
        
        print("\n" + "=" * 60)
        print("✅ BASE DE DATOS INICIALIZADA CORRECTAMENTE")
        print("=" * 60)
        print("\n📝 CREDENCIALES DE PRUEBA:")
        print("   Email: juan@example.com   | Password: 123456")
        print("   Email: maria@example.com  | Password: 123456")
        print("   Email: pedro@example.com  | Password: 123456")
        print("\n🎯 Usa estas credenciales para hacer login en el frontend")
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
