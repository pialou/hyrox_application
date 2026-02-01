/**
 * API Client - Hyrox Intel
 * 
 * Centralized HTTP client with headers and API key management.
 * All API calls go through this module.
 */

const BASE_URL = process.env.REACT_APP_API_URL || 'https://pialousport.tailad5314.ts.net/webhook/api/router';
const API_KEY = process.env.REACT_APP_API_KEY || '';

/**
 * Default headers for all API requests
 */
const getHeaders = () => ({
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
});

/**
 * Handle API response and errors
 * @param {Response} response - Fetch response object
 * @returns {Promise<any>} Parsed JSON data
 * @throws {Error} If response is not ok
 */
const handleResponse = async (response) => {
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API Error ${response.status}: ${errorBody}`);
    }
    return response.json();
};

/**
 * Make a POST request to the API
 * @param {string} action - Action type for the webhook router
 * @param {Object} payload - Request payload
 * @returns {Promise<any>} Response data
 */
export const post = async (action, payload = {}) => {
    const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ action, ...payload }),
    });
    return handleResponse(response);
};

/**
 * Make a GET request to the API
 * @param {string} action - Action type for the webhook router
 * @param {Object} params - Query parameters
 * @returns {Promise<any>} Response data
 */
export const get = async (action, params = {}) => {
    const queryString = new URLSearchParams({ action, ...params }).toString();
    const url = `${BASE_URL}?${queryString}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(),
    });
    return handleResponse(response);
};

export default {
    post,
    get,
    BASE_URL,
};
