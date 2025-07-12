import React, {useState, useEffect} from 'react';
import {useTools} from '../../../../hooks/useTools.js';
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import {dracula} from 'react-syntax-highlighter/dist/esm/styles/prism';
import '../../../../assets/css/ToolsTab.css';

const ToolsTab = () => {
    const {tools, loading, error} = useTools();
    const [selectedTool, setSelectedTool] = useState(null);

    if (loading) return <p>Loading tools…</p>;
    if (error) return <p style={{color: 'red'}}>❌ {error}</p>;

    return (
        <div className="tools-tab">

            {/* grid of cards */}
            <div className="tool-grid">
                {tools.map(t => (
                    <div key={t.name} className="tool-card" onClick={() => setSelectedTool(t)}>
                        <h4>{t.name}</h4>
                    </div>
                ))}
            </div>

            {/* modal */}
            {selectedTool && (
                <div className="tool-detail-overlay" onClick={() => setSelectedTool(null)}>
                    <div className="tool-detail" onClick={e => e.stopPropagation()}>

                        <button className="close-btn" onClick={() => setSelectedTool(null)}>×</button>
                        <h3>{selectedTool.name}</h3>
                        <p>{selectedTool.description}</p>

                        <div className="tool-detail-body">

                            <div className="tool-info">
                                <div className="tool-meta">
                                    <p><strong>Binary:</strong> {selectedTool.binary ? '✅ Yes' : '❌ No'}</p>
                                    <p><strong>FTI Only:</strong>{selectedTool.fti_only ? '✅ Yes' : '❌ No'}</p>
                                </div>

                                <div className="tool-schema">
                                    <h4>Input Schema</h4>
                                    {(() => {
                                        const s = selectedTool.inputSchema;
                                        let parsed = null;
                                        if (typeof s === 'object' && s && Object.keys(s).length) parsed = s;
                                        else if (typeof s === 'string' && s.trim().startsWith('{')) {
                                            try {
                                                parsed = JSON.parse(s);
                                            } catch {
                                            }
                                        }
                                        return parsed ? (
                                            <div className="json-preview centered">
                                                <SyntaxHighlighter
                                                    language="json"
                                                    style={dracula}
                                                    showLineNumbers={false}
                                                    wrapLongLines={true}
                                                    customStyle={{
                                                        background: 'transparent',
                                                        fontSize: '0.9rem',
                                                        padding: '0'
                                                    }}
                                                >
                                                    {JSON.stringify(parsed, null, 2)}
                                                </SyntaxHighlighter>
                                            </div>
                                        ) : <p className="schema-placeholder">No input schema.</p>;
                                    })()}
                                </div>
                            </div>

                        </div>
                        {/* /tool-detail-body */}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ToolsTab;
