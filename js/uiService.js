// js/uiService.js

import { SERVICE_CATEGORIES } from './config.js';
import * as DataService from './dataService.js';
import * as ApiService from './apiService.js';
import { haversineDistance } from './utils.js';

// --- Referencias a elementos del DOM ---
const modals = {
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
 * Cierra todos los paneles laterales.
 */
export const closeAllPanels = () => {
    document.getElementById('search-panel').classList.remove('is-open');
    document.getElementById('publish-panel').classList.remove('is-open');
};

/**
 * Muestra u oculta el panel de búsqueda lateral.
 */
export const toggleSearchPanel = () => {
    const publishPanel = document.getElementById('publish-panel');
    if (publishPanel.classList.contains('is-open')) {
        publishPanel.classList.remove('is-open');
    }
    document.getElementById('search-panel').classList.toggle('is-open');
};

/**
 * Muestra u oculta el panel de publicar servicio.
 */
export const togglePublishPanel = () => {
    const searchPanel = document.getElementById('search-panel');
    if (searchPanel.classList.contains('is-open')) {
        searchPanel.classList.remove('is-open');
    }
    document.getElementById('publish-panel').classList.toggle('is-open');
};

/**
 * Renderiza las categorías o los servicios de una categoría en el panel de búsqueda.
 * @param {Function} onCategoryClick - Callback para clic en una categoría/servicio.
 * @param {Function} onBackClick - Callback para clic en el botón de volver.
 * @param {string|null} categoryName - La categoría a mostrar. Si es null, muestra las principales.
 */
export const renderServiceCategories = (onCategoryClick, onBackClick, categoryName = null) => {
    serviceCategoriesDiv.innerHTML = ''; // Limpiar

    if (categoryName) {
        const category = SERVICE_CATEGORIES.find(c => c.categoria === categoryName);
        if (!category) return;

        // Botón para volver a las categorías principales
        const backBtn = document.createElement('button');
        backBtn.className = 'category-btn back-btn';
        backBtn.textContent = '← Volver a categorías';
        backBtn.addEventListener('click', onBackClick);
        serviceCategoriesDiv.appendChild(backBtn);

        // Renderizar servicios de la categoría
        category.servicios.forEach(service => {
            const serviceBtn = document.createElement('button');
            serviceBtn.className = 'category-btn';
            serviceBtn.textContent = service;
            serviceBtn.dataset.category = service; // Se busca por el servicio específico
            serviceBtn.addEventListener('click', () => onCategoryClick(service));
            serviceCategoriesDiv.appendChild(serviceBtn);
        });

    } else {
        // Renderizar categorías principales
        SERVICE_CATEGORIES.forEach(category => {
            const categoryBtn = document.createElement('button');
            categoryBtn.className = 'category-btn';
            categoryBtn.textContent = category.categoria;
            categoryBtn.dataset.category = category.categoria;
            categoryBtn.addEventListener('click', () => onCategoryClick(category.categoria, true)); // true indica que es una categoría principal
            serviceCategoriesDiv.appendChild(categoryBtn);
        });
    }
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
 * Inicializa los dropdowns de categoría y servicio en el formulario de publicación.
 */
export const initPublishFormCategories = () => {
    const mainCategorySelect = document.getElementById('service-main-category');
    const subCategorySelect = document.getElementById('service-subcategory');

    // Limpiar opciones existentes
    mainCategorySelect.innerHTML = '<option value="">Selecciona una categoría</option>';
    subCategorySelect.innerHTML = '<option value="">Selecciona un servicio</option>';

    // Llenar el dropdown de categorías principales
    SERVICE_CATEGORIES.forEach(category => {
        const option = document.createElement('option');
        option.value = category.categoria;
        option.textContent = category.categoria;
        mainCategorySelect.appendChild(option);
    });

    // Listener para cambios en la categoría principal
    mainCategorySelect.addEventListener('change', () => {
        const selectedCategoryName = mainCategorySelect.value;
        subCategorySelect.innerHTML = '<option value="">Selecciona un servicio</option>'; // Resetear

        if (selectedCategoryName) {
            const selectedCategory = SERVICE_CATEGORIES.find(c => c.categoria === selectedCategoryName);
            if (selectedCategory) {
                selectedCategory.servicios.forEach(service => {
                    const option = document.createElement('option');
                    option.value = service;
                    option.textContent = service;
                    subCategorySelect.appendChild(option);
                });
            }
        }
    });
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
    document.getElementById('close-search-panel').addEventListener('click', toggleSearchPanel);
    document.getElementById('close-publish-panel').addEventListener('click', togglePublishPanel);
    document.getElementById('close-profile-modal').addEventListener('click', callbacks.onCloseModal);

    // Búsqueda en tiempo real
    serviceSearchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        callbacks.onSearchInput(searchTerm);
    });
};