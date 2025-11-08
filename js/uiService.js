// js/uiService.js

import { SERVICE_CATEGORIES } from './config.js';
import * as DataService from './dataService.js';
import * as ApiService from './apiService.js';
import * as MapService from './mapService.js';
import { haversineDistance } from './utils.js';

// --- Referencias a elementos del DOM ---
const modals = {
    profile: document.getElementById('profile-modal')
};

const notificationContainer = document.getElementById('notification-container');
const serviceCategoriesDiv = document.getElementById('service-categories');
const filterStatusDiv = document.getElementById('filter-status');
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
 * @param {Object} options - Opciones adicionales { actionText, actionCallback }
 */
export const showNotification = (message, type = 'info', duration = 3000, options = {}) => {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Crear el contenido de la notificación
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    notification.appendChild(messageSpan);
    
    // Si hay una acción, agregar botón
    if (options.actionText && options.actionCallback) {
        const actionButton = document.createElement('button');
        actionButton.className = 'notification-action';
        actionButton.textContent = options.actionText;
        actionButton.addEventListener('click', () => {
            options.actionCallback();
            notification.remove(); // Cerrar notificación al hacer clic
        });
        notification.appendChild(actionButton);
        
        // Hacer la notificación más duradera si tiene acción
        duration = Math.max(duration, 6000);
    }

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
    hideDetailPanel(); // También cerrar el panel de detalles
};

// Variable para callback de cierre de panel
let onSearchPanelCloseCallback = null;

/**
 * Establece un callback para cuando se cierre el search panel.
 * @param {Function} callback - Función a llamar cuando se cierre el panel.
 */
export const setOnSearchPanelCloseCallback = (callback) => {
    onSearchPanelCloseCallback = callback;
};

/**
 * Muestra u oculta el panel de búsqueda lateral.
 */
export const toggleSearchPanel = () => {
    const publishPanel = document.getElementById('publish-panel');
    if (publishPanel.classList.contains('is-open')) {
        publishPanel.classList.remove('is-open');
    }
    
    const searchPanel = document.getElementById('search-panel');
    const isCurrentlyOpen = searchPanel.classList.contains('is-open');
    const isMobile = window.innerWidth < 768;
    
    // Si está cerrando el panel, resetear el estado del filtro solo en pantallas grandes
    if (isCurrentlyOpen) {
        // Solo resetear filtros en pantallas >= 768px (desktop/tablet)
        if (!isMobile) {
            updateFilterStatus(null);
            if (onSearchPanelCloseCallback) {
                onSearchPanelCloseCallback();
            }
        }
        
        // Restaurar scroll del body en móvil
        if (isMobile) {
            document.body.style.overflow = '';
        }
    } else {
        // Si se está abriendo en móvil, prevenir scroll del body
        if (isMobile) {
            document.body.style.overflow = 'hidden';
        }
    }
    
    searchPanel.classList.toggle('is-open');
};

/**
 * Muestra u oculta el panel de publicar servicio.
 */
