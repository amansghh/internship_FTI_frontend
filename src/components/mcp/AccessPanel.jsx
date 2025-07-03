import React from 'react';
import {useMcpSession} from '../../hooks/useMcpSession';
import '../../assets/css/AccessPanel.css';

const AccessPanel = () => {
    const {
        apiKey,
        setApiKey,
        fti,
        setFti,
        protocolVersion,
        setProtocolVersion,
        sessionId,
        initialized,
        initializeSession,
        sendInitialized,
        serverResponse, resetSession
    } = useMcpSession();

    const handleStartSession = async () => {
        await initializeSession();
    };

    const handleConfirmInitialized = async () => {
        await sendInitialized();
    };

    return (
        <div className={`access-panel-wrapper ${serverResponse ? 'with-preview' : ''}`}>
            <div className="access-panel">
                <h2>MCP Access Panel</h2>

                <div className="form-group">
                    <label>API Key:</label>
                    <input
                        type="text"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter your API key"
                    />
                </div>

                <div className="form-group">
                    <label>Protocol Version:</label>
                    <input
                        type="text"
                        value={protocolVersion}
                        onChange={(e) => setProtocolVersion(e.target.value)}
                        placeholder="e.g. 2025-06-18"
                    />
                </div>

                <div className="form-group checkbox">
                    <label>
                        <input
                            type="checkbox"
                            checked={fti}
                            onChange={(e) => setFti(e.target.checked)}
                        />
                        Enable FTI mode
                    </label>
                </div>

                <div className="button-group">
                    <button onClick={handleStartSession} disabled={!apiKey || sessionId}>
                        Initialize MCP Session
                    </button>
                    <button
                        onClick={handleConfirmInitialized}
                        disabled={!sessionId || initialized}
                    >
                        Confirm Initialized
                    </button>
                    {sessionId && (
                        <button onClick={resetSession} className="reset-btn">
                            Reset Session
                        </button>
                    )}
                </div>

                <div className="status-box">
                    <p><strong>Session ID:</strong> {sessionId || "—"}</p>
                    <p><strong>Initialized:</strong> {initialized ? "🟢 Yes" : "⚪ No"}</p>
                    <p><strong>FTI Mode:</strong> {fti ? "🟢 Enabled" : "⚪ Disabled"}</p>
                    <p><strong>Protocol Version:</strong> {protocolVersion}</p>
                </div>
            </div>

            {serverResponse && (
                <div className="json-preview animated">
                    <pre>{JSON.stringify(serverResponse, null, 2)}</pre>
                </div>
            )}
        </div>
    );
};

export default AccessPanel;
