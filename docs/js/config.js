// js/config.js

// Estructura de categorías y servicios
export const SERVICE_CATEGORIES = [
  {
    "categoria": "Servicios del hogar",
    "servicios": [
      "Electricista",
      "Gasfíter",
      "Pintor",
      "Jardinero",
      "Aseador de hogar",
      "Carpintero",
      "Cerrajero"
    ]
  },
  {
    "categoria": "Construcción y mantenimiento",
    "servicios": [
      "Maestro en construcción",
      "Instalador de pisos y cerámicas",
      "Soldador",
      "Técnico en refrigeración",
      "Técnico en lavadoras"
    ]
  },
  {
    "categoria": "Tecnología y computación",
    "servicios": [
      "Técnico en computación",
      "Reparador de celulares",
      "Programador web",
      "Instalador de cámaras de seguridad"
    ]
  },
  {
    "categoria": "Transporte y mudanzas",
    "servicios": [
      "Chofer particular",
      "Servicio de mudanza",
      "Repartidor",
      "Moto delivery",
      "Flete local"
    ]
  },
  {
    "categoria": "Cuidado personal y bienestar",
    "servicios": [
      "Peluquero",
      "Manicurista",
      "Barbero",
      "Esteticista",
      "Podólogo"
    ]
  },
  {
    "categoria": "Cuidado familiar y mascotas",
    "servicios": [
      "Niñera",
      "Cuidadores de adultos mayores",
      "Paseador de perros",
      "Entrenador canino",
      "Veterinario a domicilio"
    ]
  }
];

// Servicios fijos e inmutables (reemplazado por SERVICE_CATEGORIES)
export const SKILLS = [];

// Ubicación por defecto para el mapa
export const DEFAULT_LOCATION = { lat: -33.4489, lng: -70.6693 };

// Zoom por defecto para el mapa
export const DEFAULT_ZOOM = 13;

// URLs de APIs
export const GEOCODING_API_URL = 'https://nominatim.openstreetmap.org/reverse';
// Backend API: configurable por ventana global en producción
export const API_BASE_URL = (typeof window !== 'undefined' && window.API_BASE_URL)
  ? window.API_BASE_URL
  : 'http://127.0.0.1:8000/api/v1';
