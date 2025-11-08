// js/mapService.js

import { DEFAULT_LOCATION, DEFAULT_ZOOM } from './config.js';
import * as DataService from './dataService.js';

let map;
let tempServiceMarker;
let isSelectingLocation = false;
let onLocationSelectCallback;
let serviceMarkers = new Map(); // Almacenar marcadores por ID de servicio

const categoryIcons = {
    // Servicios del hogar
    'Electricista': '⚡',
    'Gasfíter': '🔧', 
    'Pintor': '🎨',
    'Jardinero': '🌱',
    'Aseador de hogar': '🧹',
    'Carpintero': '🔨',
    'Cerrajero': '�',
    
    // Construcción y mantenimiento
    'Maestro en construcción': '🏗️',
    'Instalador de pisos y cerámicas': '🧱',
    'Soldador': '🔥',
    'Técnico en refrigeración': '❄️',
    'Técnico en lavadoras': '🔧',
    
    // Tecnología y computación
    'Técnico en computación': '💻',
    'Reparador de celulares': '📱',
    'Programador web': '💻',
    'Instalador de cámaras de seguridad': '📹',
    
    // Transporte y mudanzas
    'Chofer particular': '�',
    'Servicio de mudanza': '📦',
    'Repartidor': '🚲',
    'Moto delivery': '🏍️',
    'Flete local': '🚛',
    
    // Cuidado personal y bienestar
    'Peluquero': '✂️',
    'Manicurista': '💅',
    'Barbero': '💈',
    'Esteticista': '💆',
    'Podólogo': '🦶',
    
    // Cuidado familiar y mascotas
    'Niñera': '👶',
    'Cuidadores de adultos mayores': '👴',
    'Paseador de perros': '🐕',
    'Entrenador canino': '🐕‍🦺',
    'Veterinario a domicilio': '�',
    
    // Fallback
    'Otros': '⚙️'
};

/**
 * Inicializa el mapa Leaflet.
 * @param {Function} onMapClick - Callback que se ejecuta cuando se hace clic en el mapa.
 */
export const initMap = (onMapClick) => {
    map = L.map('map', { 
        zoomControl: false, // Totalmente desactivado para control manual
        attributionControl: false
    }).setView([DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng], DEFAULT_ZOOM);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // --- Control Manual de Controles ---

    // 1. Mover la atribución a la izquierda
    L.control.attribution({ position: 'bottomleft' }).addTo(map);

    // 2. Crear un control de zoom y moverlo a nuestro contenedor personalizado
    const zoomControl = L.control.zoom({ position: 'topleft' }); // La posición es irrelevante aquí
    map.addControl(zoomControl);
    
    const zoomControlContainer = zoomControl.getContainer();
    const customControlsContainer = document.querySelector('.floating-controls');
    
    // Inserta el control de zoom al principio del contenedor personalizado
    customControlsContainer.prepend(zoomControlContainer);

    // --- Fin de Control Manual ---

    map.on('click', (e) => {
        if (isSelectingLocation) {
            onMapClick(e.latlng.lat, e.latlng.lng);
        }
    });

    // La llamada a renderMarkers() se elimina de aquí para evitar la doble renderización.
    // Se llamará desde main.js después de obtener la ubicación del usuario.
};

/**
 * Renderiza los marcadores de los usuarios en el mapa.
 * @param {Array} filteredUsers - Opcional, una lista de usuarios para renderizar. Si no se provee, renderiza todos.
 */
