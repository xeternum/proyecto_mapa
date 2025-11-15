#!/usr/bin/env python3
"""
Script para inicializar la base de datos con datos de prueba
Crea las tablas, categorías, usuarios y servicios de ejemplo

NUEVO: 10 servicios distribuidos:
- 3 Electricistas
- 3 Gasfíters
- 4 Categorías diferentes (Programador web, Carpintero, Peluquero, Pintor)
"""

from app.db.init_db import init_db
from app.db.session import SessionLocal
from app.crud import crud_user, crud_service
from app.schemas.user import UserCreate
from app.schemas.service import ServiceCreate

def delete_all_data(db):
    """Elimina todos los datos existentes (usuarios y servicios)"""
    print("\n🗑️  Eliminando datos existentes...")
    
    # Importar modelos
    from app.db.base import User, Service, Review
    
    # Eliminar en orden por dependencias
    deleted_reviews = db.query(Review).delete()
    deleted_services = db.query(Service).delete()
    deleted_users = db.query(User).delete()
    
    db.commit()
    
    print(f"   ✅ Eliminadas {deleted_reviews} valoraciones")
    print(f"   ✅ Eliminados {deleted_services} servicios")
    print(f"   ✅ Eliminados {deleted_users} usuarios")

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
        user_in = UserCreate(**user_data)
        user = crud_user.user.create(db, obj_in=user_in)
        print(f"   ✅ Usuario creado: {user.email}")
        created_users.append(user)
    
    return created_users

def create_test_services(db, users):
    """Crea servicios de prueba"""
    print("\n🛠️  Creando servicios de prueba...")
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
        user_id = service_data.pop("user_id")
        service_in = ServiceCreate(**service_data)
        service = crud_service.service.create_with_owner(db, obj_in=service_in, owner_id=user_id)
        print(f"   ✅ Servicio creado: {service.service_name} ({service.category})")

def main():
    """Función principal para inicializar la base de datos"""
    print("=" * 60)
    print("🚀 REINICIALIZANDO BASE DE DATOS CON DATOS NUEVOS")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        # 1. Crear tablas y categorías
        init_db(db)
        
        # 2. ELIMINAR TODOS LOS DATOS EXISTENTES
        delete_all_data(db)
        
        # 3. Crear usuarios de prueba (mismos 3 usuarios)
        users = create_test_users(db)
        
        # 4. Crear 10 servicios con nueva distribución
        create_test_services(db, users)
        
        print("\n" + "=" * 60)
        print("✅ BASE DE DATOS REINICIALIZADA CORRECTAMENTE")
        print("=" * 60)
        print("\n📊 RESUMEN DE DATOS:")
        print("   👥 Usuarios: 3")
        print("   🛠️  Servicios: 10")
        print("      - 3 Electricistas")
        print("      - 3 Gasfíters")
        print("      - 1 Programador web")
        print("      - 1 Carpintero")
        print("      - 1 Peluquero")
        print("      - 1 Pintor")
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
