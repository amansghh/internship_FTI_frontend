import React, {useEffect, useMemo, useRef, useState} from 'react';
import {toast} from 'react-toastify';
import {useMcpContext} from '../../context/McpContext.jsx';
import {useSSE} from '../../hooks/useSSE';

/**
 * Global, headless listener that shows toasts for MCP SSE events.
 * - List-changed events always show.
 * - Resource-updated shows only if user subscribed to the URI.
 */
export default function NotificationsProvider({onNavigate}) {
    const {sessionId} = useMcpContext();
    const {events, connected} = useSSE('/mcp/stream', sessionId);

    // pull subscribed URIs saved by useResources()
    const subscribed = useMemo(() => {
        try {
            return new Set(JSON.parse(sessionStorage.getItem('subscribed-resources') || '[]'));
        } catch {
            return new Set();
        }
    }, []);

    const seenRef = useRef(new Set());
    const [lastLen, setLastLen] = useState(0);

    const openResource = () => {
        onNavigate?.('mcp');   // just switch tab
    };


    const showToast = (title, body, ctaLabel, onClick) => {
        toast.info(
            <div style={{lineHeight: 1.3}}>
                <strong style={{display: 'block', marginBottom: 4}}>{title}</strong>
                <div style={{opacity: 0.9, fontSize: 14, marginBottom: 8}}>{body}</div>
                {onClick && (
                    <button
                        onClick={onClick}
                        style={{
                            border: 'none',
                            padding: '6px 10px',
                            borderRadius: 6,
                            cursor: 'pointer',
                            background: '#3b82f6',
                            color: '#fff',
                            fontWeight: 600,
                        }}
                    >
                        {ctaLabel}
                    </button>
                )}
            </div>,
            {autoClose: 8000, closeOnClick: false}
        );
    };

    // Normalize server events to { kind, uri }
    const toKind = (evt) => {
        if (!evt) return null;
        const method = evt.method || evt.kind;
        const uri = evt.params?.uri ?? evt.uri ?? null;

        switch (method) {
            case 'notifications/resources/updated':
                return {kind: 'resource_updated', uri};
            case 'notifications/resources/list_changed':
            case 'notifications/resources':
                return {kind: 'resources'};
            case 'notifications/tools/list_changed':
            case 'notifications/tools':
                return {kind: 'tools'};
            case 'notifications/prompts/list_changed':
            case 'notifications/prompts':
                return {kind: 'prompts'};
            default:
                // fallback: accept pre-normalized {kind, uri}
                if (evt.kind) return {kind: evt.kind, uri};
                return null;
        }
    };

    useEffect(() => {
        if (events.length === 0 || events.length === lastLen) return;

        for (let i = lastLen; i < events.length; i++) {
            const raw = events[i];
            const norm = toKind(raw);
            if (!norm?.kind) continue;

            // de-dupe
            const key = JSON.stringify({k: norm.kind, u: norm.uri});
            if (seenRef.current.has(key)) continue;
            seenRef.current.add(key);

            switch (norm.kind) {
                case 'resource_updated': {
                    const uri = norm.uri;
                    if (!uri) break;
                    if (subscribed.has(uri)) {
                        const short = uri.replace(/^file:\/\//, '');
                        showToast('Resource updated', short, 'Open', () => openResource(uri));
                    }
                    break;
                }
                case 'resources':
                    showToast('Resources list changed', 'New or removed resources detected.', 'Open', () => onNavigate?.('mcp'));
                    break;
                case 'tools':
                    showToast('Tools list changed', 'Available tools were updated.', 'Open', () => onNavigate?.('mcp'));
                    break;
                case 'prompts':
                    showToast('Prompts list changed', 'Prompt catalog was updated.', 'Open', () => onNavigate?.('mcp'));
                    break;
                default:
                    break;
            }
        }

        setLastLen(events.length);
    }, [events, lastLen, subscribed, onNavigate]);

    // One-time “connected” toast (optional)
    const wasConnected = useRef(false);
    useEffect(() => {
        if (connected && !wasConnected.current) {
            wasConnected.current = true;
            toast.success('Connected to MCP event stream', {autoClose: 2500});
        }
    }, [connected]);

    return null;
}
