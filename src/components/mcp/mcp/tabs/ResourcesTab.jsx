import React, {useState} from 'react';
import {useResources} from '../../../../hooks/useResources.js';
import '../../../../assets/css/ResourcesTab.css';
import ReactMarkdown from 'react-markdown';

const ResourcesTab = () => {
    const {
        resources,
        loading,
        error,
        selected,
        setSelected,
        content,
        fetchContent,
    } = useResources();

    const [expanded, setExpanded] = useState('content');

    const toggle = (section) => {
        setExpanded(expanded === section ? null : section);
    };

    if (loading) return <p>Loading resources...</p>;
    if (error) return <p className="error-msg">❌ {error}</p>;

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
                        }}
                    >
                        {r.uri.replace(/^file:\/\//, '')}
                    </div>
                ))}
            </div>


            {selected && (
                <div className="resource-modal-overlay" onClick={() => setSelected(null)}>
                    <div className="resource-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setSelected(null)}>×</button>
                        <h3>{selected.replace(/^file:\/\//, '')}</h3>

                        {/* Content section */}
                        <div className="accordion-section">
                            <div
                                className={`accordion-header ${expanded === 'content' ? 'expanded' : ''}`}
                                onClick={() => toggle('content')}
                            >
                                <span className={`triangle ${expanded === 'content' ? 'open' : ''}`}>&#9654;</span>
                                <h4>📝 Content</h4>
                            </div>
                            <div
                                className={`accordion-body-wrapper ${
                                    expanded === 'content' ? 'open' : ''
                                }`}
                            >
                                <div className="accordion-body">
                                    {content.text ? (
                                        <pre className="scroll-content">{content.text}</pre>
                                    ) : (
                                        <div className="scroll-content loading-msg">⏳ Loading content...</div>
                                    )}
                                </div>

                            </div>
                        </div>

                        {/* Metadata section */}
                        {content.metadata && (
                            <div className="accordion-section">
                                <div
                                    className={`accordion-header ${expanded === 'metadata' ? 'expanded' : ''}`}
                                    onClick={() => toggle('metadata')}
                                >
                                    <span className={`triangle ${expanded === 'metadata' ? 'open' : ''}`}>&#9654;</span>
                                    <h4>📌 Metadata</h4>
                                </div>
                                <div
                                    className={`accordion-body-wrapper ${
                                        expanded === 'metadata' ? 'open' : ''
                                    }`}
                                >
                                    <div className="accordion-body">
                                        {content.metadata ? (
                                            <div className="scroll-content markdown-preview">
                                                <ReactMarkdown>{content.metadata}</ReactMarkdown>
                                            </div>
                                        ) : (
                                            <div className="scroll-content loading-msg">⏳ Loading metadata...</div>
                                        )}
                                    </div>

                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResourcesTab;
