import React, {useState, memo} from "react";
import "../assets/css/OllamaBridge.css";
import "../assets/css/ToolsTab.css";
import {Prism as Syntax} from "react-syntax-highlighter";
import {dracula} from "react-syntax-highlighter/dist/esm/styles/prism";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {ollamaBridgeService} from "../services/ollamaBridgeService";

/* ── memoised JSON pretty-printer (shared look-&-feel) ───────── */
const JsonBlock = memo(({obj}) => (
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

/* ────────────────────────────────────────────────────────────── */
export default function OllamaBridgePage() {
    const [userInput, setUserInput] = useState("");
    const [chatLog, setChatLog] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState(null);

    /* send prompt → Ollama ⇆ MCP */
    const submit = async () => {
        if (!userInput.trim()) return;
        const prompt = userInput.trim();

        setChatLog(c => [...c, {role: "user", text: prompt}]);
        setUserInput("");
        setLoading(true);

        try {
            const out = await ollamaBridgeService.call(prompt);

            if (out.tools) {
                setChatLog(c => [...c, {role: "assistant", tools: out.tools}]);
            } else if (out.tool) {
                setChatLog(c => [...c,
                    {role: "assistant", text: `🔧 Called ${out.tool}`, result: out.result}
                ]);
            } else {
                setChatLog(c => [...c, {role: "assistant", text: out.reply}]);
            }
        } catch (err) {
            setChatLog(c => [...c, {role: "assistant", text: `❌ ${err.message}`}]);
        } finally {
            setLoading(false);
        }
    };

    /* ──────────────────────────────────────────────────────────── */
    return (
        <div className="bridge-container">
            <h2 className="bridge-title">Ollama ⇆ MCP</h2>

            {/* conversation */}
            <div className="chat-log">
                {chatLog.map((m, i) => (
                    <div key={i} className={`chat-message ${m.role}`}>
                        <span>{m.role === "user" ? "🧑" : "🤖"}&nbsp;</span>
                        {m.text}

                        {/* list_tools → grid of cards */}
                        {m.tools && (
                            <div className="tool-grid" style={{marginTop: "0.5rem"}}>
                                {m.tools.map(t => (
                                    <div key={t.name}
                                         className="tool-card"
                                         onClick={() => setSelected(t)}>
                                        <h4>{t.name}</h4>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* any JSON result */}
                        {m.result && <JsonBlock obj={m.result}/>}
                    </div>
                ))}
            </div>

            {/* tool-detail modal (pixel-perfect match with ToolsTab) */}
            {selected && (
                <div className="tool-detail-overlay" onClick={() => setSelected(null)}>
                    <div className="tool-detail" onClick={e => e.stopPropagation()}>

                        <button className="close-btn" onClick={() => setSelected(null)}>×</button>
                        <h3>{selected.name}</h3>

                        {/* ◉ Markdown description rendered with same component */}
                        <div className="tool-markdown">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    /* syntax-highlight fenced blocks just like ToolsTab */
                                    code: ({inline, className, children, ...props}) =>
                                        inline ? (
                                            <code className={className} {...props}>{children}</code>
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
                                        )
                                }}
                            >
                                {selected.description}
                            </ReactMarkdown>
                        </div>

                        <div className="tool-detail-body">
                            <div className="tool-info">
                                <div className="tool-meta">
                                    <p><strong>Binary:</strong> {selected.binary ? "✅ Yes" : "❌ No"}</p>
                                    {"fti_only" in selected &&
                                        <p><strong>FTI Only:</strong> {selected.fti_only ? "✅ Yes" : "❌ No"}</p>}
                                </div>

                                <div className="tool-schema">
                                    <h4>Input Schema</h4>
                                    {/* tools coming from list_tools carry `inputSchema`;                    */
                                        /* single-call payloads carry `parameters` – support both  */}
                                    {(selected.inputSchema && Object.keys(selected.inputSchema).length) ?
                                        <JsonBlock obj={selected.inputSchema}/> :
                                        (selected.parameters && Object.keys(selected.parameters).length) ?
                                            <JsonBlock obj={selected.parameters}/> :
                                            <p className="schema-placeholder">No input schema.</p>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* prompt row */}
            <div className="chat-input-row">
                <input
                    className="chat-input"
                    value={userInput}
                    onChange={e => setUserInput(e.target.value)}
                    placeholder="Type your prompt…"
                    onKeyDown={e => e.key === "Enter" && submit()}
                />
                <button className="chat-send-btn" onClick={submit} disabled={loading}>
                    {loading ? "Thinking…" : "Send"}
                </button>
            </div>
        </div>
    );
}
