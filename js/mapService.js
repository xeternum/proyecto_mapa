// js/mapService.js

import { DEFAULT_LOCATION, DEFAULT_ZOOM } from './config.js';
import * as DataService from './dataService.js';

let map;
let tempServiceMarker;
let isSelectingLocation = false;
let onLocationSelectCallback;

const categoryIcons = {
    'Diseño Gráfico': '🎨',
    'Carpintería': '🔨',
    'Electricista': '⚡',
    'Fontanería': '🔧',
    'Clases particulares': '📚',
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

        marker.bindPopup(`
            <div style="min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; color: #333;">${user.serviceName}</h3>
                <p style="margin: 4px 0;"><strong>Categoría:</strong> ${user.category}</p>
                <p style="margin: 4px 0;"><strong>Dirección:</strong> ${user.address}</p>
                <p style="margin: 4px 0;"><strong>Contacto:</strong> <a href="mailto:${user.email}">${user.email}</a></p>
            </div>
        `);
    });
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
    document.getElementById('map-section').classList.add('location-selection-mode');
    map.getContainer().style.cursor = 'crosshair';
};

/**
 * Desactiva el modo de selección de ubicación.
 */
export const exitLocationSelectionMode = () => {
    isSelectingLocation = false;
    document.getElementById('map-section').classList.remove('location-selection-mode');
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