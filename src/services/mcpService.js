import axios from 'axios';

const MCP_URL = 'http://localhost:8000/mcp';

export const initializeSession = async (apiKey, fti, protocolVersion = '2025-06-18') => {
    const res = await axios.post(
        'http://localhost:8000/mcp',
        {
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: {protocolVersion, fti},
        },
        {
            headers: {'api-key': apiKey},
        }
    );

    const headers = Object.fromEntries(
        Object.entries(res.headers).map(([k, v]) => [k.toLowerCase(), v])
    );
    const sessionId = headers['mcp-session-id'];

    const result = res.data.result || {};
    return {
        sessionId,
        capabilities: result.capabilities || {},
        serverInfo: result.serverInfo || {},
        full: res.data, // full JSON-RPC response
    };
};

// Generic helper for MCP JSON-RPC calls
export async function mcpRpc({apiKey, sessionId, protocolVersion}, payload) {
    const res = await fetch('http://localhost:8000/mcp/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-key': apiKey,
            'Mcp-Session-Id': sessionId,
            'Mcp-Protocol-Version': protocolVersion,
        },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`RPC ${payload.method} failed ${res.status}`);
    return res.json();
}


export const sendInitializedNotification = async (apiKey, sessionId, protocolVersion = '2025-06-18') => {
    return await axios.post(
        MCP_URL,
        {
            jsonrpc: '2.0',
            method: 'notifications/initialized',
            params: {},
        },
        {
            headers: {
                'api-key': apiKey,
                'Mcp-Session-Id': sessionId,
                'Mcp-Protocol-Version': protocolVersion,
            },
        }
    );
};
