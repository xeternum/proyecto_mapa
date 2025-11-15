
// js/apiService.js
// ============================================
// API SERVICE - Conexión con Backend Real
// ============================================

import { GEOCODING_API_URL } from './config.js';

// URL base de la API real
const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

// ============================================
// HELPERS
// ============================================

function getAuthToken() {
    return localStorage.getItem('authToken');
}

function getHeaders(includeAuth = false) {
    const headers = {
        'Content-Type': 'application/json',
    };
    
    if (includeAuth) {
        const token = getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }
    
    return headers;
}

async function handleResponse(response) {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Error desconocido' }));
        throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }
    return response.json();
}

// ============================================
// TRANSFORMACIÓN DE DATOS
// ============================================

/**
 * Transforma servicio del backend al formato frontend
 */
export function transformServiceToFrontend(service) {
    return {
        id: service.id,
        serviceName: service.service_name,
        description: service.description,
        category: service.category,
        price: service.price,
        priceModality: service.price_modality,
        schedule: service.schedule,
        address: service.address,
        rating: service.rating,
        totalReviews: service.total_reviews,
        location: {
            lat: service.latitude,
            lng: service.longitude
        },
        contactMethod: {
            method: service.contact_method,
            email: service.contact_email,
            phone: service.contact_phone,
            countryCode: service.contact_country_code,
            whatsappAvailable: service.whatsapp_available
        },
        userId: service.user_id,
        isActive: service.is_active,
        createdAt: service.created_at,
        updatedAt: service.updated_at,
        // Información del propietario (si está disponible)
        ownerName: service.owner?.full_name || 'Usuario',
        ownerId: service.owner?.id || service.user_id
    };
}

// ============================================
// FUNCIONES DE API
// ============================================

/**
 * Obtiene servicios desde el backend con filtros opcionales
 * @param {Object} filters - Filtros para aplicar a la búsqueda
 * @returns {Promise<Array>} - Array de servicios
 */
export async function getServices(filters = {}) {
    try {
        console.log('🌐 API: Obteniendo servicios con filtros:', filters);
        
        // Construir query params
        const params = new URLSearchParams();
        if (filters.category) params.append('category', filters.category);
        if (filters.search) params.append('search', filters.search);
        if (filters.skip) params.append('skip', filters.skip);
        if (filters.limit) params.append('limit', filters.limit);
        
        const url = params.toString() ? `${API_BASE_URL}/services/?${params.toString()}` : `${API_BASE_URL}/services/`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: getHeaders(false)
        });
        
        const services = await handleResponse(response);
        
        // Transformar servicios al formato frontend
        const transformedServices = services.map(transformServiceToFrontend);
        
        console.log(`✅ API: ${transformedServices.length} servicios obtenidos y transformados`);
        return transformedServices;
        
    } catch (error) {
        console.error('❌ Error obteniendo servicios:', error);
        // Si el backend no está disponible, retornar array vacío en lugar de romper la app
        return [];
    }
}

/**
 * Crea un nuevo servicio en el backend
 * NOTA: Esta función ya no se usa directamente, se usa AuthService.createService
 * @param {Object} serviceData - Datos del servicio a crear
 * @returns {Promise<Object>} - Servicio creado
 */
export async function createService(serviceData) {
    try {
        console.log('🌐 API: Creando servicio con datos:', serviceData);
        
        // Transformar datos del frontend al formato backend
        const backendData = {
            service_name: serviceData.serviceName,
            description: serviceData.description,
            category: serviceData.category,
            price: parseFloat(serviceData.price),
            price_modality: serviceData.priceModality,
            schedule: serviceData.schedule,
            address: serviceData.address,
            latitude: serviceData.location.lat,
            longitude: serviceData.location.lng,
            contact_method: serviceData.contactMethod.method,
            contact_email: serviceData.contactMethod.email || null,
            contact_phone: serviceData.contactMethod.phone || null,
            contact_country_code: serviceData.contactMethod.countryCode || null,
            whatsapp_available: serviceData.contactMethod.whatsappAvailable || false
        };
        
        const response = await fetch(`${API_BASE_URL}/services/`, {
            method: 'POST',
            headers: getHeaders(true), // Requiere autenticación
            body: JSON.stringify(backendData)
        });
        
        const service = await handleResponse(response);
        
        // Transformar respuesta al formato frontend
        const transformedService = transformServiceToFrontend(service);
        
        console.log('✅ API: Servicio creado exitosamente:', transformedService);
        return transformedService;
        
    } catch (error) {
        console.error('❌ Error creando servicio:', error);
        throw error;
    }
}

/**
 * Actualiza un servicio existente
 * @param {number|string} serviceId - ID del servicio
 * @param {Object} updateData - Datos a actualizar
 * @returns {Promise<Object>} - Servicio actualizado
 */
export async function updateService(serviceId, updateData) {
    try {
        console.log('🌐 API: Actualizando servicio ID:', serviceId);
        console.log('📦 Datos recibidos:', updateData);
        
        // Los datos ya vienen en formato snake_case desde main.js
        // Solo enviamos directamente al backend
        
        console.log('📤 Enviando al endpoint PUT:', `${API_BASE_URL}/services/${serviceId}`);
        
        const response = await fetch(`${API_BASE_URL}/services/${serviceId}`, {
            method: 'PUT',
            headers: getHeaders(true), // Requiere autenticación
            body: JSON.stringify(updateData)
        });
        
        console.log('📥 Respuesta HTTP status:', response.status);
        
        const service = await handleResponse(response);
        console.log('📦 Servicio devuelto por backend:', service);
        
        const transformedService = transformServiceToFrontend(service);
        
        console.log('✅ API: Servicio actualizado y transformado:', transformedService);
        return transformedService;
        
    } catch (error) {
        console.error('❌ Error actualizando servicio:', error);
        throw error;
    }
}

