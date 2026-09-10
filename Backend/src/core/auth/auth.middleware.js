import { verifyAccessToken } from './token.util.js';
import { sendError } from '../../utils/response.js';
import { FoodUser } from '../users/user.model.js';
import { FoodAdmin } from '../admin/admin.model.js';

const normalizeRole = (role) => String(role || '').trim().replace(/_/g, '-').toUpperCase();

export const requireAdmin = (req, res, next) => {
    const role = normalizeRole(req.user?.role);
    if (!['ADMIN', 'SUPERADMIN', 'FRANCHISE-ADMIN'].includes(role)) {
        return sendError(res, 403, 'Admin access required');
    }
    next();
};

export const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
        return sendError(res, 401, 'Authentication token missing');
    }

    try {
        const decoded = verifyAccessToken(token);
        req.user = {
            userId: decoded.userId,
            role: decoded.role
        };
        const role = normalizeRole(decoded.role);
        if (role === 'USER' || role === 'CUSTOMER') {
            // Enforce active status in real-time - deactivated users are logged out on next request.
            const doc = await FoodUser.findById(decoded.userId).select('isActive').lean();
            if (!doc || doc.isActive === false) {
                return sendError(res, 401, 'User account is deactivated');
            }
        }
        if (['ADMIN', 'SUPERADMIN', 'FRANCHISE-ADMIN', 'STORE-MANAGER', 'KITCHEN-SUPERVISOR', 'KITCHEN-STAFF'].includes(role)) {
            const doc = await FoodUser.findById(decoded.userId).select('isActive isDeleted').lean();
            if (!doc || doc.isActive === false || doc.isDeleted === true) {
                return sendError(res, 401, 'Account is inactive');
            }
        }
        return next();
    } catch (error) {
        return sendError(res, 401, 'Invalid or expired token');
    }
};
