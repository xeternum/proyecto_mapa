
// js/utils.js

/**
 * Calcula la distancia Haversine entre dos puntos geográficos.
 * @param {{lat: number, lng: number}} coords1 - Coordenadas del primer punto.
 * @param {{lat: number, lng: number}} coords2 - Coordenadas del segundo punto.
 * @returns {number} - Distancia en kilómetros.
 */
export const haversineDistance = (coords1, coords2) => {
    const toRad = (x) => x * Math.PI / 180;
    const R = 6371; // Radio de la Tierra en km

    const dLat = toRad(coords2.lat - coords1.lat);
    const dLng = toRad(coords2.lng - coords1.lng);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(coords1.lat)) * Math.cos(toRad(coords2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};
