import React, {useEffect, useState} from 'react';
import {useResources} from '../../../../hooks/useResources.js';
import {useToolRunner} from '../../../../hooks/useToolRunner.js';
import '../../../../assets/css/ResourcesTab.css';
import ReactMarkdown from 'react-markdown';
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import {dracula} from 'react-syntax-highlighter/dist/esm/styles/prism';

/* helper: base64 → Blob URL */
const b64ToUrl = (b64, mime) => {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    return URL.createObjectURL(new Blob([bytes], {type: mime}));
};

const ResourcesTab = () => {
    const {
        resources,
        loading,
        error,
        selected,
        setSelected,
        content,
        fetchContent,
        subscribe,
        unsubscribe,
        subscriptions,
    } = useResources();

    const [expanded, setExpanded] = useState('content');
    const toggle = section => setExpanded(expanded === section ? null : section);
    const { run, running, output, error: runErr, setOutput } = useToolRunner();

    // Clear output when switching resources
    useEffect(() => {
        setOutput(null);
    }, [selected]);

    const prettyOutput = output?.data
        ? {
            filename: output.filename,
            mimeType: output.mimeType,
            size: output.size,
        }
        : null;

    if (loading) return <p>Loading resources...</p>;
    if (error) return <p className="error-msg">❌ {error}</p>;

    const isSubscribed = selected && subscriptions.has(selected);


    return (
        <div className="resources-tab">
            <div className="resource-list">
                {resources.map((r, i) => (
                    <div
                        key={i}
                        className={`resource-card ${selected === r.uri ? 'active' : ''}`}
                        onClick={() => {
                            setSelected(r.uri);
                            fetchContent(r.uri);
                            setExpanded('content');
                            setOutput(null); // 🧹 Clear previous tool output
                        }}
                    >
                        {r.uri.replace(/^file:\/\//, '')}
                    </div>
                ))}
            </div>

            {selected && (
                <div className="resource-modal-overlay" onClick={() => setSelected(null)}>
                    <div className="resource-modal" onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setSelected(null)}>×</button>
                        <div className="resource-title-row">
                            <h3 className="resource-title">{selected.replace(/^file:\/\//, '')}</h3>
                            <button
                                className="fti-subscribe-btn"
                                onClick={() => isSubscribed ? unsubscribe(selected) : subscribe(selected)}
                            >
                                {isSubscribed ? '🔕 Unsubscribe' : '🔔 Subscribe'}
                            </button>
                        </div>


                        {runErr && (
                            <p className="error-msg" style={{marginTop: '.5rem'}}>❌ {runErr}</p>
                        )}


                        {/* Content Accordion */}
                        <div className="accordion-section">
                            <div
                                className={`accordion-header ${expanded === 'content' ? 'expanded' : ''}`}
                                onClick={() => toggle('content')}
                            >
                                <span className={`triangle ${expanded === 'content' ? 'open' : ''}`}>&#9654;</span>
                                <h4>📝 Content</h4>
                            </div>
                            <div className={`accordion-body-wrapper ${expanded === 'content' ? 'open' : ''}`}>
                                <div className="accordion-body">
                                    {content.text
                                        ? <pre className="scroll-content">{content.text}</pre>
                                        : <div className="scroll-content loading-msg">⏳ Loading content...</div>
                                    }
                                </div>
                            </div>
                        </div>

                        {/* Metadata Accordion */}
                        {content.metadata && (
                            <div className="accordion-section">
                                <div
                                    className={`accordion-header ${expanded === 'metadata' ? 'expanded' : ''}`}
                                    onClick={() => toggle('metadata')}
                                >
                                    <span className={`triangle ${expanded === 'metadata' ? 'open' : ''}`}>&#9654;</span>
                                    <h4>📌 Metadata</h4>
                                </div>
                                <div className={`accordion-body-wrapper ${expanded === 'metadata' ? 'open' : ''}`}>
                                    <div className="accordion-body">
                                        <div className="scroll-content markdown-preview">
                                            <ReactMarkdown>{content.metadata}</ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ⬇️ Download Button */}
                        <button
                            className="download-btn"
                            disabled={running}
                            onClick={() => run('download_file', {uri: selected})}
                        >
                            {running ? 'Downloading…' : '⬇️ Download'}
                        </button>

                        {/* JSON Preview */}
                        {prettyOutput && (
                            <div className="runner-output json-preview centered">
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
                                    {JSON.stringify(prettyOutput, null, 2)}
                                </SyntaxHighlighter>
                            </div>
                        )}

                        {/* Save Button */}
                        {output?.data && (
                            <button
                                className="save-btn"
                                onClick={() => {
                                    const url = b64ToUrl(output.data, output.mimeType);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = output.filename || 'download';
                                    a.click();
                                    URL.revokeObjectURL(url);
                                }}
                            >
                                💾 Save {output.filename}
                            </button>
                        )}

                    </div>
                </div>
            )}
        </div>
    );
};

export default ResourcesTab;
