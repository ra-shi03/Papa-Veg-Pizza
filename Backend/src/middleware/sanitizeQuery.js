import { sendError } from '../utils/response.js';

// Query values go straight into Mongo filters in the catalogue and staff list handlers. Express parses
// `?price[$gt]=0` into { price: { $gt: '0' } }, which Mongo reads as an operator. So: no key may start with "$" or
// contain "." (checked on the raw query string, because app.js already drops top-level "$" keys silently), and every
// value must be one plain value, which is passed on as a string. Handlers read numbers (page, limit) with parseInt.

const badPart = (part) => part.startsWith('$') || part.includes('.');

// `price[$gt]` -> ['price', '$gt']
const rawKeyParts = (req) => {
    const qs = String(req.originalUrl || '').split('?')[1] || '';
    return [...new URLSearchParams(qs).keys()].map((key) => ({ key, parts: key.split(/[[\]]+/).filter(Boolean) }));
};

export const sanitizeQuery = (req, res, next) => {
    const bad = rawKeyParts(req).find(({ parts }) => parts.some(badPart));
    if (bad) return sendError(res, 400, `Invalid query parameter: ${bad.key}`);

    const clean = {};
    for (const [key, value] of Object.entries(req.query || {})) {
        if (value !== null && typeof value === 'object') return sendError(res, 400, `Query parameter "${key}" must be a single value`);
        clean[key] = String(value ?? '');
    }
    req.query = clean;
    return next();
};
