<template>
  <header>
    <h1>Red GeoConecta</h1>
    <nav class="main-nav">
      <button class="nav-btn primary" @click="$emit('openSearch')">
        <span class="icon">🔍</span>
        <span class="label">Buscar</span>
      </button>
      <button class="nav-btn" @click="$emit('openAddService')">
        <span class="icon">➕</span>
        <span class="label">Publicar</span>
      </button>
      <button class="nav-btn" @click="$emit('openProfileMenu')">
        <span class="icon">☰</span>
        <span class="label">Menú</span>
      </button>
    </nav>
  </header>
</template>

<script>
export default {
  name: 'HeaderSection',
};
</script>

<style scoped>
/* Agrega aquí los estilos específicos para el componente HeaderSection */
</style>
