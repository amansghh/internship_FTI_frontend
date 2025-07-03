import {useEffect, useState} from 'react';
import {useMcpContext} from '../context/McpContext';
import {listPrompts} from '../services/promptService';

export const usePrompts = () => {
    const {apiKey, sessionId, protocolVersion} = useMcpContext();
    const [prompts, setPrompts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                const result = await listPrompts(apiKey, sessionId, protocolVersion);
                setPrompts(result || []);
            } catch (err) {
                setError(err.response?.data?.detail || 'Failed to load prompts');
            } finally {
                setLoading(false);
            }
        };
        if (apiKey && sessionId && protocolVersion) {
            fetch();
        } else {
            setLoading(false);
        }
    }, [apiKey, sessionId, protocolVersion]);

    return {prompts, loading, error};
};
