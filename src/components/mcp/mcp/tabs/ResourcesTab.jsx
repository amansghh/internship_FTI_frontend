import React, {useEffect, useMemo, useState, useCallback} from 'react';
import {useResources} from '../../../../hooks/useResources.js';
import {useToolRunner} from '../../../../hooks/useToolRunner.js';
import '../../../../assets/css/ResourcesTab.css';
import ReactMarkdown from 'react-markdown';
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import {dracula} from 'react-syntax-highlighter/dist/esm/styles/prism';
import {useRateLimit} from '../../../../context/RateLimitContext.jsx';

/* helper: base64 → Blob URL */
const b64ToUrl = (b64, mime) => {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    return URL.createObjectURL(new Blob([bytes], {type: mime}));
};

function SkeletonList({count = 6}) {
    return Array.from({length: count}).map((_, i) => (
        <div key={i} className="resource-card skeleton disabled">
            <div className="skeleton-bar"/>
        </div>
    ));
}

const ResourcesTab = ({setRefetch}) => {
    const {
        resources,
        loading,
        fetchingList,
        listError,
        showEmptyList,
        selected,
        setSelected,
        content,
        contentLoading,
        contentError,
        fetchList,
        fetchContent,
        subscribe,
        unsubscribe,
        subscriptions,
    } = useResources();

    const {run, running, output, error: runErr, setOutput} = useToolRunner();
    const {rate} = useRateLimit();

    // Only disable interactions during cooldown (timer > 0)
    const isCooling = useMemo(
        () => Boolean(rate?.until && Date.now() < rate.until),
        [rate?.until]
    );

    // Clear tool output when switching resources
    useEffect(() => {
        setOutput(null);
    }, [selected, setOutput]);

    // Global Retry should refetch list if nothing selected; otherwise refetch content of selected
    const refetchCurrent = useCallback(() => {
        if (selected) fetchContent(selected);
        else fetchList();
    }, [selected, fetchContent, fetchList]);

    useEffect(() => {
        setRefetch?.(refetchCurrent);
        return () => setRefetch?.(null);
    }, [refetchCurrent, setRefetch]);

    const isSubscribed = selected && subscriptions.has(selected);

    return (
        <div className="resources-tab">
            <div className="resource-list">
                {loading ? (
                    <SkeletonList/>
                ) : showEmptyList ? (
                    <div className="resource-empty">
                        {fetchingList ? 'Refreshing…' : 'No resources available yet.'}
                    </div>
                ) : resources.length > 0 ? (
                    resources.map((r, i) => (
                        <div
                            key={i}
                            className={`resource-card ${selected === r.uri ? 'active' : ''} ${isCooling ? 'disabled' : ''}`}
                            onClick={() => {
                                if (isCooling) return;
                                setSelected(r.uri);
                                fetchContent(r.uri);
                                setOutput(null);
                            }}
                            title={isCooling ? 'Rate limited — wait to interact' : r.uri}
                        >
                            {r.uri.replace(/^file:\/\//, '')}
                        </div>
                    ))
                ) : (
                    <SkeletonList/>
                )}
            </div>

            {listError && !isCooling && (
                <p className="error-msg" style={{marginTop: '.5rem'}}>❌ {listError}</p>
            )}

            {selected && (
                <div className="resource-modal-overlay" onClick={() => setSelected(null)}>
                    <div className="resource-modal" onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setSelected(null)}>×</button>
                        <div className="resource-title-row">
                            <h3 className="resource-title">{selected.replace(/^file:\/\//, '')}</h3>
                            <button
                                className="fti-subscribe-btn"
                                disabled={isCooling}
                                onClick={() => isSubscribed ? unsubscribe(selected) : subscribe(selected)}
                                title={isCooling ? 'Rate limited — wait to interact' : (isSubscribed ? 'Unsubscribe' : 'Subscribe')}
                            >
                                {isSubscribed ? '🔕 Unsubscribe' : '🔔 Subscribe'}
                            </button>
                        </div>

                        {/* Content Accordion */}
                        <div className="accordion-section">
                            <div
                                className={`accordion-header ${'content' ? 'expanded' : ''}`}
                                onClick={() => {
                                }}
                            >
                                <span className={`triangle ${'content' ? 'open' : ''}`}>&#9654;</span>
                                <h4>📝 Content</h4>
                            </div>
                            <div className={`accordion-body-wrapper open`}>
                                <div className="accordion-body">
                                    {contentLoading && !content.text ? (
                                        <div className="scroll-content loading-msg">⏳ Loading content...</div>
                                    ) : content.text ? (
                                        <pre className="scroll-content">{content.text}</pre>
                                    ) : (
                                        <div className="scroll-content loading-msg">No content.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Metadata Accordion */}
                        {content.metadata && (
                            <div className="accordion-section">
                                <div className={`accordion-header expanded`} onClick={() => {
                                }}>
                                    <span className={`triangle open`}>&#9654;</span>
                                    <h4>📌 Metadata</h4>
                                </div>
                                <div className={`accordion-body-wrapper open`}>
                                    <div className="accordion-body">
                                        <div className="scroll-content markdown-preview">
                                            <ReactMarkdown>{content.metadata}</ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {contentError && !isCooling && (
                            <p className="error-msg" style={{marginTop: '.5rem'}}>❌ {contentError}</p>
                        )}

                        {/* ⬇️ Download Button */}
                        <button
                            className="download-btn"
                            disabled={running || isCooling || !selected}
                            onClick={() => run('download_file', {uri: selected})}
                            title={isCooling ? 'Rate limited — wait to interact' : 'Download'}
                        >
                            {running ? 'Downloading…' : '⬇️ Download'}
                        </button>

                        {/* JSON Preview */}
                        {output?.data && (
                            <div className="runner-output json-preview centered">
                                <SyntaxHighlighter
                                    language="json"
                                    style={dracula}
                                    showLineNumbers={false}
                                    wrapLongLines
                                    customStyle={{background: 'transparent', fontSize: '0.9rem', padding: 0}}
                                >
                                    {JSON.stringify({
                                        filename: output.filename,
                                        mimeType: output.mimeType,
                                        size: output.size,
                                    }, null, 2)}
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