export const togglePublishPanel = () => {
    const searchPanel = document.getElementById('search-panel');
    if (searchPanel.classList.contains('is-open')) {
        searchPanel.classList.remove('is-open');
    }
    
    const publishPanel = document.getElementById('publish-panel');
    const isCurrentlyOpen = publishPanel.classList.contains('is-open');
    const isMobile = window.innerWidth < 768;
    
    if (isCurrentlyOpen) {
        // Restaurar scroll del body en móvil
        if (isMobile) {
            document.body.style.overflow = '';
        }
    } else {
        // Si se está abriendo en móvil, prevenir scroll del body
        if (isMobile) {
            document.body.style.overflow = 'hidden';
        }
    }
    
    publishPanel.classList.toggle('is-open');
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
 * Actualiza el estado visual del filtro activo.
 * @param {string|null} filterName - El nombre del filtro activo o null para desactivar.
 */
export const updateFilterStatus = (filterName) => {
    if (!filterStatusDiv) return;
    
    if (filterName) {
        filterStatusDiv.innerHTML = `
            <strong>Filtro activo:</strong> ${filterName}
            <br><small>Usa el botón "← Volver" para mostrar todos los servicios</small>
        `;
        filterStatusDiv.classList.add('active');
    } else {
        filterStatusDiv.classList.remove('active');
        // Pequeño delay para la animación antes de limpiar el contenido
        setTimeout(() => {
            if (!filterStatusDiv.classList.contains('active')) {
                filterStatusDiv.innerHTML = '';
            }
        }, 300);
    }
};

/**
 * Renderiza la lista de usuarios/servicios encontrados.
 * @param {Array} users - La lista de usuarios a mostrar.
 */
export const renderSearchResults = (users) => {
    nearbyUsersList.innerHTML = ''; // Limpiar lista

    // Actualizar el contador de resultados
    if (users.length > 0) {
        const plural = users.length === 1 ? '' : 's';
        resultsCount.textContent = `✓ ${users.length} servicio${plural} encontrado${plural}`;
        resultsCount.style.color = '#059669'; // text-emerald-600
    } else {
        resultsCount.textContent = '⚠️ No se encontraron servicios con los criterios actuales';
        resultsCount.style.color = '#DC2626'; // text-red-600
    }

    if (users.length === 0) {
        nearbyUsersList.innerHTML = `
            <li class="no-results">
                <div style="text-align: center; padding: 2rem; color: #6B7280;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
                    <p><strong>No se encontraron servicios</strong></p>
                    <p style="font-size: 0.875rem; margin-top: 0.5rem;">
                        Intenta ajustar los filtros o ampliar la búsqueda
                    </p>
                </div>
            </li>
        `;
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

        // CARDS COMPACTAS - Información esencial y bien organizada
        
        // Descripción muy resumida
        if (user.description) {
            const description = document.createElement('p');
            description.className = 'service-description-compact';
            description.textContent = user.description.substring(0, 60) + (user.description.length > 60 ? '...' : '');
            cardBody.appendChild(description);
        }

        // Información principal en línea compacta
        const mainInfo = document.createElement('div');
        mainInfo.className = 'service-main-info';
        
        if (user.price) {
            const price = document.createElement('span');
            price.className = 'service-price-compact';
            price.textContent = user.price;
            mainInfo.appendChild(price);
        }

        if (user.schedule) {
            const schedule = document.createElement('span');
            schedule.className = 'service-schedule-compact';
            schedule.textContent = user.schedule;
            mainInfo.appendChild(schedule);
        }
        
        cardBody.appendChild(mainInfo);

        // Footer con distancia prominente y valoración
        const footer = document.createElement('div');
        footer.className = 'service-card-footer';
        
        // Distancia PROMINENTE (información clave)
        if (user.distance) {
            const distance = document.createElement('div');
            distance.className = 'service-distance-prominent';
            distance.innerHTML = `<span class="distance-value">${user.distance.toFixed(1)}</span> <span class="distance-unit">km</span>`;
            footer.appendChild(distance);
        }

        // Valoración compacta
        if (user.rating) {
            const rating = document.createElement('div');
            rating.className = 'service-rating-mini';
            rating.innerHTML = `<span class="rating-stars">★★★★☆</span> <span class="rating-value">${user.rating}</span>`;
            footer.appendChild(rating);
        }
        
        cardBody.appendChild(footer);

        card.appendChild(cardHeader);
        card.appendChild(cardBody);

        // Agregar event listener para mostrar detalles y centrar el mapa
        card.addEventListener('click', () => {
            // Centrar el mapa en el servicio
            MapService.focusOnService(user.id);
            
            // Mostrar el panel de detalles - llamada interna
            showDetailPanel(user);
            
            // En móvil, mostrar notificación de navegación
            const isMobile = window.innerWidth < 768;
            if (isMobile) {
                showNotification('📍 Viendo detalles del servicio', 'info', 3000);
            }
        });

        nearbyUsersList.appendChild(card);
    });
};

/**
 * Actualiza el campo de dirección en el formulario.
 * @param {string} address - La dirección a mostrar.
 * @param {boolean} fromPublishPanel - Si la selección viene del panel de publicación.
 */
export const updateAddressInput = (address, fromPublishPanel = false) => {
    serviceAddressInput.value = address;
    
    // Solo mostrar notificaciones si viene del panel de publicación
    if (fromPublishPanel) {
        const isMobile = window.innerWidth < 768;
        
        if (isMobile) {
            // En móvil: el panel está cerrado, ofrecer volver al formulario
            showNotification('📍 Ubicación seleccionada correctamente.', 'success', 6000, {
                actionText: 'Volver al formulario',
                actionCallback: () => {
                    togglePublishPanel(); // Abrir el panel de publicación
                }
            });
        } else {
            // En desktop: el panel sigue abierto, solo confirmar
            showNotification('📍 Ubicación agregada en el formulario.', 'success', 3000);
        }
    }
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

    // Listener para cambio de tamaño de ventana (orientación móvil)
    window.addEventListener('resize', () => {
        // Pequeño delay para evitar múltiples llamadas durante el resize
        clearTimeout(window.resizeTimer);
        window.resizeTimer = setTimeout(() => {
            // Ajustar el comportamiento de los paneles según el tamaño de pantalla
            const searchPanel = document.getElementById('search-panel');
            const publishPanel = document.getElementById('publish-panel');
            const isMobile = window.innerWidth < 768;
            
            // En móvil, asegurar que los paneles ocupen toda la pantalla
            if (isMobile) {
                if (searchPanel.classList.contains('is-open')) {
                    document.body.style.overflow = 'hidden';
                } else {
                    document.body.style.overflow = '';
                }
            } else {
                // En desktop, restaurar el overflow normal
                document.body.style.overflow = '';
            }
            
            // Fix para iOS Safari - actualizar altura de viewport
            setViewportHeight();
        }, 100);
    });

    // Fix inicial para iOS Safari
    setViewportHeight();
};

