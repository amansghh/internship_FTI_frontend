import React, { createContext, useContext, useState, useCallback } from "react";
const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const push = useCallback((msg, type = "info") => {
        const id = crypto.randomUUID();
        setToasts(t => [...t, { id, msg, type }]);
        setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
    }, []);

    const api = {
        info:  msg => push(msg, "info"),
        success: msg => push(msg, "success"),
        error: msg => push(msg, "error"),
        warn:  msg => push(msg, "warn"),
    };

    return (
        <ToastCtx.Provider value={api}>
            {children}
            <div className="toast-container">
                {toasts.map(t => (
                    <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>
                ))}
            </div>
        </ToastCtx.Provider>
    );
}

export const useToast = () => useContext(ToastCtx);
