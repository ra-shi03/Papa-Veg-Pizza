import { sendError } from '../../utils/response.js';

const normalizeRole = (role) => String(role || '').trim().replace(/_/g, '-').toUpperCase();

const roleMatches = (userRole, allowedRole) => {
    const user = normalizeRole(userRole);
    const allowed = normalizeRole(allowedRole);

    if (user === allowed) return true;
    if (allowed === 'ADMIN') {
        return user === 'SUPERADMIN' || user === 'FRANCHISE-ADMIN';
    }
    // Allow mapping between USER and CUSTOMER
    if (allowed === 'USER' && user === 'CUSTOMER') return true;
    if (allowed === 'CUSTOMER' && user === 'USER') return true;
    // Allow mapping between DELIVERY-PARTNER and DELIVERY_PARTNER
    if (allowed === 'DELIVERY-PARTNER' && user === 'DELIVERY-PARTNER') return true;
    if (allowed === 'DELIVERY-PARTNER' && user === 'DELIVERY_PARTNER') return true;
    if (allowed === 'DELIVERY_PARTNER' && user === 'DELIVERY-PARTNER') return true;
    if (allowed === 'DELIVERY_PARTNER' && user === 'DELIVERY_PARTNER') return true;
    return false;
};

export const requireRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return sendError(res, 401, 'Not authenticated');
        }

        if (!allowedRoles.some((role) => roleMatches(req.user.role, role))) {
            return sendError(res, 403, 'Forbidden: insufficient permissions');
        }

        next();
    };
};

export const allowRoles = requireRoles;
