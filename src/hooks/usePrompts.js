import {useCallback, useEffect, useRef, useState} from 'react';
import {useMcpContext} from '../context/McpContext';
import {listPrompts} from '../services/promptService';
import {extractErrorInfo} from '../utils/errorUtils';
import {useRateLimit} from '../context/RateLimitContext.jsx';

const CACHE_KEY = 'mcp-prompts-cache';

export const usePrompts = () => {
    const {apiKey, sessionId, protocolVersion} = useMcpContext();
    const {clearRate} = useRateLimit();
    const clearRateRef = useRef(clearRate);
    clearRateRef.current = clearRate;

    // Load last-good prompts from cache so refresh during 429 still shows cards
    const cached = (() => {
        try {
            return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
        } catch {
            return [];
        }
    })();

    const [prompts, setPrompts] = useState(Array.isArray(cached) ? cached : []);
    const [fetching, setFetching] = useState(false);
    const [loadingFirst, setLoadingFirst] = useState(true); // until first attempt finishes
    const [errorInfo, setErrorInfo] = useState(null);       // non-429 only
    const [showEmpty, setShowEmpty] = useState(false);      // only if first successful fetch returned empty

    // Have we ever had non-empty data?
    const hasDataRef = useRef((prompts && prompts.length > 0) || false);

    const fetchPrompts = useCallback(async () => {
        if (!apiKey || !sessionId || !protocolVersion) return;
        setFetching(true);
        try {
            const result = await listPrompts(apiKey, sessionId, protocolVersion);
            const arr = Array.isArray(result) ? result : [];

            if (arr.length > 0) {
                setPrompts(arr);
                hasDataRef.current = true;
                setShowEmpty(false);
                try {
                    localStorage.setItem(CACHE_KEY, JSON.stringify(arr));
                } catch {
                }
            } else {
                // Empty success: only show empty if we've never had data at all
                if (!hasDataRef.current) {
                    setPrompts([]);
                    setShowEmpty(true);
                    try {
                        localStorage.removeItem(CACHE_KEY);
                    } catch {
                    }
                }
                // else: keep previous prompts (do NOT clobber)
            }

            setErrorInfo(null);
            clearRateRef.current?.(); // success → hide global banner
        } catch (err) {
            const is429 = err?.response?.status === 429;
            const info = extractErrorInfo(err);

            // Keep last-good on 429. Only surface non-429 errors locally.
            if (!is429) {
                setErrorInfo({
                    ...info,
                    until:
                        typeof info.retryAfterSeconds === 'number'
                            ? Date.now() + info.retryAfterSeconds * 1000
                            : null,
                });
            }
        } finally {
            setFetching(false);
            setLoadingFirst(false);
        }
    }, [apiKey, sessionId, protocolVersion]);

    useEffect(() => {
        fetchPrompts();
    }, [fetchPrompts]);

    return {
        prompts,
        loading: loadingFirst,
        fetching,
        errorInfo,   // non-429 only
        showEmpty,   // first-success empty only
        refetch: fetchPrompts,
    };
};
