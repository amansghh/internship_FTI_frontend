import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Copy, UploadCloud, Download, Info, X, Building2 } from "lucide-react";

import "../../assets/css/TransferDemo.css";
import useSecureTransfer from "../../hooks/useSecureTransfer";
import { ToastProvider, useToast } from "../ui/Toast.jsx";
import { useMcpContext } from "../../context/McpContext";

export default function TransferDemoPage() {
    return (
        <ToastProvider>
            <TransferDemoContent />
        </ToastProvider>
    );
}

const ROLE = import.meta.env.VITE_ROLE || "sender"; // "sender" | "receiver"

function CopyButton({ text }) {
    const toast = useToast();
    const copy = async () => {
        await navigator.clipboard.writeText(text);
        toast.success("Copied!");
    };
    return (
        <button className="td-btn ghost icon" onClick={copy} aria-label="Copy">
            <Copy size={14} />
        </button>
    );
}

function Modal({ open, onClose, children }) {
    if (!open) return null;
    return (
        <div className="td-modal-backdrop" onClick={onClose}>
            <div className="td-modal" onClick={(e) => e.stopPropagation()}>
                <button className="td-btn ghost icon modal-close" onClick={onClose} aria-label="Close">
                    <X size={16} />
                </button>
                {children}
            </div>
        </div>
    );
}

/** Gallery with one real provider (FTI) and one dummy. */
const PROVIDERS = [
    {
        id: "fti-we",
        name: "Flanders Technology & Innovation",
        logo: "/fti.svg",           // white logo in /public/fti.svg
        blurb: "West Europe",
        real: true
    },
    {
        id: "demo",
        name: "Demo Provider",
        logo: null,                 // no logo → show Building2 icon
        blurb: "Demo provider (no data).",
        real: false
    }
];

