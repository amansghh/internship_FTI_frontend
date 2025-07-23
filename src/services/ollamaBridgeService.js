import axios from "axios";
import {v4 as uuidv4} from "uuid";

/* ── CONFIG ────────────────────────────────────────────────────────── */
const MCP_URL = import.meta.env.VITE_BACKEND_URL + '/mcp';
const OLLAMA_EP = "http://localhost:11434/v1/chat/completions";
const API_KEY = "8QC61ErsDdHCMEo7b8aZD8UqdzZ_pXE5GsQkv8hywzw";
const MODEL = "hhao/qwen2.5-coder-tools:1.5b";

const HEADERS = {"api-key": API_KEY, "Content-Type": "application/json"};

/* session-scoped state */
let toolsForModel = [];          // OpenAI “functions” array
let fullToolList = [];          // original list_tools payload
let expectedArgs = {};          // tool_name -> [param1, …]
let headersReady = null;        // Promise that resolves when MCP ready

/* fenced-block regex */
const FENCED_JSON = /```json\s*([\s\S]+?)\s*```/i;

/* ─────────────────── helpers ─────────────────────────────────────── */
function sanitise(fn) {
    /** unwrap remote JSON-Schema wrappers & flatten types */
    const p = fn.parameters ?? {};
    p.type = "object";

    /* 1) where are the real properties? */
    let raw = ("inputSchema" in fn && !("properties" in fn.inputSchema))
        ? fn.inputSchema
        : ("inputSchema" in fn && "properties" in fn.inputSchema)
            ? fn.inputSchema.properties
            : (p.properties ?? {});

    if (raw && "properties" in raw) raw = raw.properties;    // one more peel

    p.properties = {};
    for (const [k, spec] of Object.entries(raw)) {
        const t = (spec && typeof spec.type === "string") ? spec.type : "string";
        p.properties[k] = {type: t};
    }
    p.required = Object.keys(p.properties);
    fn.parameters = p;
    return fn;
}

/* build EXPECTED_ARGS map whenever we refresh tools */
function indexExpectedArgs(clean) {
    expectedArgs = Object.fromEntries(
        clean.map(f => [f.name, Object.keys(f.parameters.properties)])
    );
}

/* alias-fixer: 1 extra + 1 missing → rename */
function fixArgs(tool, args) {
    const exp = expectedArgs[tool] || [];
    const extra = Object.keys(args).filter(k => !exp.includes(k));
    const missing = exp.filter(k => !(k in args));
    if (extra.length === 1 && missing.length === 1) {
        args[missing[0]] = args[extra[0]];
        delete args[extra[0]];
    }

    // 🧠 Normalize path for `download_file` like resolve_path() in backend
    if (tool === "download_file" && typeof args.uri === "string") {
        let raw = args.uri.trim();

        // Strip file:// prefix and decode
        if (raw.startsWith("file://")) {
            try {
                raw = decodeURIComponent(raw.replace("file://", "")).replace(/^\/+/, "");
            } catch {
                // fallback if decodeURIComponent fails
                raw = raw.replace("file://", "").replace(/^\/+/, "");
            }
        }

        // Strip absolute mobile/OS paths → keep only the filename
        if (raw.includes("/")) {
            raw = raw.split("/").pop();
        }

        // Final filename used in MCP call
        args.uri = raw;
    }

    return args;
}


/* ─────────────────── MCP bootstrap ──────────────────────────────── */
async function initSession() {
    /* Initialise only once – reuse promise */
    if (headersReady) return headersReady;
    headersReady = (async () => {
        /* 1. initialise */
        const init = await axios.post(MCP_URL, {
            jsonrpc: "2.0", id: uuidv4(), method: "initialize", params: {fti: true}
        }, {headers: HEADERS});
        Object.assign(HEADERS, {
            "Mcp-Session-Id": init.headers["mcp-session-id"],
            "Mcp-Protocol-Version": init.data.result.protocolVersion,
        });
        await axios.post(MCP_URL, {
            jsonrpc: "2.0", id: uuidv4(), method: "notifications/initialized"
        }, {headers: HEADERS});

        /* 2. fetch + sanitise tools */
        const tr = await axios.post(MCP_URL, {
            jsonrpc: "2.0", id: uuidv4(), method: "tools/list"
        }, {headers: HEADERS});

        const raw = tr.data.result.functions || [];
        if (!raw.find(f => f.name === "list_tools")) {
            raw.push({
                name: "list_tools",
                description: "Returns a list of all available tools",
                parameters: {type: "object", properties: {}, required: []}
            });
        }
        const clean = raw.map(sanitise);
        indexExpectedArgs(clean);
        fullToolList = clean;
        toolsForModel = clean.map(f => ({type: "function", function: f}));
    })();
    return headersReady;
}

/* ─────────────────── public API ─────────────────────────────────── */
export const ollamaBridgeService = {
    /**
     * Returns:
     *  • { reply }                     simple chat
     *  • { tools }                     list_tools
     *  • { tool, result }              generic tool output
     */
    async call(userInput) {
        await initSession();

        /* ---- call Ollama ------------------------------------------------ */
        const payload = {
            model: MODEL,
            messages: [
                {
                    role: "system",
                    content: "You are an assistant with function-calling. "
                        + "Always call a tool when appropriate. When asked "
                        + "what you can do, call `list_tools`."
                },
                {role: "user", content: userInput}
            ],
            tools: toolsForModel,
            tool_choice: "auto",
            stream: false,
        };
        const {data: ores} = await axios.post(OLLAMA_EP, payload, {timeout: 300_000});
        const msg = ores.choices?.[0]?.message;
        if (!msg) return {reply: "(no response)"};

        /* ---- extract function call -------------------------------------- */
        let fnName, fnArgs = {};
        if (msg.tool_calls?.length) {
            const fc = msg.tool_calls[0].function;
            fnName = fc.name;
            fnArgs = JSON.parse(fc.arguments || "{}");
        } else if (msg.function_call) {
            const fc = msg.function_call;
            fnName = fc.name;
            fnArgs = JSON.parse(fc.arguments || "{}");
        } else if (msg.content && FENCED_JSON.test(msg.content)) {
            try {
                ({name: fnName, arguments: fnArgs = {}} = JSON.parse(
                    msg.content.match(FENCED_JSON)[1]));
            } catch {
            }
        } else if (/\b(tool|function)s?\b/i.test(userInput)) {
            fnName = "list_tools";
            fnArgs = {};
        }

        /* ---- plain chat -------------------------------------------------- */
        if (!fnName) return {reply: msg.content};

        /* ---- alias fixer ------------------------------------------------- */
        fnArgs = fixArgs(fnName, {...fnArgs});

        /* ---- MCP call ---------------------------------------------------- */
        const {data: tres} = await axios.post(MCP_URL, {
            jsonrpc: "2.0", id: uuidv4(), method: "tools/call",
            params: {name: fnName, arguments: fnArgs}
        }, {headers: HEADERS});

        if (fnName === "list_tools") return {tools: fullToolList};
        if (tres.result) return {tool: fnName, result: tres.result};
        throw new Error(tres.error?.message || "Unknown MCP error");
    }
};
