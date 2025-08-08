export function extractErrorInfo(err) {
    // Default
    const info = {message: 'Request failed', retryAfterSeconds: null};

    if (!err || typeof err !== 'object') {
        info.message = String(err);
        return info;
    }

    const res = err.response;
    if (!res) {
        info.message = err.message || 'Network error';
        return info;
    }

    // 429: Prefer Retry-After header, else body.retry_after_seconds
    if (res.status === 429) {
        const rpc = res.data?.error;
        const detail = res.data?.detail ?? rpc?.message;
        const hdrRetry = res.headers?.['retry-after'];

        const retry =
            hdrRetry ??
            (typeof detail === 'object' ? detail.retry_after_seconds : undefined);

        const msg =
            (typeof detail === 'object' && (detail.error || 'Rate limit exceeded')) ||
            (typeof detail === 'string' && detail) ||
            'Rate limit exceeded';

        info.message = msg;
        info.retryAfterSeconds = retry != null ? Number(retry) : null;
        return info;
    }

    // JSON-RPC error envelope
    if (res.data?.error) {
        const rpc = res.data.error;
        info.message =
            (typeof rpc.message === 'object' && (rpc.message.error || JSON.stringify(rpc.message))) ||
            rpc.message ||
            info.message;
        return info;
    }

    // FastAPI/REST style
    if (res.data?.detail) {
        const d = res.data.detail;
        info.message =
            typeof d === 'string' ? d : (d?.error ?? JSON.stringify(d));
        return info;
    }

    info.message = err.message || info.message;
    return info;
}
