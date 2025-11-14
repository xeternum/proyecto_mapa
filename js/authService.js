// ============================================
// AUTH SERVICE - Gestión de Autenticación
// ============================================

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

// Token de autenticación (se guarda en localStorage)
let authToken = localStorage.getItem('authToken') || null;
let currentUser = null;

// ============================================
// HELPERS
// ============================================

function getHeaders(includeAuth = false) {
    const headers = {
        'Content-Type': 'application/json',
    };
    
    if (includeAuth && authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
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
// FUNCIONES DE AUTENTICACIÓN
// ============================================

/**
 * Login de usuario
 */
export async function login(email, password) {
    try {
        const formData = new URLSearchParams();
        formData.append('username', email); // FastAPI espera 'username'
        formData.append('password', password);

        const response = await fetch(`${API_BASE_URL}/login/access-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData
        });

        const data = await handleResponse(response);
        
        // Guardar token
        authToken = data.access_token;
        localStorage.setItem('authToken', authToken);
        
        // Obtener datos del usuario
        currentUser = await getCurrentUser();
        
        return { success: true, user: currentUser };
    } catch (error) {
        console.error('Error en login:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Registrar nuevo usuario
 */
export async function register(userData) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/`, {
            method: 'POST',
            headers: getHeaders(false),
            body: JSON.stringify(userData)
        });

        await handleResponse(response);
        
        // Automáticamente hacer login después de registrar
        return await login(userData.email, userData.password);
    } catch (error) {
        console.error('Error en registro:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Logout
 */
export function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    
    // Recargar la página para limpiar el estado
    window.location.reload();
}

/**
 * Verificar si hay sesión activa
 */
export function isAuthenticated() {
    return authToken !== null;
}

/**
 * Obtener datos del usuario actual
 */
export async function getCurrentUser() {
    if (!authToken) {
        return null;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/me`, {
            headers: getHeaders(true)
        });

        const user = await handleResponse(response);
        currentUser = user;
        return user;
    } catch (error) {
        console.error('Error obteniendo usuario actual:', error);
        // Si falla, el token probablemente expiró
        logout();
        return null;
    }
}

/**
 * Obtener usuario actual en caché (sin llamada a API)
 */
export function getCachedUser() {
    return currentUser;
}

/**
 * Inicializar autenticación al cargar la página
 */
export async function initAuth() {
    if (isAuthenticated()) {
        try {
            currentUser = await getCurrentUser();
            return { authenticated: true, user: currentUser };
        } catch (error) {
            console.error('Error verificando sesión:', error);
            logout();
            return { authenticated: false, user: null };
        }
    }
    return { authenticated: false, user: null };
}

/**
 * Obtener token actual
 */
export function getAuthToken() {
    return authToken;
}

/**
 * Crear servicio (requiere autenticación)
 */
export async function createService(serviceData) {
    if (!isAuthenticated()) {
        throw new Error('Debes iniciar sesión para publicar un servicio');
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/services/`, {
            method: 'POST',
            headers: getHeaders(true),
            body: JSON.stringify(serviceData)
        });

        return await handleResponse(response);
    } catch (error) {
        console.error('Error creando servicio:', error);
        throw error;
    }
}

/**
 * Obtener mis servicios
 */
export async function getMyServices() {
    if (!isAuthenticated()) {
        throw new Error('Debes iniciar sesión');
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/services/me`, {
            headers: getHeaders(true)
        });

        return await handleResponse(response);
    } catch (error) {
        console.error('Error obteniendo mis servicios:', error);
        throw error;
    }
}

/**
 * Obtener mis reviews
 */
export async function getMyReviews() {
    if (!isAuthenticated()) {
        throw new Error('Debes iniciar sesión');
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/reviews/me`, {
            headers: getHeaders(true)
        });

        return await handleResponse(response);
    } catch (error) {
        console.error('Error obteniendo mis reviews:', error);
        throw error;
    }
}

/**
 * Crear review (requiere autenticación)
 */
export async function createReview(serviceId, rating) {
    if (!isAuthenticated()) {
        throw new Error('Debes iniciar sesión para valorar un servicio');
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/reviews/`, {
            method: 'POST',
            headers: getHeaders(true),
            body: JSON.stringify({
                service_id: serviceId,
                rating: rating
            })
        });

        return await handleResponse(response);
    } catch (error) {
        console.error('Error creando review:', error);
        throw error;
    }
}

/**
 * Actualizar perfil
 */
export async function updateProfile(userData) {
    if (!isAuthenticated()) {
        throw new Error('Debes iniciar sesión');
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/me`, {
            method: 'PUT',
            headers: getHeaders(true),
            body: JSON.stringify(userData)
        });

        currentUser = await handleResponse(response);
        return { success: true, user: currentUser };
    } catch (error) {
        console.error('Error actualizando perfil:', error);
        return { success: false, error: error.message };
    }
}
