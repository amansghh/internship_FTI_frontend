// src/pages/OllamaBridgePage.jsx
import React, {useState} from "react";
import "../assets/css/OllamaBridge.css";
import "../assets/css/ToolsTab.css";
import "../assets/css/SecureFile.css";        // for the json-line / toggle-btn styles
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {Prism as Syntax} from "react-syntax-highlighter";
import {dracula} from "react-syntax-highlighter/dist/esm/styles/prism";
import {ollamaBridgeService} from "../services/ollamaBridgeService";

/* ── File preview / Base64 toggle / Download ────────────────── */
const FileBlock = ({file}) => {
    const [expanded, setExpanded] = useState(false);
    const [previewing, setPreviewing] = useState(false);
    const {filename, mimeType, size, rawData} = file;

    const toggle = () => setExpanded((v) => !v);
    const displayData = expanded ? rawData : `${rawData.slice(0, 60)}…`;

    const doPreview = () => setPreviewing(true);
    const doDownload = () => {
        const bytes = Uint8Array.from(atob(rawData), (c) => c.charCodeAt(0));
        const blob = new Blob([bytes], {type: mimeType});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const renderFileJSON = () => {
        const entries = [
            ["filename", filename],
            ["mimeType", mimeType],
            ["size", size],
            ["data", displayData],
        ];
        return entries.map(([key, val]) => {
            if (key === "data") {
                return (
                    <div key={key} className="json-line">
                        <span className="json-key">"{key}":</span>{" "}
                        <span className="json-value">"{val}"</span>
                        <button className="toggle-btn" onClick={toggle}>
                            [{expanded ? "Hide" : "Show full"}]
                        </button>
                    </div>
                );
            }
            const isString = typeof val === "string";
            return (
                <div key={key} className="json-line">
                    <span className="json-key">"{key}":</span>{" "}
                    <span className="json-value">
            {isString ? `"${val}"` : val}
          </span>
                </div>
            );
        });
    };

    return (
        <div className="file-block">
            <div className="json-preview centered">
                {renderFileJSON()}
            </div>

            <div className="inline-actions">
                <button onClick={doPreview}>Preview</button>
                <button onClick={doDownload}>Download</button>
            </div>

            {previewing && (
                <div className="modal-overlay" onClick={() => setPreviewing(false)}>
                    <div className="modal-window" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setPreviewing(false)}>
                            ×
                        </button>

                        {mimeType.startsWith("image/") ? (
                            <img
                                src={URL.createObjectURL(
                                    new Blob(
                                        [Uint8Array.from(atob(rawData), (c) => c.charCodeAt(0))],
                                        {type: mimeType}
                                    )
                                )}
                                alt={filename}
                                style={{maxWidth: "100%"}}
                            />
                        ) : mimeType === "application/pdf" ? (
                            <iframe
                                src={URL.createObjectURL(
                                    new Blob(
                                        [Uint8Array.from(atob(rawData), (c) => c.charCodeAt(0))],
                                        {type: mimeType}
                                    )
                                )}
                                width="100%"
                                height="500px"
                                style={{border: "none"}}
                            />
                        ) : (
                            <p>Preview not supported for {mimeType}</p>
                        )}

                        <button className="download-btn" onClick={doDownload}>
                            ⬇ Download
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ── memoised JSON pretty-printer (shared look-&-feel) ───────── */
const JsonBlock = React.memo(({obj}) => (
    <div className="json-preview centered">
        <Syntax
            language="json"
            style={dracula}
            wrapLongLines
            showLineNumbers={false}
            customStyle={{background: "transparent", fontSize: "0.9rem", padding: 0}}
        >
            {JSON.stringify(obj, null, 2)}
        </Syntax>
    </div>
));

export default function OllamaBridgePage() {
    const [userInput, setUserInput] = useState("");
    const [chatLog, setChatLog] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState(null);

    const submit = async () => {
        if (!userInput.trim()) return;
        const prompt = userInput.trim();

        setChatLog((c) => [...c, {role: "user", text: prompt}]);
        setUserInput("");
        setLoading(true);

        try {
            const out = await ollamaBridgeService.call(prompt);

            if (out.tools) {
                setChatLog((c) => [...c, {role: "assistant", tools: out.tools}]);
            } else if (out.tool) {
                let msg = `🔧 Called ${out.tool}`;
                let result = out.result;

                if (out.tool === "download_file" && result?.data) {
                    // stash rawData for FileBlock and redact
                    const {filename, mimeType, size, data: rawData} = result;
                    msg += `\n💾 File ready: ${filename}`;
                    result = {filename, mimeType, size, rawData};
                }

                setChatLog((c) => [...c, {role: "assistant", text: msg, result}]);
            } else {
                setChatLog((c) => [...c, {role: "assistant", text: out.reply}]);
            }
        } catch (err) {
            setChatLog((c) => [...c, {role: "assistant", text: `❌ ${err.message}`}]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bridge-container">
            <h2 className="bridge-title">Ollama ⇆ MCP</h2>

            <div className="chat-log">
                {chatLog.map((m, i) => (
                    <div key={i} className={`chat-message ${m.role}`}>
                        <span>{m.role === "user" ? "🧑" : "🤖"}&nbsp;</span>
                        {m.text}

                        {m.tools && (
                            <div className="tool-grid" style={{marginTop: "0.5rem"}}>
                                {m.tools.map((t) => (
                                    <div
                                        key={t.name}
                                        className="tool-card"
                                        onClick={() => setSelected(t)}
                                    >
                                        <h4>{t.name}</h4>
                                    </div>
                                ))}
                            </div>
                        )}

                        {m.result &&
                            (m.result.rawData ? (
                                <FileBlock file={m.result}/>
                            ) : (
                                <JsonBlock obj={m.result}/>
                            ))}
                    </div>
                ))}
            </div>

            {/* tool-detail modal (pixel-perfect match with ToolsTab) */}
            {selected && (
                <div className="tool-detail-overlay" onClick={() => setSelected(null)}>
                    <div className="tool-detail" onClick={(e) => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setSelected(null)}>
                            ×
                        </button>
                        <h3>{selected.name}</h3>
                        <div className="tool-markdown">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    code: ({inline, className, children, ...props}) =>
                                        inline ? (
                                            <code className={className} {...props}>
                                                {children}
                                            </code>
                                        ) : (
                                            <Syntax
                                                style={dracula}
                                                language={(className || "").replace("language-", "")}
                                                PreTag="div"
                                                wrapLongLines
                                                customStyle={{background: "#282a36", borderRadius: 6}}
                                                {...props}
                                            >
                                                {String(children).replace(/\n$/, "")}
                                            </Syntax>
                                        ),
                                }}
                            >
                                {selected.description}
                            </ReactMarkdown>
                        </div>
                        <div className="tool-detail-body">
                            <div className="tool-info">
                                <div className="tool-meta">
                                    <p>
                                        <strong>Binary:</strong>{" "}
                                        {selected.binary ? "✅ Yes" : "❌ No"}
                                    </p>
                                    {"fti_only" in selected && (
                                        <p>
                                            <strong>FTI Only:</strong>{" "}
                                            {selected.fti_only ? "✅ Yes" : "❌ No"}
                                        </p>
                                    )}
                                </div>
                                <div className="tool-schema">
                                    <h4>Input Schema</h4>
                                    {selected.inputSchema && Object.keys(selected.inputSchema).length ? (
                                        <JsonBlock obj={selected.inputSchema}/>
                                    ) : selected.parameters && Object.keys(selected.parameters).length ? (
                                        <JsonBlock obj={selected.parameters}/>
                                    ) : (
                                        <p className="schema-placeholder">No input schema.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="chat-input-row">
                <input
                    className="chat-input"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Type your prompt…"
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                />
                <button className="chat-send-btn" onClick={submit} disabled={loading}>
                    {loading ? "Thinking…" : "Send"}
                </button>
            </div>
        </div>
    );
}
