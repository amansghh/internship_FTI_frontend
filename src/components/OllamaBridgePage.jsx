import React, {useState} from "react";
import "../assets/css/OllamaBridge.css";
import "../assets/css/ToolsTab.css";
import "../assets/css/SecureFile.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {Prism as Syntax} from "react-syntax-highlighter";
import {dracula} from "react-syntax-highlighter/dist/esm/styles/prism";
import {ollamaBridgeService} from "../services/ollamaBridgeService";

/* ── File preview component (unchanged) ─────────────────────────────── */
const FileBlock = ({file}) => {
    const [expanded, setExpanded] = useState(false);
    const [previewing, setPreviewing] = useState(false);
    const {filename, mimeType, size, rawData} = file;

    const toggle = () => setExpanded((v) => !v);
    const download = () => {
        const bytes = Uint8Array.from(atob(rawData), (c) => c.charCodeAt(0));
        const blob = new Blob([bytes], {type: mimeType});
        const url = URL.createObjectURL(blob);
        const a = Object.assign(document.createElement("a"), {href: url, download: filename});
        a.click();
        URL.revokeObjectURL(url);
    };

    const displayData = expanded ? rawData : rawData.slice(0, 60) + "…";
    const jsonLines = [
        ["filename", filename],
        ["mimeType", mimeType],
        ["size", size],
        ["data", displayData],
    ];

    return (
        <div className="file-block">
            <div className="json-preview centered">
                {jsonLines.map(([k, v]) => (
                    <div key={k} className="json-line">
                        <span className="json-key">"{k}":</span>{" "}
                        <span className="json-value">
              {k === "data" ? `"${v}"` : typeof v === "string" ? `"${v}"` : v}
            </span>
                        {k === "data" && (
                            <button className="toggle-btn" onClick={toggle}>
                                [{expanded ? "Hide" : "Show full"}]
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <div className="inline-actions">
                <button onClick={() => setPreviewing(true)}>Preview</button>
                <button onClick={download}>Download</button>
            </div>

            {previewing && (
                <div className="modal-overlay" onClick={() => setPreviewing(false)}>
                    <div className="modal-window" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setPreviewing(false)}>
                            ×
                        </button>

                        {mimeType.startsWith("image/") && (
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
                        )}

                        {mimeType === "application/pdf" && (
                            <iframe
                                src={URL.createObjectURL(
                                    new Blob(
                                        [Uint8Array.from(atob(rawData), (c) => c.charCodeAt(0))],
                                        {type: mimeType}
                                    )
                                )}
                                width="100%"
                                height="500"
                                style={{border: "none"}}
                            />
                        )}

                        {mimeType.startsWith("text/") && (
                            <pre className="text-preview">
                {new TextDecoder().decode(
                    Uint8Array.from(atob(rawData), (c) => c.charCodeAt(0))
                )}
              </pre>
                        )}

                        {!mimeType.startsWith("image/")
                            && mimeType !== "application/pdf"
                            && !mimeType.startsWith("text/") && (
                                <p>Preview not supported for {mimeType}</p>
                            )}

                        <button className="download-btn" onClick={download}>
                            ⬇ Download
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ── Pretty JSON viewer (unchanged) ─────────────────────────────────── */
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

/* ── MAIN COMPONENT ─────────────────────────────────────────────────-- */
export default function OllamaBridgePage() {
    const [userInput, setUserInput] = useState("");
    const [chatLog, setChatLog] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState(null);
    const [awaitingDesc, setAwaitingDesc] = useState(null); // ← filename waiting for description

    /* helper to push new chat message */
    const push = (msg) => setChatLog((c) => [...c, msg]);

    const submit = async () => {
        if (!userInput.trim()) return;
        const prompt = userInput.trim();

        /* 1 ▸ send user message */
        push({role: "user", text: prompt});
        setUserInput("");
        setLoading(true);

        try {
            /* 2 ▸ if we’re waiting for a description → call secure_transfer */
            if (awaitingDesc) {
                const result = await ollamaBridgeService.run("secure_transfer", {
                    action: "upload",
                    filename: awaitingDesc,
                    description: prompt,
                });
                push({
                    role: "assistant",
                    text: `🔧 Called secure_transfer (upload '${awaitingDesc}')`,
                    result,
                });
                setAwaitingDesc(null);
                setLoading(false);
                return;
            }

            /* 3 ▸ normal flow via service */
            const out = await ollamaBridgeService.call(prompt);

            if (out.askDesc) {
                /* backend asked for a description – store state & prompt user */
                setAwaitingDesc(out.file);
                push({
                    role: "assistant",
                    text: `🤖 Please provide a short description for '${out.file}'.`,
                });
            } else if (out.tools) {
                push({role: "assistant", tools: out.tools});
            } else if (out.prompts) {
                push({role: "assistant", prompts: out.prompts});
            } else if (out.tool) {
                let msg = `🔧 Called ${out.tool}`;
                let result = out.result;

                if (out.tool === "download_file" && result?.data) {
                    const {filename, mimeType, size, data: rawData} = result;
                    msg += `\n💾 File ready: ${filename}`;
                    result = {filename, mimeType, size, rawData};
                }
                push({role: "assistant", text: msg, result});
            } else {
                push({role: "assistant", text: out.reply});
            }
        } catch (err) {
            push({role: "assistant", text: `❌ ${err.message}`});
            setAwaitingDesc(null);
        } finally {
            setLoading(false);
        }
    };

    /* ── RENDER ─────────────────────────────────────────────────────── */
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

                        {m.prompts && (
                            <div className="tool-grid" style={{marginTop: "0.5rem"}}>
                                {m.prompts.map((p) => (
                                    <div
                                        key={p.name}
                                        className="tool-card"
                                        onClick={() => setSelected(p)}
                                    >
                                        <h4>{p.name}</h4>
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

            {/* detail modal for tool or prompt */}
            {selected && (
                <div
                    className="tool-detail-overlay"
                    onClick={() => setSelected(null)}
                >
                    <div
                        className="tool-detail"
                        onClick={(e) => e.stopPropagation()}
                    >
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
                                    {"binary" in selected && (
                                        <p>
                                            <strong>Binary:</strong>{" "}
                                            {selected.binary ? "✅ Yes" : "❌ No"}
                                        </p>
                                    )}
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
                                    ) : selected.arguments && selected.arguments.length ? (
                                        <JsonBlock
                                            obj={Object.fromEntries(
                                                selected.arguments.map((a) => [a.name, "string"])
                                            )}
                                        />
                                    ) : (
                                        <p className="schema-placeholder">No input schema.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* input bar */}
            <div className="chat-input-row">
                <input
                    className="chat-input"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Type your prompt…"
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                />
                <button className="chat-send-btn" onClick={submit} disabled={loading}>
                    {loading ? "Thinking…" : awaitingDesc ? "Send desc" : "Send"}
                </button>
            </div>
        </div>
    );
}
