import axios from 'axios';

const MCP_URL = import.meta.env.VITE_BACKEND_URL + '/mcp';
export const listPrompts = async (apiKey, sessionId, protocolVersion) => {
    const res = await axios.post(
        MCP_URL,
        {
            jsonrpc: '2.0',
            id: 3,
            method: 'prompts/list',
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
    return res.data.result?.prompts || [];
};
