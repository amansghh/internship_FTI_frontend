import React, { useState, useEffect } from 'react';
import { useTools } from '../../../../hooks/useTools.js';
import { useToolRunner } from '../../../../hooks/useToolRunner.js';
import '../../../../assets/css/ToolsTab.css';

/* base-64 → Blob URL */
const b64ToUrl = (b64, mime) => {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    return URL.createObjectURL(new Blob([bytes], { type: mime }));
};

const ToolsTab = () => {
    const { tools, loading, error } = useTools();
    const [selectedTool, setSelectedTool] = useState(null);
    const [argText,      setArgText]      = useState('');
    const { run, running, output, error: runError } = useToolRunner();

    useEffect(() => setArgText(''), [selectedTool]);   // clear on switch

    const prettyOutput = output
        ? (output.data
            ? { filename: output.filename, mimeType: output.mimeType, size: output.size }
            : output)
        : '/* no output yet */';

    if (loading) return <p>Loading tools…</p>;
    if (error)   return <p style={{ color:'red' }}>❌ {error}</p>;

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

                            {/* LEFT column */}
                            <div className="tool-info">
                                <div className="tool-meta">
                                    <p><strong>Binary:</strong>  {selectedTool.binary   ? '✅ Yes' : '❌ No'}</p>
                                    <p><strong>FTI Only:</strong>{selectedTool.fti_only ? '✅ Yes' : '❌ No'}</p>
                                </div>

                                <div className="tool-schema">
                                    <h4>Input Schema</h4>
                                    {(() => {
                                        const s = selectedTool.inputSchema;
                                        let parsed = null;
                                        if (typeof s === 'object' && s && Object.keys(s).length) parsed = s;
                                        else if (typeof s === 'string' && s.trim().startsWith('{')) {
                                            try { parsed = JSON.parse(s); } catch {}
                                        }
                                        return parsed ? (
                                            <div className="json-preview centered">
                                                <pre>{JSON.stringify(parsed, null, 2)}</pre>
                                            </div>
                                        ) : <p className="schema-placeholder">No input schema.</p>;
                                    })()}
                                </div>
                            </div>

                            {/* RIGHT column */}
                            <div className="tool-runner">

                                <h4>Run Tool</h4>
                                <textarea
                                    className="tool-args-input"
                                    rows={6}
                                    value={argText}
                                    onChange={e => setArgText(e.target.value)}
                                    placeholder='Type JSON or just "Meeting_1.pdf"'
                                />

                                <button
                                    className="run-btn"
                                    disabled={running}
                                    onClick={() => {
                                        /* accept bare filename or JSON */
                                        let args;
                                        try {
                                            args = argText.trim().startsWith('{')
                                                ? JSON.parse(argText.trim() || '{}')
                                                : { uri: argText.trim() };

                                            if (args.uri && !args.uri.startsWith('file:///'))
                                                args.uri = `file:///${args.uri}`;
                                        } catch {
                                            alert('❌ Invalid input'); return;
                                        }
                                        run(selectedTool.name, args);
                                    }}
                                >
                                    {running ? 'Running…' : 'Run'}
                                </button>

                                {runError && (
                                    <p style={{ color:'red', marginTop:'0.6rem' }}>❌ {runError}</p>
                                )}

                                {/* Save button (if binary) */}
                                {output?.data && (
                                    <button
                                        className="run-btn save-btn"
                                        onClick={() => {
                                            const url = b64ToUrl(output.data, output.mimeType);
                                            const a   = document.createElement('a');
                                            a.href = url; a.download = output.filename || 'download'; a.click();
                                            URL.revokeObjectURL(url);
                                        }}
                                    >
                                        ⬇️ Save&nbsp;{output.filename}
                                    </button>
                                )}

                                {/* Always-visible output viewer */}
                                <div className="runner-output json-preview centered">
                  <pre>{typeof prettyOutput === 'string'
                      ? prettyOutput
                      : JSON.stringify(prettyOutput, null, 2)}</pre>
                                </div>

                            </div>{/* /tool-runner */}
                        </div>{/* /tool-detail-body */}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ToolsTab;
