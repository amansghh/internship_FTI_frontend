import React, {useState} from "react";
import {useTools} from "../../../../hooks/useTools.js";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {Prism as SyntaxHighlighter} from "react-syntax-highlighter";
import {dracula} from "react-syntax-highlighter/dist/esm/styles/prism";
import "../../../../assets/css/ToolsTab.css";

/* — helper for the schema “pretty-print” code box — */
const JsonBlock = ({obj}) => (
    <div className="json-preview centered">
        <SyntaxHighlighter
            language="json"
            style={dracula}
            wrapLongLines
            showLineNumbers={false}
            customStyle={{background: "transparent", fontSize: "0.9rem", padding: 0}}
        >
            {JSON.stringify(obj, null, 2)}
        </SyntaxHighlighter>
    </div>
);

export default function ToolsTab() {
    const {tools, loading, error} = useTools();
    const [selected, setSelected] = useState(null);

    if (loading) return <p>Loading tools…</p>;
    if (error) return <p style={{color: "red"}}>❌ {error}</p>;

    return (
        <div className="tools-tab">

            {/* ─── grid of clickable cards ────────────────────────────── */}
            <div className="tool-grid">
                {tools.map(t => (
                    <div key={t.name}
                         className="tool-card"
                         onClick={() => setSelected(t)}>
                        <h4>{t.name}</h4>
                    </div>
                ))}
            </div>

            {/* ─── modal ──────────────────────────────────────────────── */}
            {selected && (
                <div className="tool-detail-overlay" onClick={() => setSelected(null)}>
                    <div className="tool-detail" onClick={e => e.stopPropagation()}>

                        <button className="close-btn" onClick={() => setSelected(null)}>×</button>

                        <h3>{selected.name}</h3>

                        {/* 💄  render Markdown description  */}
                        <div className="tool-markdown">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                children={selected.description}
                                components={{
                                    code: ({node, inline, className, children, ...props}) =>
                                        inline ? (
                                            <code className={className} {...props}>{children}</code>
                                        ) : (
                                            <SyntaxHighlighter
                                                style={dracula}
                                                language={(className || "").replace("language-", "")}
                                                PreTag="div"
                                                wrapLongLines
                                                customStyle={{background: "#282a36", borderRadius: 6}}
                                                {...props}
                                            >
                                                {String(children).replace(/\n$/, "")}
                                            </SyntaxHighlighter>
                                        )
                                }}
                            />
                        </div>

                        {/* ── meta + schema ─────────────────────────────── */}
                        <div className="tool-detail-body">

                            <div className="tool-info">

                                <div className="tool-meta">
                                    <p><strong>Binary:</strong> {selected.binary ? "✅ Yes" : "❌ No"}</p>
                                    {"fti_only" in selected &&
                                        <p><strong>FTI Only:</strong> {selected.fti_only ? "✅ Yes" : "❌ No"}</p>}
                                </div>

                                <div className="tool-schema">
                                    <h4>Input Schema</h4>
                                    {selected.inputSchema && Object.keys(selected.inputSchema).length
                                        ? <JsonBlock obj={selected.inputSchema}/>
                                        : <p className="schema-placeholder">No input schema.</p>}
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
