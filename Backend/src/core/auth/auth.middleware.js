import { verifyAccessToken } from './token.util.js';
import { sendError } from '../../utils/response.js';
import { User } from '../users/models/user.model.js';
import { FoodDeliveryPartner } from '../../modules/food/delivery/models/deliveryPartner.model.js';

const normalizeRole = (role) => String(role || '').trim().replace(/_/g, '-').toUpperCase();

const ADMIN_PANEL_ROLES = new Set([
    'SUPERADMIN',
    'FRANCHISE-ADMIN',
    'STORE-MANAGER',
    'KITCHEN-SUPERVISOR',
    'KITCHEN-STAFF'
]);

// ─── Require any admin panel role ─────────────────────────────────────────────
export const requireAdmin = (req, res, next) => {
    const role = normalizeRole(req.user?.role);
    if (!ADMIN_PANEL_ROLES.has(role)) {
        return sendError(res, 403, 'Admin access required');
    }
    next();
};

// ─── Require specifically superadmin ─────────────────────────────────────────
export const requireSuperAdmin = (req, res, next) => {
    const role = normalizeRole(req.user?.role);
    if (role !== 'SUPERADMIN' && role !== 'SUPER-ADMIN') {
        return sendError(res, 403, 'Super Admin access required');
    }
    next();
};

// ─── Core JWT verification middleware ─────────────────────────────────────────
export const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
        return sendError(res, 401, 'Authentication token missing');
    }

    try {
        const decoded = verifyAccessToken(token);

        // Attach decoded payload to req.user — available to all downstream handlers
        req.user = {
            userId:      decoded.userId,
            role:        decoded.role,
            franchiseId: decoded.franchiseId || null,
            storeId:     decoded.storeId     || null,
        };

        const role = normalizeRole(decoded.role);

        // For all roles: enforce real-time account status check
        // This ensures deactivated accounts are locked out on the very next request
        // Delivery partners are their own records (their token carries the partner id, not a User id).
        // A suspended or rejected partner is locked out on the next request, like a deactivated user.
        if (role === 'DELIVERY-PARTNER') {
            const partner = await FoodDeliveryPartner.findById(decoded.userId).select('status').lean();
            if (partner) {
                if (partner.status === 'suspended' || partner.status === 'rejected') {
                    return sendError(res, 401, 'Account is inactive. Contact support.');
                }
                return next();
            }
        }

        const doc = await User.findById(decoded.userId)
            .select('isActive isBlocked isDeleted')
            .lean();

        if (!doc) {
            return sendError(res, 401, 'Account not found');
        }
        if (doc.isDeleted === true) {
            return sendError(res, 401, 'Account has been deleted');
        }
        if (doc.isActive === false || doc.isBlocked === true) {
            return sendError(res, 401, 'Account is inactive. Contact support.');
        }

        return next();
    } catch (error) {
        return sendError(res, 401, 'Invalid or expired token');
    }
};
