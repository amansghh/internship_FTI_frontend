import axios from 'axios';

const API = 'http://localhost:8000';

/* ---------- 1. Upload (client-side encrypted on server) ---------- */
export const uploadRaw = async (file, apiKey) => {
    const url = `${API}/secure-file/upload-raw?filename=${encodeURIComponent(file.name)}`;
    const res = await axios.post(url, file, {
        headers: {'api-key': apiKey, 'Content-Type': file.type || 'application/octet-stream'},
    });
    return res.data;  // { file_id, enc_sym_key_b64, nonce_b64, sha256_b64, filename }
};

/* ---------- 2. Download encrypted blob ---------- */
export const downloadEncrypted = async (fileId, apiKey) => {
    const url = `${API}/secure-file/download/${fileId}`;
    const res = await axios.get(url, {
        headers: {'api-key': apiKey, Accept: 'application/json'},
    });
    return res.data;  // JSON bundle shown in backend
};

/* ---------- 3. Decrypt on server ---------- */
export const decryptOnServer = async (keyId, body, apiKey) => {
    // request JSON response with data_b64
    const url = `${API}/secure-file/decrypt/${keyId}?json_mode=true`;
    const res = await axios.post(url, body, {
        headers: {'api-key': apiKey, 'Content-Type': 'application/json'},
    });
    return res.data;  // { data_b64, filename, sha256_b64, ... }
};
