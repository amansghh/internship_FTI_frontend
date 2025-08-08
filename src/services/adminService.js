import axios from 'axios';

const MCP_URL = import.meta.env.VITE_BACKEND_URL + '/admin';
export const createApiKey = (adminKey, {role, owner, expires, tier}) =>
    axios.post(
        `${MCP_URL}/keys`,
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
    axios.get(`${MCP_URL}/keys`, {
        headers: {'api-key': adminKey},
    });

export const deactivateApiKey = (adminKey, apiKey) =>
    axios.delete(`${MCP_URL}/keys/${apiKey}`, {
        headers: { 'api-key': adminKey },
    });

export const registerTool = (adminKey, toolData) =>
    axios.post(`${MCP_URL}/tools/register`, toolData, {
        headers: {'api-key': adminKey},
    });

export const fetchAdminLogs = (adminKey) =>
    axios.get(`${MCP_URL}/trace`, {
        headers: {'api-key': adminKey},
    });