export const renderMarkers = (filteredUsers) => {
    if (!map) return;

    // Limpiar marcadores existentes (excepto el del usuario si ya existe)
    map.eachLayer((layer) => {
        if (layer instanceof L.Marker && !layer.options.isUserMarker) {
            map.removeLayer(layer);
        }
    });

    // Limpiar el Map de referencias
    serviceMarkers.clear();

    const usersToRender = filteredUsers || DataService.getUsers();

    usersToRender.filter(user => user.location).forEach(user => {
        const iconHtml = `<div style="background: white; border-radius: 50%; padding: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); font-size: 20px; text-align: center;">${categoryIcons[user.category] || '⚙️'}</div>`;
        const customIcon = L.divIcon({
            html: iconHtml,
            className: 'custom-marker',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });

        const marker = L.marker([user.location.lat, user.location.lng], { icon: customIcon }).addTo(map);

        // Almacenar referencia del marcador
        serviceMarkers.set(user.id, marker);

        // Crear el contenido del popup ultra simplificado
        const popupContent = `
            <div class="service-popup-mini">
                <h3 class="popup-title-mini">${user.serviceName}</h3>
                <p class="popup-category-mini">${user.category}</p>
                ${user.distance ? `<p class="popup-distance-mini">📍 ${user.distance.toFixed(1)} km</p>` : ''}
                <div class="popup-actions-mini">
                    <button class="popup-btn-mini primary" onclick="window.showServiceDetails('${user.id}')">
                        Ver más
                    </button>
                    ${user.phone ? `
                    <button class="popup-btn-mini secondary" onclick="window.open('tel:${user.phone}', '_self')">
                        📞
                    </button>
                    ` : ''}
                </div>
            </div>
        `;

        marker.bindPopup(popupContent, {
            maxWidth: 200,
            minWidth: 180,
            className: 'custom-popup-mini'
        });
    });
};

/**
 * Enfoca el mapa en un servicio específico y abre su popup.
 * @param {number} serviceId - ID del servicio.
 */
export const focusOnService = (serviceId) => {
    const marker = serviceMarkers.get(serviceId);
    if (marker && map) {
        // Centrar el mapa en el marcador
        map.setView(marker.getLatLng(), 16, {
            animate: true,
            duration: 0.5
        });
        
        // Abrir el popup después de un pequeño delay para que la animación se vea bien
        setTimeout(() => {
            marker.openPopup();
        }, 300);
    }
};

/**
 * Marca la ubicación del usuario en el mapa.
 * @param {{lat: number, lng: number}} userLocation - Coordenadas del usuario.
 */
export const markUserLocation = (userLocation) => {
    if (!map) return;

    const userIcon = L.divIcon({
        html: '<div style="background: #4a86e8; border: 3px solid white; border-radius: 50%; width: 20px; height: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.5);"></div>',
        className: 'user-location-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    const userMarker = L.marker([userLocation.lat, userLocation.lng], { 
        icon: userIcon,
        isUserMarker: true // Opción personalizada para no borrarlo al refrescar
    }).addTo(map);
    
    userMarker.bindPopup("<b>Tu ubicación actual</b>").openPopup();
};


/**
 * Centra el mapa en una ubicación específica.
 * @param {number} lat - Latitud.
 * @param {number} lng - Longitud.
 */
export const centerMap = (lat, lng) => {
    if (map) {
        map.setView([lat, lng], 15);
    }
};

/**
 * Activa el modo de selección de ubicación en el mapa.
 * @param {Function} callback - Función a llamar cuando se selecciona una ubicación.
 */
export const enterLocationSelectionMode = (callback) => {
    isSelectingLocation = true;
    onLocationSelectCallback = callback;
    map.getContainer().style.cursor = 'crosshair';
};

/**
 * Desactiva el modo de selección de ubicación.
 */
export const exitLocationSelectionMode = () => {
    isSelectingLocation = false;
    map.getContainer().style.cursor = '';
    removeTempMarker();
};

/**
 * Muestra un marcador temporal en el mapa.
 * @param {number} lat - Latitud.
 * @param {number} lng - Longitud.
 */
export const showTempMarker = (lat, lng) => {
    removeTempMarker();
    const tempIcon = L.divIcon({
        html: '<div style="background: #667eea; border: 3px solid white; border-radius: 50%; width: 20px; height: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
        className: 'temp-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
    tempServiceMarker = L.marker([lat, lng], { icon: tempIcon }).addTo(map);
};

/**
 * Elimina el marcador temporal del mapa.
 */
export const removeTempMarker = () => {
    if (tempServiceMarker) {
        map.removeLayer(tempServiceMarker);
        tempServiceMarker = null;
    }
};