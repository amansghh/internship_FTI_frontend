import React, {useState, useEffect, useMemo} from "react";
import {Copy, UploadCloud, Download, Info, X} from "lucide-react";

import "../../assets/css/TransferDemo.css";
import useSecureTransfer from "../../hooks/useSecureTransfer";
import {ToastProvider, useToast} from "../ui/Toast.jsx";

export default function TransferDemoPage() {
    return (
        <ToastProvider>
            <TransferDemoContent/>
        </ToastProvider>
    );
}

const ROLE = import.meta.env.VITE_ROLE || "sender";   // "sender" (provider) | "receiver" (consumer)

/* ─────────────────────────────── UI helpers ─────────────────────────────── */
function CopyButton({text}) {
    const toast = useToast();
    const copy = async () => {
        await navigator.clipboard.writeText(text);
        toast.success("Copied!");
    };
    return (
        <button className="td-btn ghost icon" onClick={copy} aria-label="Copy">
            <Copy size={14}/>
        </button>
    );
}

/* centre-screen modal */
function Modal({open, onClose, children}) {
    if (!open) return null;
    return (
        <div className="td-modal-backdrop" onClick={onClose}>
            <div className="td-modal" onClick={e => e.stopPropagation()}>
                <button className="td-btn ghost icon modal-close" onClick={onClose} aria-label="Close">
                    <X size={16}/>
                </button>
                {children}
            </div>
        </div>
    );
}

/* pretty-print last JSON-RPC response */
function JsonPreview({data}) {
    const [expanded, setExpanded] = useState({});
    const toggle = k => setExpanded(p => ({...p, [k]: !p[k]}));

    return (
        <div className="json-preview">
            {Object.entries(data).map(([k, v]) => {
                const long = typeof v === "string" && k.endsWith("_b64") && v.length > 120;
                return (
                    <div className="jp-row" key={k}>
                        <span className="jp-key">"{k}": </span>
                        {long ? (
                            <>
                <span className="jp-val">
                  "
                    {expanded[k] ? v : `${v.slice(0, 70)}… (${v.length} chars)`}
                    "
                </span>
                                <button className="jp-toggle" onClick={() => toggle(k)}>
                                    {expanded[k] ? "hide" : "show"}
                                </button>
                            </>
                        ) : (
                            <span className="jp-val">
                {typeof v === "string" ? `"${v}"` : JSON.stringify(v)}
              </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/* ─────────────────────────────── Main component ─────────────────────────────── */
function TransferDemoContent() {
    const {status, upload, listAvailable, pull, decrypt} = useSecureTransfer();

    /* Provider state */
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileDesc, setFileDesc] = useState("");

    /* Shared state */
    const [fileId, setFileId] = useState("");
    const [lastResp, setLastResp] = useState(null);

    /* Consumer state */
    const [fileList, setFileList] = useState([]);
    const [modalInfo, setModalInfo] = useState(null);      // shows on ℹ️ click

    const toast = useToast();

    /* consumer loads provider catalogue on mount */
    useEffect(() => {
        if (ROLE === "receiver") {
            listAvailable()
                .then(setFileList)
                .catch(err => toast.error(err.message || "Failed to load files"));
        }
    }, [listAvailable]);

    /* ——— Provider handlers ——— */
    const handleFilePick = e => setSelectedFile(e.target.files[0] || null);

    const handleUpload = async () => {
        if (!selectedFile) return;
        try {
            const res = await upload(selectedFile, fileDesc.trim());
            setFileId(res.file_id);
            setLastResp(res);
            setSelectedFile(null);
            setFileDesc("");
            toast.success(`Uploaded: ${res.filename || selectedFile.name}`);
        } catch (err) {
            toast.error(err.message || "Upload failed");
        }
    };

    /* ——— Consumer handlers ——— */
    const handlePull = async id => {
        try {
            const enc = await pull(id);     // sets "Downloading…" status
            const plain = await decrypt(enc); // sets "Decrypting…" status
            setLastResp(plain);

            /* auto-download decrypted bytes */
            const base64 = plain.data_b64 || plain.data;
            if (!base64) throw new Error("Decrypted payload missing data_b64");
            const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
            const url = URL.createObjectURL(new Blob([bytes]));
            const a = Object.assign(document.createElement("a"), {
                href: url,
                download: plain.saved_path.split("/").pop()
            });
            a.click();
            URL.revokeObjectURL(url);

            toast.success("Decrypted & downloaded!");
        } catch (err) {
            toast.error(err.message || "Pull failed");
        }
    };

    /* role-based palette */
    const palette = useMemo(
        () => ROLE === "sender"
            ? {brand: "#2563eb", light: "#eff6ff", dark: "#1e40af"}
            : {brand: "#ea580c", light: "#fff7ed", dark: "#c2410c"},
        []
    );

    return (
        <div
            className="td-container"
            style={{"--brand": palette.brand, "--light": palette.light, "--dark": palette.dark}}
        >
            <header className="td-header">
                {ROLE === "sender" ? "🚀 Provider Portal" : "📥 Consumer Portal"}
            </header>

            {/* ───────────────────── Provider UI ───────────────────── */}
            {ROLE === "sender" && (
                <section className="td-card">
                    <h3><UploadCloud size={18}/> Upload (Provider)</h3>

                    {/* file picker */}
                    <label className="file-label">
                        <input type="file" onChange={handleFilePick}/>
                        {selectedFile ? selectedFile.name : "Choose file…"}
                    </label>

                    {/* description textbox */}
                    <input
                        type="text"
                        className="td-input"
                        placeholder="Description shown to consumers"
                        value={fileDesc}
                        onChange={e => setFileDesc(e.target.value)}
                    />

                    {/* upload button */}
                    <button
                        className="td-btn primary"
                        onClick={handleUpload}
                        disabled={!selectedFile}
                    >
                        Upload
                    </button>

                    {fileId && (
                        <p className="td-note">Last file_id: <code>{fileId}</code></p>
                    )}
                </section>
            )}

            {/* ───────────────────── Consumer UI ───────────────────── */}
            {ROLE === "receiver" && (
                <section className="td-card">
                    <h3><Download size={18}/> Available Files</h3>

                    {fileList.length ? (
                        <ul className="td-list">
                            {fileList.map(f => (
                                <li key={f.file_id}>
                                    <span className="td-file">{f.filename}</span>

                                    {/* open modal with details */}
                                    <button
                                        className="td-btn ghost icon"
                                        aria-label="Details"
                                        onClick={() => setModalInfo(f)}
                                    >
                                        <Info size={14}/>
                                    </button>

                                    <button className="td-btn primary" onClick={() => handlePull(f.file_id)}>
                                        Download
                                    </button>

                                    <CopyButton text={f.file_id}/>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="td-note">No files found on provider</p>
                    )}
                </section>
            )}

            {/* status & last response */}
            {status && <p className="td-status">{status}</p>}
            {lastResp && <JsonPreview data={lastResp}/>}

            {/* description modal */}
            <Modal open={!!modalInfo} onClose={() => setModalInfo(null)}>
                {modalInfo && (
                    <>
                        <h4 className="modal-title">{modalInfo.filename}</h4>
                        {modalInfo.description && <p>{modalInfo.description}</p>}
                        <pre className="modal-pre">file_id: {modalInfo.file_id}</pre>
                        {modalInfo.created_at && (
                            <pre className="modal-pre">
                created: {new Date(modalInfo.created_at).toLocaleString()}
              </pre>
                        )}
                    </>
                )}
            </Modal>
        </div>
    );
}
