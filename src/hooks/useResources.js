import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useMcpContext} from '../context/McpContext';
import {listResources, readResource} from '../services/resourceService';
import {subscribeResource, unsubscribeResource} from '../services/subscriptionService';
import {extractErrorInfo} from '../utils/errorUtils';
import {useRateLimit} from '../context/RateLimitContext.jsx';

const CACHE_LIST = 'mcp-resources-cache';
const CACHE_SELECTED = 'mcp-resource-selected';

export const useResources = () => {
    const {apiKey, sessionId, protocolVersion} = useMcpContext();
    const {clearRate} = useRateLimit();
    const clearRateRef = useRef(clearRate);
    clearRateRef.current = clearRate;

    // Load cached list + last selected so refresh under 429 still shows stuff
    const cachedList = (() => {
        try {
            return JSON.parse(localStorage.getItem(CACHE_LIST) || '[]');
        } catch {
            return [];
        }
    })();
    const cachedSelected = (() => {
        try {
            return sessionStorage.getItem(CACHE_SELECTED) || null;
        } catch {
            return null;
        }
    })();

    const [resources, setResources] = useState(Array.isArray(cachedList) ? cachedList : []);
    const [selected, setSelected] = useState(cachedSelected);
    const [content, setContent] = useState({text: '', mimeType: '', metadata: ''});

    // list states
    const [fetchingList, setFetchingList] = useState(false);
    const [loadingFirstList, setLoadingFirstList] = useState(true);
    const [listError, setListError] = useState(null);      // non-429 only
    const [showEmptyList, setShowEmptyList] = useState(false);
    const hadListDataRef = useRef((resources && resources.length > 0) || false);

    // content states
    const [contentLoading, setContentLoading] = useState(false);
    const [contentError, setContentError] = useState(null); // non-429 only
    const hasContentRef = useRef(false);

    // persist selected
    useEffect(() => {
        try {
            if (selected) sessionStorage.setItem(CACHE_SELECTED, selected);
            else sessionStorage.removeItem(CACHE_SELECTED);
        } catch {
        }
    }, [selected]);

    const fetchList = useCallback(async () => {
        if (!apiKey || !sessionId || !protocolVersion) return;
        setFetchingList(true);
        try {
            const list = await listResources(apiKey, sessionId, protocolVersion);
            const arr = Array.isArray(list) ? list : [];
            if (arr.length > 0) {
                setResources(arr);
                hadListDataRef.current = true;
                setShowEmptyList(false);
                try {
                    localStorage.setItem(CACHE_LIST, JSON.stringify(arr));
                } catch {
                }
            } else {
                if (!hadListDataRef.current) {
                    setResources([]);
                    setShowEmptyList(true);
                    try {
                        localStorage.removeItem(CACHE_LIST);
                    } catch {
                    }
                }
                // else: keep previous resources (do NOT clobber)
            }
            setListError(null);
            clearRateRef.current?.(); // success → hide global banner
        } catch (err) {
            const is429 = err?.response?.status === 429;
            const info = extractErrorInfo(err);
            if (!is429) {
                setListError(info.message || 'Failed to load resources');
            }
        } finally {
            setFetchingList(false);
            setLoadingFirstList(false);
        }
    }, [apiKey, sessionId, protocolVersion]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    const fetchContent = useCallback(async (uri) => {
        if (!uri || !apiKey || !sessionId || !protocolVersion) return;
        setContentLoading(true);
        // do NOT clear existing content here; keeps last-good visible on 429
        setContentError(null);
        try {
            const data = await readResource(uri, apiKey, sessionId, protocolVersion);
            setContent(data || {text: '', mimeType: '', metadata: ''});
            hasContentRef.current = Boolean(data?.text || data?.metadata);
            clearRateRef.current?.(); // success → hide global banner
        } catch (err) {
            const is429 = err?.response?.status === 429;
            const info = extractErrorInfo(err);
            if (!is429) {
                setContentError(info.message || 'Failed to read resource');
                // if first ever content attempt failed (non-429) and we had no content, clear it
                if (!hasContentRef.current) {
                    setContent({text: '', mimeType: '', metadata: ''});
                }
            }
            // 429 → keep last content displayed
        } finally {
            setContentLoading(false);
        }
    }, [apiKey, sessionId, protocolVersion]);

    // subscriptions
    const [subscriptions, setSubscriptions] = useState(() => {
        try {
            return new Set(JSON.parse(sessionStorage.getItem('subscribed-resources') || '[]'));
        } catch {
            return new Set();
        }
    });
    const persistSubs = (set) => {
        try {
            sessionStorage.setItem('subscribed-resources', JSON.stringify([...set]));
        } catch {
        }
    };

    const subscribe = useCallback(async (uri) => {
        await subscribeResource(uri, apiKey, sessionId, protocolVersion);
        const next = new Set(subscriptions);
        next.add(uri);
        setSubscriptions(next);
        persistSubs(next);
    }, [subscriptions, apiKey, sessionId, protocolVersion]);

    const unsubscribe = useCallback(async (uri) => {
        await unsubscribeResource(uri, apiKey, sessionId, protocolVersion);
        const next = new Set(subscriptions);
        next.delete(uri);
        setSubscriptions(next);
        persistSubs(next);
    }, [subscriptions, apiKey, sessionId, protocolVersion]);

    const state = useMemo(() => ({
        resources,
        loading: loadingFirstList,
        fetchingList,
        listError,       // non-429 only
        showEmptyList,   // first-success empty only
        selected,
        setSelected,
        content,
        contentLoading,
        contentError,    // non-429 only
        fetchList,
        fetchContent,
        subscriptions,
        subscribe,
        unsubscribe,
    }), [
        resources, loadingFirstList, fetchingList, listError, showEmptyList,
        selected, content, contentLoading, contentError,
        fetchList, fetchContent, subscriptions, subscribe, unsubscribe
    ]);

    return state;
};
