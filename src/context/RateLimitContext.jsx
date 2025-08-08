import React, {createContext, useContext, useEffect, useMemo, useState} from "react";
import axios from "axios";

const STORAGE_KEY = "mcp-rate-state";
const RateLimitCtx = createContext(null);

export function RateLimitProvider({children}) {
    const [rate, setRate] = useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    });

    useEffect(() => {
        if (rate) localStorage.setItem(STORAGE_KEY, JSON.stringify(rate));
        else localStorage.removeItem(STORAGE_KEY);
    }, [rate]);

    useEffect(() => {
        const id = axios.interceptors.response.use(
            r => r,
            err => {
                const res = err?.response;
                if (res?.status === 429) {
                    const rpc = res.data?.error;
                    const detail = res.data?.detail ?? rpc?.message;
                    const retry = res.headers?.["retry-after"] ??
                        (typeof detail === "object" ? detail.retry_after_seconds : undefined);

                    const message =
                        (typeof detail === "object" && (detail.error || "Rate limit exceeded")) ||
                        (typeof detail === "string" && detail) ||
                        "Rate limit exceeded";

                    const until = retry != null ? Date.now() + Number(retry) * 1000 : null;

                    setRate({
                        message,
                        until,
                        tier: typeof detail === "object" ? detail.tier : undefined,
                        limit: typeof detail === "object" ? detail.limit : undefined,
                        windowSeconds: typeof detail === "object" ? detail.window_seconds : undefined,
                    });
                }
                return Promise.reject(err);
            }
        );
        return () => axios.interceptors.response.eject(id);
    }, []);

    const value = useMemo(() => ({
        rate,
        clearRate: () => setRate(null),
        setRate: (v) => setRate(v),
    }), [rate]);

    return <RateLimitCtx.Provider value={value}>{children}</RateLimitCtx.Provider>;
}

export function useRateLimit() {
    const ctx = useContext(RateLimitCtx);
    if (!ctx) throw new Error("useRateLimit must be used inside RateLimitProvider");
    return ctx;
}
