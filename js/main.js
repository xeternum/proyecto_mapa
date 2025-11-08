// js/main.js

import { DEFAULT_LOCATION } from './config.js';
import * as DataService from './dataService.js';
import * as MapService from './mapService.js';
import * as UIService from './uiService.js';
import * as ApiService from './apiService.js';
import * as SearchService from './searchService.js';

import { haversineDistance } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- Estado de la Aplicación ---
    let selectedLocation = null;
    let centerLocation = { ...DEFAULT_LOCATION };
    let activeCategory = null; // Para gestionar la categoría activa
    let userLocation = null; // Para guardar la ubicación del usuario
    let isSelectingFromPublishPanel = false; // Flag para saber el contexto de selección

    // --- Lógica Principal ---

    const hideHero = () => {
        const hero = document.querySelector('.map-hero');
        if (hero && !hero.classList.contains('hidden')) {
            hero.classList.add('hidden');
            // Opcional: centrar mapa en ubicación por defecto si existe `map` variable
            if (window.map && typeof window.map.invalidateSize === 'function') {
                window.map.invalidateSize();
            }
        }
    };

    const resetSearchState = () => {
        activeCategory = null;
        UIService.updateActiveCategory(null);
        UIService.updateFilterStatus(null);
    };

    const performSearch = (searchTerm) => {
        let publications = SearchService.searchUsers(searchTerm);
        
        // Si tenemos la ubicación del usuario, calculamos las distancias
        if (userLocation) {
            publications.forEach(pub => {
                if (pub.location) {
                    pub.distance = haversineDistance(userLocation, pub.location);
                }
            });
            // Opcional: ordenar por distancia
            publications.sort((a, b) => a.distance - b.distance);
        }

        UIService.renderSearchResults(publications);
        MapService.renderMarkers(publications);
    };

    const initApp = () => {
        // 1. Inicializar servicios
        DataService.initDataService(centerLocation);
        MapService.initMap(handleMapClick);
        SearchService.initSearchService();

        // 2. Listeners de la UI principal
        const uiCallbacks = {
            onCloseModal: handleCloseModal,
            onSearchInput: handleSearch
        };
        UIService.initEventListeners(uiCallbacks);

        // 3. Configurar callback para cierre de search panel
        UIService.setOnSearchPanelCloseCallback(resetSearchState);

        // 4. Listeners de la navegación principal
        document.getElementById('btn-search-service').addEventListener('click', () => {
            hideHero(); // Ocultar hero al hacer clic en buscar
            const panel = document.getElementById('search-panel');
            // Si el panel se va a abrir, carga el contenido
            if (!panel.classList.contains('is-open')) {
                UIService.renderServiceCategories(handleCategoryClick, handleBackToCategories);
                activeCategory = null;
                UIService.updateActiveCategory(activeCategory);
                UIService.updateFilterStatus(null); // Resetear estado del filtro
                performSearch('');
            }
            UIService.toggleSearchPanel();
        });

        document.getElementById('btn-add-service').addEventListener('click', () => {
            hideHero(); // Ocultar hero al hacer clic en publicar
            UIService.initPublishFormCategories();
            UIService.togglePublishPanel();
        });

        document.getElementById('btn-profile-menu').addEventListener('click', () => {
            hideHero(); // Ocultar hero al hacer clic en perfil
            UIService.showModal('profile');
        });

        document.getElementById('btn-current-location').addEventListener('click', () => {
            hideHero(); // Ocultar hero al hacer clic en ubicación actual
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((position) => {
                    centerLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
                    DataService.updateCenterLocation(centerLocation);
                    MapService.centerMap(centerLocation.lat, centerLocation.lng);
                    UIService.showNotification('Ubicación actualizada a tu posición actual', 'info');
                }, () => UIService.showNotification('No se pudo obtener tu ubicación actual', 'error'));
            } else {
                UIService.showNotification('Geolocalización no soportada por este navegador', 'error');
            }
        });

        // 5. Listener para el formulario de registro
        document.getElementById('register-form').addEventListener('submit', handleRegisterFormSubmit);

        // 6. Listener para el botón de cerrar panel de detalles
        document.getElementById('close-detail-panel').addEventListener('click', () => {
            UIService.hideDetailPanel();
        });

        // 8. Listener para el botón de cambiar ubicación
        document.getElementById('change-location-btn').addEventListener('click', () => {
            const isMobile = window.innerWidth < 768;
            isSelectingFromPublishPanel = true; // Marcar que estamos seleccionando desde publish panel
            
            // En móvil, cerrar el panel para mostrar el mapa
            if (isMobile) {
                UIService.closeAllPanels();
                // Mostrar instrucción inmediata por más tiempo
                UIService.showNotification('🗺️ Toca en el mapa para seleccionar la ubicación de tu servicio.', 'info', 6000);
                // Pequeño delay para que la animación de cierre termine
                setTimeout(() => {
                    MapService.enterLocationSelectionMode(handleMapClick);
                }, 300);
            } else {
                // En desktop, mantener el panel abierto y mostrar instrucción
                UIService.showNotification('🗺️ Haz clic en el mapa para seleccionar la ubicación.', 'info', 5000);
                MapService.enterLocationSelectionMode(handleMapClick);
            }
        });

        // 7. Obtener ubicación del usuario y cargar datos iniciales
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
                MapService.markUserLocation(userLocation);
                MapService.centerMap(userLocation.lat, userLocation.lng);
                performSearch(''); // Carga inicial con distancias
            }, () => {
                UIService.showNotification('No se pudo obtener tu ubicación para calcular distancias.', 'info');
                performSearch(''); // Carga inicial sin distancias
            });
        } else {
            UIService.showNotification('Geolocalización no es soportada. No se mostrarán distancias.', 'error');
            performSearch(''); // Carga inicial sin distancias
        }

        // --- Carga Inicial UI ---
        UIService.hideAllModals();

        // Hero CTA handlers (puedes integrarlo en tu init principal)
        const hero = document.querySelector('.map-hero');
        const explore = document.getElementById('hero-explore');
        const publish = document.getElementById('hero-publish');

        if (explore) {
            explore.addEventListener('click', () => {
                // ocultar hero y dar foco al mapa
                hero?.classList.add('hidden');
                // opcional: centrar mapa en ubicación por defecto si existe `map` variable
                if (window.map && typeof window.map.invalidateSize === 'function') {
                    window.map.invalidateSize();
                }
                // Abrir el panel lateral de búsqueda (reutiliza el botón de navegación)
                document.getElementById('btn-search-service')?.click();
            });
        }

        if (publish) {
            publish.addEventListener('click', () => {
                // ocultar hero y abrir panel de publicar (reutiliza el botón existente)
                hero?.classList.add('hidden');
                document.getElementById('btn-add-service')?.click();
            });
        }
    };

    // --- Handlers (manejadores de eventos) ---

    const handleCategoryClick = (item, isMainCategory) => {
        if (isMainCategory) {
            // Muestra los servicios de la categoría seleccionada
            UIService.renderServiceCategories(handleCategoryClick, handleBackToCategories, item);
            activeCategory = null; // Aún no hay una selección final
            UIService.updateFilterStatus(null);
        } else {
            // Es un servicio final, realiza la búsqueda
            if (activeCategory === item) {
                activeCategory = null; // Deseleccionar si se hace clic de nuevo
                UIService.updateFilterStatus(null);
                performSearch('');
            } else {
                activeCategory = item;
                UIService.updateFilterStatus(item);
                performSearch(item);
            }
        }
        UIService.updateActiveCategory(activeCategory);
    };

    const handleBackToCategories = () => {
        // Vuelve a mostrar las categorías principales
        UIService.renderServiceCategories(handleCategoryClick, handleBackToCategories);
        activeCategory = null;
        UIService.updateActiveCategory(activeCategory);
        // Desactivar filtro y realizar nueva búsqueda
        UIService.updateFilterStatus(null);
        performSearch(''); // Búsqueda sin filtros
    };

    const handleSearch = (searchTerm) => {
        activeCategory = null;
        UIService.updateActiveCategory(null);
        UIService.updateFilterStatus(null);
        performSearch(searchTerm);
    };

    const handleMapClick = async (lat, lng) => {
        selectedLocation = { lat, lng };
        MapService.showTempMarker(lat, lng);
        const address = await ApiService.getStreetAddress(lat, lng);
        UIService.updateAddressInput(address, isSelectingFromPublishPanel);
        MapService.exitLocationSelectionMode();
        isSelectingFromPublishPanel = false; // Reset flag después de usar
    };

    const handleCloseModal = () => {
        UIService.hideAllModals();
        MapService.exitLocationSelectionMode();
        isSelectingFromPublishPanel = false; // Reset flag al cerrar modal
    };

    const handleRegisterFormSubmit = (e) => {
        e.preventDefault();
        const form = e.target;
        const serviceName = form.querySelector('#service-name').value;
        const serviceDescription = form.querySelector('#service-description').value;
        const servicePrice = form.querySelector('#service-price').value;
        const serviceSchedule = form.querySelector('#service-schedule').value;
        const serviceContact = form.querySelector('#service-contact').value;
        const userEmail = form.querySelector('#user-email').value;
        const serviceAddress = form.querySelector('#service-address').value;
        const category = form.querySelector('#service-subcategory').value;

        if (!selectedLocation) {
            UIService.showNotification('Error: No se ha seleccionado ubicación en el mapa.', 'error');
            return;
        }

        const newUser = {
            id: Date.now(),
            serviceName,
            description: serviceDescription,
            price: servicePrice,
            schedule: serviceSchedule,
            contact: serviceContact,
            email: userEmail,
            address: serviceAddress,
            category,
            location: selectedLocation,
            rating: 4.2 // Placeholder para valoraciones futuras
        };

        DataService.addUser(newUser);
        performSearch(''); // Actualiza la lista y el mapa
        
        // Mensaje diferenciado para móvil vs desktop
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
            UIService.showNotification('✅ ¡Servicio publicado! Tu servicio ya está visible en el mapa.', 'success', 5000);
        } else {
            UIService.showNotification('¡Servicio publicado con éxito!', 'success');
        }
        
        UIService.resetRegisterForm();
        UIService.togglePublishPanel();
    };

    // --- Inicialización de la App ---
    initApp();
});

// --- Funciones Globales para Mapas ---

/**
 * Función global para mostrar detalles de un servicio desde popups del mapa.
 * @param {string} serviceId - ID del servicio a mostrar.
 */
window.showServiceDetails = (serviceId) => {
    // Buscar el servicio en los datos
    const services = DataService.getUsers();
    
    // SOLUCION: Convertir el serviceId recibido a número si es necesario
    const searchId = typeof serviceId === 'string' ? parseInt(serviceId, 10) : serviceId;
    
    const service = services.find(s => s.id === searchId);
    
    if (service) {
        UIService.showDetailPanel(service);
        
        // Opcional: cerrar el popup del mapa para mejor UX
        if (window.map && window.map.closePopup) {
            window.map.closePopup();
        }
    } else {
        console.error('Service not found with ID:', searchId);
        console.error('Available IDs:', services.map(s => s.id));
    }
};
