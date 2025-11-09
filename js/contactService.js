// js/contactService.js

/**
 * Servicio para gestión de contacto y validación de métodos de comunicación
 */

/**
 * Valida un número de teléfono básico (estándar internacional)
 * @param {string} countryCode - Código del país (ej: +56)
 * @param {string} phoneNumber - Número de teléfono sin código de país
 * @returns {Object} - { isValid: boolean, message: string, formattedNumber?: string }
 */
export function validatePhoneNumber(countryCode, phoneNumber) {
    const cleanPhone = phoneNumber.replace(/\D/g, ''); // Solo números
    
    // Validación básica estándar para cualquier país
    const minLength = 7;  // Mínimo común internacional
    const maxLength = 15; // Máximo según estándar E.164
    
    if (!cleanPhone) {
        return {
            isValid: false,
            message: 'El número de teléfono es requerido'
        };
    }

    if (cleanPhone.length < minLength) {
        return {
            isValid: false,
            message: `El número debe tener al menos ${minLength} dígitos`
        };
    }

    if (cleanPhone.length > maxLength) {
        return {
            isValid: false,
            message: `El número no puede exceder ${maxLength} dígitos`
        };
    }

    // Verificar que solo contenga números
    if (!/^\d+$/.test(cleanPhone)) {
        return {
            isValid: false,
            message: 'El número solo debe contener dígitos'
        };
    }

    return {
        isValid: true,
        message: '✓ Número válido',
        formattedNumber: `${countryCode}${cleanPhone}`
    };
}

/**
 * Genera información de contacto pública (sin datos sensibles)
 * Solo muestra el tipo de contacto disponible, no los datos reales
 * @param {Object} contactInfo - Información de contacto
 * @returns {Object} - Información pública de contacto
 */
export function getPublicContactInfo(contactInfo) {
    if (!contactInfo) {
        return { type: 'none', label: 'Sin contacto' };
    }

    if (contactInfo.method === 'email') {
        return { 
            type: 'email', 
            label: 'Contactar por Email',
            icon: '📧'
        };
    } else if (contactInfo.method === 'phone') {
        return { 
            type: 'phone', 
            label: contactInfo.whatsappAvailable ? 'Contactar (Tel/WhatsApp)' : 'Contactar por Teléfono',
            icon: contactInfo.whatsappAvailable ? '📱💬' : '📞'
        };
    }

    return { type: 'none', label: 'Contactar', icon: '📞' };
}

/**
 * Revela información de contacto completa (solo para usuarios autorizados)
 * @param {Object} contactInfo - Información de contacto
 * @returns {Object} - Información de contacto completa
 */
export function revealContactInfo(contactInfo) {
    // En un sistema real, aquí verificarías permisos de usuario
    // Por ahora, simplemente retornamos la información completa
    return { ...contactInfo };
}

/**
 * Formatea un número de teléfono para mostrar de manera legible
 * @param {string} phoneNumber - Número completo con código de país
 * @returns {string} - Número formateado
 */
export function formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return '';
    
    // Detectar código de país
    const countryCode = phoneNumber.match(/^\+\d{1,3}/)?.[0];
    if (!countryCode) return phoneNumber;
    
    const number = phoneNumber.substring(countryCode.length);
    
    // Formatear según el país
    switch (countryCode) {
        case '+56': // Chile: +56 9 1234 5678
            return `${countryCode} ${number.substring(0, 1)} ${number.substring(1, 5)} ${number.substring(5)}`;
        case '+54': // Argentina: +54 9 011 234-5678
            if (number.length === 10) {
                return `${countryCode} ${number.substring(0, 1)} ${number.substring(1, 4)} ${number.substring(4, 7)}-${number.substring(7)}`;
            }
            break;
        case '+1': // EE.UU.: +1 (555) 123-4567
            return `${countryCode} (${number.substring(0, 3)}) ${number.substring(3, 6)}-${number.substring(6)}`;
        case '+34': // España: +34 612 34 56 78
            return `${countryCode} ${number.substring(0, 3)} ${number.substring(3, 5)} ${number.substring(5, 7)} ${number.substring(7)}`;
        default:
            // Formato genérico
            return `${countryCode} ${number}`;
    }
    
    return phoneNumber;
}

/**
 * Genera URL de WhatsApp para contacto directo
 * @param {string} phoneNumber - Número completo con código de país
 * @param {string} message - Mensaje predefinido (opcional)
 * @returns {string} - URL de WhatsApp
 */
export function generateWhatsAppURL(phoneNumber, message = '') {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}${message ? `?text=${encodedMessage}` : ''}`;
}

/**
 * Valida que el método de contacto elegido esté completo
 * @param {Object} contactData - Datos de contacto del formulario
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export function validateContactMethod(contactData) {
    const errors = [];
    
    if (!contactData.method) {
        errors.push('Debes seleccionar un método de contacto.');
        return { isValid: false, errors };
    }
    
    if (contactData.method === 'email') {
        if (!contactData.email || !contactData.email.trim()) {
            errors.push('El email es requerido cuando eliges contacto por email.');
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(contactData.email.trim())) {
                errors.push('El formato del email no es válido.');
            }
        }
    }
    
    if (contactData.method === 'phone') {
        if (!contactData.phone || !contactData.phone.trim()) {
            errors.push('El teléfono es requerido cuando eliges contacto telefónico.');
        } else {
            // Validar que tenga código de país
            if (!contactData.countryCode || !contactData.countryCode.startsWith('+')) {
                errors.push('El teléfono debe incluir el código de país (ej: +56912345678).');
            } else {
                const validation = validatePhoneNumber(contactData.countryCode, contactData.phone);
                if (!validation.isValid) {
                    errors.push(`Teléfono inválido: ${validation.message}`);
                }
            }
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}