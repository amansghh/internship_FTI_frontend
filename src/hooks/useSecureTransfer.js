import {useState, useCallback} from "react";
import {useMcpContext} from "../context/McpContext";
import {
    uploadFileOnly,
    listFilesFromProvider,
    downloadFile,
    decryptFile,
} from "../services/transferService";

const PROTO = "2025-06-18"; // single source of truth

export default function useSecureTransfer() {
    const {
        apiKey, sessionId, setSessionId,
        initialized, setInitialized,
        protocolVersion, setProtocolVersion
    } = useMcpContext();

    const [status, setStatus] = useState("");

    const ensureSession = useCallback(async () => {
        // Don't attempt without an API key
        if (!apiKey) {
            throw new Error("API key not ready");
        }
        // Reuse existing session
        if (sessionId) return sessionId;

        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/mcp`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": apiKey,
                "Mcp-Protocol-Version": PROTO
            },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: 0,
                method: "initialize",
                params: {fti_mode: true}
            })
        }).then(r => r.json());

        if (res.error) throw new Error(res.error.message);

        // Persist session + protocol; also expose a global for services that can't read context
        setSessionId(res.result.session_id);
        setInitialized(true);
        setProtocolVersion(PROTO);
        window.__MCP_PROTOCOL_VERSION__ = PROTO;

        return res.result.session_id;
    }, [apiKey, sessionId, setInitialized, setProtocolVersion, setSessionId]);

    const buildCtx = useCallback(async () => ({
        apiKey,
        sessionId: await ensureSession()
    }), [apiKey, ensureSession]);

    /* provider upload */
    const upload = useCallback(async (file, description = "") => {
        setStatus("Encrypting & uploading…");
        const res = await uploadFileOnly(file, description, await buildCtx());
        setStatus(`Uploaded file_id ${res.file_id}`);
        return res;
    }, [buildCtx]);

    /* consumer catalogue */
    const listAvailable = useCallback(async () => {
        setStatus("Querying remote files…");
        const list = await listFilesFromProvider(await buildCtx());
        setStatus(`Found ${list.length} file(s)`);
        return list;
    }, [buildCtx]);

    /* consumer download */
    const pull = useCallback(async id => {
        setStatus("Downloading encrypted file…");
        return downloadFile(id, await buildCtx());
    }, [buildCtx]);

    /* decrypt */
    const decrypt = useCallback(async enc => {
        setStatus("Decrypting…");
        return decryptFile(enc, await buildCtx());
    }, [buildCtx]);

    return {status, upload, listAvailable, pull, decrypt, initialized, protocolVersion};
}
