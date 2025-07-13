import {useState} from "react";
import {
    uploadRaw,
    downloadEncrypted,
    decryptOnServer,
} from "../services/secureFileService";
import {useMcpContext} from "../context/McpContext";

export const useSecureFile = () => {
    const {apiKey, sessionId} = useMcpContext();      // sessionId comes from /initialize

    const [uploadRes, setUploadRes] = useState(null);
    const [downloadRes, setDownloadRes] = useState(null);
    const [decryptRes, setDecryptRes] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const reset = () => {
        setUploadRes(null);
        setDownloadRes(null);
        setDecryptRes(null);
        setError(null);
    };

    /* ---------------- actions ---------------- */

    const upload = async file => {
        reset();
        setLoading(true);
        try {
            setUploadRes(await uploadRaw(file, apiKey, sessionId));
        } catch (e) {
            setError(e.message || "Upload failed");
        } finally {
            setLoading(false);
        }
    };

    const download = async fileId => {
        setLoading(true);
        setError(null);
        setDecryptRes(null);
        try {
            setDownloadRes(await downloadEncrypted(fileId, apiKey, sessionId));
        } catch (e) {
            setError(e.message || "Download failed");
        } finally {
            setLoading(false);
        }
    };

    const decrypt = async (keyId, body) => {
        setLoading(true);
        setError(null);
        try {
            setDecryptRes(await decryptOnServer(keyId, body, apiKey, sessionId));
        } catch (e) {
            setError(e.message || "Decrypt failed");
        } finally {
            setLoading(false);
        }
    };

    return {
        uploadRes,
        downloadRes,
        decryptRes,
        loading,
        error,
        upload,
        download,
        decrypt,
    };
};
