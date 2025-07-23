import React, {createContext, useContext, useState, useEffect} from 'react';

const McpContext = createContext(null);

export const McpProvider = ({children}) => {
    const [apiKey, setApiKey] = useState('');
    const [fti, setFti] = useState(false);
    const [protocolVersion, setProtocolVersion] = useState('2025-06-18');
    const [sessionId, setSessionId] = useState(null);
    const [initialized, setInitialized] = useState(false);
    const [serverResponse, setServerResponse] = useState(null);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        // Log the env mode and backend URL once on startup
        console.log(
            `⚙️ MODE=${import.meta.env.MODE}  VITE_ROLE=${import.meta.env.VITE_ROLE}  BACKEND=${import.meta.env.VITE_BACKEND_URL}`
        );
    })

    const resetSession = () => {
        setApiKey('');
        setFti(false);
        setProtocolVersion('2025-06-18');
        setSessionId(null);
        setInitialized(false);
        setServerResponse(null);
        sessionStorage.removeItem('mcp-session');
    };



    // Hydrate from sessionStorage once on mount
    useEffect(() => {
        const saved = sessionStorage.getItem('mcp-session');
        if (saved) {
            try {
                const p = JSON.parse(saved);
                setApiKey(p.apiKey);
                setFti(p.fti);
                setProtocolVersion(p.protocolVersion);
                setSessionId(p.sessionId);
                setInitialized(p.initialized);
                setServerResponse(p.serverResponse);
            } catch (e) {
                console.error('Failed to parse sessionStorage:', e);
            }
        }
        setHydrated(true);
    }, []);

    // Save every time any piece changes *after* hydration
    useEffect(() => {
        if (!hydrated) return;
        const data = {apiKey, fti, protocolVersion, sessionId, initialized, serverResponse};
        sessionStorage.setItem('mcp-session', JSON.stringify(data));
    }, [apiKey, fti, protocolVersion, sessionId, initialized, serverResponse, hydrated]);

    return (
        <McpContext.Provider value={{
            apiKey, setApiKey,
            fti, setFti,
            protocolVersion, setProtocolVersion,
            sessionId, setSessionId,
            initialized, setInitialized,
            serverResponse, setServerResponse,
            resetSession,
        }}>
            {children}
        </McpContext.Provider>
    );
};

export const useMcpContext = () => useContext(McpContext);
