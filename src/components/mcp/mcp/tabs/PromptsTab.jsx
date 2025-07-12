import React, {useState} from 'react';
import {usePrompts} from '../../../../hooks/usePrompts';
import '../../../../assets/css/PromptsTab.css';

import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import {dracula} from 'react-syntax-highlighter/dist/esm/styles/prism';

const PromptsTab = () => {
    const {prompts, loading, error} = usePrompts();
    const [selectedPrompt, setSelectedPrompt] = useState(null);

    const closeDetail = () => setSelectedPrompt(null);

    if (loading) return <p>Loading prompts...</p>;
    if (error) return <p style={{color: 'red'}}>❌ {error}</p>;

    return (
        <div className="prompts-tab">
            <div className="prompt-grid">
                {prompts.map(prompt => (
                    <div key={prompt.name} className="prompt-card" onClick={() => setSelectedPrompt(prompt)}>
                        <h4>{prompt.name}</h4>
                    </div>
                ))}
            </div>

            {selectedPrompt && (
                <div className="prompt-detail-overlay" onClick={closeDetail}>
                    <div className="prompt-detail" onClick={e => e.stopPropagation()}>
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
                                        wrapLongLines={true}
                                        customStyle={{
                                            background: 'transparent',
                                            fontSize: '0.9rem',
                                            padding: '0'
                                        }}
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
                                        wrapLongLines={true}
                                        customStyle={{
                                            background: 'transparent',
                                            fontSize: '0.9rem',
                                            padding: '0'
                                        }}
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
