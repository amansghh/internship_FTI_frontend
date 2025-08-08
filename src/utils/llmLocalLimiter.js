// Simple client-side fixed-window limiter for the LLM tab.
// Persists to localStorage so refreshes keep the cooldown.

const STORAGE_KEY = (tier) => `llm-rate:${tier || 'basic'}`;

// Default tiers (mirror your backend vibes)
const TIERS = {
    basic: {limit: 5, windowSeconds: 60},
    premium: {limit: 30, windowSeconds: 60},
    unlimited: null, // no limit
};

function readState(tier) {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY(tier)) || 'null');
    } catch {
        return null;
    }
}

function writeState(tier, obj) {
    try {
        localStorage.setItem(STORAGE_KEY(tier), JSON.stringify(obj));
    } catch {
    }
}

export function getTierConfig(tier) {
    const envTier = (import.meta.env.VITE_LLM_RATE_TIER || '').toLowerCase().trim();
    const t = tier || envTier || 'basic';
    return {tier: t, cfg: TIERS[t] ?? TIERS.basic};
}

/**
 * consume() -> { ok: true } OR { ok: false, retryAt: epochMs, remaining: number }
 */
export function consume(tier) {
    const {cfg, tier: t} = getTierConfig(tier);
    if (!cfg) return {ok: true}; // unlimited

    const now = Date.now();
    const win = cfg.windowSeconds * 1000;

    let st = readState(t) || {windowStart: now, count: 0, limit: cfg.limit, windowSeconds: cfg.windowSeconds};

    // rotate window if expired
    if (now - st.windowStart >= win) {
        st = {windowStart: now, count: 0, limit: cfg.limit, windowSeconds: cfg.windowSeconds};
    }

    if (st.count < st.limit) {
        st.count += 1;
        writeState(t, st);
        return {ok: true, remaining: st.limit - st.count};
    }

    const retryAt = st.windowStart + win;
    writeState(t, st); // persist
    return {ok: false, retryAt, remaining: 0};
}

export function reset(tier) {
    try {
        localStorage.removeItem(STORAGE_KEY(tier));
    } catch {
    }
}

export function getRetryAt(tier) {
    const {cfg, tier: t} = getTierConfig(tier);
    if (!cfg) return null;
    const st = readState(t);
    if (!st) return null;
    const win = cfg.windowSeconds * 1000;
    return Math.max(st.windowStart + win, Date.now());
}
