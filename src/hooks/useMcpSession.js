import {useState} from 'react';
import {toast} from 'react-toastify';
import {initializeSession as apiInit, sendInitializedNotification} from '../services/mcpService';

const PROTOCOL_VERSION = '2025-06-18';

export const useMcpSession = () => {
    const [sessionId, setSessionId] = useState(null);
    const [apiKey, setApiKey] = useState('');
    const [fti, setFti] = useState(false);
    const [initialized, setInitialized] = useState(false);
    const [protocolVersion, setProtocolVersion] = useState('2025-06-18');
    const [serverResponse, setServerResponse] = useState(null);

    const headers = {
        'api-key': apiKey,
        ...(sessionId && {
            'Mcp-Session-Id': sessionId,
            'Mcp-Protocol-Version': PROTOCOL_VERSION,
        }),
    };

    const initializeSession = async () => {
        try {
            const {sessionId, capabilities, serverInfo, full} = await apiInit(apiKey, fti, protocolVersion);
            if (!sessionId) throw new Error('No session ID returned');
            setSessionId(sessionId);
            setServerResponse(full); // save full response JSON
            toast.success('Session initialized');
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error?.message || 'Failed to initialize session');
        }
    };


    const sendInitialized = async () => {
        try {
            await sendInitializedNotification(apiKey, sessionId, PROTOCOL_VERSION);
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
        protocolVersion,
        setProtocolVersion,
        sessionId,
        initialized,
        initializeSession,
        sendInitialized,
        headers,
        serverResponse,
    };
};
