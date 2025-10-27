
// js/dataService.js

import { haversineDistance } from './utils.js';

import { mockUsers } from './mockData.js';

let users = [];
let centerLocation = null;

/**
 * Carga los usuarios desde localStorage o usa datos de mock si está vacío.
 */
const loadUsers = () => {
    const storedUsers = localStorage.getItem('users');
    if (storedUsers && JSON.parse(storedUsers).length > 0) {
        users = JSON.parse(storedUsers);
    } else {
        users = mockUsers;
        saveUsers(); // Guarda los datos de mock en localStorage para futuras sesiones
    }
};

/**
 * Guarda los usuarios en localStorage.
 */
const saveUsers = () => {
    localStorage.setItem('users', JSON.stringify(users));
};

/**
 * Inicializa el servicio de datos.
 * @param {object} initialCenterLocation - La ubicación central inicial.
 */
export const initDataService = (initialCenterLocation) => {
    loadUsers();
    centerLocation = initialCenterLocation;
};

/**
 * Obtiene todos los usuarios.
 * @returns {Array} - La lista de usuarios.
 */
export const getUsers = () => users;

/**
 * Añade un nuevo usuario y lo guarda.
 * @param {object} user - El nuevo usuario a añadir.
 */
export const addUser = (user) => {
    users.push(user);
    saveUsers();
};

/**
 * Actualiza la ubicación central para cálculos de distancia.
 * @param {object} newCenterLocation - La nueva ubicación central.
 */
export const updateCenterLocation = (newCenterLocation) => {
    centerLocation = newCenterLocation;
};


/**
 * Obtiene la ubicación central actual.
 * @returns {object} - La ubicación central.
 */
export const getCenterLocation = () => centerLocation;
