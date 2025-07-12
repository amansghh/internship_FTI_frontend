import React, { useState } from 'react';
import '../../assets/css/SecureFile.css';
import { useSecureFile } from '../../hooks/useSecureFile.js';

const b64ToUrl = (b64, mime) => {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    return URL.createObjectURL(new Blob([bytes], { type: mime }));
};

const SecureFilePage = () => {
    const {
        uploadRes,
        downloadRes,
        decryptRes,
        error,
        upload,
        download,
        decrypt,
    } = useSecureFile();

    const [fileId, setFileId] = useState('');
    const [keyId, setKeyId] = useState(1);
    const [busyCard, setBusyCard] = useState(null);
    const [expandedFields, setExpandedFields] = useState({});

    const start = card => (setBusyCard(card), true);
    const stop = () => setBusyCard(null);

    const toggleField = (fieldPath) => {
        setExpandedFields(prev => ({
            ...prev,
            [fieldPath]: !prev[fieldPath]
        }));
    };

    const renderJSON = (data, prefix = '') => {
        return Object.entries(data).map(([key, value]) => {
            const fieldPath = `${prefix}${key}`;
            if (typeof value === 'string' && key.endsWith('_b64') && value.length > 120) {
                const isExpanded = expandedFields[fieldPath];
                const display = isExpanded ? value : `${value.slice(0, 80)}… (${value.length} chars)`;
                return (
                    <div key={fieldPath} className="json-line">
                        <span className="json-key">"{key}":</span>{' '}
                        <span className="json-value">"{display}"</span>{' '}
                        <button className="toggle-btn" onClick={() => toggleField(fieldPath)}>
                            {isExpanded ? 'Hide' : 'Show full'}
                        </button>
                    </div>
                );
            } else {
                return (
                    <div key={fieldPath} className="json-line">
                        <span className="json-key">"{key}":</span>{' '}
                        <span className="json-value">
                            {typeof value === 'string' ? `"${value}"` : JSON.stringify(value)}
                        </span>
                    </div>
                );
            }
        });
    };

    return (
        <div className="secure-file-container">
            <h2 className="sfp-title">Secure File Transfer</h2>

            {/* Upload */}
            <section className={`sfp-card ${busyCard === 'upload' ? 'busy' : ''}`}>
                <h3>⬆️ Upload & Encrypt</h3>

                <label className="file-label">
                    📄 Choose file
                    <input
                        className="file-input"
                        type="file"
                        onChange={e => {
                            const f = e.target.files[0];
                            if (f) {
                                start('upload');
                                upload(f).finally(stop);
                            }
                        }}
                    />
                </label>

                {uploadRes && (
                    <div className="json-preview centered">
                        {renderJSON(uploadRes)}
                    </div>
                )}
            </section>

            {/* Download */}
            <section className={`sfp-card ${busyCard === 'download' ? 'busy' : ''}`}>
                <h3>⬇️ Download Encrypted</h3>

                <input
                    type="text"
                    placeholder="file_id"
                    value={fileId}
                    onChange={e => setFileId(e.target.value)}
                />

                <button
                    className="sfp-btn"
                    disabled={busyCard}
                    onClick={() => start('download') && download(fileId).finally(stop)}
                >
                    {busyCard === 'download' ? <span className="spinner" /> : 'Download JSON'}
                </button>

                {downloadRes && (
                    <div className="json-preview centered">
                        {renderJSON(downloadRes)}
                    </div>
                )}
            </section>

            {/* Decrypt */}
            {downloadRes && (
                <section className={`sfp-card ${busyCard === 'decrypt' ? 'busy' : ''}`}>
                    <h3>🔓 Decrypt on Server</h3>

                    <div className="sfp-keyrow">
                        RSA key&nbsp;
                        <input
                            type="number"
                            value={keyId}
                            onChange={e => setKeyId(e.target.value)}
                            style={{ width: '70px' }}
                        />
                        <button
                            className="sfp-btn"
                            disabled={busyCard}
                            onClick={() =>
                                start('decrypt') &&
                                decrypt(keyId, { ...downloadRes, filename: downloadRes.filename }).finally(stop)
                            }
                        >
                            {busyCard === 'decrypt' ? <span className="spinner" /> : 'Decrypt'}
                        </button>
                    </div>

                    {decryptRes && (
                        <>
                            <div className="json-preview centered">
                                {renderJSON(decryptRes)}
                            </div>

                            <button
                                className="sfp-btn"
                                onClick={() => {
                                    const url = b64ToUrl(decryptRes.data_b64, 'application/pdf');
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = downloadRes.filename || 'file';
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
};

export default SecureFilePage;
