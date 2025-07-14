import React from 'react';
import {useMcpContext} from '../../context/McpContext';
import {useSSE} from '../../hooks/useSSE';
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import {dracula} from 'react-syntax-highlighter/dist/esm/styles/prism';

const SSETestPage = () => {
    const {sessionId} = useMcpContext();
    const {events, connected} = useSSE('/mcp/stream', sessionId);

    return (
        <div style={{maxWidth: '900px', margin: '0 auto', padding: '2rem'}}>
            <h2 style={{marginBottom: '0.5rem'}}>🛰️ MCP SSE Stream</h2>
            <p style={{marginBottom: '1rem', fontSize: '0.95rem'}}>
                Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}
            </p>

            <div style={{
                maxHeight: '500px',
                overflowY: 'auto',
                background: '#1e1e1e',
                border: '1px solid #333',
                borderRadius: '8px',
                padding: '1rem'
            }}>
                {events.length === 0 && (
                    <p style={{color: '#ccc', fontStyle: 'italic'}}>
                        No events received yet.
                    </p>
                )}

                {events.map((evt, idx) => (
                    <SyntaxHighlighter
                        key={idx}
                        language="json"
                        style={dracula}
                        customStyle={{
                            background: 'transparent',
                            padding: '1rem 0',
                            fontSize: '0.85rem',
                            lineHeight: '1.4',
                            borderBottom: '1px solid #333',
                        }}
                    >
                        {JSON.stringify(evt, null, 2)}
                    </SyntaxHighlighter>
                ))}
            </div>
        </div>
    );
};

export default SSETestPage;
