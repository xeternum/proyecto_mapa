from sqlalchemy.orm import Session
from .base import Base, Category
from .session import engine

def init_db(db: Session) -> None:
    """Inicializa la base de datos y carga las categorías"""
    # Crear todas las tablas
    Base.metadata.create_all(bind=engine)

    # Verificar si ya existen categorías
    if db.query(Category).first():
        print("✓ Las categorías ya están cargadas")
        return

    # Lista de categorías a insertar
    categories_to_insert = [
        # Servicios del hogar
        Category(name='Electricista', parent_category='Servicios del hogar', display_order=1),
        Category(name='Gasfíter', parent_category='Servicios del hogar', display_order=2),
        Category(name='Pintor', parent_category='Servicios del hogar', display_order=3),
        Category(name='Jardinero', parent_category='Servicios del hogar', display_order=4),
        Category(name='Aseador de hogar', parent_category='Servicios del hogar', display_order=5),
        Category(name='Carpintero', parent_category='Servicios del hogar', display_order=6),
        Category(name='Cerrajero', parent_category='Servicios del hogar', display_order=7),
        
        # Construcción y mantenimiento
        Category(name='Maestro en construcción', parent_category='Construcción y mantenimiento', display_order=8),
        Category(name='Instalador de pisos y cerámicas', parent_category='Construcción y mantenimiento', display_order=9),
        Category(name='Soldador', parent_category='Construcción y mantenimiento', display_order=10),
        Category(name='Técnico en refrigeración', parent_category='Construcción y mantenimiento', display_order=11),
        Category(name='Técnico en lavadoras', parent_category='Construcción y mantenimiento', display_order=12),
        
        # Tecnología y computación
        Category(name='Técnico en computación', parent_category='Tecnología y computación', display_order=13),
        Category(name='Reparador de celulares', parent_category='Tecnología y computación', display_order=14),
        Category(name='Programador web', parent_category='Tecnología y computación', display_order=15),
        Category(name='Instalador de cámaras de seguridad', parent_category='Tecnología y computación', display_order=16),
        
        # Transporte y mudanzas
        Category(name='Chofer particular', parent_category='Transporte y mudanzas', display_order=17),
        Category(name='Servicio de mudanza', parent_category='Transporte y mudanzas', display_order=18),
        Category(name='Repartidor', parent_category='Transporte y mudanzas', display_order=19),
        Category(name='Moto delivery', parent_category='Transporte y mudanzas', display_order=20),
        Category(name='Flete local', parent_category='Transporte y mudanzas', display_order=21),
        
        # Cuidado personal y bienestar
        Category(name='Peluquero', parent_category='Cuidado personal y bienestar', display_order=22),
        Category(name='Manicurista', parent_category='Cuidado personal y bienestar', display_order=23),
        Category(name='Barbero', parent_category='Cuidado personal y bienestar', display_order=24),
        Category(name='Esteticista', parent_category='Cuidado personal y bienestar', display_order=25),
        Category(name='Podólogo', parent_category='Cuidado personal y bienestar', display_order=26),
        
        # Cuidado familiar y mascotas
        Category(name='Niñera', parent_category='Cuidado familiar y mascotas', display_order=27),
        Category(name='Cuidadores de adultos mayores', parent_category='Cuidado familiar y mascotas', display_order=28),
        Category(name='Paseador de perros', parent_category='Cuidado familiar y mascotas', display_order=29),
        Category(name='Entrenador canino', parent_category='Cuidado familiar y mascotas', display_order=30),
        Category(name='Veterinario a domicilio', parent_category='Cuidado familiar y mascotas', display_order=31),
    ]
    
    print(f"📊 Insertando {len(categories_to_insert)} categorías...")
    db.add_all(categories_to_insert)
    db.commit()
    print("✅ Categorías cargadas exitosamente")
