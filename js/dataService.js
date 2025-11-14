
// js/dataService.js
// ============================================
// DATA SERVICE - Gestión de servicios con backend
// ============================================

import { haversineDistance } from './utils.js';
import { getServices as getServicesFromAPI } from './apiService.js';

let services = [];
let centerLocation = null;
let isLoadingServices = false;

/**
 * Carga los servicios desde el backend
 */
const loadServicesData = async () => {
    if (isLoadingServices) {
        console.log('⏳ Ya se están cargando servicios...');
        return;
    }
    
    try {
        isLoadingServices = true;
        console.log('📡 Cargando servicios desde backend...');
        
        // Obtener servicios desde el backend
        services = await getServicesFromAPI();
        
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
 */
export const reloadServices = async () => {
    await loadServicesData();
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
