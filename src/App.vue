<template>
  <div id="app">
    <HeaderSection 
      @openSearch="showSearchModal" 
      @openAddService="enterLocationSelectionMode" 
      @openProfileMenu="showProfileModal" />

    <main>
      <MapSection 
        :users="users" 
        :centerLocation="centerLocation" 
        ref="mapSection" 
        @locationSelected="updateSelectedLocation" />
      <SearchModal 
        v-if="modals.search" 
        :skills="skills" 
        :users="users"
        :centerLocation="centerLocation"
        @closeModal="closeAllModals" 
      />
      <AddServiceForm 
        v-if="modals.addService" 
        :selectedLocation="selectedLocation" 
        @closeForm="closeAllModals" 
        @changeLocation="enterLocationSelectionMode" 
        @serviceAdded="handleNuevoServicio" 
      />
      <ProfileModal 
        v-if="modals.profile" 
        @closeModal="closeAllModals"
/>
    </main>
  </div>
</template>

<script>
import HeaderSection from './components/HeaderSection.vue';
import MapSection from './components/MapSection.vue';
import SearchModal from './components/SearchModal.vue';
import ProfileModal from './components/ProfileModal.vue';
import AddServiceForm from './components/AddServiceForm.vue';

export default {
  name: 'App',
  components: {
    HeaderSection,
    MapSection,
    SearchModal,
    ProfileModal,
    AddServiceForm,
  },
  data() {
    return {
      users: JSON.parse(localStorage.getItem('users')) || [],
      skills: ['Diseño Gráfico', 'Carpintería', 'Electricista', 'Fontanería', 'Clases particulares', 'Otros'],
      centerLocation: { lat: -33.4489, lng: -70.6693 },
      selectedLocation: null,
      modals: {
        search: false,
        addService: false,
        profile: false,
      },
    };
  },
  methods: {
    saveUsers() {
      localStorage.setItem('users', JSON.stringify(this.users));
    },
    haversineDistance(coords1, coords2) {
      const toRad = (x) => x * Math.PI / 180;
      const R = 6371; // Radio de la Tierra en km

      const dLat = toRad(coords2.lat - coords1.lat);
      const dLng = toRad(coords2.lng - coords1.lng);

      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(toRad(coords1.lat)) * Math.cos(toRad(coords2.lat)) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return R * c;
    },
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

        return `${road}, ${quarter}, ${houseNumber}`.replace(/,\s*,/g, ',').trim();
      } catch (error) {
        console.error('Error al obtener la dirección:', error);
        return 'Dirección no disponible';
      }
    },
    handleNuevoServicio(nuevoServicio) {
      this.users.push(nuevoServicio);
      this.saveUsers();
    },
    showSearchModal() {
      this.closeAllModals();
      this.modals.search = true;
    },
    enterLocationSelectionMode() {
      this.closeAllModals();
      this.$refs.mapSection.enterLocationSelectionMode();
    },
    showProfileModal() {
      this.closeAllModals();
      this.modals.profile = true;
    },
    closeAllModals() {
      this.modals.search = false;
      this.modals.addService = false;
      this.modals.profile = false;
    },
    updateSelectedLocation(location) {
      this.selectedLocation = location;
      this.modals.addService = true;
    },
  },
};
</script>

<style scoped>
/* Puedes mover aquí los estilos específicos del componente */
</style>
