import axios from "axios";
import { v4 as uuidv4 } from "uuid";

/* ── CONFIG ───────────────────────────────────────────────────────────── */
const MCP_URL   = import.meta.env.VITE_BACKEND_URL + "/mcp";
const OLLAMA_EP = "http://localhost:11434/v1/chat/completions";
const API_KEY   = "d_4gmAyC4yHgOIUEDIsnPPgn7evW0rQl3VZgEVylekw";
const MODEL     = "hhao/qwen2.5-coder-tools:1.5b";

const HEADERS = { "api-key": API_KEY, "Content-Type": "application/json" };

/* session-scoped state */
let toolsForModel   = [];
let fullToolList    = [];
let fullPromptList  = [];
let promptNames     = new Set();
let expectedArgs    = {};
let headersReady    = null;

const FENCED_JSON   = /```json\s*([\s\S]+?)\s*```/i;

/* ── PATH / STRING HELPERS ───────────────────────────────────────────── */
const isPathish = (s) =>
    !!s && (s.includes("/") || s.includes("\\") || s.includes(".") || s.startsWith("~"));

/* ── SHORTCUT PARSER (download / upload / …) ─────────────────────────── */
function parseShortcut(text) {
    const line = text.trim();

    /* ── download / get / fetch [file] ────────────────────────────── */
    const dl = /^(download|get|fetch)\s+(?:me\s+)?(?:the\s+)?(?:file\s+)?(.+)$/i.exec(
        line
    );
    if (dl) {
        return { name: "download_file", args: { uri: dl[2].trim() } };
    }

    /* ── securely upload <file>  OR  upload <file> securely ───────── */
    const up = /^(?:securely\s+upload|upload\s+(.+?)\s+securely|upload)\s+(.+)$/i.exec(
        line
    );
    if (up && isPathish(up[2])) {
        return { askDescription: true, filename: up[2].trim() };
    }

    /* ── what’s inside <file> ─────────────────────────────────────── */
    const inside = /^(?:what(?:'s| is)?|show|display|cat|extract)\s+.*inside.*\s+(.+)$/i.exec(
        line
    );
    if (inside) {
        return { name: "extract_metadata", args: { uri: inside[1].trim() } };
    }

    /* ── summarise <file> ─────────────────────────────────────────── */
    const sum = /^summari[sz]e\s+(.+)$/i.exec(line);
    if (sum) {
        return { name: "extract_metadata", args: { uri: sum[1].trim() } };
    }

    return null; // no shortcut matched
}

/* ── SANITISERS / EXPECTED-ARGS MAP ─────────────────────────────────── */
function sanitiseTool(fn) {
    const p = fn.parameters ?? {};
    p.type = "object";

    let raw = fn.inputSchema?.properties ?? fn.inputSchema ?? p.properties ?? {};
    if (raw?.properties) raw = raw.properties;

    p.properties = {};
    for (const [k, spec] of Object.entries(raw)) {
        p.properties[k] = { type: typeof spec?.type === "string" ? spec.type : "string" };
    }
    p.required = Object.keys(p.properties);
    fn.parameters = p;
    return fn;
}

function buildPromptFunction(p) {
    const props = Object.fromEntries(p.arguments.map((a) => [a.name, { type: "string" }]));
    return {
        name: p.name,
        description: p.description,
        parameters: { type: "object", properties: props, required: Object.keys(props) },
    };
}

function indexExpectedArgs(list) {
    expectedArgs = Object.fromEntries(list.map((f) => [f.name, Object.keys(f.parameters.properties)]));
}

function fixArgs(name, args) {
    const exp = expectedArgs[name] || [];
    const extra = Object.keys(args).filter((k) => !exp.includes(k));
    const miss = exp.filter((k) => !(k in args));
    if (extra.length === 1 && miss.length === 1) {
        args[miss[0]] = args[extra[0]];
        delete args[extra[0]];
    }
    if (name === "download_file" && typeof args.uri === "string") {
        let raw = args.uri.trim();
        if (raw.startsWith("file://")) raw = raw.replace(/^file:\/+/, "");
        if (raw.includes("/")) raw = raw.split("/").pop();
        args.uri = raw;
    }
    return args;
}

/* ── MCP BOOTSTRAP (run once) ───────────────────────────────────────── */
async function initSession() {
    if (headersReady) return headersReady;
    headersReady = (async () => {
        /* 1 ╢ initialise */
        const init = await axios.post(
            MCP_URL,
            { jsonrpc: "2.0", id: uuidv4(), method: "initialize", params: { fti: true } },
            { headers: HEADERS }
        );
        Object.assign(HEADERS, {
            "Mcp-Session-Id": init.headers["mcp-session-id"],
            "Mcp-Protocol-Version": init.data.result.protocolVersion,
        });
        await axios.post(
            MCP_URL,
            { jsonrpc: "2.0", id: uuidv4(), method: "notifications/initialized" },
            { headers: HEADERS }
        );

        /* 2 ╢ fetch tools + prompts */
        const [tr, pr] = await Promise.all([
            axios.post(
                MCP_URL,
                { jsonrpc: "2.0", id: uuidv4(), method: "tools/list" },
                { headers: HEADERS }
            ),
            axios.post(
                MCP_URL,
                { jsonrpc: "2.0", id: uuidv4(), method: "prompts/list" },
                { headers: HEADERS }
            ),
        ]);

        const rawTools   = tr.data.result.functions || [];
        const rawPrompts = pr.data.result.prompts   || [];

        /* pseudo discovery helpers */
        rawTools.push({
            name: "list_tools",
            description: "Returns a list of all available tools",
            parameters: { type: "object", properties: {}, required: [] },
        });
        rawPrompts.push({
            name: "list_prompts",
            description: "Returns a list of all available prompts",
            arguments: [],
        });

        const cleanTools   = rawTools.map(sanitiseTool);
        const cleanPrompts = rawPrompts.map(buildPromptFunction);

        toolsForModel  = [
            ...cleanTools.map((f)   => ({ type: "function", function: f })),
            ...cleanPrompts.map((f) => ({ type: "function", function: f })),
        ];
        fullToolList   = cleanTools;
        fullPromptList = rawPrompts.filter(p => p.name !== "list_prompts"); // hide helper
        promptNames    = new Set(rawPrompts.map((p) => p.name));
        indexExpectedArgs([...cleanTools, ...cleanPrompts]);
    })();
    return headersReady;
}

/* ── INTERNAL: low-level MCP call (tool or prompt) ───────────────────── */
async function _run(name, args) {
    const method = promptNames.has(name) ? "prompts/run" : "tools/call";
    const { data } = await axios.post(
        MCP_URL,
        {
            jsonrpc: "2.0",
            id: uuidv4(),
            method,
            params: { name, arguments: args },
        },
        { headers: HEADERS }
    );
    if (data.result) return data.result;
    throw new Error(data.error?.message || "MCP error");
}

/* ── PUBLIC API ──────────────────────────────────────────────────────── */
export const ollamaBridgeService = {
    /** direct tool/prompt call (used by description follow-up) */
    async run(name, args) {
        await initSession();
        return _run(name, args);
    },

    /**
     * Main entry.
     * Returns one of:
     *   • { reply }
     *   • { tools }          – list_tools
     *   • { prompts }        – list_prompts
     *   • { askDesc, file }  – need description for secure upload
     *   • { tool, result }   – executed tool/prompt
     */
    async call(userInput) {
        await initSession();

        /* 0 ╢ human shortcuts */
        const sc = parseShortcut(userInput);
        if (sc) {
            if (sc.askDescription) {
                return { askDesc: true, file: sc.filename };
            }
            const result = await _run(sc.name, sc.args);
            return { tool: sc.name, result };
        }

        /* 1 ╢ model call --------------------------------------------------- */
        const payload = {
            model: MODEL,
            messages: [
                {
                    role: "system",
                    content:
                        "You are an assistant wired to MCP. Call tools or prompts when helpful. " +
                        "When asked what you can do, call `list_tools` or `list_prompts`.",
                },
                { role: "user", content: userInput },
            ],
            tools: toolsForModel,
            tool_choice: "auto",
            stream: false,
        };
        const { data: mres } = await axios.post(OLLAMA_EP, payload, { timeout: 300_000 });
        const msg = mres.choices?.[0]?.message;
        if (!msg) return { reply: "(no response)" };

        /* 2 ╢ extract function call --------------------------------------- */
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
                ({ name: fnName, arguments: fnArgs = {} } =
                    JSON.parse(msg.content.match(FENCED_JSON)[1]));
            } catch {}
        }

        /* plain chat */
        if (!fnName) return { reply: msg.content };

        /* alias fixer → run MCP */
        fnArgs = fixArgs(fnName, { ...fnArgs });

        if (fnName === "list_tools")   return { tools: fullToolList };
        if (fnName === "list_prompts") return { prompts: fullPromptList };

        const result = await _run(fnName, fnArgs);
        return { tool: fnName, result };
    },
};
