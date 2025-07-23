// src/services/transferService.js
const BASE = import.meta.env.VITE_BACKEND_URL;
const PROTO = "2025-03-26";

/* shared JSON-RPC wrapper */
const callMcp = async (payload, {apiKey, sessionId}) => {
    const res = await fetch(`${BASE}/mcp`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "api-key": apiKey,
            "Mcp-Session-Id": sessionId,
            "Mcp-Protocol-Version": PROTO
        },
        body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error.message);
    return json.result;
};

/* 1. 📤 Upload (provider) */
export const uploadFileOnly = async (file, description, ctx) => {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const dataB64 = btoa(String.fromCharCode(...bytes));

    return callMcp({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
            name: "secure_transfer",
            arguments: {
                action: "upload",
                filename: file.name,
                data_b64: dataB64,
                description
            }
        }
    }, ctx);
};

/* 2. 📄 List (consumer) */
export const listFilesFromProvider = async ctx => {
    const res = await fetch(`${BASE}/remote-files`, {
        method: "POST",
        headers: {"Content-Type": "application/json", "api-key": ctx.apiKey},
        body: JSON.stringify({
            remote_host: "backend-provider",
            remote_port: 8000,
            remote_api_key: "bc2lepTJrzlJ2m7r2oOPgrDkd28WBxY1MgWmfLSNCxs"
        })
    });
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()).files;
};

/* 3. 📥 Download (consumer) */
export const downloadFile = (fileId, ctx) => callMcp({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
        name: "secure_transfer",
        arguments: {
            action: "download",
            file_id: fileId,
            remote_host: "backend-provider",
            remote_port: 8000,
            remote_api_key: "bc2lepTJrzlJ2m7r2oOPgrDkd28WBxY1MgWmfLSNCxs"
        }
    }
}, ctx);

/* 4. 🔓 Decrypt (consumer) */
export const decryptFile = (enc, ctx) => callMcp({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
        name: "secure_transfer",
        arguments: {
            action: "decrypt",
            key_id: 2,           // adapt if keys are dynamic
            ...enc
        }
    }
}, ctx);
