import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const MCP_URL   = "http://localhost:8000/mcp";
const OLLAMA_EP = "http://localhost:11434/v1/chat/completions";
const API_KEY   = "8QC61ErsDdHCMEo7b8aZD8UqdzZ_pXE5GsQkv8hywzw";
const MODEL     = "hhao/qwen2.5-coder-tools:1.5b";

const HEADERS = {
    "api-key": API_KEY,
    "Content-Type": "application/json",
};

let sessionHeaders = null;
let toolsForModel  = [];
let fullToolList   = [];

// regex to pick up ```json { … } ```
const FENCED_JSON = /```json\s*([\s\S]+?)\s*```/i;

function sanitise(fn) {
    const p = fn.parameters ?? {};
    p.type       = "object";
    p.properties = p.properties ?? {};
    for (let [k,v] of Object.entries(p.properties)) {
        if (typeof v === "string")              p.properties[k] = { type: v };
        else if (v && typeof v.type === "string") p.properties[k] = { type: v.type };
        else                                      p.properties[k] = { type: "string" };
    }
    p.required = Object.keys(p.properties);
    fn.parameters = p;
    return fn;
}

async function initSession() {
    // initialize
    const init = await axios.post(MCP_URL, {
        jsonrpc:"2.0", id:uuidv4(), method:"initialize", params:{ fti:true }
    }, { headers: HEADERS });
    sessionHeaders = {
        "Mcp-Session-Id":       init.headers["mcp-session-id"],
        "Mcp-Protocol-Version": init.data.result.protocolVersion,
    };
    Object.assign(HEADERS, sessionHeaders);

    // notifications
    await axios.post(MCP_URL, {
        jsonrpc:"2.0", id:uuidv4(), method:"notifications/initialized"
    }, { headers: HEADERS });

    // fetch tools
    const tr = await axios.post(MCP_URL, {
        jsonrpc:"2.0", id:uuidv4(), method:"tools/list"
    }, { headers: HEADERS });
    const raw = tr.data.result.functions || [];

    if (!raw.find(f=>f.name==="list_tools")) {
        raw.push({
            name: "list_tools",
            description: "Returns a list of all available tools",
            parameters: { type:"object", properties:{}, required:[] },
        });
    }

    const clean = raw.map(sanitise);
    fullToolList  = clean;
    toolsForModel = clean.map(f=>({ type:"function", function:f }));
}

export const ollamaBridgeService = {
    /**
     * Returns:
     *  - { tools: Tool[] }           when list_tools
     *  - { tool: string, result: any } for extract_metadata / download_file / …
     *  - { reply: string }           for plain chat
     */
    async call(userInput) {
        if (!sessionHeaders) await initSession();

        const payload = {
            model: MODEL,
            messages: [
                { role:"system",
                    content:"You are an assistant with function-calling. Always call a tool when appropriate. When the user asks what you can do, call `list_tools`." },
                { role:"user", content:userInput },
            ],
            tools: toolsForModel,
            tool_choice: "auto",
            stream: false,
        };
        const ores = await axios.post(OLLAMA_EP, payload, { timeout:300_000 });
        if (ores.data.error) throw new Error(ores.data.error.message);
        const msg = ores.data.choices?.[0]?.message;
        if (!msg) throw new Error("No response from Ollama.");

        // 1) detect fn
        let fnName, fnArgs={};
        if (msg.tool_calls?.length) {
            fnName = msg.tool_calls[0].function.name;
            fnArgs = JSON.parse(msg.tool_calls[0].function.arguments||"{}");
        }
        else if (msg.function_call) {
            fnName = msg.function_call.name;
            fnArgs = JSON.parse(msg.function_call.arguments||"{}");
        }
        // fenced JSON
        else if (msg.content && FENCED_JSON.test(msg.content)) {
            try {
                const jsonPart = msg.content.match(FENCED_JSON)[1];
                const blob = JSON.parse(jsonPart);
                fnName = blob.name;
                fnArgs = blob.arguments||{};
            } catch{}
        }
        // explicit extract keyword overrides download_file
        else if (/^\s*extract/i.test(userInput)) {
            fnName = "extract_metadata";
            fnArgs = { uri: (userInput.match(/"uri":\s*"([^"]+)"/)||[])[1] };
        }
        // fallback heuristic
        else if (/\b(tool|function)s?\b/i.test(userInput)) {
            fnName = "list_tools";
            fnArgs = {};
        }

        // 2) plain text
        if (!fnName) {
            return { reply: msg.content };
        }

        // 3) call MCP
        const tres = await axios.post(MCP_URL, {
            jsonrpc:"2.0", id:uuidv4(), method:"tools/call",
            params:{ name:fnName, arguments:fnArgs }
        }, { headers: HEADERS });
        const out = tres.data;

        // 4) download_file special-case
        if (fnName==="download_file" && out.result?.data) {
            const { data:b64, filename } = out.result;
            const bin = Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
            const blob = new Blob([bin]);
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            a.click();
            return { tool:fnName, result: out.result };
        }

        // 5) list_tools
        if (fnName==="list_tools") {
            return { tools: fullToolList };
        }

        // 6) generic JSON result
        if (out.result) {
            return { tool:fnName, result: out.result };
        }

        throw new Error(out.error?.message||"Unknown MCP error");
    }
};
