import React, {useEffect, useMemo, useState} from "react";
import {useTools} from "../../../../hooks/useTools.js";
import "../../../../assets/css/ToolsTab.css";
import {useRateLimit} from "../../../../context/RateLimitContext.jsx";

function SkeletonGrid({count = 6}) {
    return (
        <>
            {Array.from({length: count}).map((_, i) => (
                <div key={i} className="tool-card skeleton disabled">
                    <div className="skeleton-bar"/>
                </div>
            ))}
        </>
    );
}

export default function ToolsTab({setRefetch}) {
    const {tools, loading, fetching, errorInfo, showEmpty, refetch} = useTools();
    const {rate} = useRateLimit();
    const [selected, setSelected] = useState(null);

    // Cooldown state: only disable clicks while we're still counting down
    const isCooling = useMemo(
        () => Boolean(rate?.until && Date.now() < rate.until),
        [rate?.until]
    );

    useEffect(() => {
        setRefetch?.(refetch);
        return () => setRefetch?.(null);
    }, [refetch, setRefetch]);

    return (
        <div className="tools-tab">
            {loading && <p>Loading tools…</p>}

            {/* Non-429 local errors only */}
            {!rate && errorInfo && (
                <div style={{color: "red", marginBottom: 12}}>❌ {errorInfo.message}</div>
            )}

            <div className="tool-grid">
                {/* If we truly have no tools (first successful fetch was empty) show an empty state.
            Otherwise, render cached/last-good or skeletons while we wait. */}
                {showEmpty && !loading ? (
                    <div className="tool-empty">
                        {fetching ? "Refreshing…" : "No tools available yet."}
                    </div>
                ) : tools.length > 0 ? (
                    tools.map((t) => (
                        <div
                            key={t.name}
                            className={`tool-card ${isCooling ? 'disabled' : ''}`}
                            onClick={() => !isCooling && setSelected(t)}
                            title={isCooling ? 'Rate limited — wait to interact' : t.name}
                        >
                            <h4>{t.name}</h4>
                        </div>
                    ))
                ) : (
                    // No data yet (first call 429, etc.) → render skeletons instead of a blank box
                    <SkeletonGrid/>
                )}
            </div>

            {selected && (
                <div className="tool-detail-overlay" onClick={() => setSelected(null)}>
                    <div className="tool-detail" onClick={(e) => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setSelected(null)}>×</button>
                        <h3>{selected.name}</h3>
                        <p style={{opacity: .85}}>{selected.description}</p>
                        <div style={{marginTop: 8, fontSize: 12, opacity: .7}}>
                            Binary: {selected.binary ? "Yes" : "No"}
                            {"fti_only" in selected && <> • FTI Only: {selected.fti_only ? "Yes" : "No"}</>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
