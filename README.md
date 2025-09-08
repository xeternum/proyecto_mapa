Requisitos Previos
Node.js (versión 14 o superior)
npm (viene con Node.js)
Git

Instalación
1. Clonar el repositorio
 $ git clone github.com/xeternum/proyecto_mapa.git
 $ cd vue-app

2. Instalar dependencias
 $ npm install

Variables de entorno (si las necesitas) Crea un archivo .env en la raíz del proyecto:
VITE_APP_TITLE=ServiceMap


Ejecutar el proyecto en modo desarrollo
 $ npm run dev
El servidor de desarrollo se iniciará en http://localhost:5173

Estructura del Proyecto
vue-app/
├── src/
│   ├── components/
│   │   ├── AddServiceForm.vue
│   │   ├── HeaderSection.vue
│   │   ├── MapSection.vue
│   │   ├── ProfileModal.vue
│   │   └── SearchModal.vue
│   ├── App.vue
│   └── main.js
├── public/
├── index.html
└── package.json
Características Principales
-Integración con Leaflet para mapas interactivos
-Geolocalización y selección de ubicación
-Búsqueda por categorías
-Publicación de nuevos servicios
-Gestión de perfil de usuario
Scripts Disponibles
npm run dev: Inicia el servidor de desarrollo
npm run build: Compila el proyecto para producción
npm run preview: Previsualiza la versión de producción
Tecnologías Utilizadas
-Vue 3
-Vite
-Leaflet
-CSS3
-HTML5
