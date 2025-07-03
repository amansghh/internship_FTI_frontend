import axios from 'axios';

const BASE_URL = 'http://localhost:8000/admin';

export const createApiKey = (adminKey, {role, owner, expires, tier}) =>
    axios.post(
        `http://localhost:8000/admin/keys/create`,
        null, // no body
        {
            headers: {'api-key': adminKey},
            params: {
                role,
                created_by: owner,
                expires,              // gets mapped to ?expires=...
                rate_limit_tier: tier
            }
        }
    );

export const listApiKeys = (adminKey) =>
    axios.get(`${BASE_URL}/keys/list`, {
        headers: {'api-key': adminKey},
    });

export const deactivateApiKey = (adminKey, apiKey) =>
    axios.post(`${BASE_URL}/keys/deactivate`, null, {
        headers: {'api-key': adminKey},
        params: {target_key: apiKey}
    });

export const registerTool = (adminKey, toolData) =>
    axios.post(`${BASE_URL}/tools/register`, toolData, {
        headers: {'api-key': adminKey},
    });

export const fetchAdminLogs = (adminKey) =>
    axios.get(`${BASE_URL}/trace`, {
        headers: {'api-key': adminKey},
    });
