import React, {useState} from 'react';
import {useMcpSession} from '../../hooks/useMcpSession';
import '../../assets/css/AccessPanel.css';
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import {dracula} from 'react-syntax-highlighter/dist/esm/styles/prism';

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


    const [showApiKey, setShowApiKey] = useState(false);

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

                {/* API Key Field */}
                <div className="form-group api-key-group">
                    <label>API Key:</label>
                    <div className="input-with-toggle">
                        <input
                            type={showApiKey ? "text" : "password"} // 👈 switch type
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Enter your API key"
                        />
                        <button
                            type="button"
                            className="toggle-visibility"
                            onClick={() => setShowApiKey(!showApiKey)}
                            aria-label="Toggle API key visibility"
                        >
                            {showApiKey ? '🙈' : '👁'}
                        </button>
                    </div>
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
                    <SyntaxHighlighter
                        language="json"
                        style={dracula}
                        showLineNumbers={false}
                        wrapLongLines={true}
                        customStyle={{background: 'transparent', fontSize: '0.9rem', padding: '0'}}
                    >
                        {JSON.stringify(serverResponse, null, 2)}
                    </SyntaxHighlighter>
                </div>
            )}

        </div>
    );
};

export default AccessPanel;
