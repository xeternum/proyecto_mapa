
// js/dataService.js
// ============================================
// DATA SERVICE - Gestión de servicios con backend
// ============================================

import { haversineDistance } from './utils.js';
import { getServices as getServicesFromAPI } from './apiService.js';

let services = [];
let centerLocation = null;
let isLoadingServices = false;
let lastLoadTime = null;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutos en milisegundos

/**
 * Verifica si el caché es válido
 */
const isCacheValid = () => {
    if (!lastLoadTime) return false;
    const elapsed = Date.now() - lastLoadTime;
    return elapsed < CACHE_DURATION;
};

/**
 * Carga los servicios desde el backend
 * @param {boolean} forceRefresh - Forzar recarga aunque el caché sea válido
 */
const loadServicesData = async (forceRefresh = false) => {
    console.log(`📊 loadServicesData llamado - forceRefresh: ${forceRefresh}, cacheValid: ${isCacheValid()}, services: ${services.length}`);
    
    // Usar caché si es válido y no se fuerza refresh
    if (!forceRefresh && isCacheValid() && services.length > 0) {
        console.log('⚡ Usando servicios cacheados (' + services.length + ' servicios)');
        return;
    }
    
    if (isLoadingServices) {
        console.log('⏳ Ya se están cargando servicios...');
        return;
    }
    
    try {
        isLoadingServices = true;
        console.log('🔄 Cargando servicios desde backend...');
        
        // Obtener servicios desde el backend
        services = await getServicesFromAPI();
        lastLoadTime = Date.now();
        
        console.log('✅ Servicios cargados:', services.length);
        console.log('📊 Categorías encontradas:', [...new Set(services.map(s => s.category))]);
        console.log('📋 Detalle de servicios:', services.map(s => ({ 
            id: s.id, 
            name: s.serviceName, 
            category: s.category 
        })));
        
        console.log(`✅ ${services.length} servicios cargados desde backend`);
        
    } catch (error) {
        console.error('❌ Error cargando servicios:', error);
        // Si falla, usar array vacío
        services = [];
    } finally {
        isLoadingServices = false;
    }
};

/**
 * Inicializa el servicio de datos con servicios del backend
 * @param {object} initialCenterLocation - La ubicación central inicial
 */
export const initDataService = async (initialCenterLocation) => {
    centerLocation = initialCenterLocation;
    await loadServicesData();
};

/**
 * Recarga los servicios desde el backend
 * Útil después de crear/actualizar/eliminar un servicio
 * @param {boolean} forceRefresh - Forzar recarga ignorando caché (default false para respetar caché)
 */
export const reloadServices = async (forceRefresh = false) => {
    await loadServicesData(forceRefresh);
};

/**
 * Actualiza un servicio específico en el caché sin recargar todo
 * @param {Object} updatedService - Servicio actualizado
 */
export const updateServiceInCache = (updatedService) => {
    const index = services.findIndex(s => s.id === updatedService.id);
    if (index !== -1) {
        services[index] = updatedService;
        console.log(`✅ Servicio ${updatedService.id} actualizado en caché`);
    }
};

/**
 * Agrega un nuevo servicio al caché sin recargar todo
 * @param {Object} newService - Nuevo servicio
 */
export const addServiceToCache = (newService) => {
    services.push(newService);
    console.log(`✅ Servicio ${newService.id} agregado al caché`);
};

/**
 * Elimina un servicio del caché sin recargar todo
 * @param {number} serviceId - ID del servicio a eliminar
 */
export const removeServiceFromCache = (serviceId) => {
    const index = services.findIndex(s => s.id === serviceId);
    if (index !== -1) {
        services.splice(index, 1);
        console.log(`✅ Servicio ${serviceId} eliminado del caché`);
    }
};

/**
 * Obtiene todos los servicios
 * @returns {Array} - La lista de servicios
 */
export const getUsers = () => services; // Mantiene nombre para compatibilidad

/**
 * Obtiene todos los servicios (alias más claro)
 * @returns {Array} - La lista de servicios
 */
export const getServices = () => services;

/**
 * Añade un nuevo servicio localmente
 * NOTA: Ahora los servicios se crean a través de AuthService.createService
 * Esta función solo actualiza el array local después de la creación
 * @param {object} service - El nuevo servicio a añadir
 */
export const addUser = (service) => {
    services.push(service);
};

/**
 * Añade un servicio (alias más claro)
 * @param {object} service - El nuevo servicio a añadir
 */
export const addService = (service) => {
    services.push(service);
};

/**
 * Actualiza la ubicación central para cálculos de distancia
 * @param {object} newCenterLocation - La nueva ubicación central
 */
export const updateCenterLocation = (newCenterLocation) => {
    centerLocation = newCenterLocation;
};

/**
 * Obtiene la ubicación central actual
 * @returns {object} - La ubicación central
 */
export const getCenterLocation = () => centerLocation;
