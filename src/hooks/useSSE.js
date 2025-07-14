import {useEffect, useState} from 'react';
import {useMcpContext} from '../context/McpContext';

// If you proxy “/mcp” → 8000 in vite.config.js you can keep PATH = '/mcp/stream'
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export function useSSE(path, sessionId) {
    const {apiKey} = useMcpContext();       // ← no change to context itself
    const [events, setEvents] = useState([]);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!sessionId || !apiKey) return;     // wait until initialize

        const url = `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
        console.log('[SSE] Connecting →', url);

        const controller = new AbortController();

        (async () => {
            try {
                const res = await fetch(url, {
                    headers: {
                        'Mcp-Session-Id': sessionId,
                        'api-key': apiKey,            // ★ satisfies guard_mcp
                        Accept: 'text/event-stream',
                    },
                    signal: controller.signal,
                });

                if (!res.ok || !res.body) {
                    console.error('[SSE] Bad status', res.status);
                    return;
                }

                setConnected(true);
                const reader = res.body.getReader();
                const decoder = new TextDecoder('utf-8');
                let buffer = '';

                while (true) {
                    const {value, done} = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, {stream: true});
                    const parts = buffer.split('\n\n');
                    buffer = parts.pop();                 // keep remainder

                    for (const chunk of parts) {
                        if (!chunk.startsWith('data: ')) continue;
                        const data = chunk.slice(6);
                        try {
                            const json = JSON.parse(data);
                            setEvents(prev => [...prev, json]);
                        } catch {
                            console.warn('[SSE] Non-JSON event:', data);
                        }
                    }
                }
            } catch (err) {
                if (err.name !== 'AbortError') console.error('[SSE]', err);
            } finally {
                setConnected(false);
            }
        })();

        return () => controller.abort();
    }, [path, sessionId, apiKey]);

    return {events, connected};
}
