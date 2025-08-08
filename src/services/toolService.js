import axios from 'axios';

const MCP_URL = import.meta.env.VITE_BACKEND_URL + '/mcp';

export const listTools = async (apiKey, sessionId, protocolVersion) => {
    console.log('🔍 Sending listTools request to:', MCP_URL);
    console.log('🔑 Headers:', {apiKey, sessionId, protocolVersion});

    try {
        const res = await axios.post(
            MCP_URL,
            {
                jsonrpc: '2.0',
                id: 2,
                method: 'tools/list',
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
        return res.data.result?.tools || [];
    } catch (err) {
        console.error('🚨 listTools error:', err);
        throw err;
    }
};


export const callTool = async (
    name,
    args,
    apiKey,
    sessionId,
    protocolVersion
) => {
    const res = await axios.post(
        MCP_URL,
        {
            jsonrpc: '2.0',
            id: Date.now(),               // quick unique ID
            method: 'tools/call',
            params: {name, arguments: args},
        },
        {
            headers: {
                'api-key': apiKey,
                'Mcp-Session-Id': sessionId,
                'Mcp-Protocol-Version': protocolVersion,
            },
        }
    );
    return res.data.result;          // may contain {binary, uri, ...}
};

