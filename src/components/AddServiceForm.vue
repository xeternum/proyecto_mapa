<template>
  <section id="add-service-form" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Agregar Nuevo Servicio</h2>
        <button class="close-btn" @click="closeForm">&times;</button>
      </div>
      <form @submit.prevent="submitService">
        <div class="form-group">
          <label for="service-name">Nombre del servicio:</label>
          <input type="text" id="service-name" v-model="serviceName" required placeholder="Ej: Reparación de electrodomésticos">
        </div>
        <div class="form-group">
          <label for="user-email">Email de contacto:</label>
          <input type="email" id="user-email" v-model="userEmail" required placeholder="ejemplo@servicio.com">
        </div>
        <div class="form-group">
          <label for="service-address">Dirección del servicio:</label>
          <div class="address-input-container">
            <input type="text" id="service-address" v-model="serviceAddress" required placeholder="Ingresa la dirección...">
            <button type="button" class="change-location-btn" @click="changeLocation">📍 Cambiar ubicación</button>
          </div>
        </div>
        <div class="form-group">
          <label>Categoría del servicio:</label>
          <select id="service-category" v-model="serviceCategory" required>
            <option value="">Selecciona una categoría</option>
            <option value="Diseño Gráfico">Diseño Gráfico</option>
            <option value="Carpintería">Carpintería</option>
            <option value="Electricista">Electricista</option>
            <option value="Fontanería">Fontanería</option>
            <option value="Clases particulares">Clases particulares</option>
            <option value="Otros">Otros</option>
          </select>
        </div>
        <button type="submit" class="submit-btn">Publicar Servicio</button>
      </form>
    </div>
  </section>
</template>

<script>
export default {
  name: 'AddServiceForm',
  props: {
    selectedLocation: {
      type: Object,
      required: false,
      default: null,
    },
  },
  data() {
    return {
      serviceName: '',
      userEmail: 'test@example.com', // Email por defecto
      serviceAddress: '',
      serviceCategory: '',
      skills: ['Diseño Gráfico', 'Carpintería', 'Electricista', 'Fontanería', 'Clases particulares', 'Otros'],
    };
  },
  watch: {
    // Observar cambios en selectedLocation para actualizar la dirección
    selectedLocation: {
      immediate: true,
      async handler(newLocation) {
        if (newLocation) {
          this.serviceAddress = await this.getStreetAddress(newLocation.lat, newLocation.lng);
        }
      }
    }
  },
  methods: {
    async getStreetAddress(lat, lng) {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
        const response = await fetch(url);
        const data = await response.json();
        const address = data.address;
        const houseNumber = address.house_number || '';
        const road = address.road || '';
        const quarter = address.quarter || '';
        const town = address.town || address.city || address.village || '';
        return `${road}, ${quarter}, ${houseNumber}`.replace(/,(\s*,){1,}/g, ',').trim();
      } catch (error) {
        console.error('Error al obtener la dirección:', error);
        return 'Dirección no disponible';
      }
    },
    closeForm() {
      this.$emit('closeForm');
    },
    changeLocation() {
      this.$emit('changeLocation');
    },
    submitService() {
      if (!this.selectedLocation) {
        alert('Error: No se ha seleccionado ubicación');
        return;
      }

      const newService = {
        id: Date.now(),
        serviceName: this.serviceName,
        email: this.userEmail,
        address: this.serviceAddress,
        category: this.serviceCategory,
        location: this.selectedLocation,
      };

      this.$emit('serviceAdded', newService);
      this.$emit('closeForm'); // Cerrar el modal después de agregar el servicio

      // Reset form fields
      this.serviceName = '';
      this.userEmail = '';
      this.serviceAddress = '';
      this.serviceCategory = '';

      alert('¡Servicio publicado con éxito!');
    },
  },
};
</script>

<style scoped>
/* Agrega aquí los estilos específicos para el componente AddServiceForm */
</style>
