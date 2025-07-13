import React, {useRef, useState, useLayoutEffect} from "react";
import "../../assets/css/SecureFile.css";
import {useSecureFile} from "../../hooks/useSecureFile.js";
import { Upload, Download, ShieldCheck } from 'lucide-react';

const b64ToUrl = (b64, mime) => {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    return URL.createObjectURL(new Blob([bytes], {type: mime}));
};

const MIN_W = 400;

export default function SecureFilePage() {
    const {
        uploadRes,
        downloadRes,
        decryptRes,
        error,
        upload,
        download,
        decrypt,
    } = useSecureFile();

    const [fileId, setFileId] = useState("");
    const [keyId, setKeyId] = useState(1);
    const [busyCard, setBusyCard] = useState(null);
    const [expandedFields, setExpandedFields] = useState({});

    const fileInputRef = useRef(null);
    const mirrorRef = useRef(null);
    const downloadBtnRef = useRef(null);

    const start = (card) => (setBusyCard(card), true);
    const stop = () => setBusyCard(null);

    const handleFileIdChange = (e) => setFileId(e.target.value);

    useLayoutEffect(() => {
        const input = fileInputRef.current;
        const mirror = mirrorRef.current;
        const btn = downloadBtnRef.current;
        if (!input || !mirror || !btn) return;

        mirror.textContent = fileId || input.placeholder || "";

        const card = input.closest(".sfp-card");
        const cardW = card ? card.clientWidth : 800;
        const gap = 8; // matches .5rem gap
        const btnW = btn.offsetWidth;
        const maxAllowed = cardW - btnW - gap * 2;

        const style = getComputedStyle(input);
        const extra =
            parseFloat(style.paddingLeft) +
            parseFloat(style.paddingRight) +
            parseFloat(style.borderLeftWidth) +
            parseFloat(style.borderRightWidth);

        const desired = mirror.offsetWidth + extra + 2;
        const finalW = Math.min(Math.max(MIN_W, desired), maxAllowed);
        input.style.width = finalW + "px";
    }, [fileId]);

    const toggleField = (path) =>
        setExpandedFields((prev) => ({...prev, [path]: !prev[path]}));

    const renderJSON = (data, prefix = "") =>
        Object.entries(data).map(([k, v]) => {
            const path = prefix + k;
            if (typeof v === "string" && k.endsWith("_b64") && v.length > 120) {
                const exp = expandedFields[path];
                return (
                    <div key={path} className="json-line">
                        <span className="json-key">"{k}":</span>{" "}
                        <span className="json-value">
              "{exp ? v : `${v.slice(0, 80)}… (${v.length} chars)`}"
            </span>{" "}
                        <button className="toggle-btn" onClick={() => toggleField(path)}>
                            {exp ? "Hide" : "Show full"}
                        </button>
                    </div>
                );
            }
            return (
                <div key={path} className="json-line">
                    <span className="json-key">"{k}":</span>{" "}
                    <span className="json-value">
            {typeof v === "string" ? `"${v}"` : JSON.stringify(v)}
          </span>
                </div>
            );
        });

    return (
        <div className="secure-file-container">
            <h2 className="sfp-title">Secure File Transfer</h2>

            {/* Upload */}
            <section className={`sfp-card ${busyCard === "upload" ? "busy" : ""}`}>
                <h3><Upload size={18} style={{ marginRight: '0.5rem' }} /> Upload & Encrypt</h3>
                <label className="file-label">
                    📄 Choose file
                    <input
                        className="file-input"
                        type="file"
                        onChange={(e) => {
                            const f = e.target.files[0];
                            if (f) {
                                start("upload");
                                upload(f).finally(stop);
                            }
                        }}
                    />
                </label>
                {uploadRes && (
                    <div className="json-preview centered">{renderJSON(uploadRes)}</div>
                )}
            </section>

            {/* Download */}
            <section className={`sfp-card ${busyCard === "download" ? "busy" : ""}`}>
                <h3><Download size={18} style={{ marginRight: '0.5rem' }} /> Download Encrypted</h3>

                <span className="input-mirror" ref={mirrorRef}/>

                <div className="download-row">
                    <input
                        ref={fileInputRef}
                        type="text"
                        className="sfp-input"
                        placeholder="file_id"
                        value={fileId}
                        onChange={handleFileIdChange}
                    />
                    <button
                        ref={downloadBtnRef}
                        className="sfp-btn"
                        disabled={!!busyCard}
                        onClick={() =>
                            start("download") && download(fileId).finally(stop)
                        }
                    >
                        {busyCard === "download" ? (
                            <span className="spinner"/>
                        ) : (
                            "Download"
                        )}
                    </button>
                </div>

                {downloadRes && (
                    <div className="json-preview centered">{renderJSON(downloadRes)}</div>
                )}
            </section>

            {/* Decrypt */}
            {downloadRes && (
                <section className={`sfp-card ${busyCard === "decrypt" ? "busy" : ""}`}>
                    <h3><ShieldCheck size={18} style={{ marginRight: '0.5rem' }} /> Decrypt on Server</h3>
                    <div className="sfp-keyrow">
                        <label htmlFor="rsa-key-input">RSA key</label>
                        <input
                            id="rsa-key-input"
                            type="number"
                            className="sfp-input"
                            value={keyId}
                            onChange={(e) => setKeyId(e.target.value)}
                        />
                        <button
                            className="sfp-btn"
                            disabled={!!busyCard}
                            onClick={() =>
                                start("decrypt") &&
                                decrypt(keyId, {...downloadRes, filename: downloadRes.filename}).finally(
                                    stop
                                )
                            }
                        >
                            {busyCard === "decrypt" ? <span className="spinner"/> : "Decrypt"}
                        </button>
                    </div>
                    {decryptRes && (
                        <>
                            <div className="json-preview centered">{renderJSON(decryptRes)}</div>
                            <button
                                className="sfp-btn save-decrypt"
                                onClick={() => {
                                    const url = b64ToUrl(decryptRes.data_b64, "application/pdf");
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = downloadRes.filename || "file";
                                    a.click();
                                    URL.revokeObjectURL(url);
                                }}
                            >
                                💾 Save Decrypted
                            </button>
                        </>
                    )}
                </section>
            )}

            {error && <p className="error-msg">❌ {error}</p>}
        </div>
    );
}
