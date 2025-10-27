
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

    // --- Lógica Principal ---

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
            onCloseSearchPanel: () => UIService.toggleSearchPanel(), // Cierra el panel
            onSearchInput: handleSearch
        };
        UIService.initEventListeners(uiCallbacks);

        // 3. Listeners de la navegación principal
        document.getElementById('btn-search-service').addEventListener('click', () => {
            const panel = document.getElementById('search-panel');
            // Si el panel se va a abrir, carga el contenido
            if (!panel.classList.contains('is-open')) {
                UIService.renderServiceCategories(handleCategoryClick);
                activeCategory = null;
                UIService.updateActiveCategory(activeCategory);
                performSearch('');
            }
            UIService.toggleSearchPanel();
        });

        document.getElementById('btn-add-service').addEventListener('click', () => {
            UIService.hideAllModals();
            MapService.enterLocationSelectionMode(handleMapClick);
        });

        document.getElementById('btn-profile-menu').addEventListener('click', () => {
            UIService.showModal('profile');
        });

        document.getElementById('btn-current-location').addEventListener('click', () => {
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

        // 4. Listener para el formulario de registro
        document.getElementById('register-form').addEventListener('submit', handleRegisterFormSubmit);

        // 5. Listener para el botón de cambiar ubicación
        document.getElementById('change-location-btn').addEventListener('click', () => {
            UIService.hideModal('serviceInfo');
            MapService.enterLocationSelectionMode(handleMapClick);
        });

        // 6. Obtener ubicación del usuario y cargar datos iniciales
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

        // 7. Listener para el menú hamburguesa
        document.getElementById('hamburger-menu').addEventListener('click', () => {
            document.querySelector('.main-header').classList.toggle('nav-open');
        });

    };

    // --- Handlers (manejadores de eventos) ---

    const handleCategoryClick = (category) => {
        if (activeCategory === category) {
            activeCategory = null;
            performSearch('');
        } else {
            activeCategory = category;
            performSearch(category);
        }
        UIService.updateActiveCategory(activeCategory);
    };

    const handleSearch = (searchTerm) => {
        activeCategory = null;
        UIService.updateActiveCategory(null);
        performSearch(searchTerm);
    };

    const handleMapClick = async (lat, lng) => {
        selectedLocation = { lat, lng };
        MapService.showTempMarker(lat, lng);
        const address = await ApiService.getStreetAddress(lat, lng);
        UIService.updateAddressInput(address);
        MapService.exitLocationSelectionMode();
        UIService.showModal('serviceInfo');
    };

    const handleCloseModal = () => {
        UIService.hideAllModals();
        MapService.exitLocationSelectionMode();
    };

    const handleRegisterFormSubmit = (e) => {
        e.preventDefault();
        const form = e.target;
        const serviceName = form.querySelector('#service-name').value;
        const userEmail = form.querySelector('#user-email').value;
        const serviceAddress = form.querySelector('#service-address').value;
        const category = form.querySelector('#service-category').value;

        if (!selectedLocation) {
            UIService.showNotification('Error: No se ha seleccionado ubicación en el mapa.', 'error');
            return;
        }

        const newUser = {
            id: Date.now(),
            serviceName,
            email: userEmail,
            address: serviceAddress,
            category,
            location: selectedLocation
        };

        DataService.addUser(newUser);
        performSearch(''); // Actualiza la lista y el mapa
        UIService.showNotification('¡Servicio publicado con éxito!', 'success');
        UIService.resetRegisterForm();
        handleCloseModal();
        selectedLocation = null;
    };

    // --- Inicialización de la App ---
    initApp();
});
