import axios from 'axios';

const MCP_URL = 'http://localhost:8000/mcp';

export const listTools = async (apiKey, sessionId, protocolVersion) => {
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

