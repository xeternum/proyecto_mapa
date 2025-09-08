<template>
  <section id="profile-modal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Mi Perfil</h2>
        <button class="close-btn" @click="closeModal">&times;</button>
      </div>

      <div class="profile-section">
        <!-- Sección de perfil -->
        <div class="profile-header">
          <div class="avatar-container">
            <div class="avatar">
              <span class="avatar-text">JD</span>
            </div>
            <button class="change-photo-btn">Cambiar foto</button>
          </div>
          <div class="user-info">
            <h3>John Doe</h3>
            <p>john.doe@example.com</p>
          </div>
        </div>

        <!-- Sección de ajustes -->
        <div class="settings-section">
          <h3>Ajustes de la aplicación</h3>

          <!-- Privacidad -->
          <div class="setting-group">
            <h4>Privacidad</h4>
            <div class="setting-item">
              <label class="toggle-switch">
                <input type="checkbox" v-model="settings.locationSharing">
                <span class="slider"></span>
              </label>
              <div class="setting-text">
                <span>Compartir ubicación</span>
                <small>Permite que otros usuarios vean tu ubicación aproximada</small>
              </div>
            </div>
            <div class="setting-item">
              <label class="toggle-switch">
                <input type="checkbox" v-model="settings.profileVisibility">
                <span class="slider"></span>
              </label>
              <div class="setting-text">
                <span>Perfil público</span>
                <small>Tu perfil será visible para otros usuarios</small>
              </div>
            </div>
          </div>

          <!-- Preferencias -->
          <div class="setting-group">
            <h4>Preferencias</h4>
            <div class="setting-item">
              <select v-model="settings.language" class="select-input">
                <option value="es">Español</option>
                <option value="en">English</option>
                <option value="pt">Português</option>
              </select>
              <div class="setting-text">
                <span>Idioma</span>
                <small>Selecciona el idioma de la aplicación</small>
              </div>
            </div>
            <div class="setting-item">
              <select v-model="settings.radius" class="select-input">
                <option value="1">1 km</option>
                <option value="5">5 km</option>
                <option value="10">10 km</option>
                <option value="20">20 km</option>
              </select>
              <div class="setting-text">
                <span>Radio de búsqueda</span>
                <small>Distancia máxima para buscar servicios</small>
              </div>
            </div>
          </div>
        </div>

        <!-- Botones de acción -->
        <div class="action-buttons">
          <button class="btn-secondary" @click="closeModal">Cancelar</button>
          <button class="btn-primary" @click="saveSettings">Guardar cambios</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'ProfileModal',
  data() {
    return {
      settings: {
        locationSharing: false,
        profileVisibility: true,
        language: 'es',
        radius: '5'
      }
    }
  },
  methods: {
    closeModal() {
      this.$emit('closeModal');
    },
    saveSettings() {
      // Aquí iría la lógica para guardar los ajustes
      alert('Cambios guardados correctamente');
      this.closeModal();
    }
  }
}
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
  padding: 24px;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 85vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h2 {
  margin: 0;
  color: #2d3748;
  font-size: 24px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #4a5568;
}

.profile-header {
  display: flex;
  align-items: center;
  margin-bottom: 32px;
  padding: 16px;
  background: #f7fafc;
  border-radius: 8px;
}

.avatar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 24px;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #4a5568;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.avatar-text {
  color: white;
  font-size: 32px;
  font-weight: bold;
}

.change-photo-btn {
  background: none;
  border: none;
  color: #4299e1;
  cursor: pointer;
  font-size: 14px;
}

.user-info h3 {
  margin: 0;
  color: #2d3748;
  font-size: 20px;
}

.user-info p {
  margin: 4px 0 0;
  color: #718096;
}

.settings-section {
  padding: 0 16px;
}

.settings-section h3 {
  color: #2d3748;
  margin-bottom: 24px;
}

.setting-group {
  margin-bottom: 32px;
}

.setting-group h4 {
  color: #4a5568;
  margin-bottom: 16px;
  font-size: 16px;
}

.setting-item {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.setting-text {
  margin-left: 16px;
  flex: 1;
}

.setting-text span {
  display: block;
  color: #2d3748;
  font-weight: 500;
}

.setting-text small {
  color: #718096;
  font-size: 12px;
}

/* Toggle Switch */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cbd5e0;
  transition: .4s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #48bb78;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

/* Select Input */
.select-input {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  width: 120px;
  color: #2d3748;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.btn-primary, .btn-secondary {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #4299e1;
  color: white;
  border: none;
}

.btn-primary:hover {
  background: #3182ce;
}

.btn-secondary {
  background: white;
  color: #4a5568;
  border: 1px solid #e2e8f0;
}

.btn-secondary:hover {
  background: #f7fafc;
}
</style>
