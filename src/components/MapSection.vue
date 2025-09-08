<template>
  <section id="map-section" class="active-section">
    <div id="map"></div>
    <div class="floating-controls">
      <button class="control-btn" @click="useCurrentLocation">📍</button>
    </div>
  </section>
</template>

<script>
import { onMounted, ref } from 'vue';
import L from 'leaflet';

export default {
  name: 'MapSection',
  props: {
    users: {
      type: Array,
      required: true,
    },
    centerLocation: {
      type: Object,
      required: true,
    },
  },
  setup(props, { emit }) {
    const map = ref(null);
    const centerMarker = ref(null);
    const tempServiceMarker = ref(null);
    const isSelectingLocation = ref(false);

    const initMap = () => {
      map.value = L.map('map').setView([props.centerLocation.lat, props.centerLocation.lng], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map.value);

      map.value.on('click', (e) => {
        if (isSelectingLocation.value) {
          selectLocationOnMap(e.latlng.lat, e.latlng.lng);
        }
      });

      renderMarkers();
    };

    const enterLocationSelectionMode = () => {
      isSelectingLocation.value = true;
      document.getElementById('map-section').classList.add('location-selection-mode');
      map.value.getContainer().style.cursor = 'crosshair';
    };

    const exitLocationSelectionMode = () => {
      isSelectingLocation.value = false;
      document.getElementById('map-section').classList.remove('location-selection-mode');
      map.value.getContainer().style.cursor = '';

      if (tempServiceMarker.value) {
        map.value.removeLayer(tempServiceMarker.value);
        tempServiceMarker.value = null;
      }
    };

    const selectLocationOnMap = async (lat, lng) => {
      const tempIcon = L.divIcon({
        html: '<div style="background: #667eea; border: 3px solid white; border-radius: 50%; width: 20px; height: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
        className: 'temp-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      if (tempServiceMarker.value) {
        map.value.removeLayer(tempServiceMarker.value);
      }

      tempServiceMarker.value = L.marker([lat, lng], { icon: tempIcon }).addTo(map.value);
      exitLocationSelectionMode();

      // Usa emit en lugar de this.$emit
      emit('locationSelected', { lat, lng });
    };

    const renderMarkers = () => {
      if (!map.value) return;

      map.value.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          map.value.removeLayer(layer);
        }
      });

      props.users.filter((user) => user.location).forEach((user) => {
        const latlng = [user.location.lat, user.location.lng];

        const categoryIcons = {
          'Diseño Gráfico': '🎨',
          'Carpintería': '🔨',
          'Electricista': '⚡',
          'Fontanería': '🔧',
          'Clases particulares': '📚',
          'Otros': '⚙️',
        };

        const icon = L.divIcon({
          html: `<div style="background: white; border-radius: 50%; padding: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); font-size: 20px; text-align: center;">${categoryIcons[user.category] || '⚙️'}</div>`,
          className: 'custom-marker',
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        const marker = L.marker(latlng, { icon }).addTo(map.value);

        marker.bindPopup(`
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; color: #333;">${user.serviceName}</h3>
            <p style="margin: 4px 0;"><strong>Categoría:</strong> ${user.category}</p>
            <p style="margin: 4px 0;"><strong>Dirección:</strong> ${user.address}</p>
            <p style="margin: 4px 0;"><strong>Contacto:</strong> <a href="mailto:${user.email}">${user.email}</a></p>
          </div>
        `);
      });
    };

    const useCurrentLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          map.value.setView([lat, lng], 15);

          if (!centerMarker.value) {
            centerMarker.value = L.marker([lat, lng]).addTo(map.value);
          } else {
            centerMarker.value.setLatLng([lat, lng]);
          }
        }, () => {
          alert('No se pudo obtener tu ubicación actual');
        });
      } else {
        alert('Geolocalización no soportada por este navegador');
      }
    };

    onMounted(initMap);

    return {
      useCurrentLocation,
      enterLocationSelectionMode,
      exitLocationSelectionMode,
    };
  },
};
</script>

<style scoped>
#map {
  height: 100vh;
  width: 100%;
}
/* Agrega aquí los estilos específicos para el componente del mapa */

.floating-controls {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1000;
}

.control-btn {
  background: white;
  border: none;
  border-radius: 5px;
  padding: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: background 0.3s;
}

.control-btn:hover {
  background: #f0f0f0;
}

/* Estilos para el modo de selección de ubicación */
.location-selection-mode #map {
  cursor: crosshair;
}

.temp-marker {
  background: #667eea;
  border: 3px solid white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
</style>
