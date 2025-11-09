
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

/**
 * Formatea un precio numérico con separadores de miles y modalidad
 * @param {number} price - Precio numérico
 * @param {string} modality - Modalidad de cobro
 * @returns {string} - Precio formateado
 */
export const formatPrice = (price, modality) => {
    if (!price || price === 0) {
        return 'Precio a consultar';
    }

    // Formatear número con separadores de miles
    const formattedNumber = price.toLocaleString('es-CL');
    
    // Mapear modalidades a texto legible
    const modalityText = {
        'por_hora': '/hora',
        'por_servicio': '',
        'por_dia': '/día',
        'por_mes': '/mes',
        'por_proyecto': '',
        'consultar': ''
    };

    const modalitySuffix = modalityText[modality] || '';
    
    // Si es "por_servicio" o "por_proyecto", agregar "Desde"
    const prefix = (modality === 'por_servicio' || modality === 'por_proyecto') ? 'Desde ' : '';
    
    if (modality === 'consultar') {
        return 'A consultar';
    }
    
    return `${prefix}$${formattedNumber}${modalitySuffix}`;
};

/**
 * Obtiene el nombre legible de una modalidad de precio
 * @param {string} modality - Modalidad de cobro
 * @returns {string} - Nombre legible
 */
export const getModalityLabel = (modality) => {
    const labels = {
        'por_hora': 'Por hora',
        'por_servicio': 'Por servicio completo',
        'por_dia': 'Por día',
        'por_mes': 'Por mes',
        'por_proyecto': 'Por proyecto',
        'consultar': 'A consultar'
    };
    
    return labels[modality] || 'Por servicio';
};
