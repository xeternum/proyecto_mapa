
// js/apiService.js

import { GEOCODING_API_URL } from './config.js';
import { mockUsers } from './mockData.js';

// Configuración de la API simulada
const API_LATENCY = 800; // ms - simula latencia de red
let nextId = mockUsers.length > 0 ? Math.max(...mockUsers.map(p => p.id)) + 1 : 1;

// TODO: Reemplazar con la URL base de la API real.
// const API_BASE_URL = 'https://tu-api.com/v1';

/**
 * Simula la obtención de servicios desde una API.
 * TODO: Reemplazar el cuerpo de esta función con una llamada `fetch` al endpoint GET /services.
 * @param {Object} filters - Filtros para aplicar a la búsqueda
 * @returns {Promise<Array>} - Array de servicios
 */
export async function getServices(filters = {}) {
    console.log('🌐 API_SIM: Obteniendo servicios con filtros:', filters);
    
    // Simular latencia de red
    await new Promise(resolve => setTimeout(resolve, API_LATENCY));

    let results = [...mockUsers]; // Copia para evitar mutaciones
    
    // Aplicar filtros
    if (filters.category) {
        results = results.filter(s => s.category === filters.category);
    }
    
    if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        results = results.filter(s => 
            s.serviceName.toLowerCase().includes(searchTerm) || 
            s.description.toLowerCase().includes(searchTerm) ||
            s.category.toLowerCase().includes(searchTerm)
        );
    }

    if (filters.location && filters.radius) {
        // Filtro por ubicación y radio (implementar si es necesario)
        // results = results.filter(s => calculateDistance(s.location, filters.location) <= filters.radius);
    }

    console.log(`🌐 API_SIM: Retornando ${results.length} servicios`);
    
    // Retornar una copia para simular la inmutabilidad de una respuesta de API
    return JSON.parse(JSON.stringify(results));
}

/**
 * Simula la creación de un nuevo servicio.
 * TODO: Reemplazar el cuerpo de esta función con una llamada `fetch` al endpoint POST /services.
 * @param {Object} serviceData - Datos del servicio a crear
 * @returns {Promise<Object>} - Servicio creado
 */
export async function createService(serviceData) {
    console.log('🌐 API_SIM: Creando servicio con datos:', serviceData);
    
    // Simular latencia de red (más tiempo para simular procesamiento)
    await new Promise(resolve => setTimeout(resolve, API_LATENCY + 500));

    // Simulación de validación en el "backend"
    if (!serviceData.serviceName || !serviceData.category || !serviceData.location) {
        return Promise.reject({ 
            message: 'Datos incompletos. Nombre del servicio, categoría y ubicación son requeridos.',
            code: 'VALIDATION_ERROR'
        });
    }

    if (!serviceData.location.lat || !serviceData.location.lng) {
        return Promise.reject({ 
            message: 'Coordenadas de ubicación inválidas.',
            code: 'INVALID_LOCATION'
        });
    }

    // Crear nuevo servicio con ID único
    const newService = {
        id: nextId++,
        serviceName: serviceData.serviceName,
        description: serviceData.description || '',
        price: serviceData.price || 0,
        priceModality: serviceData.priceModality || 'consultar',
        schedule: serviceData.schedule || 'No especificado',
        address: serviceData.address || '',
        category: serviceData.category,
        rating: 4.0, // Rating inicial
        location: serviceData.location,
        contactMethod: serviceData.contactMethod || null,
        createdAt: new Date().toISOString()
    };

    // Agregar a la "base de datos" simulada
    mockUsers.push(newService);

    console.log('✅ API_SIM: Servicio creado exitosamente:', newService);
    
    return newService;
}

/**
 * Simula la actualización de un servicio existente.
 * TODO: Reemplazar con llamada PUT /services/:id
 * @param {number|string} serviceId - ID del servicio
 * @param {Object} updateData - Datos a actualizar
 * @returns {Promise<Object>} - Servicio actualizado
 */
export async function updateService(serviceId, updateData) {
    console.log('🌐 API_SIM: Actualizando servicio ID:', serviceId, 'con datos:', updateData);
    
    await new Promise(resolve => setTimeout(resolve, API_LATENCY));

    const serviceIndex = mockUsers.findIndex(s => s.id == serviceId);
    
    if (serviceIndex === -1) {
        return Promise.reject({ 
            message: 'Servicio no encontrado.',
            code: 'SERVICE_NOT_FOUND'
        });
    }

    // Actualizar servicio
    const updatedService = {
        ...mockUsers[serviceIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
    };

    mockUsers[serviceIndex] = updatedService;

    console.log('✅ API_SIM: Servicio actualizado exitosamente:', updatedService);
    
    return updatedService;
}

/**
 * Simula la eliminación de un servicio.
 * TODO: Reemplazar con llamada DELETE /services/:id
 * @param {number|string} serviceId - ID del servicio a eliminar
 * @returns {Promise<boolean>} - true si se eliminó exitosamente
 */
export async function deleteService(serviceId) {
    console.log('🌐 API_SIM: Eliminando servicio ID:', serviceId);
    
    await new Promise(resolve => setTimeout(resolve, API_LATENCY));

    const serviceIndex = mockUsers.findIndex(s => s.id == serviceId);
    
    if (serviceIndex === -1) {
        return Promise.reject({ 
            message: 'Servicio no encontrado.',
            code: 'SERVICE_NOT_FOUND'
        });
    }

    // Eliminar servicio
    mockUsers.splice(serviceIndex, 1);

    console.log('✅ API_SIM: Servicio eliminado exitosamente');
    
    return true;
}

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
        console.error('Error obteniendo dirección:', error);
        return 'Dirección no disponible';
    }
};
