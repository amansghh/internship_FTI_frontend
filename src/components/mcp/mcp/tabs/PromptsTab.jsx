import React, {useState} from 'react';
import {usePrompts} from '../../../../hooks/usePrompts';
import '../../../../assets/css/PromptsTab.css';

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
                                <pre className="json-preview centered">
                                    {JSON.stringify(selectedPrompt.arguments, null, 2)}
                                </pre>
                            </div>
                        )}

                        <div className="prompt-template">
                            {selectedPrompt.template && selectedPrompt.template.trim() !== '' && (
                                <>
                                    <h4>Template</h4>
                                    <div className="json-preview centered">
                                        <pre>{selectedPrompt.template}</pre>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PromptsTab;
