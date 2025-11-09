// js/uiService.js

import { SERVICE_CATEGORIES } from './config.js';
import * as DataService from './dataService.js';
import * as ApiService from './apiService.js';
import * as MapService from './mapService.js';
import { haversineDistance, formatPrice, getModalityLabel } from './utils.js';
import { validatePhoneNumber, getPublicContactInfo, revealContactInfo, formatPhoneNumber, generateWhatsAppURL } from './contactService.js';

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
    console.log('🔍 renderSearchResults - usuarios recibidos:', users.length);
    if (users.length > 0) {
        console.log('🔍 Primer usuario:', users[0]);
    }
    
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
            const formattedPrice = formatPrice(user.price, user.priceModality);
            console.log(`💰 Formato precio para ${user.serviceName}:`, {
                price: user.price,
                priceModality: user.priceModality,
                formatted: formattedPrice
            });
            price.textContent = formattedPrice;
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
    // Restablecer valores por defecto después del reset
    const emailInput = document.getElementById('user-email');
    const phoneInput = document.getElementById('user-phone');
    const whatsappCheckbox = document.getElementById('whatsapp-available');
    const priceModalitySelect = document.getElementById('price-modality');
    
    if (emailInput) emailInput.value = 'contacto@ejemplo.com';
    if (phoneInput) phoneInput.value = '+56912345678';
    if (whatsappCheckbox) whatsappCheckbox.checked = true;
    if (priceModalitySelect) priceModalitySelect.value = 'por_servicio';
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
            💰 ${formatPrice(service.price, service.priceModality)}
        </div>
        ` : ''}

        <div class="service-detail-section">
            <h4>📍 Ubicación</h4>
            <div class="service-detail-highlight">
                <p class="service-detail-text"><strong>Dirección:</strong> ${service.address || 'No especificada'}</p>
                ${service.distance ? `<p class="service-detail-text"><strong>Distancia:</strong> ${service.distance.toFixed(1)} km</p>` : ''}
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
            ${renderFullContact(service)}
        </div>
    `;
};

// --- Estados de Carga ---

/**
 * Muestra un estado de carga para una operación específica
 * @param {string} operation - Tipo de operación ('search', 'publish', 'details')
 */
