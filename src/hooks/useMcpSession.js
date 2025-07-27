import {useMcpContext} from '../context/McpContext.jsx';
import {
    initializeSession as apiInit,
    sendInitializedNotification as apiNotify,
    deleteSession as apiDeleteSession,
} from '../services/mcpService';
import {toast} from 'react-toastify';
import {useEffect} from "react";

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

    // Log once when this hook is first used
    useEffect(() => {
        console.log(
            `⚙️ [useSecureTransfer] MODE=${import.meta.env.MODE}  BACKEND=${import.meta.env.VITE_BACKEND_URL}`
        );
    }, []);

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

    // Fully tear-down an MCP session:
    // 1. Ask the server to delete it.
    // Flush React-state via context’s resetSession().
    const deleteAndResetSession = async () => {
        try {
            if (sessionId) {
                await apiDeleteSession(apiKey, sessionId);
            }
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.detail || 'Failed to delete session');
            // fall through – even if server delete fails we still clear UI state
        } finally {
            resetSession();               // context helper you already expose
            toast.info('Session reset');
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
        resetSession: deleteAndResetSession,
    };
};
