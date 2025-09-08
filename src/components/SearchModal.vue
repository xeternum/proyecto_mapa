<template>
  <section id="search-modal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Buscar Servicios</h2>
        <button class="close-btn" @click="closeModal">&times;</button>
      </div>

      <div class="search-section">
        <div class="form-group">
          <label>Filtrar por categoría:</label>
          <select v-model="selectedCategory" @change="filterServices" class="category-select">
            <option value="">Todas las categorías</option>
            <option v-for="skill in skills" :key="skill" :value="skill">
              {{ skill }}
            </option>
          </select>
        </div>

        <!-- Resultados de búsqueda -->
        <div v-if="filteredServices.length > 0" class="results-container">
          <h3>Servicios Encontrados</h3>
          <div class="service-list">
            <div v-for="service in filteredServices" :key="service.id" class="service-card">
              <div class="service-header">
                <h4>{{ service.serviceName }}</h4>
                <span class="category-badge">{{ service.category }}</span>
              </div>
              <div class="service-details">
                <p><strong>Dirección:</strong> {{ service.address }}</p>
                <p><strong>Email:</strong> {{ service.email }}</p>
                <p><strong>Distancia:</strong> {{ calculateDistance(service.location) }} km</p>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="no-results">
          <p>No se encontraron servicios{{ selectedCategory ? ' en la categoría ' + selectedCategory : '' }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'SearchModal',
  props: {
    users: {
      type: Array,
      required: true,
      default: () => []
    },
    skills: {
      type: Array,
      required: true
    },
    centerLocation: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      selectedCategory: '',
      filteredServices: []
    }
  },
  created() {
    // Inicializar los servicios filtrados con todos los servicios
    this.filterServices();
  },
  methods: {
    closeModal() {
      this.$emit('closeModal');
    },
    filterServices() {
      if (!this.selectedCategory) {
        this.filteredServices = [...this.users];
      } else {
        this.filteredServices = this.users.filter(user => 
          user.category === this.selectedCategory
        );
      }
      
      // Ordenar por distancia
      this.filteredServices.sort((a, b) => {
        const distA = this.calculateDistance(a.location);
        const distB = this.calculateDistance(b.location);
        return distA - distB;
      });
    },
    calculateDistance(serviceLocation) {
      if (!serviceLocation || !this.centerLocation) return 0;
      
      const toRad = x => (x * Math.PI) / 180;
      const R = 6371; // Radio de la Tierra en km

      const dLat = toRad(serviceLocation.lat - this.centerLocation.lat);
      const dLng = toRad(serviceLocation.lng - this.centerLocation.lng);

      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(this.centerLocation.lat)) * 
        Math.cos(toRad(serviceLocation.lat)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return parseFloat((R * c).toFixed(2));
    }
  }
};
</script>

<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h2 {
  margin: 0;
  color: #2d3748;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #4a5568;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #4a5568;
  font-weight: 500;
}

.category-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 16px;
}

.service-list {
  display: grid;
  gap: 16px;
  margin-top: 20px;
}

.service-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  background: #f8fafc;
}

.service-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.service-header h4 {
  margin: 0;
  color: #2d3748;
  font-size: 18px;
}

.category-badge {
  background: #4a5568;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 14px;
}

.service-details p {
  margin: 8px 0;
  color: #4a5568;
}

.no-results {
  text-align: center;
  padding: 40px 0;
  color: #718096;
}
</style>
