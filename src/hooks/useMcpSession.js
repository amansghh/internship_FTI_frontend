import {useState} from 'react';
import axios from 'axios';
import {toast} from 'react-toastify';

const MCP_URL = 'http://localhost:8000/mcp';
const PROTOCOL_VERSION = '2025-06-18';

export const useMcpSession = () => {
    const [sessionId, setSessionId] = useState(null);
    const [apiKey, setApiKey] = useState('');
    const [fti, setFti] = useState(false);
    const [initialized, setInitialized] = useState(false);

    const headers = {
        'api-key': apiKey,
        ...(sessionId && {
            'Mcp-Session-Id': sessionId,
            'Mcp-Protocol-Version': PROTOCOL_VERSION,
        }),
    };

    const initializeSession = async () => {
        try {
            const res = await axios.post(MCP_URL, {
                jsonrpc: '2.0',
                id: 1,
                method: 'initialize',
                params: {
                    protocolVersion: PROTOCOL_VERSION,
                    fti,
                },
            }, {headers});

            const sid = res.headers['mcp-session-id'];
            if (!sid) throw new Error('No session ID returned');

            setSessionId(sid);
            toast.success('Session initialized');
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error?.message || 'Failed to initialize session');
        }
    };

    const sendInitialized = async () => {
        try {
            await axios.post(MCP_URL, {
                jsonrpc: '2.0',
                method: 'notifications/initialized',
                params: {},
            }, {headers});

            setInitialized(true);
            toast.success('Session marked as initialized');
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error?.message || 'Failed to send initialized notification');
        }
    };

    return {
        apiKey,
        setApiKey,
        fti,
        setFti,
        sessionId,
        initialized,
        initializeSession,
        sendInitialized,
        headers,
    };
};
