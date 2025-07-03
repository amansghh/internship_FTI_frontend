import React, {useState} from 'react';
import {useTools} from '../../../../hooks/useTools.js';
import '../../../../assets/css/ToolsTab.css';

const ToolsTab = () => {
    const {tools, loading, error} = useTools();
    const [selectedTool, setSelectedTool] = useState(null);

    const closeDetail = () => setSelectedTool(null);

    if (loading) return <p>Loading tools...</p>;
    if (error) return <p style={{color: 'red'}}>❌ {error}</p>;
    console.log("🔍 Selected tool object:", selectedTool);

    return (
        <div className="tools-tab">
            <div className="tool-grid">
                {tools.map(tool => (
                    <div key={tool.name} className="tool-card" onClick={() => setSelectedTool(tool)}>
                        <h4>{tool.name}</h4>
                    </div>
                ))}
            </div>

            {selectedTool && (
                <div className="tool-detail-overlay" onClick={closeDetail}>
                    <div className="tool-detail" onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={closeDetail}>×</button>
                        <h3>{selectedTool.name}</h3>
                        <p>{selectedTool.description}</p>
                        <div className="tool-meta">
                            <p><strong>Binary:</strong> {selectedTool.binary ? '✅ Yes' : '❌ No'}</p>
                            <p><strong>FTI Only:</strong> {selectedTool.fti_only ? '✅ Yes' : '❌ No'}</p>
                        </div>
                        <div className="tool-schema">
                            <h4>Input Schema</h4>
                            {(() => {
                                const schema = selectedTool.inputSchema;
                                let parsed = null;

                                if (typeof schema === 'object' && Object.keys(schema).length > 0) {
                                    parsed = schema;
                                } else if (typeof schema === 'string' && schema.trim().startsWith('{')) {
                                    try {
                                        parsed = JSON.parse(schema);
                                    } catch {
                                    }
                                }

                                return parsed ? (
                                    <div className="json-preview centered">
                                        <pre>{JSON.stringify(parsed, null, 2)}</pre>
                                    </div>
                                ) : (
                                    <p className="schema-placeholder">No input schema defined.</p>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ToolsTab;