/**
 * Fix para iOS Safari viewport height
 */
const setViewportHeight = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
};

// --- PANEL DE DETALLES ---

/**
 * Muestra el panel de detalles con la información completa del servicio.
 * @param {Object} service - Los datos del servicio a mostrar.
 */
export const showDetailPanel = (service) => {
    const detailPanel = document.getElementById('detail-panel');
    const serviceDetailContent = detailPanel.querySelector('.service-detail-content');
    
    // Renderizar el contenido del servicio
    serviceDetailContent.innerHTML = renderServiceDetails(service);
    
    // Mostrar el panel
    detailPanel.classList.add('is-open');
    
    // En móvil, podemos ocultar otros paneles para dar más espacio
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
        // En móvil, el panel de detalles puede tomar más espacio
        detailPanel.style.width = '100vw';
        detailPanel.style.right = '0';
        document.body.style.overflow = 'hidden';
    }
};

/**
 * Oculta el panel de detalles.
 */
export const hideDetailPanel = () => {
    const detailPanel = document.getElementById('detail-panel');
    detailPanel.classList.remove('is-open');
    
    // Restaurar estilos móviles
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
        detailPanel.style.width = '';
        detailPanel.style.right = '';
        document.body.style.overflow = '';
    }
};

/**
 * Renderiza el contenido detallado de un servicio.
 * @param {Object} service - Los datos del servicio.
 * @returns {string} - HTML del contenido del servicio.
 */
const renderServiceDetails = (service) => {
    const categoryConfig = SERVICE_CATEGORIES[service.category] || {};
    const categoryName = categoryConfig.name || service.category;
    
    return `
        <div class="service-detail-header">
            <h2 class="service-detail-title">${service.serviceName}</h2>
            <span class="service-detail-category">${categoryName}</span>
        </div>

        <div class="service-detail-section">
            <h4>📋 Descripción</h4>
            <p class="service-detail-text">${service.description || 'No hay descripción disponible.'}</p>
        </div>

        ${service.price ? `
        <div class="service-detail-price">
            💰 ${service.price}
        </div>
        ` : ''}

        <div class="service-detail-section">
            <h4>📍 Ubicación y Contacto</h4>
            <div class="service-detail-highlight">
                <p class="service-detail-text"><strong>Dirección:</strong> ${service.address || 'No especificada'}</p>
                ${service.distance ? `<p class="service-detail-text"><strong>Distancia:</strong> ${service.distance.toFixed(1)} km</p>` : ''}
                ${service.phone ? `<p class="service-detail-text"><strong>Teléfono:</strong> ${service.phone}</p>` : ''}
                ${service.email ? `<p class="service-detail-text"><strong>Email:</strong> ${service.email}</p>` : ''}
            </div>
        </div>

        ${service.schedule ? `
        <div class="service-detail-section">
            <h4>🕒 Horarios</h4>
            <p class="service-detail-text">${service.schedule}</p>
        </div>
        ` : ''}

        ${service.experience ? `
        <div class="service-detail-section">
            <h4>👨‍💼 Experiencia</h4>
            <p class="service-detail-text">${service.experience}</p>
        </div>
        ` : ''}

        ${service.specializations && service.specializations.length > 0 ? `
        <div class="service-detail-section">
            <h4>🎯 Especializaciones</h4>
            <p class="service-detail-text">${service.specializations.join(', ')}</p>
        </div>
        ` : ''}

        ${service.equipment && service.equipment.length > 0 ? `
        <div class="service-detail-section">
            <h4>🛠️ Equipo y Herramientas</h4>
            <p class="service-detail-text">${service.equipment.join(', ')}</p>
        </div>
        ` : ''}

        ${service.rating ? `
        <div class="service-detail-section">
            <h4>⭐ Valoración</h4>
            <div class="service-detail-highlight">
                <p class="service-detail-text">
                    <strong>${service.rating}/5</strong> estrellas
                    ${service.reviewsCount ? ` (${service.reviewsCount} reseñas)` : ''}
                </p>
            </div>
        </div>
        ` : ''}

        <div class="service-detail-actions">
            ${service.phone ? `
            <a href="tel:${service.phone}" class="detail-action-btn primary">
                📞 Llamar
            </a>
            ` : ''}
            ${service.whatsapp ? `
            <a href="https://wa.me/${service.whatsapp}" target="_blank" class="detail-action-btn secondary">
                💬 WhatsApp
            </a>
            ` : ''}
            ${(service.email || service.contact) ? `
            <a href="mailto:${service.email || service.contact}" class="detail-action-btn primary">
                ✉️ Contactar
            </a>
            ` : ''}
        </div>
    `;
};