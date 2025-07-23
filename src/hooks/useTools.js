import {useEffect, useState} from 'react';
import {useMcpContext} from '../context/McpContext';
import {listTools} from '../services/toolService';

export const useTools = () => {
    const {apiKey, sessionId, protocolVersion} = useMcpContext();
    const [tools, setTools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Log once when this hook is first used
    useEffect(() => {
        console.log(
            `⚙️ [useSecureTransfer] MODE=${import.meta.env.MODE}  BACKEND=${import.meta.env.VITE_BACKEND_URL}`
        );
    }, []);

    useEffect(() => {
        const fetch = async () => {
            try {
                const result = await listTools(apiKey, sessionId, protocolVersion);
                setTools(result || []);
            } catch (err) {
                setError(err.response?.data?.detail || 'Failed to load tools');
            } finally {
                setLoading(false);
            }
        };
        if (apiKey && sessionId && protocolVersion) {
            fetch();
        } else {
            setLoading(false); // no session yet
        }
    }, [apiKey, sessionId, protocolVersion]);

    return {tools, loading, error};
};
