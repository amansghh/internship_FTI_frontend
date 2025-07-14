import {mcpRpc} from './mcpService.js';

export async function subscribeResource(uri, apiKey, sessionId, protocolVersion) {
    const credentials = {apiKey, sessionId, protocolVersion};
    const payload = {
        jsonrpc: "2.0",
        id: Date.now(),  // optional, can use a unique ID if needed
        method: 'resources/subscribe',
        params: {uri},
    };
    return mcpRpc(credentials, payload);
}

export async function unsubscribeResource(uri, apiKey, sessionId, protocolVersion) {
    const credentials = {apiKey, sessionId, protocolVersion};
    const payload = {
        jsonrpc: "2.0",
        id: Date.now(),
        method: 'resources/unsubscribe',
        params: {uri},
    };
    return mcpRpc(credentials, payload);
}
