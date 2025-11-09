#!/usr/bin/env python3
"""
Script para inicializar la base de datos
Crea las tablas y carga los datos iniciales (categorías)
"""

from app.db.init_db import init_db
from app.db.session import SessionLocal

def main():
    """Función principal para inicializar la base de datos"""
    print("🚀 Iniciando la base de datos...")
    
    db = SessionLocal()
    try:
        init_db(db)
        print("✅ Base de datos inicializada correctamente")
    except Exception as e:
        print(f"❌ Error al inicializar la base de datos: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
