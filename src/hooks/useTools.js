import {useCallback, useEffect, useRef, useState} from 'react';
import {useMcpContext} from '../context/McpContext';
import {listTools} from '../services/toolService';
import {extractErrorInfo} from '../utils/errorUtils';
import {useRateLimit} from '../context/RateLimitContext.jsx';

const CACHE_KEY = 'mcp-tools-cache';

export const useTools = () => {
    const {apiKey, sessionId, protocolVersion} = useMcpContext();
    const {clearRate} = useRateLimit();

    const clearRateRef = useRef(clearRate);
    clearRateRef.current = clearRate;

    // Load last-good tools from cache (so refresh while rate-limited still shows cards)
    const cached = (() => {
        try {
            return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
        } catch {
            return [];
        }
    })();

    const [tools, setTools] = useState(Array.isArray(cached) ? cached : []);
    const [fetching, setFetching] = useState(false);
    const [loadingFirst, setLoadingFirst] = useState(true); // true until first attempt finishes
    const [errorInfo, setErrorInfo] = useState(null);       // non-429 only
    const [showEmpty, setShowEmpty] = useState(false);      // only if first *successful* fetch returned empty

    // Track whether we ever had non-empty data
    const hasDataRef = useRef((tools && tools.length > 0) || false);

    const fetchTools = useCallback(async () => {
        if (!apiKey || !sessionId || !protocolVersion) return;
        setFetching(true);
        try {
            const result = await listTools(apiKey, sessionId, protocolVersion);
            console.log("TOOLS RESPONSE:", result);

            const arr = Array.isArray(result) ? result : [];

            if (arr.length > 0) {
                setTools(arr);
                hasDataRef.current = true;
                setShowEmpty(false);
                // update cache
                try {
                    localStorage.setItem(CACHE_KEY, JSON.stringify(arr));
                } catch {
                }
            } else {
                // Empty success: only show empty if we've never had data at all
                if (!hasDataRef.current) {
                    setTools([]);       // ok to show empty grid message
                    setShowEmpty(true);
                    try {
                        localStorage.removeItem(CACHE_KEY);
                    } catch {
                    }
                }
                // else: keep previous tools (do NOT clobber)
            }

            setErrorInfo(null);
            clearRateRef.current?.(); // success → hide banner
        } catch (err) {
            const is429 = err?.response?.status === 429;
            const info = extractErrorInfo(err);

            // On 429: keep whatever we have (cached or last-good); no local error
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
            setLoadingFirst(false); // first attempt (success or error) finished
        }
    }, [apiKey, sessionId, protocolVersion]);

    useEffect(() => {
        fetchTools();
    }, [fetchTools]);

    return {
        tools,
        loading: loadingFirst,  // spinner only before the very first attempt finishes
        fetching,               // true during active fetches
        errorInfo,              // non-429 errors only
        showEmpty,              // true only if first successful fetch was empty
        refetch: fetchTools,
    };
};
