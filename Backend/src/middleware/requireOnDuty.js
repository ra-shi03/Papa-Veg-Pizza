import { StoreAttendance } from '../modules/food/store/models/attendance.model.js';
import { StoreManager } from '../modules/food/franchise/models/storeManager.model.js';
import { dateKeyOf } from '../modules/food/store/services/attendanceTime.js';
import { isId, toId } from '../modules/food/dashboard/services/dashboardAccess.js';

const KITCHEN_ROLES = new Set(['KITCHEN_SUPERVISOR', 'KITCHEN_STAFF']);
const ON_DUTY = ['present', 'half_day'];
const OPEN_SESSION_HOURS = 20;

/**
 * Kitchen supervisors and kitchen staff must have marked attendance (clocked in, or been marked present by the store
 * manager) and not yet clocked out before they do any kitchen work. The store manager is never blocked, and reads
 * (GET) stay open so a person can still see their tasks and the clock-in screen before they start.
 */
export const requireOnDuty = (req, res, next) => {
    const role = String(req.user?.role || '').trim().replace(/-/g, '_').toUpperCase();
    // marking a notification read is not work
    if (!KITCHEN_ROLES.has(role) || req.method === 'GET' || req.path.endsWith('/read')) return next();

    (async () => {
        const storeId = req.user?.storeId;
        if (!isId(storeId) || !isId(req.user?.userId)) return false;
        const me = await StoreManager.findOne({ userId: toId(req.user.userId), storeId: String(storeId), status: { $ne: 'DELETED' } }).select('_id').lean();
        if (!me) return false;
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
                error: 'Mark your attendance (Clock In) before you start work.',
                message: 'Mark your attendance (Clock In) before you start work.',
            });
        })
        .catch(next);
};
