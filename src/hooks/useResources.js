import {useEffect, useState} from 'react';
import {useMcpContext} from '../context/McpContext';
import {listResources, readResource} from '../services/resourceService';
import {subscribeResource, unsubscribeResource} from '../services/subscriptionService';

export const useResources = () => {
    const {apiKey, sessionId, protocolVersion} = useMcpContext();
    const [resources, setResources] = useState([]);
    const [selected, setSelected] = useState(null);
    const [content, setContent] = useState({text: '', mimeType: '', metadata: ''});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [subscriptions, setSubscriptions] = useState(() => {
        try {
            return new Set(JSON.parse(sessionStorage.getItem('subscribed-resources') || '[]'));
        } catch {
            return new Set();
        }
    });

    const persist = (set) => {
        sessionStorage.setItem('subscribed-resources', JSON.stringify([...set]));
    };


    const fetchContent = async (uri) => {
        try {
            setContent({text: '', mimeType: '', metadata: ''});
            const data = await readResource(uri, apiKey, sessionId, protocolVersion);
            setContent(data);
        } catch (e) {
            setError('Failed to read resource');
        }
    };
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const list = await listResources(apiKey, sessionId, protocolVersion);
                setResources(list);
            } catch (e) {
                setError('Failed to load resources');
            } finally {
                setLoading(false);
            }
        };

        if (apiKey && sessionId && protocolVersion) load();
        else setLoading(false);
    }, [apiKey, sessionId, protocolVersion]);

    // Subscribe to URI
    const subscribe = async (uri) => {
        await subscribeResource(uri, apiKey, sessionId, protocolVersion);
        const next = new Set(subscriptions);
        next.add(uri);
        setSubscriptions(next);
        persist(next);
    };

    const unsubscribe = async (uri) => {
        await unsubscribeResource(uri, apiKey, sessionId, protocolVersion);
        const next = new Set(subscriptions);
        next.delete(uri);
        setSubscriptions(next);
        persist(next);
    };


    return {
        resources,
        loading,
        error,
        selected,
        setSelected,
        content,
        fetchContent,
        subscriptions,
        subscribe,
        unsubscribe,
    };
};