export const showLoadingState = (operation) => {
    switch (operation) {
        case 'search':
            // Mostrar loading en la lista de resultados
            if (nearbyUsersList) {
                nearbyUsersList.innerHTML = `
                    <div class="loading-state">
                        <div class="loading-spinner"></div>
                        <p>Buscando servicios...</p>
                    </div>
                `;
            }
            break;
            
        case 'publish':
            // Deshabilitar el botón de envío y mostrar loading
            const submitBtn = document.querySelector('#register-form button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = `
                    <div class="loading-spinner-small"></div>
                    Publicando...
                `;
            }
            break;
            
        case 'details':
            // Mostrar loading en el panel de detalles
            const detailContent = document.querySelector('.detail-panel-content');
            if (detailContent) {
                detailContent.innerHTML = `
                    <div class="loading-state">
                        <div class="loading-spinner"></div>
                        <p>Cargando detalles...</p>
                    </div>
                `;
            }
            break;
    }
};

/**
 * Oculta el estado de carga para una operación específica
 * @param {string} operation - Tipo de operación ('search', 'publish', 'details')
 */
export const hideLoadingState = (operation) => {
    switch (operation) {
        case 'search':
            // El contenido se reemplazará con los resultados de búsqueda
            break;
            
        case 'publish':
            // Restaurar el botón de envío
            const submitBtn = document.querySelector('#register-form button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Publicar Servicio';
            }
            break;
            
        case 'details':
            // El contenido se reemplazará con los detalles del servicio
            break;
    }
};

// --- Gestión del Formulario de Contacto ---

/**
 * Inicializa los event listeners para el formulario de contacto mejorado
 */
export const initContactFormListeners = () => {
    // Listeners para cambio de método de contacto
    const emailRadio = document.getElementById('contact-email');
    const phoneRadio = document.getElementById('contact-phone');
    const emailSection = document.getElementById('email-contact-section');
    const phoneSection = document.getElementById('phone-contact-section');

    if (emailRadio && phoneRadio && emailSection && phoneSection) {
        emailRadio.addEventListener('change', () => {
            if (emailRadio.checked) {
                emailSection.classList.remove('hidden');
                phoneSection.classList.add('hidden');
                clearPhoneValidation();
            }
        });

        phoneRadio.addEventListener('change', () => {
            if (phoneRadio.checked) {
                phoneSection.classList.remove('hidden');
                emailSection.classList.add('hidden');
            }
        });
    }

    // Validación en tiempo real para el teléfono
    const phoneInput = document.getElementById('user-phone');
    const phoneValidationDiv = document.getElementById('phone-validation');

    if (phoneInput && phoneValidationDiv) {
        const validatePhone = () => {
            const fullPhoneNumber = phoneInput.value.trim();
            
            if (fullPhoneNumber) {
                phoneValidationDiv.className = 'validation-message checking';
                phoneValidationDiv.textContent = 'Validando...';
                
                // Pequeño delay para simular validación
                setTimeout(() => {
                    // Extraer código de país y número
                    const phoneMatch = fullPhoneNumber.match(/^(\+\d{1,3})(\d+)$/);
                    
                    if (!phoneMatch) {
                        phoneValidationDiv.className = 'validation-message invalid';
                        phoneValidationDiv.textContent = 'Debe comenzar con código de país. Ej: +56912345678';
                        return;
                    }
                    
                    const [, countryCode, phoneNumber] = phoneMatch;
                    const validation = validatePhoneNumber(countryCode, phoneNumber);
                    phoneValidationDiv.className = `validation-message ${validation.isValid ? 'valid' : 'invalid'}`;
                    phoneValidationDiv.textContent = validation.message;
                }, 300);
            } else {
                clearPhoneValidation();
            }
        };

        phoneInput.addEventListener('input', validatePhone);
    }
};

/**
 * Limpia la validación del teléfono
 */
function clearPhoneValidation() {
    const phoneValidationDiv = document.getElementById('phone-validation');
    if (phoneValidationDiv) {
        phoneValidationDiv.className = 'validation-message';
        phoneValidationDiv.textContent = '';
    }
}

/**
 * Extrae los datos de contacto del formulario
 * @returns {Object} - Datos de contacto
 */
export const getContactDataFromForm = () => {
    const emailRadio = document.getElementById('contact-email');
    const phoneRadio = document.getElementById('contact-phone');
    const emailInput = document.getElementById('user-email');
    const phoneInput = document.getElementById('user-phone');
    const whatsappCheckbox = document.getElementById('whatsapp-available');

    const contactData = {
        method: emailRadio?.checked ? 'email' : 'phone'
    };

    if (contactData.method === 'email') {
        contactData.email = emailInput?.value?.trim() || '';
    } else {
        const fullPhoneNumber = phoneInput?.value?.trim() || '';
        
        // Extraer código de país y número del input completo
        const phoneMatch = fullPhoneNumber.match(/^(\+\d{1,3})(\d+)$/);
        
        if (phoneMatch) {
            const [, countryCode, phoneNumber] = phoneMatch;
            contactData.phone = phoneNumber;
            contactData.countryCode = countryCode;
        } else {
            // Si no tiene formato válido, guardar todo como phone
            contactData.phone = fullPhoneNumber.replace(/\D/g, '');
            contactData.countryCode = '+56'; // Código por defecto
        }
        
        contactData.whatsappAvailable = whatsappCheckbox?.checked || false;
    }

    return contactData;
};

/**
 * Renderiza la información de contacto en las cards (sin datos sensibles)
 * Solo muestra que hay un método de contacto disponible
 * @param {Object} service - Datos del servicio
 * @returns {string} - HTML de la información de contacto
 */
export const renderPublicContact = (service) => {
    if (!service.contactMethod) {
        return '<p class="contact-info">📞 Contactar</p>';
    }

    const publicInfo = getPublicContactInfo(service.contactMethod);
    return `<p class="contact-info">${publicInfo.icon} ${publicInfo.label}</p>`;
};

/**
 * Renderiza botones de contacto que redirigen directamente (sin mostrar datos)
 * Los datos se revelan solo al hacer clic en el botón correspondiente
 * @param {Object} service - Datos del servicio
 * @returns {string} - HTML de los botones de contacto
 */
export const renderFullContact = (service) => {
    console.log('🔍 renderFullContact - Servicio:', service);
    console.log('🔍 renderFullContact - contactMethod:', service.contactMethod);
    
    if (!service.contactMethod) {
        console.warn('⚠️ No hay contactMethod en el servicio:', service.id, service.serviceName);
        return '<p class="no-contact-available">No hay información de contacto disponible.</p>';
    }

    const fullContact = revealContactInfo(service.contactMethod);
    let contactHTML = '<div class="contact-actions">';

    if (fullContact.method === 'email') {
        contactHTML += `
            <a href="mailto:${fullContact.email}" class="detail-action-btn primary" title="Se abrirá tu cliente de email">
                ✉️ Contactar por Email
            </a>
            <p class="contact-hint">Al hacer clic se abrirá tu aplicación de correo</p>
        `;
    } else {
        const fullPhoneNumber = `${fullContact.countryCode}${fullContact.phone}`;
        
        contactHTML += `
            <a href="tel:${fullPhoneNumber}" class="detail-action-btn primary" title="Llamar ahora">
                📞 Llamar Ahora
            </a>
        `;
        
        if (fullContact.whatsappAvailable) {
            const whatsappURL = generateWhatsAppURL(fullPhoneNumber, 
                `Hola! Vi tu servicio "${service.serviceName}" en GeoRed y me interesa obtener más información.`);
            contactHTML += `
                <a href="${whatsappURL}" target="_blank" class="detail-action-btn secondary" title="Abrir WhatsApp">
                    💬 Contactar por WhatsApp
                </a>
            `;
        }
        
        contactHTML += `
            <p class="contact-hint">Al hacer clic se ${fullContact.whatsappAvailable ? 'llamará o abrirá WhatsApp' : 'iniciará la llamada'}</p>
        `;
    }

    contactHTML += '</div>';
    return contactHTML;
};