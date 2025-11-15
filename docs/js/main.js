// js/main.js

import { DEFAULT_LOCATION } from './config.js';
import * as DataService from './dataService.js';
import * as MapService from './mapService.js';
import * as UIService from './uiService.js';
import * as ApiService from './apiService.js';
import * as SearchService from './searchService.js';
import { validateServiceData, validateSearchFilters, sanitizeServiceData } from './validationService.js';
import * as AuthService from './authService.js';

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

    const performSearch = async (searchTerm, forceRefresh = false) => {
        try {
            console.log(`🔍 performSearch llamado - searchTerm: "${searchTerm}", forceRefresh: ${forceRefresh}`);
            
            // Mostrar estado de carga
            UIService.showLoadingState('search');
            
            // Obtener el radio de búsqueda actual SOLO si el filtro está activado
            const radiusSlider = document.getElementById('search-radius');
            const enableRadiusFilter = document.getElementById('enable-radius-filter');
            const isRadiusEnabled = enableRadiusFilter && enableRadiusFilter.checked;
            const maxRadius = (isRadiusEnabled && radiusSlider) ? parseFloat(radiusSlider.value) : null;
            
            // Validar filtros de búsqueda
            const filters = { search: searchTerm, category: activeCategory };
            const validation = validateSearchFilters(filters);
            
            if (!validation.isValid) {
                UIService.showNotification(validation.errors.join(' '), 'error');
                UIService.hideLoadingState('search');
                return;
            }
            
            // Asegurar que los servicios estén cargados (usar caché si es válido)
            await DataService.reloadServices(forceRefresh);
            
            // Obtener servicios cacheados y filtrar localmente
            let publications = DataService.getServices();
            
            // Aplicar filtros localmente
            if (searchTerm || activeCategory) {
                console.log('🔍 Filtrando localmente:', { searchTerm, activeCategory });
                console.log('📊 Total servicios antes de filtrar:', publications.length);
                console.log('📋 TODOS los servicios con categorías:');
                publications.forEach((s, idx) => {
                    console.log(`  ${idx + 1}. "${s.serviceName}" → categoría: "${s.category}" (length: ${s.category.length})`);
                });
                
                publications = publications.filter(service => {
                    const matchesSearch = !searchTerm || 
                        service.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        service.description.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesCategory = !activeCategory || service.category === activeCategory;
                    
                    if (activeCategory) {
                        const match = service.category === activeCategory;
                        console.log(`${match ? '✅' : '❌'} "${service.serviceName}": "${service.category}" === "${activeCategory}" ? ${match}`);
                    }
                    
                    return matchesSearch && matchesCategory;
                });
                
                console.log('✅ Total servicios después de filtrar:', publications.length);
            }
            
            // Si tenemos la ubicación del usuario, calculamos las distancias
            if (userLocation) {
                publications.forEach(pub => {
                    if (pub.location) {
                        pub.distance = haversineDistance(userLocation, pub.location);
                    }
                });
                
                // Filtrar por radio SOLO si está activado
                if (maxRadius !== null) {
                    publications = publications.filter(pub => {
                        return pub.distance === undefined || pub.distance <= maxRadius;
                    });
                }
                
                // Ordenar por distancia
                publications.sort((a, b) => (a.distance || 999) - (b.distance || 999));
            }

            UIService.renderSearchResults(publications);
            MapService.renderMarkers(publications);
            UIService.hideLoadingState('search');
            
        } catch (error) {
            console.error('Error en performSearch:', error);
            UIService.showNotification('Error al cargar los servicios. Inténtalo de nuevo.', 'error');
            UIService.hideLoadingState('search');
        }
    };

    const initApp = async () => {
        // 1. Inicializar servicios
        console.log('🚀 Inicializando aplicación...');
        
        // Inicializar dataService y cargar servicios desde backend
        await DataService.initDataService(centerLocation);
        
        MapService.initMap(handleMapClick);
        SearchService.initSearchService();

        // 2. Listeners de la UI principal
        const uiCallbacks = {
            onCloseModal: handleCloseModal,
            onSearchInput: handleSearch
        };
        UIService.initEventListeners(uiCallbacks);
        
        // Inicializar listeners del formulario de contacto
        UIService.initContactFormListeners();

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

        document.getElementById('btn-add-service').addEventListener('click', async () => {
            hideHero(); // Ocultar hero al hacer clic en publicar
            
            // Limpiar formulario y modo de edición
            const form = document.getElementById('register-form');
            if (form) {
                delete form.dataset.editingId;
                form.reset();
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.textContent = 'Publicar Servicio';
                }
            }
            
            UIService.initPublishFormCategories();
            
            // Pre-cargar email del usuario si está autenticado
            if (AuthService.getAuthToken()) {
                const currentUser = await AuthService.getCurrentUser();
                if (currentUser && currentUser.email) {
                    document.getElementById('user-email').value = currentUser.email;
                }
            }
            
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

        // 6. Listener para el toggle de filtros collapsible
        const toggleFiltersBtn = document.getElementById('toggle-filters');
        const filtersContent = document.getElementById('filters-content');
        if (toggleFiltersBtn && filtersContent) {
            toggleFiltersBtn.addEventListener('click', () => {
                toggleFiltersBtn.classList.toggle('active');
                filtersContent.classList.toggle('open');
            });
        }

        // 7. Listener para activar/desactivar filtro de radio
        const enableRadiusFilter = document.getElementById('enable-radius-filter');
        const radiusFilterContent = document.getElementById('radius-filter-content');
        if (enableRadiusFilter && radiusFilterContent) {
            enableRadiusFilter.addEventListener('change', (e) => {
                if (e.target.checked) {
                    radiusFilterContent.classList.remove('disabled');
                    // Mostrar círculo en el mapa
                    const radiusSlider = document.getElementById('search-radius');
                    const radius = radiusSlider ? parseFloat(radiusSlider.value) : 10;
                    if (userLocation) {
                        MapService.showRadiusCircle(userLocation.lat, userLocation.lng, radius);
                    }
                } else {
                    radiusFilterContent.classList.add('disabled');
                    // Ocultar círculo del mapa
                    MapService.hideRadiusCircle();
                }
                
                // Actualizar contador de filtros activos
                updateActiveFiltersCount();
                
                // Ejecutar búsqueda
                const searchInput = document.getElementById('service-search-input');
                performSearch(searchInput ? searchInput.value : '');
            });
        }

        // 8. Listener para el control de radio de búsqueda
        const radiusSlider = document.getElementById('search-radius');
        const radiusValueDisplay = document.getElementById('radius-value');
        if (radiusSlider && radiusValueDisplay) {
            radiusSlider.addEventListener('input', (e) => {
                radiusValueDisplay.textContent = e.target.value;
                
                // Actualizar círculo en tiempo real si el filtro está activo
                const enableRadiusFilter = document.getElementById('enable-radius-filter');
                if (enableRadiusFilter && enableRadiusFilter.checked && userLocation) {
                    MapService.showRadiusCircle(userLocation.lat, userLocation.lng, parseFloat(e.target.value));
                }
            });
            
            radiusSlider.addEventListener('change', () => {
                // Solo ejecutar búsqueda si el filtro está activado
                const enableRadiusFilter = document.getElementById('enable-radius-filter');
                if (enableRadiusFilter && enableRadiusFilter.checked) {
                    const searchInput = document.getElementById('service-search-input');
                    performSearch(searchInput ? searchInput.value : '');
                }
            });
        }

        // 10. Listener para el botón de cerrar panel de detalles
        document.getElementById('close-detail-panel').addEventListener('click', () => {
            UIService.hideDetailPanel();
        });

        // 10.1 Listener para el botón de cerrar modal de mis servicios
        document.getElementById('close-my-services-modal')?.addEventListener('click', () => {
            document.getElementById('my-services-modal').classList.add('hidden-section');
            document.body.style.overflow = 'auto';
        });

        // 10.2 Listener para cerrar modal al hacer click fuera (backdrop)
        document.getElementById('my-services-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'my-services-modal') {
                document.getElementById('my-services-modal').classList.add('hidden-section');
            }
        });

        // 11. Listener para el botón de cambiar ubicación
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

        // 7. Obtener ubicación del usuario
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
                MapService.markUserLocation(userLocation);
                MapService.centerMap(userLocation.lat, userLocation.lng);
                
                // Si el filtro de radio está activo, mostrar el círculo
                const enableRadiusFilter = document.getElementById('enable-radius-filter');
                const radiusSlider = document.getElementById('search-radius');
                if (enableRadiusFilter && enableRadiusFilter.checked && radiusSlider) {
                    MapService.showRadiusCircle(userLocation.lat, userLocation.lng, parseFloat(radiusSlider.value));
                }
                
                // Los servicios ya están cargados por initDataService, no necesitamos recargarlos
                console.log('✅ Ubicación del usuario obtenida');
            }, () => {
                UIService.showNotification('No se pudo obtener tu ubicación para calcular distancias.', 'info');
            });
        } else {
            UIService.showNotification('Geolocalización no es soportada. No se mostrarán distancias.', 'error');
        }
        
        // Cargar y renderizar servicios iniciales en el mapa
        const initialServices = DataService.getServices();
        if (initialServices.length > 0) {
            MapService.renderMarkers(initialServices);
            console.log(`✅ ${initialServices.length} servicios cargados en el mapa`);
        } else {
            console.log('ℹ️ No hay servicios disponibles aún');
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

        // 9. Inicializar autenticación
        initAuthentication();
    };

    // ============================================
    // AUTENTICACIÓN
    // ============================================

    const initAuthentication = async () => {
        // Verificar si hay sesión activa
        const authState = await AuthService.initAuth();
        
        if (authState.authenticated) {
            updateUIForAuthenticatedUser(authState.user);
        } else {
            updateUIForGuestUser();
        }

        // Configurar tabs de login/registro
        setupAuthTabs();
        
        // Configurar formularios
        setupLoginForm();
        setupRegisterForm();
        
        // Configurar botones de menú de usuario
        setupUserMenuButtons();
    };

    const setupAuthTabs = () => {
        const tabs = document.querySelectorAll('.auth-tab');
        const loginContent = document.getElementById('login-tab-content');
        const registerContent = document.getElementById('register-tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                
                // Actualizar tabs activos
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Mostrar contenido correspondiente
                if (tabName === 'login') {
                    loginContent.classList.add('active');
                    registerContent.classList.remove('active');
                } else {
                    loginContent.classList.remove('active');
                    registerContent.classList.add('active');
                }
            });
        });
    };

    const setupLoginForm = () => {
        const form = document.getElementById('login-form');
        const errorDiv = document.getElementById('login-error');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            // Limpiar error anterior
            errorDiv.classList.add('hidden');
            
            // Mostrar loading
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Iniciando sesión...';
            submitBtn.disabled = true;

            const result = await AuthService.login(email, password);

            if (result.success) {
                UIService.showNotification('¡Sesión iniciada correctamente!', 'success');
                updateUIForAuthenticatedUser(result.user);
                UIService.hideModal('profile');
                form.reset();
            } else {
                errorDiv.textContent = result.error || 'Error al iniciar sesión';
                errorDiv.classList.remove('hidden');
            }

            // Restaurar botón
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
    };

    const setupRegisterForm = () => {
        const form = document.getElementById('signup-form');
        const errorDiv = document.getElementById('register-error');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const phone = document.getElementById('register-phone').value;
            const password = document.getElementById('register-password').value;
            const passwordConfirm = document.getElementById('register-password-confirm').value;

            // Validar contraseñas
            if (password !== passwordConfirm) {
                errorDiv.textContent = 'Las contraseñas no coinciden';
                errorDiv.classList.remove('hidden');
                return;
            }

            // Limpiar error anterior
            errorDiv.classList.add('hidden');
            
            // Mostrar loading
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Creando cuenta...';
            submitBtn.disabled = true;

            const userData = {
                email,
                password,
                full_name: name,
                phone: phone || undefined
            };

            const result = await AuthService.register(userData);

            if (result.success) {
                UIService.showNotification('¡Cuenta creada e iniciada sesión!', 'success');
                updateUIForAuthenticatedUser(result.user);
                UIService.hideModal('profile');
                form.reset();
            } else {
                errorDiv.textContent = result.error || 'Error al crear la cuenta';
                errorDiv.classList.remove('hidden');
            }

            // Restaurar botón
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
    };

    const setupUserMenuButtons = () => {
        // Botón de cerrar sesión
        document.getElementById('btn-logout')?.addEventListener('click', async () => {
            const confirmed = await UIService.showConfirm(
                '¿Cerrar sesión?',
                '¿Estás seguro de que deseas cerrar sesión?',
                { confirmText: 'Cerrar sesión', cancelText: 'Cancelar' }
            );
            if (confirmed) {
                AuthService.logout();
            }
        });

        // Botón de mis servicios
        document.getElementById('btn-my-services')?.addEventListener('click', async () => {
            try {
                UIService.hideModal('profile');
                console.log('📋 Cargando mis servicios...');
                const services = await AuthService.getMyServices();
                console.log('📋 Servicios obtenidos:', services);
                console.log('🔢 Total de servicios:', services.length);
                displayMyServices(services);
            } catch (error) {
                console.error('❌ Error al cargar servicios:', error);
                UIService.showNotification('Error al cargar tus servicios', 'error');
            }
        });

        // Botón de volver en mis servicios
        document.getElementById('back-my-services')?.addEventListener('click', () => {
            document.getElementById('my-services-modal').classList.add('hidden-section');
            UIService.showModal('profile');
        });

        // Botón de editar perfil
        document.getElementById('btn-edit-profile')?.addEventListener('click', async () => {
            try {
                UIService.hideModal('profile');
                
                // Obtener datos actuales del usuario
                const user = AuthService.getCachedUser();
                if (!user) {
                    UIService.showNotification('Error al cargar datos del usuario', 'error');
                    return;
                }
                
                // Cargar datos en el formulario
                document.getElementById('edit-name').value = user.full_name || '';
                document.getElementById('edit-email').value = user.email || '';
                document.getElementById('edit-password').value = '';
                document.getElementById('edit-password-confirm').value = '';
                
                // Mostrar modal
                document.getElementById('edit-profile-modal').classList.remove('hidden-section');
                document.body.style.overflow = 'hidden';
            } catch (error) {
                console.error('Error al abrir editar perfil:', error);
                UIService.showNotification('Error al abrir el formulario', 'error');
            }
        });

        // Botón de volver en editar perfil
        document.getElementById('back-edit-profile')?.addEventListener('click', () => {
            document.getElementById('edit-profile-modal').classList.add('hidden-section');
            UIService.showModal('profile');
        });

        // Cerrar modal de editar perfil
        document.getElementById('close-edit-profile-modal')?.addEventListener('click', () => {
            document.getElementById('edit-profile-modal').classList.add('hidden-section');
            document.body.style.overflow = 'auto';
        });

        document.getElementById('cancel-edit-profile')?.addEventListener('click', () => {
            document.getElementById('edit-profile-modal').classList.add('hidden-section');
        });

        // Botón de Plan Pro
        document.getElementById('btn-pro-plan')?.addEventListener('click', () => {
            UIService.hideModal('profile');
            document.getElementById('pro-plan-modal').classList.remove('hidden-section');
            document.body.style.overflow = 'hidden';
        });

        // Botón de volver en Plan Pro
        document.getElementById('back-pro-plan')?.addEventListener('click', () => {
            document.getElementById('pro-plan-modal').classList.add('hidden-section');
            UIService.showModal('profile');
        });

        // Cerrar modal de Plan Pro
        document.getElementById('close-pro-plan-modal')?.addEventListener('click', () => {
            document.getElementById('pro-plan-modal').classList.add('hidden-section');
            document.body.style.overflow = 'auto';
        });

        // Formulario de editar perfil
        document.getElementById('edit-profile-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('edit-name').value.trim();
            const email = document.getElementById('edit-email').value.trim();
            const password = document.getElementById('edit-password').value;
            const passwordConfirm = document.getElementById('edit-password-confirm').value;
            
            // Validaciones
            if (!name || name.length < 2) {
                UIService.showNotification('El nombre debe tener al menos 2 caracteres', 'error');
                return;
            }
            
            // Validar email con regex
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email || !emailRegex.test(email)) {
                UIService.showNotification('El email no es válido', 'error');
                return;
            }
            
            // Si hay contraseña, validar
            if (password || passwordConfirm) {
                if (password.length < 6) {
                    UIService.showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
                    return;
                }
                
                if (password !== passwordConfirm) {
                    UIService.showNotification('Las contraseñas no coinciden', 'error');
                    return;
                }
            }
            
            try {
                // Preparar datos para actualizar
                const updateData = {
                    full_name: name,
                    email: email
                };
                
                // Incluir contraseña solo si se proporcionó
                if (password) {
                    updateData.password = password;
                }
                
                // Actualizar usuario
                const updatedUser = await AuthService.updateUser(updateData);
                
                // Actualizar UI
                updateUIForAuthenticatedUser(updatedUser);
                
                // Cerrar modal y mostrar éxito
                document.getElementById('edit-profile-modal').classList.add('hidden-section');
                document.body.style.overflow = 'auto';
                UIService.showNotification('Perfil actualizado correctamente', 'success');
                
            } catch (error) {
                console.error('Error al actualizar perfil:', error);
                UIService.showNotification(error.message || 'Error al actualizar perfil', 'error');
            }
        });
    };

    const updateUIForAuthenticatedUser = (user) => {
        // Actualizar botón de navegación
        const profileBtn = document.getElementById('btn-profile-menu');
        const profileBtnText = profileBtn.querySelector('span');
        if (profileBtnText) {
            profileBtnText.textContent = user.full_name.split(' ')[0]; // Primer nombre
        }

        // Mostrar sección de usuario, ocultar formularios de auth
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('user-menu-section').classList.remove('hidden');

        // Actualizar información del usuario en el menú
        document.getElementById('user-display-name').textContent = user.full_name;
        document.getElementById('user-display-email').textContent = user.email;
    };

    const updateUIForGuestUser = () => {
        // Restaurar botón de navegación
        const profileBtn = document.getElementById('btn-profile-menu');
        const profileBtnText = profileBtn.querySelector('span');
        if (profileBtnText) {
            profileBtnText.textContent = 'Iniciar Sesión';
        }

        // Mostrar formularios de auth, ocultar sección de usuario
        document.getElementById('auth-section').classList.remove('hidden');
        document.getElementById('user-menu-section').classList.add('hidden');
    };

    // --- Helper Functions ---

    /**
     * Actualiza el contador de filtros activos
     */
    const updateActiveFiltersCount = () => {
        const badge = document.getElementById('active-filters-count');
        const toggleBtn = document.getElementById('toggle-filters');
        
        if (!badge || !toggleBtn) return;
        
        let count = 0;
        
        // Contar filtro de radio si está activo
        const enableRadiusFilter = document.getElementById('enable-radius-filter');
        if (enableRadiusFilter && enableRadiusFilter.checked) {
            count++;
        }
        
        // Contar categoría activa
        if (activeCategory) {
            count++;
        }
        
        // Actualizar badge
        if (count > 0) {
            badge.textContent = count;
            badge.classList.remove('hidden');
            toggleBtn.classList.add('active');
        } else {
            badge.classList.add('hidden');
            toggleBtn.classList.remove('active');
        }
    };

    /**
     * Muestra el modal con los servicios del usuario
     */
    const displayMyServices = (services) => {
        const modal = document.getElementById('my-services-modal');
        const list = document.getElementById('my-services-list');
        
        if (!modal || !list) return;
        
        if (services.length === 0) {
            list.innerHTML = `
                <div class="no-services-message">
                    <h3>No tienes servicios publicados</h3>
                    <p>Comienza a publicar tus servicios para que otros usuarios puedan contactarte</p>
                    <button class="btn-create-first-service" id="btn-create-first">
                        Publicar servicio
                    </button>
                </div>
            `;
            
            document.getElementById('btn-create-first')?.addEventListener('click', () => {
                modal.classList.add('hidden-section');
                document.body.style.overflow = 'auto';
                UIService.togglePublishPanel();
            });
        } else {
            list.innerHTML = services.map(service => renderServiceCard(service)).join('');
            
            // Adjuntar event listeners a los botones
            services.forEach(service => {
                document.getElementById(`boost-${service.id}`)?.addEventListener('click', () => {
                    UIService.showNotification('Función de impulsar visibilidad próximamente disponible', 'info');
                });
                document.getElementById(`edit-${service.id}`)?.addEventListener('click', () => handleEditService(service));
                document.getElementById(`delete-${service.id}`)?.addEventListener('click', () => handleDeleteService(service.id));
                document.getElementById(`toggle-${service.id}`)?.addEventListener('click', () => handleToggleService(service));
            });
        }
        
        modal.classList.remove('hidden-section');
        document.body.style.overflow = 'hidden';
    };

    /**
     * Renderiza una tarjeta de servicio editable
     */
    const renderServiceCard = (service) => {
        const isActive = service.isActive !== false;
        const statusClass = isActive ? 'active' : 'inactive';
        const statusText = isActive ? 'Activo' : 'Inactivo';
        
        // Formatear precio
        const priceDisplay = service.price ? 
            `$${parseFloat(service.price).toLocaleString('es-CL')} ${service.priceModality ? `(${service.priceModality.replace('_', ' ')})` : ''}` 
            : 'Precio a consultar';
        
        return `
            <div class="my-service-card">
                <div class="my-service-header">
                    <div class="my-service-header-left">
                        <h3 class="my-service-title">${service.serviceName || 'Sin nombre'}</h3>
                        <span class="my-service-category">${service.category || 'Sin categoría'}</span>
                    </div>
                    <div class="my-service-status">
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </div>
                </div>
                <p class="my-service-description">${service.description || 'Sin descripción'}</p>
                
                <div class="my-service-details">
                    <div class="service-detail-row">
                        <div class="service-detail-item">
                            <span class="detail-icon">💰</span>
                            <div class="detail-content">
                                <span class="detail-label">Precio</span>
                                <span class="detail-value">${priceDisplay}</span>
                            </div>
                        </div>
                        <div class="service-detail-item">
                            <span class="detail-icon">🕐</span>
                            <div class="detail-content">
                                <span class="detail-label">Horario</span>
                                <span class="detail-value">${service.schedule || 'No especificado'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="service-detail-row">
                        ${service.contactPhone ? `
                            <div class="service-detail-item">
                                <span class="detail-icon">📱</span>
                                <div class="detail-content">
                                    <span class="detail-label">Teléfono</span>
                                    <span class="detail-value">${service.contactPhone}</span>
                                </div>
                            </div>
                        ` : ''}
                        ${service.contactEmail ? `
                            <div class="service-detail-item">
                                <span class="detail-icon">✉️</span>
                                <div class="detail-content">
                                    <span class="detail-label">Email</span>
                                    <span class="detail-value">${service.contactEmail}</span>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    
                    ${service.address ? `
                        <div class="service-detail-row">
                            <div class="service-detail-item full-width">
                                <span class="detail-icon">📍</span>
                                <div class="detail-content">
                                    <span class="detail-label">Dirección</span>
                                    <span class="detail-value">${service.address}</span>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="my-service-actions">
                    <button class="service-action-btn btn-boost-service" id="boost-${service.id}" title="Próximamente">
                        🚀 Impulsar
                    </button>
                    <button class="service-action-btn btn-edit-service" id="edit-${service.id}">
                        ✏️ Editar
                    </button>
                    <button class="service-action-btn btn-toggle-status" id="toggle-${service.id}">
                        ${isActive ? '⏸️ Pausar' : '▶️ Activar'}
                    </button>
                    <button class="service-action-btn btn-delete-service" id="delete-${service.id}">
                        🗑️ Eliminar
                    </button>
                </div>
            </div>
        `;
    };

    /**
     * Maneja la edición de un servicio
     */
    const handleEditService = async (service) => {
        const modal = document.getElementById('my-services-modal');
        modal.classList.add('hidden-section');
        
        // Inicializar categorías ANTES de abrir el panel
        UIService.initPublishFormCategories();
        
        // Abrir panel de publicación con los datos del servicio
        UIService.togglePublishPanel();
        
        // Llenar el formulario con los datos del servicio
        setTimeout(() => {
            const form = document.getElementById('register-form');
            if (form) {
                form.dataset.editingId = service.id;
                
                // Campos básicos
                document.getElementById('service-name').value = service.serviceName || '';
                document.getElementById('service-description').value = service.description || '';
                document.getElementById('service-price').value = service.price || '';
                document.getElementById('price-modality').value = service.priceModality || 'por_servicio';
                document.getElementById('service-schedule').value = service.schedule || '';
                document.getElementById('service-address').value = service.address || '';
                
                // Seleccionar categoría principal y subcategoría
                const mainCategoryInput = document.getElementById('service-main-category');
                const subcategoryInput = document.getElementById('service-subcategory');
                const selectedDisplay = document.getElementById('selected-category-display');
                const selectedText = document.getElementById('selected-category-text');
                
                if (service.category && mainCategoryInput && subcategoryInput) {
                    // Importar categorías desde config
                    import('./config.js').then(({ SERVICE_CATEGORIES }) => {
                        // Buscar la categoría principal del servicio
                        let foundMainCategory = null;
                        
                        for (const category of SERVICE_CATEGORIES) {
                            if (category.servicios.includes(service.category)) {
                                foundMainCategory = category.categoria;
                                break;
                            }
                        }
                        
                        if (foundMainCategory) {
                            // Establecer valores en los inputs ocultos
                            mainCategoryInput.value = foundMainCategory;
                            subcategoryInput.value = service.category;
                            
                            // Mostrar la selección en el display (solo la subcategoría)
                            if (selectedDisplay && selectedText) {
                                selectedText.textContent = service.category;
                                selectedDisplay.classList.remove('hidden');
                            }
                            
                            // Marcar visualmente la categoría seleccionada
                            setTimeout(() => {
                                const categoryCards = document.querySelectorAll('.category-card');
                                categoryCards.forEach(card => {
                                    if (card.querySelector('.category-name')?.textContent === foundMainCategory) {
                                        card.classList.add('selected');
                                    }
                                });
                            }, 100);
                        }
                    });
                }
                
                // Configurar método de contacto
                if (service.contactEmail) {
                    document.getElementById('contact-email').checked = true;
                    document.getElementById('user-email').value = service.contactEmail;
                    document.getElementById('email-contact-section').classList.remove('hidden');
                    document.getElementById('phone-contact-section').classList.add('hidden');
                } else if (service.contactPhone) {
                    document.getElementById('contact-phone').checked = true;
                    document.getElementById('user-phone').value = service.contactPhone;
                    document.getElementById('phone-contact-section').classList.remove('hidden');
                    document.getElementById('email-contact-section').classList.add('hidden');
                    
                    if (service.whatsappAvailable !== undefined) {
                        document.getElementById('whatsapp-available').checked = service.whatsappAvailable;
                    }
                }
                
                // Actualizar ubicación en el mapa si existe
                if (service.location) {
                    selectedLocation = service.location;
                    MapService.showTempMarker(service.location.lat, service.location.lng);
                    MapService.centerMap(service.location.lat, service.location.lng);
                }
                
                // Cambiar texto del botón
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.textContent = 'Actualizar Servicio';
                }
            }
        }, 100);
    };

    /**
     * Maneja la eliminación de un servicio
     */
    const handleDeleteService = async (serviceId) => {
        const confirmed = await UIService.showConfirm(
            '¿Eliminar servicio?',
            'Esta acción no se puede deshacer.',
            { confirmText: 'Eliminar', cancelText: 'Cancelar' }
        );
        if (!confirmed) {
            return;
        }
        
        try {
            await ApiService.deleteService(serviceId);
            UIService.showNotification('Servicio eliminado correctamente', 'success');
            
            // Eliminar servicio del caché
            DataService.removeServiceFromCache(serviceId);
            
            // Recargar la lista de servicios del usuario
            const services = await AuthService.getMyServices();
            displayMyServices(services);
        } catch (error) {
            console.error('Error al eliminar servicio:', error);
            UIService.showNotification('Error al eliminar el servicio', 'error');
        }
    };

    /**
     * Maneja el cambio de estado activo/inactivo de un servicio
     */
    const handleToggleService = async (service) => {
        const newStatus = !service.isActive;
        
        try {
            await ApiService.updateService(service.id, { is_active: newStatus });
            UIService.showNotification(
                newStatus ? 'Servicio activado correctamente' : 'Servicio pausado correctamente',
                'success'
            );
            
            // Recargar la lista de servicios
            const services = await AuthService.getMyServices();
            displayMyServices(services);
        } catch (error) {
            console.error('Error al cambiar estado del servicio:', error);
            UIService.showNotification('Error al cambiar el estado del servicio', 'error');
        }
    };

    // --- Handlers (manejadores de eventos) ---

    const handleCategoryClick = (item, isMainCategory) => {
        console.log('🎯 Click en categoría:', { item, isMainCategory, type: typeof item });
        
        if (isMainCategory) {
            // Muestra los servicios de la categoría seleccionada
            UIService.renderServiceCategories(handleCategoryClick, handleBackToCategories, item);
            activeCategory = null; // Aún no hay una selección final
            UIService.updateFilterStatus(null);
            updateActiveFiltersCount();
        } else {
            // Es un servicio final, realiza la búsqueda
            if (activeCategory === item) {
                console.log('🔄 Deseleccionando categoría:', item);
                activeCategory = null; // Deseleccionar si se hace clic de nuevo
                UIService.updateFilterStatus(null);
                performSearch('');
            } else {
                console.log('✅ Seleccionando categoría:', item);
                activeCategory = item;
                UIService.updateFilterStatus(item);
                performSearch(''); // Pasar cadena vacía - el filtro usa activeCategory, no searchTerm
            }
            updateActiveFiltersCount();
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
        updateActiveFiltersCount();
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

    const handleRegisterFormSubmit = async (e) => {
        e.preventDefault();
        
        // Verificar autenticación
        if (!AuthService.isAuthenticated()) {
            UIService.showNotification('Debes iniciar sesión para publicar un servicio', 'error');
            UIService.togglePublishPanel(); // Cerrar panel de publicación
            UIService.showModal('profile'); // Mostrar modal de login
            return;
        }
        
        try {
            const form = e.target;
            const editingId = form.dataset.editingId;
            const isEditing = !!editingId;
            
            const serviceName = form.querySelector('#service-name').value;
            const serviceDescription = form.querySelector('#service-description').value;
            const priceValue = form.querySelector('#service-price').value;
            const servicePrice = priceValue ? parseFloat(priceValue) : null;
            const priceModality = form.querySelector('#price-modality').value;
            const serviceSchedule = form.querySelector('#service-schedule').value;
            const serviceAddress = form.querySelector('#service-address').value;
            const category = form.querySelector('#service-subcategory').value;

            // Validar ubicación (requerida para crear, opcional para editar)
            if (!selectedLocation) {
                if (!isEditing) {
                    UIService.showNotification('Error: No se ha seleccionado ubicación en el mapa.', 'error');
                    return;
                }
                // Si está editando y no hay nueva ubicación, no se actualiza la ubicación
            }

            // Obtener datos de contacto del nuevo formulario
            const contactMethod = UIService.getContactDataFromForm();

            // Crear objeto de datos del servicio
            const serviceData = {
                serviceName,
                description: serviceDescription,
                price: servicePrice,
                priceModality: priceModality,
                schedule: serviceSchedule,
                address: serviceAddress,
                category,
                location: selectedLocation, // Puede ser null si se está editando
                contactMethod: contactMethod
            };

            // DEBUG: Log para ver los datos antes de sanitizar
            console.log('🔍 Datos ANTES de sanitizar:', {
                price: servicePrice,
                priceType: typeof servicePrice,
                priceModality: priceModality,
                priceModalityType: typeof priceModality,
                contactMethod: contactMethod
            });

            // Sanitizar datos
            const sanitizedData = sanitizeServiceData(serviceData);

            // DEBUG: Log para ver los datos después de sanitizar
            console.log('🔍 Datos DESPUÉS de sanitizar:', {
                price: sanitizedData.price,
                priceType: typeof sanitizedData.price,
                priceModality: sanitizedData.priceModality,
                priceModalityType: typeof sanitizedData.priceModality
            });

            // Validar datos
            const validation = validateServiceData(sanitizedData);
            if (!validation.isValid) {
                console.error('❌ Errores de validación:', validation.errors);
                UIService.showNotification(validation.errors.join(' '), 'error');
                return;
            }

            // Mostrar estado de carga
            UIService.showLoadingState('publish');

            // Preparar datos para el backend (adaptando nombres de campos)
            const backendData = {
                service_name: sanitizedData.serviceName,
                description: sanitizedData.description,
                category: sanitizedData.category,
                price: sanitizedData.price,
                price_modality: sanitizedData.priceModality,
                schedule: sanitizedData.schedule,
                address: sanitizedData.address,
                contact_method: sanitizedData.contactMethod.method,
                contact_email: sanitizedData.contactMethod.email || null,
                contact_phone: sanitizedData.contactMethod.phone || null,
                contact_country_code: sanitizedData.contactMethod.countryCode || null,
                whatsapp_available: sanitizedData.contactMethod.whatsappAvailable || false
            };
            
            // Solo agregar ubicación si existe (para no sobrescribir en ediciones)
            if (sanitizedData.location) {
                backendData.latitude = sanitizedData.location.lat;
                backendData.longitude = sanitizedData.location.lng;
            }

            console.log('📤 Enviando al backend:', backendData);

            let result;
            if (isEditing) {
                // Actualizar servicio existente
                console.log('🔄 Actualizando servicio ID:', editingId);
                console.log('📤 Datos a enviar:', backendData);
                
                result = await ApiService.updateService(editingId, backendData);
                
                console.log('✅ Respuesta del servidor:', result);
                console.log('🔍 Verificando cambios...');
                
                UIService.showNotification('¡Servicio actualizado con éxito!', 'success');
                
                // Actualizar servicio en caché sin recargar todo
                DataService.updateServiceInCache(result);
                
                // Actualizar la lista de búsqueda y el mapa
                await performSearch('', false);
                
            } else {
                // Crear servicio nuevo
                result = await AuthService.createService(backendData);
                console.log('✅ Servicio creado exitosamente:', result);
                
                // Mensaje diferenciado para móvil vs desktop
                const isMobile = window.innerWidth < 768;
                if (isMobile) {
                    UIService.showNotification('✅ ¡Servicio publicado! Tu servicio ya está visible en el mapa.', 'success', 5000);
                } else {
                    UIService.showNotification('¡Servicio publicado con éxito!', 'success');
                }
                
                // Agregar servicio al caché sin recargar todo
                DataService.addServiceToCache(result);
                await performSearch('', false);
            }
            
            UIService.resetRegisterForm();
            UIService.togglePublishPanel();
            UIService.hideLoadingState('publish');
            
            // Limpiar el dataset de edición
            delete form.dataset.editingId;
            
            // Limpiar selectedLocation para evitar conflictos
            selectedLocation = null;
            
        } catch (error) {
            console.error('Error al crear servicio:', error);
            UIService.showNotification(error.message || 'Error al publicar el servicio. Inténtalo de nuevo.', 'error');
            UIService.hideLoadingState('publish');
        }
    };

    // --- Inicialización de la App ---
    initApp();
});

// --- Funciones Globales para Mapas ---

/**
 * Función global para mostrar detalles de un servicio desde popups del mapa.
 * @param {string} serviceId - ID del servicio a mostrar.
 */
window.showServiceDetails = async (serviceId) => {
    try {
        // Buscar el servicio en los datos cacheados
        const services = DataService.getServices();
        
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
    } catch (error) {
        console.error('Error loading service details:', error);
        UIService.showNotification('Error al cargar los detalles del servicio.', 'error');
    }
};
