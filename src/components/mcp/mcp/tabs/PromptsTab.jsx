import React, {useEffect, useMemo, useState} from 'react';
import {usePrompts} from '../../../../hooks/usePrompts';
import '../../../../assets/css/PromptsTab.css';
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import {dracula} from 'react-syntax-highlighter/dist/esm/styles/prism';
import {useRateLimit} from '../../../../context/RateLimitContext.jsx';

function SkeletonGrid({count = 6}) {
    return (
        <>
            {Array.from({length: count}).map((_, i) => (
                <div key={i} className="prompt-card skeleton disabled">
                    <div className="skeleton-bar"/>
                </div>
            ))}
        </>
    );
}

const PromptsTab = ({setRefetch}) => {
    const {prompts, loading, fetching, errorInfo, showEmpty, refetch} = usePrompts();
    const [selectedPrompt, setSelectedPrompt] = useState(null);
    const {rate} = useRateLimit();

    // Disable only during cooldown (while timer > 0)
    const isCooling = useMemo(
        () => Boolean(rate?.until && Date.now() < rate.until),
        [rate?.until]
    );

    useEffect(() => {
        setRefetch?.(refetch);
        return () => setRefetch?.(null);
    }, [refetch, setRefetch]);

    const closeDetail = () => setSelectedPrompt(null);

    return (
        <div className="prompts-tab">
            {loading && <p>Loading prompts...</p>}
            {!rate && errorInfo && <p style={{color: 'red'}}>❌ {errorInfo.message}</p>}

            <div className="prompt-grid">
                {showEmpty && !loading ? (
                    <div className="prompt-empty">{fetching ? 'Refreshing…' : 'No prompts available yet.'}</div>
                ) : prompts.length > 0 ? (
                    prompts.map((prompt) => (
                        <div
                            key={prompt.name}
                            className={`prompt-card ${isCooling ? 'disabled' : ''}`}
                            onClick={() => !isCooling && setSelectedPrompt(prompt)}
                            title={isCooling ? 'Rate limited — wait to interact' : prompt.name}
                        >
                            <h4>{prompt.name}</h4>
                        </div>
                    ))
                ) : (
                    <SkeletonGrid/>
                )}
            </div>

            {selectedPrompt && (
                <div className="prompt-detail-overlay" onClick={closeDetail}>
                    <div className="prompt-detail" onClick={(e) => e.stopPropagation()}>
                        <button className="close-btn" onClick={closeDetail}>×</button>
                        <h3>{selectedPrompt.name}</h3>
                        <p>{selectedPrompt.description}</p>

                        {selectedPrompt.arguments && Object.keys(selectedPrompt.arguments).length > 0 && (
                            <div className="prompt-args">
                                <h4>Arguments</h4>
                                <div className="json-preview centered">
                                    <SyntaxHighlighter
                                        language="json"
                                        style={dracula}
                                        showLineNumbers={false}
                                        wrapLongLines
                                        customStyle={{background: 'transparent', fontSize: '0.9rem', padding: 0}}
                                    >
                                        {JSON.stringify(selectedPrompt.arguments, null, 2)}
                                    </SyntaxHighlighter>
                                </div>
                            </div>
                        )}

                        {selectedPrompt.template && selectedPrompt.template.trim() !== '' && (
                            <div className="prompt-template">
                                <h4>Template</h4>
                                <div className="json-preview centered">
                                    <SyntaxHighlighter
                                        language="json"
                                        style={dracula}
                                        showLineNumbers={false}
                                        wrapLongLines
                                        customStyle={{background: 'transparent', fontSize: '0.9rem', padding: 0}}
                                    >
                                        {selectedPrompt.template}
                                    </SyntaxHighlighter>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PromptsTab;
