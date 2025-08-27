import React, {useEffect, useMemo, useState} from "react";
import {useTools} from "../../../../hooks/useTools.js";
import "../../../../assets/css/ToolsTab.css";
import {useRateLimit} from "../../../../context/RateLimitContext.jsx";
import {Prism as SyntaxHighlighter} from "react-syntax-highlighter";
import {dracula} from "react-syntax-highlighter/dist/esm/styles/prism";
import ReactMarkdown from "react-markdown";

function SkeletonGrid({count = 6}) {
    return (
        <>
            {Array.from({length: count}).map((_, i) => (
                <div key={i} className="tool-card skeleton disabled">
                    <div className="skeleton-bar"/>
                </div>
            ))}
        </>
    );
}

export default function ToolsTab({setRefetch}) {
    const {tools, loading, fetching, errorInfo, showEmpty, refetch} = useTools();
    const {rate} = useRateLimit();
    const [selected, setSelected] = useState(null);

    const isCooling = useMemo(
        () => Boolean(rate?.until && Date.now() < rate.until),
        [rate?.until]
    );

    useEffect(() => {
        setRefetch?.(refetch);
        return () => setRefetch?.(null);
    }, [refetch, setRefetch]);

    const closeDetail = () => setSelected(null);

    return (
        <div className="tools-tab">
            {loading && <p>Loading tools…</p>}

            {!rate && errorInfo && (
                <div style={{color: "red", marginBottom: 12}}>❌ {errorInfo.message}</div>
            )}

            <div className="tool-grid">
                {showEmpty && !loading ? (
                    <div className="tool-empty">
                        {fetching ? "Refreshing…" : "No tools available yet."}
                    </div>
                ) : tools.length > 0 ? (
                    tools.map((t) => (
                        <div
                            key={t.name}
                            className={`tool-card ${isCooling ? "disabled" : ""}`}
                            onClick={() => !isCooling && setSelected(t)}
                            title={isCooling ? "Rate limited — wait to interact" : t.name}
                        >
                            <h4>{t.name}</h4>
                        </div>
                    ))
                ) : (
                    <SkeletonGrid/>
                )}
            </div>

            {selected && (
                <div className="tool-detail-overlay" onClick={closeDetail}>
                    <div className="tool-detail" onClick={(e) => e.stopPropagation()}>
                        <button className="close-btn" onClick={closeDetail}>×</button>

                        <h3>{selected.name}</h3>

                        {(() => {
                            // 🔑 Accept both camelCase (API) and snake_case (older code), plus fallbacks
                            const schema =
                                selected.inputSchema ||
                                selected.input_schema ||
                                selected.schema ||
                                selected.parameters ||
                                selected.arguments;

                            // Remove the boilerplate "Required arguments..." section from description
                            const rawDesc = selected.description || "";
                            const desc = rawDesc.replace(
                                /###\s*Required arguments[\s\S]*$/i,
                                ""
                            ).trim();

                            return (
                                <>
                                    {desc && (
                                        <div className="tool-markdown">
                                            <ReactMarkdown>{desc}</ReactMarkdown>
                                        </div>
                                    )}

                                    {/* Pretty-print schema if present (supports simple dicts or full JSON Schema) */}
                                    {schema && Object.keys(schema).length > 0 && (
                                        <div className="tool-schema" style={{marginTop: 14}}>
                                            <h4>Arguments</h4>
                                            <div className="json-preview centered">
                                                <SyntaxHighlighter
                                                    language="json"
                                                    style={dracula}
                                                    showLineNumbers={false}
                                                    wrapLongLines
                                                    customStyle={{
                                                        background: "transparent",
                                                        fontSize: "0.9rem",
                                                        padding: 0
                                                    }}
                                                >
                                                    {JSON.stringify(schema, null, 2)}
                                                </SyntaxHighlighter>
                                            </div>
                                        </div>
                                    )}
                                </>
                            );
                        })()}

                        <div style={{marginTop: 8, fontSize: 12, opacity: 0.7}}>
                            Binary: {selected.binary ? "Yes" : "No"}
                            {"fti_only" in selected && <> • FTI Only: {selected.fti_only ? "Yes" : "No"}</>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
