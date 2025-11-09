// js/validationService.js

import { validateContactMethod } from './contactService.js';

/**
 * Servicio de validación para el frontend
 * Contiene todas las validaciones de datos antes de enviar a la API
 */

/**
 * Valida los datos de un nuevo servicio
 * @param {Object} serviceData - Datos del servicio a validar
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export function validateServiceData(serviceData) {
    const errors = [];

    // Validar nombre del servicio
    if (!serviceData.serviceName || !serviceData.serviceName.trim()) {
        errors.push('El nombre del servicio es requerido.');
    } else if (serviceData.serviceName.trim().length < 3) {
        errors.push('El nombre del servicio debe tener al menos 3 caracteres.');
    } else if (serviceData.serviceName.trim().length > 100) {
        errors.push('El nombre del servicio no puede exceder 100 caracteres.');
    }

    // Validar descripción
    if (!serviceData.description || !serviceData.description.trim()) {
        errors.push('La descripción del servicio es requerida.');
    } else if (serviceData.description.trim().length < 10) {
        errors.push('La descripción debe tener al menos 10 caracteres.');
    } else if (serviceData.description.trim().length > 500) {
        errors.push('La descripción no puede exceder 500 caracteres.');
    }

    // Validar categoría
    if (!serviceData.category || !serviceData.category.trim()) {
        errors.push('La categoría del servicio es requerida.');
    }

    // Validar precio (ahora es numérico)
    if (serviceData.price === undefined || serviceData.price === null || serviceData.price === '' || isNaN(serviceData.price)) {
        errors.push('El precio del servicio es requerido.');
    } else if (serviceData.price < 0) {
        errors.push('El precio debe ser un número positivo.');
    }

    // Validar modalidad de precio
    const validModalities = ['por_hora', 'por_servicio', 'por_dia', 'por_mes', 'por_proyecto', 'consultar'];
    if (!serviceData.priceModality || !validModalities.includes(serviceData.priceModality)) {
        errors.push('La modalidad de precio no es válida.');
    }

    // Validar horario
    if (serviceData.schedule && serviceData.schedule.length > 100) {
        errors.push('El horario no puede exceder 100 caracteres.');
    }

    // Validar método de contacto usando el servicio especializado
    if (serviceData.contactMethod) {
        const contactValidation = validateContactMethod(serviceData.contactMethod);
        if (!contactValidation.isValid) {
            errors.push(...contactValidation.errors);
        }
    }

    // Validar ubicación
    if (!serviceData.location) {
        errors.push('La ubicación del servicio es requerida.');
    } else {
        if (!serviceData.location.lat || !serviceData.location.lng) {
            errors.push('Las coordenadas de ubicación son requeridas.');
        } else if (!isValidCoordinate(serviceData.location.lat, 'lat') || 
                   !isValidCoordinate(serviceData.location.lng, 'lng')) {
            errors.push('Las coordenadas de ubicación no son válidas.');
        }
    }

    // Validar dirección
    if (!serviceData.address || !serviceData.address.trim()) {
        errors.push('La dirección del servicio es requerida.');
    } else if (serviceData.address.trim().length > 200) {
        errors.push('La dirección no puede exceder 200 caracteres.');
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Valida si un email es válido
 * @param {string} email - Email a validar
 * @returns {boolean} - true si es válido
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

/**
 * Valida si un contacto es válido (teléfono o email)
 * @param {string} contact - Contacto a validar
 * @returns {boolean} - true si es válido
 */
function isValidContact(contact) {
    const cleanContact = contact.trim();
    
    // Verificar si es un email válido
    if (isValidEmail(cleanContact)) {
        return true;
    }
    
    // Verificar si es un teléfono válido (formato simple)
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,15}$/;
    return phoneRegex.test(cleanContact);
}

/**
 * Valida coordenadas geográficas
 * @param {number} value - Valor de la coordenada
 * @param {string} type - Tipo: 'lat' o 'lng'
 * @returns {boolean} - true si es válida
 */
function isValidCoordinate(value, type) {
    if (typeof value !== 'number' || isNaN(value)) {
        return false;
    }
    
    if (type === 'lat') {
        return value >= -90 && value <= 90;
    } else if (type === 'lng') {
        return value >= -180 && value <= 180;
    }
    
    return false;
}

/**
 * Valida filtros de búsqueda
 * @param {Object} filters - Filtros a validar
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export function validateSearchFilters(filters) {
    const errors = [];

    // Validar término de búsqueda
    if (filters.search && filters.search.length > 100) {
        errors.push('El término de búsqueda no puede exceder 100 caracteres.');
    }

    // Validar categoría
    if (filters.category && filters.category.length > 50) {
        errors.push('La categoría no puede exceder 50 caracteres.');
    }

    // Validar radio de búsqueda
    if (filters.radius && (isNaN(filters.radius) || filters.radius < 0 || filters.radius > 100)) {
        errors.push('El radio de búsqueda debe ser un número entre 0 y 100 km.');
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Sanitiza datos de entrada para prevenir inyecciones
 * @param {string} input - Texto a sanitizar
 * @returns {string} - Texto sanitizado
 */
export function sanitizeInput(input) {
    if (typeof input !== 'string') {
        return '';
    }
    
    return input
        .trim()
        .replace(/[<>]/g, '') // Remover caracteres potencialmente peligrosos
        .substring(0, 1000); // Limitar longitud máxima
}

/**
 * Sanitiza un objeto completo
 * @param {Object} data - Objeto a sanitizar
 * @returns {Object} - Objeto sanitizado
 */
export function sanitizeServiceData(data) {
    return {
        serviceName: sanitizeInput(data.serviceName),
        description: sanitizeInput(data.description),
        price: data.price, // El precio es numérico, no sanitizar
        priceModality: data.priceModality, // La modalidad es un enum, no sanitizar
        schedule: sanitizeInput(data.schedule),
        contact: sanitizeInput(data.contact),
        email: sanitizeInput(data.email),
        address: sanitizeInput(data.address),
        category: sanitizeInput(data.category),
        location: data.location, // Las coordenadas no necesitan sanitización de texto
        contactMethod: data.contactMethod // Objeto de contacto, no sanitizar
    };
}