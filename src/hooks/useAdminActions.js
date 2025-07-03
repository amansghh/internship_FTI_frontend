import {useState} from 'react';
import {toast} from 'react-toastify';
import {
    createApiKey,
    listApiKeys,
    deactivateApiKey,
    registerTool,
    fetchAdminLogs,
} from '../services/adminService';

export const useAdminActions = (adminKey) => {
    const [listedKeys, setListedKeys] = useState([]);
    const [logs, setLogs] = useState([]);

    const createKey = async (data) => {
        try {
            await createApiKey(adminKey, data);
            toast.success("Key created");
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Error creating key');
        }
    };

    const fetchKeys = async () => {
        try {
            const res = await listApiKeys(adminKey);
            setListedKeys(res.data.keys || []);
            toast.success("Keys listed");
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Error listing keys');
        }
    };

    const deactivateKey = async (key) => {
        try {
            await deactivateApiKey(adminKey, key);
            toast.success("Key deactivated");
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Error deactivating key');
        }
    };

    const registerNewTool = async (toolData) => {
        try {
            await registerTool(adminKey, toolData);
            toast.success("Tool registered");
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Error registering tool');
        }
    };

    const fetchLogs = async () => {
        try {
            const res = await fetchAdminLogs(adminKey);
            setLogs(res.data.trace_logs || []);
            toast.success("Logs loaded");
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Error loading logs');
        }
    };

    return {
        listedKeys,
        logs,
        createKey,
        fetchKeys,
        deactivateKey,
        registerNewTool,
        fetchLogs,
    };
};
