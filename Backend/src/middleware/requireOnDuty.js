import { StoreAttendance } from '../modules/food/store/models/attendance.model.js';
import { StoreManager } from '../modules/food/franchise/models/storeManager.model.js';
import { dateKeyOf } from '../modules/food/store/services/attendanceTime.js';
import { isId, toId } from '../modules/food/dashboard/services/dashboardAccess.js';

// The store manager, the only store role that signs in (kitchen staff have no login since 2026-11-26; the store manager
// clocks them in). The franchise admin and super admin are not gated.
const GATED_ROLES = new Set(['STORE_MANAGER']);
const ON_DUTY = ['present', 'half_day'];
const OPEN_SESSION_HOURS = 20;

/**
 * The store manager must have marked attendance (clocked in, or been marked present on their behalf by the franchise admin)
 * and not yet clocked out before they do any work in the store. Reads (GET) stay open so a person can still
 * see their screens and the clock-in button before they start. A manager who cannot clock in asks the franchise admin to
 * mark them present.
 */
export const requireOnDuty = (req, res, next) => {
    const role = String(req.user?.role || '').trim().replace(/-/g, '_').toUpperCase();
    // marking a notification read is not work
    if (!GATED_ROLES.has(role) || req.method === 'GET' || req.path.endsWith('/read')) return next();

    (async () => {
        const storeId = req.user?.storeId;
        if (!isId(storeId) || !isId(req.user?.userId)) return false;
        const me = await StoreManager.findOne({ userId: toId(req.user.userId), storeId: String(storeId), status: { $ne: 'DELETED' } }).select('_id').lean();
        if (!me) return true;   // not on this store's payroll: the route's own scope check answers (403 / 404)
        const now = new Date();
        const rec = await StoreAttendance.findOne({
            storeId: toId(storeId),
            staffId: me._id,
            status: { $in: ON_DUTY },
            checkOutAt: null,
            $or: [{ date: dateKeyOf(now) }, { checkInAt: { $gte: new Date(now.getTime() - OPEN_SESSION_HOURS * 3600000) } }],
        }).select('_id').lean();
        return !!rec;
    })()
        .then((onDuty) => {
            if (onDuty) return next();
            return res.status(403).json({
                success: false,
                code: 'ATTENDANCE_REQUIRED',
                error: 'Mark your attendance first (Clock In), then start work.',
                message: 'Mark your attendance first (Clock In), then start work.',
            });
        })
        .catch(next);
};
