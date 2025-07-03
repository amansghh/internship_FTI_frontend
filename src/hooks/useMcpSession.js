import {useMcpContext} from '../context/McpContext.jsx';
import {initializeSession as apiInit, sendInitializedNotification as apiNotify} from '../services/mcpService';
import {toast} from 'react-toastify';

export const useMcpSession = () => {
    const {
        apiKey, setApiKey,
        fti, setFti,
        protocolVersion, setProtocolVersion,
        sessionId, setSessionId,
        initialized, setInitialized,
        serverResponse, setServerResponse,
        resetSession
    } = useMcpContext();

    const initializeSession = async () => {
        try {
            const {sessionId, capabilities, serverInfo, full} = await apiInit(apiKey, fti, protocolVersion);
            if (!sessionId) throw new Error('No session ID returned');
            setSessionId(sessionId);
            setServerResponse(full);
            toast.success('Session initialized');
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error?.message || 'Failed to initialize session');
        }
    };

    const sendInitialized = async () => {
        try {
            await apiNotify(apiKey, sessionId);
            setInitialized(true);
            toast.success('Session confirmed');
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error?.message || 'Failed to confirm session');
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
        serverResponse,
        resetSession
    };
};
