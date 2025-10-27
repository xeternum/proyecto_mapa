// js/uiService.js

import { SKILLS } from './config.js';
import * as DataService from './dataService.js';
import * as ApiService from './apiService.js';
import { haversineDistance } from './utils.js';

// --- Referencias a elementos del DOM ---
const modals = {
    serviceInfo: document.getElementById('service-info-modal'),
    profile: document.getElementById('profile-modal')
};

const notificationContainer = document.getElementById('notification-container');
const serviceCategoriesDiv = document.getElementById('service-categories');
const nearbyUsersList = document.getElementById('nearby-users-list');
const serviceSearchInput = document.getElementById('service-search-input');
const registerForm = document.getElementById('register-form');
const serviceAddressInput = document.getElementById('service-address');
const resultsCount = document.getElementById('results-count');

/**
 * Muestra una notificación flotante.
 * @param {string} message - El mensaje a mostrar.
 * @param {string} type - El tipo de notificación (success, error, info).
 * @param {number} duration - La duración en milisegundos.
 */
export const showNotification = (message, type = 'info', duration = 3000) => {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    notificationContainer.appendChild(notification);

    // Forzar el repintado para que la animación de entrada funcione
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Ocultar y eliminar la notificación después de la duración
    setTimeout(() => {
        notification.classList.remove('show');
        notification.addEventListener('transitionend', () => {
            notification.remove();
        });
    }, duration);
};

/**
 * Muestra un modal específico.
 * @param {string} modalName - Nombre del modal a mostrar (search, serviceInfo, profile).
 */
export const showModal = (modalName) => {
    hideAllModals();
    if (modals[modalName]) {
        modals[modalName].classList.remove('hidden-section');
        document.body.style.overflow = 'hidden';
    }
};

/**
 * Oculta un modal específico.
 * @param {string} modalName - Nombre del modal a ocultar.
 */
export const hideModal = (modalName) => {
    if (modals[modalName]) {
        modals[modalName].classList.add('hidden-section');
        document.body.style.overflow = 'auto';
    }
};

/**
 * Oculta todos los modales.
 */
export const hideAllModals = () => {
    Object.values(modals).forEach(modal => modal.classList.add('hidden-section'));
    document.body.style.overflow = 'auto';
};

/**
 * Muestra u oculta el panel de búsqueda lateral.
 */
export const toggleSearchPanel = () => {
    document.getElementById('search-panel').classList.toggle('is-open');
};

/**
 * Renderiza los botones de categorías de servicios.
 * @param {Function} onCategoryClick - Callback para cuando se hace clic en una categoría.
 * @param {Array<string>} skillsToRender - Opcional, lista de habilidades para mostrar.
 */
export const renderServiceCategories = (onCategoryClick, skillsToRender = SKILLS) => {
    serviceCategoriesDiv.innerHTML = ''; // Limpiar antes de renderizar
    skillsToRender.forEach(skill => {
        const categoryBtn = document.createElement('button');
        categoryBtn.className = 'category-btn';
        categoryBtn.textContent = skill;
        categoryBtn.dataset.category = skill; // Guardar la categoría en un atributo de datos
        categoryBtn.addEventListener('click', () => {
            onCategoryClick(skill);
        });
        serviceCategoriesDiv.appendChild(categoryBtn);
    });
};

/**
 * Actualiza la categoría activa en la UI.
 * @param {string} category - La categoría que se debe marcar como activa.
 */
export const updateActiveCategory = (category) => {
    const buttons = serviceCategoriesDiv.querySelectorAll('.category-btn');
    buttons.forEach(btn => {
        if (btn.dataset.category === category) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
};

/**
 * Renderiza la lista de usuarios/servicios encontrados.
 * @param {Array} users - La lista de usuarios a mostrar.
 */
export const renderSearchResults = (users) => {
    nearbyUsersList.innerHTML = ''; // Limpiar lista

    // Actualizar el contador de resultados
    if (users.length > 0) {
        resultsCount.textContent = `Mostrando ${users.length} resultado(s)`;
    } else {
        resultsCount.textContent = '';
    }

    if (users.length === 0) {
        nearbyUsersList.innerHTML = '<li class="no-results">No se encontraron servicios.</li>';
        return;
    }

    users.forEach(user => {
        const card = document.createElement('li');
        card.className = 'service-card';

        const cardHeader = document.createElement('div');
        cardHeader.className = 'service-card-header';

        const title = document.createElement('h3');
        title.textContent = user.serviceName;
        cardHeader.appendChild(title);

        const category = document.createElement('span');
        category.className = 'service-card-category';
        category.textContent = user.category;
        cardHeader.appendChild(category);

        const cardBody = document.createElement('div');
        cardBody.className = 'service-card-body';

        const contact = document.createElement('p');
        contact.innerHTML = `<strong>Contacto:</strong> ${user.email}`;
        cardBody.appendChild(contact);

        // Añadir la distancia si está disponible
        if (user.distance) {
            const distance = document.createElement('p');
            distance.className = 'publication-distance';
            distance.innerHTML = `<strong>Distancia:</strong> Aprox. ${user.distance.toFixed(2)} km`;
            cardBody.appendChild(distance);
        }

        card.appendChild(cardHeader);
        card.appendChild(cardBody);

        nearbyUsersList.appendChild(card);
    });
};

/**
 * Actualiza el campo de dirección en el formulario.
 * @param {string} address - La dirección a mostrar.
 */
export const updateAddressInput = (address) => {
    serviceAddressInput.value = address;
};

/**
 * Resetea el formulario de registro.
 */
export const resetRegisterForm = () => {
    registerForm.reset();
};

/**
 * Inicializa los listeners de eventos para los elementos de la UI.
 * @param {object} callbacks - Un objeto con las funciones a llamar para diferentes eventos. (onCloseModal, onSearchInput)
 */
export const initEventListeners = (callbacks) => {
    // Cierre de modales
    Object.values(modals).forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) callbacks.onCloseModal();
        });
    });
    document.getElementById('close-search-panel').addEventListener('click', callbacks.onCloseSearchPanel);
    document.getElementById('close-service-info-modal').addEventListener('click', callbacks.onCloseModal);
    document.getElementById('close-profile-modal').addEventListener('click', callbacks.onCloseModal);

    // Búsqueda en tiempo real
    serviceSearchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        callbacks.onSearchInput(searchTerm);
    });
};