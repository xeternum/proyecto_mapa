
// js/searchService.js

import * as DataService from './dataService.js';
import { haversineDistance } from './utils.js';

let allUsers = [];
let centerLocation = null;

/**
 * Initializes the search service.
 */
export const initSearchService = () => {
    allUsers = DataService.getUsers();
    centerLocation = DataService.getCenterLocation();
};

/**
 * Searches users based on a search term.
 * The search is performed on the serviceName, category, and address fields.
 * @param {string} searchTerm - The term to search for.
 * @returns {Array} - Filtered and sorted users.
 */
export const searchUsers = (searchTerm) => {
    if (!searchTerm) return allUsers;

    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    const filteredUsers = allUsers.filter(user => {
        const serviceNameMatch = user.serviceName && user.serviceName.toLowerCase().includes(lowerCaseSearchTerm);
        const categoryMatch = user.category && user.category.toLowerCase().includes(lowerCaseSearchTerm);
        const addressMatch = user.address && user.address.toLowerCase().includes(lowerCaseSearchTerm);

        return serviceNameMatch || categoryMatch || addressMatch;
    });

    // Sort by distance from the center location
    filteredUsers.sort((a, b) => {
        if (!a.location || !b.location) return 0;
        const distA = haversineDistance(centerLocation, a.location);
        const distB = haversineDistance(centerLocation, b.location);
        return distA - distB;
    });

    return filteredUsers;
};
