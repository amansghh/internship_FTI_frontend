// services/secureFileService.js
import axios from "axios";
import {v4 as uuidv4} from "uuid";

// MCP entry-point (FastAPI listens here)
const MCP_ENDPOINT = "http://localhost:8000/mcp";

/**
 * Low-level helper to invoke the secure_transfer tool.
 *
 * @param {string} action   upload | download | decrypt
 * @param {object} args     tool arguments (will be merged with { action })
 * @param {string} apiKey   user's API key
 * @param {string} sessionId  Mcp-Session-Id returned by /initialize
 * @returns {object}        tool result (already unwrapped from JSON-RPC)
 */
const callSecureTransfer = async (action, args, apiKey, sessionId) => {
    const PROTOCOL = window.__MCP_PROTOCOL_VERSION__ ?? "2025-06-18";

    const payload = {
        jsonrpc: "2.0",
        id: uuidv4(),                 // any unique value
        method: "tools/call",
        params: {
            name: "secure_transfer",
            arguments: {action, ...args},
        },
    };

    const res = await axios.post(MCP_ENDPOINT, payload, {
        headers: {
            "api-key": apiKey,
            "Mcp-Session-Id": sessionId,
            "Mcp-Protocol-Version": PROTOCOL,
            Accept: "application/json",
        },
    });

    // FastAPI always wraps the result under .result
    if (res.data?.error) throw new Error(res.data.error.message);
    return res.data.result;
};

/* ──────────────────────────────── public helpers ─────────────────────────── */

/* 1. upload – send raw file, receive ciphertext bundle */
export const uploadRaw = async (file, apiKey, sessionId) => {
    const dataB64 = await file.arrayBuffer().then(buf =>
        btoa(String.fromCharCode(...new Uint8Array(buf)))
    );

    return await callSecureTransfer(
        "upload",
        {filename: file.name, data_b64: dataB64},
        apiKey,
        sessionId,
    );             // { file_id, nonce_b64, enc_sym_key_b64, … }
};

/* 2. download – fetch encrypted blob + wrapped key */
export const downloadEncrypted = async (fileId, apiKey, sessionId) => {
    return await callSecureTransfer(
        "download",
        {file_id: fileId},
        apiKey,
        sessionId,
    );             // { ciphertext_b64, enc_sym_key_b64, … }
};

/* 3. decrypt – plaintext + convenience save-path */
export const decryptOnServer = async (keyId, body, apiKey, sessionId) => {
    return await callSecureTransfer(
        "decrypt",
        {key_id: keyId, ...body},
        apiKey,
        sessionId,
    );             // { data_b64, sha256_b64, saved_path }
};
