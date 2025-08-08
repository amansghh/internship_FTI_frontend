import React, {useEffect, useMemo, useState} from 'react';

export default function RateLimitBanner({message, until, onRetry, compact = false}) {
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    const remainingMs = Math.max(0, (until ?? now) - now);
    const remainingSec = Math.ceil(remainingMs / 1000);
    const isCooling = until && now < until;

    const label = useMemo(() => (
        isCooling ? `${message} — retry in ${remainingSec}s` : `Ready to retry`
    ), [message, isCooling, remainingSec]);

    const pct = isCooling ? Math.max(0, Math.min(100, (remainingMs / (remainingMs + 1000)) * 100)) : 0;

    return (
        <div className={`rl-banner ${compact ? 'compact' : ''}`}>
            <div className="rl-icon">⏳</div>
            <div className="rl-content">
                <div className="rl-title">Rate limit</div>
                <div className="rl-message">{label}</div>
                {isCooling && (
                    <div className="rl-meter">
                        <div className="rl-meter-bar" style={{width: `${pct}%`}}/>
                    </div>
                )}
            </div>
            <button
                className="rl-action"
                onClick={onRetry}
                disabled={isCooling}
                title={isCooling ? `Wait ${remainingSec}s` : 'Try again'}
            >
                {isCooling ? `Retry in ${remainingSec}s` : 'Try again'}
            </button>
        </div>
    );
}
