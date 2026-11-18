import { verifyAccessToken } from './token.util.js';

/**
 * For public forms that a signed-in customer can also use: when a valid customer token is sent, the request is linked to
 * them (req.optionalCustomerId). A missing or bad token is simply ignored: the form still works for a guest.
 */
export const optionalCustomer = (req, _res, next) => {
    try {
        const header = req.headers.authorization || '';
        const token = header.startsWith('Bearer ') ? header.substring(7) : null;
        if (token) {
            const decoded = verifyAccessToken(token);
            const role = String(decoded?.role || '').trim().replace(/_/g, '-').toUpperCase();
            if ((role === 'USER' || role === 'CUSTOMER') && decoded.userId) req.optionalCustomerId = decoded.userId;
        }
    } catch (_) { /* ignore: treated as a guest */ }
    next();
};