function TransferDemoContent() {
    const { status, upload, listAvailable, pull, decrypt } = useSecureTransfer();
    const { apiKey } = useMcpContext();
    const toast = useToast();

    /* Sender state */
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileDesc, setFileDesc] = useState("");

    /* Shared */
    const [fileId, setFileId] = useState("");
    const [lastResp, setLastResp] = useState(null);

    /* Receiver UI state */
    const [modalInfo, setModalInfo] = useState(null);
    const [activeProvider, setActiveProvider] = useState(null);
    const [providerFiles, setProviderFiles] = useState([]);
    const [loadingProvider, setLoadingProvider] = useState(false);
    const [uiStatus, setUiStatus] = useState(""); // <- replaces global status line for receiver

    // Sender handlers
    const handleFilePick = (e) => setSelectedFile(e.target.files[0] || null);

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

    // Receiver: no auto-fetch; explicit via button
    useEffect(() => {}, [listAvailable, apiKey]);

    // Provider gallery handlers
    const selectProvider = useCallback((p) => {
        setActiveProvider(p);
        setProviderFiles([]);
        setUiStatus(""); // clear the sticky count when switching providers
    }, []);

    const fetchFromProvider = useCallback(async () => {
        if (!activeProvider) return;

        if (!activeProvider.real) {
            setProviderFiles([]);
            setUiStatus("This provider doesn't have any data at the moment.");
            toast.info("This provider doesn't have any data at the moment.");
            return;
        }

        try {
            setLoadingProvider(true);
            const files = await listAvailable(); // no overrides; env-driven
            setProviderFiles(files);
            setUiStatus(`Found ${files.length} file(s)`);
            toast.success(
                `Fetched ${files.length} file${files.length === 1 ? "" : "s"} from ${activeProvider.name}`
            );
        } catch (err) {
            setUiStatus("Failed to fetch files.");
            toast.error(err.message || "Failed to fetch files");
        } finally {
            setLoadingProvider(false);
        }
    }, [activeProvider, listAvailable, toast]);

    const handlePullWithProvider = useCallback(
        async (id) => {
            try {
                const enc = await pull(id);      // env-driven
                const plain = await decrypt(enc);
                setLastResp(plain);

                const base64 = plain.data_b64 || plain.data;
                if (!base64) throw new Error("Decrypted payload missing data_b64");

                const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
                const url = URL.createObjectURL(new Blob([bytes]));
                const a = Object.assign(document.createElement("a"), {
                    href: url,
                    download: plain.saved_path?.split("/").pop() || "download.bin"
                });
                a.click();
                URL.revokeObjectURL(url);

                toast.success("Decrypted & downloaded!");
            } catch (err) {
                toast.error(err.message || "Pull failed");
            }
        },
        [pull, decrypt, toast]
    );

    const palette = useMemo(
        () =>
            ROLE === "sender"
                ? { brand: "#2563eb", light: "#eff6ff", dark: "#1e40af" }
                : { brand: "#5f259f", light: "#f6ecff", dark: "#3a1b6a" },
        []
    );

    return (
        <div
            className="td-container"
            style={{ "--brand": palette.brand, "--light": palette.light, "--dark": palette.dark }}
        >
            <header className="td-header">
                {ROLE === "sender" ? "🚀 Provider Portal" : "📥 Consumer Portal"}
            </header>

            {/* Sender (Provider) */}
            {ROLE === "sender" && (
                <section className="td-card">
                    <h3>
                        <UploadCloud size={18} /> Upload (Provider)
                    </h3>

                    <label className="file-label">
                        <input type="file" onChange={handleFilePick} />
                        {selectedFile ? selectedFile.name : "Choose file…"}
                    </label>

                    <input
                        type="text"
                        className="td-input"
                        placeholder="Description shown to consumers"
                        value={fileDesc}
                        onChange={(e) => setFileDesc(e.target.value)}
                    />

                    <button className="td-btn primary" onClick={handleUpload} disabled={!selectedFile}>
                        Upload
                    </button>

                    {fileId && (
                        <p className="td-note">
                            Last file_id: <code>{fileId}</code>
                        </p>
                    )}
                </section>
            )}

            {/* Receiver (Consumer) */}
            {ROLE === "receiver" && (
                <section className="td-card">
                    <h3>
                        <Download size={18} /> Providers
                    </h3>

                    {/* Two big, simple logo cards */}
                    <div className="prov-grid big simple">
                        {PROVIDERS.map((p) => (
                            <button
                                key={p.id}
                                className={`prov-card big simple ${activeProvider?.id === p.id ? "active" : ""}`}
                                onClick={() => selectProvider(p)}
                                title={p.name}
                            >
                                <div className="prov-card-top simple">
                                    {p.logo ? (
                                        <img src={p.logo} alt="" className="prov-logo-plain" />
                                    ) : (
                                        <Building2 className="prov-icon-plain" size={72} />
                                    )}
                                </div>
                                <div className="prov-card-title">{p.short}</div>
                            </button>
                        ))}
                    </div>

                    {/* Expanded panel */}
                    {activeProvider && (
                        <div className="prov-expand">
                            <div className="prov-expand-head">
                                <div className="prov-expand-left">
                                    {/* Use a small dark chip only in the expanded view to keep white logo readable */}
                                    {activeProvider.logo ? (
                                        <div className="prov-logo-chip">
                                            <img src={activeProvider.logo} alt="" className="prov-logo-in-chip" />
                                        </div>
                                    ) : (
                                        <div className="prov-logo-chip">
                                            <Building2 size={22} color="#fff" />
                                        </div>
                                    )}
                                    <div>
                                        <div className="prov-expand-title">{activeProvider.name}</div>
                                    </div>
                                </div>
                                <button className="td-btn ghost" onClick={() => setActiveProvider(null)}>
                                    Change
                                </button>
                            </div>

                            {activeProvider.blurb && <p className="prov-blurb">{activeProvider.blurb}</p>}

                            <div className="prov-actions">
                                <button className="td-btn primary" onClick={fetchFromProvider} disabled={loadingProvider}>
                                    {loadingProvider ? "Fetching…" : "Fetch files"}
                                </button>
                            </div>

                            {providerFiles.length > 0 ? (
                                <ul className="td-list prov-files">
                                    {providerFiles.map((f) => (
                                        <li key={f.file_id}>
                                            <span className="td-file">{f.filename}</span>

                                            <button
                                                className="td-btn ghost icon"
                                                aria-label="Details"
                                                onClick={() => setModalInfo(f)}
                                            >
                                                <Info size={14} />
                                            </button>

                                            <button className="td-btn primary" onClick={() => handlePullWithProvider(f.file_id)}>
                                                Download
                                            </button>

                                            <CopyButton text={f.file_id} />
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="td-note">No files fetched yet. Click “Fetch files”.</p>
                            )}
                        </div>
                    )}
                </section>
            )}

            {/* Status line:
          - sender: show hook's status
          - receiver: show local uiStatus only */}
            {ROLE === "sender" ? (
                status && <p className="td-status">{status}</p>
            ) : (
                uiStatus && <p className="td-status">{uiStatus}</p>
            )}

            {lastResp && <JsonPreview data={lastResp} />}

            <Modal open={!!modalInfo} onClose={() => setModalInfo(null)}>
                {modalInfo && (
                    <>
                        <h4 className="modal-title">{modalInfo.filename}</h4>
                        {modalInfo.description && <p>{modalInfo.description}</p>}
                        <pre className="modal-pre">file_id: {modalInfo.file_id}</pre>
                        {modalInfo.created_at && (
                            <pre className="modal-pre">created: {new Date(modalInfo.created_at).toLocaleString()}</pre>
                        )}
                    </>
                )}
            </Modal>
        </div>
    );
}

function JsonPreview({ data }) {
    const [expanded, setExpanded] = useState({});
    const toggle = (k) => setExpanded((p) => ({ ...p, [k]: !p[k] }));

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
                  "{expanded[k] ? v : `${v.slice(0, 70)}… (${v.length} chars)`}"
                </span>
                                <button className="jp-toggle" onClick={() => toggle(k)}>
                                    {expanded[k] ? "hide" : "show"}
                                </button>
                            </>
                        ) : (
                            <span className="jp-val">{typeof v === "string" ? `"${v}"` : JSON.stringify(v)}</span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