/**
 * Elimina un servicio
 * @param {number|string} serviceId - ID del servicio a eliminar
 * @returns {Promise<boolean>} - true si se eliminó exitosamente
 */
export async function deleteService(serviceId) {
    try {
        console.log('🌐 API: Eliminando servicio ID:', serviceId);
        
        const response = await fetch(`${API_BASE_URL}/services/${serviceId}`, {
            method: 'DELETE',
            headers: getHeaders(true) // Requiere autenticación
        });
        
        await handleResponse(response);
        
        console.log('✅ API: Servicio eliminado exitosamente');
        return true;
        
    } catch (error) {
        console.error('❌ Error eliminando servicio:', error);
        throw error;
    }
}

/**
 * Obtiene un servicio específico por ID
 * @param {number|string} serviceId - ID del servicio
 * @returns {Promise<Object>} - Servicio
 */
export async function getServiceById(serviceId) {
    try {
        console.log('🌐 API: Obteniendo servicio ID:', serviceId);
        
        const response = await fetch(`${API_BASE_URL}/services/${serviceId}`, {
            method: 'GET',
            headers: getHeaders(false)
        });
        
        const service = await handleResponse(response);
        const transformedService = transformServiceToFrontend(service);
        
        console.log('✅ API: Servicio obtenido:', transformedService);
        return transformedService;
        
    } catch (error) {
        console.error('❌ Error obteniendo servicio:', error);
        throw error;
    }
}

/**
 * Obtiene las categorías disponibles
 * @returns {Promise<Array>} - Array de categorías
 */
export async function getCategories() {
    try {
        console.log('🌐 API: Obteniendo categorías');
        
        const response = await fetch(`${API_BASE_URL}/categories/`, {
            method: 'GET',
            headers: getHeaders(false)
        });
        
        const categories = await handleResponse(response);
        
        console.log('✅ API: Categorías obtenidas:', categories);
        return categories;
        
    } catch (error) {
        console.error('❌ Error obteniendo categorías:', error);
        return []; // Retornar array vacío si falla
    }
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

// ========================================
// REVIEWS API
// ========================================

/**
 * Obtiene todas las reviews de un servicio
 * @param {number} serviceId - ID del servicio
 * @returns {Promise<Array>} - Array de reviews
 */
export async function getServiceReviews(serviceId) {
    try {
        console.log('🌐 API: Obteniendo reviews del servicio:', serviceId);
        
        const response = await fetch(`${API_BASE_URL}/reviews/service/${serviceId}`, {
            method: 'GET',
            headers: getHeaders(false)
        });
        
        const reviews = await handleResponse(response);
        console.log(`✅ API: ${reviews.length} reviews obtenidas`);
        return reviews;
        
    } catch (error) {
        console.error('❌ Error obteniendo reviews:', error);
        return [];
    }
}

/**
 * Crea una nueva review para un servicio
 * @param {Object} reviewData - Datos de la review {serviceId, rating}
 * @returns {Promise<Object>} - Review creada
 */
export async function createReview(reviewData) {
    try {
        console.log('🌐 API: Creando review:', reviewData);
        
        const backendData = {
            service_id: reviewData.serviceId,
            rating: reviewData.rating
        };
        
        const response = await fetch(`${API_BASE_URL}/reviews/`, {
            method: 'POST',
            headers: getHeaders(true), // Requiere autenticación
            body: JSON.stringify(backendData)
        });
        
        const review = await handleResponse(response);
        console.log('✅ API: Review creada exitosamente:', review);
        return review;
        
    } catch (error) {
        console.error('❌ Error creando review:', error);
        throw error;
    }
}

/**
 * Actualiza una review existente
 * @param {number} reviewId - ID de la review
 * @param {Object} reviewData - Datos a actualizar {rating}
 * @returns {Promise<Object>} - Review actualizada
 */
export async function updateReview(reviewId, reviewData) {
    try {
        console.log('🌐 API: Actualizando review:', reviewId);
        
        const backendData = {
            rating: reviewData.rating
        };
        
        const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
            method: 'PUT',
            headers: getHeaders(true), // Requiere autenticación
            body: JSON.stringify(backendData)
        });
        
        const review = await handleResponse(response);
        console.log('✅ API: Review actualizada exitosamente:', review);
        return review;
        
    } catch (error) {
        console.error('❌ Error actualizando review:', error);
        throw error;
    }
}

/**
 * Elimina una review
 * @param {number} reviewId - ID de la review
 * @returns {Promise<boolean>} - true si se eliminó exitosamente
 */
export async function deleteReview(reviewId) {
    try {
        console.log('🌐 API: Eliminando review:', reviewId);
        
        const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
            method: 'DELETE',
            headers: getHeaders(true) // Requiere autenticación
        });
        
        await handleResponse(response);
        console.log('✅ API: Review eliminada exitosamente');
        return true;
        
    } catch (error) {
        console.error('❌ Error eliminando review:', error);
        throw error;
    }
}
