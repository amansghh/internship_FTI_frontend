import axios from 'axios';

const MCP_URL = import.meta.env.VITE_BACKEND_URL + '/mcp';

export const listResources = async (apiKey, sessionId, protocolVersion) => {
    const res = await axios.post(
        MCP_URL,
        {
            jsonrpc: '2.0',
            id: 1,
            method: 'resources/list',
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
    return res.data.result?.resources || [];
};

export const readResource = async (uri, apiKey, sessionId, protocolVersion) => {
    const res = await axios.post(
        MCP_URL,
        {
            jsonrpc: '2.0',
            id: 2,
            method: 'resources/read',
            params: {uri},
        },
        {
            headers: {
                'api-key': apiKey,
                'Mcp-Session-Id': sessionId,
                'Mcp-Protocol-Version': protocolVersion,
            },
        }
    );

    if (res.data.error) {
        throw new Error(res.data.error.message);
    }

    const result = res.data.result;

    if (Array.isArray(result.contents) && result.contents.length > 0) {
        return {
            text: result.contents[0].text || '',
            mimeType: result.contents[0].mimeType || '',
            metadata: result.metadata || '',
        };
    }

    return {
        text: '',
        mimeType: '',
        metadata: '',
    };
};

