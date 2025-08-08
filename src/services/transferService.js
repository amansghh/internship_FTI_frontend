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

const PROVIDER_HOST = import.meta.env.VITE_PROVIDER_HOST;
const PROVIDER_PORT = Number(import.meta.env.VITE_PROVIDER_PORT || "80");
const PROVIDER_API_KEY = import.meta.env.VITE_PROVIDER_API_KEY;

/* 2. 📄 List (consumer) */
export const listFilesFromProvider = async ctx => {
    const res = await fetch(`${BASE}/remote-files`, {
        method: "POST",
        headers: {"Content-Type": "application/json", "api-key": ctx.apiKey},
        body: JSON.stringify({
            remote_host: PROVIDER_HOST,
            remote_port: PROVIDER_PORT,
            remote_api_key: PROVIDER_API_KEY
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
            remote_host: PROVIDER_HOST,
            remote_port: PROVIDER_PORT,
            remote_api_key: PROVIDER_API_KEY
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
            key_id: 1,           // adapt if keys are dynamic
            ...enc
        }
    }
}, ctx);
