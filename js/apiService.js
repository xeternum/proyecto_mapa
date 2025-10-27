
// js/apiService.js

import { GEOCODING_API_URL } from './config.js';

/**
 * Obtiene la dirección de la calle a partir de coordenadas de latitud y longitud.
 * @param {number} lat - Latitud.
 * @param {number} lng - Longitud.
 * @returns {Promise<string>} - La dirección formateada.
 */
export const getStreetAddress = async (lat, lng) => {
    try {
        const url = `${GEOCODING_API_URL}?format=json&lat=${lat}&lon=${lng}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const { address } = data;
        
        // Construye una dirección más limpia y robusta
        const road = address.road || '';
        const houseNumber = address.house_number || '';
        const suburb = address.suburb || address.quarter || '';
        const city = address.city || address.town || address.village || '';

        let formattedAddress = [road, houseNumber, suburb, city].filter(Boolean).join(', ');
        
        return formattedAddress || 'Dirección no disponible';

    } catch (error) {
        console.error('Error al obtener la dirección:', error);
        return 'No se pudo obtener la dirección';
    }
};
