import { StoreManager } from '../../franchise/models/storeManager.model.js';
import { FoodStore } from '../models/store.model.js';
import { KitchenTask } from '../models/kitchenTask.model.js';
import { StoreAttendance } from '../models/attendance.model.js';
import { FoodOrder } from '../../orders/models/order.model.js';
import { FoodSupportTicket } from '../../user/models/supportTicket.model.js';
import { User } from '../../../../core/users/models/user.model.js';
import { Profile } from '../../../../core/users/models/profile.model.js';
import { RefreshToken } from '../../../../core/auth/models/refreshToken.model.js';
import { AuthError, ForbiddenError, NotFoundError, ValidationError } from '../../../../core/auth/errors.js';
import { assertPasswordStrength } from '../../../../utils/password.js';
import { uploadImageBuffer } from '../../../../services/cloudinary.service.js';
import { isId, toId, ago, daysAgo, round1 } from '../../dashboard/services/dashboardAccess.js';
import { profileAttendance } from './attendance.service.js';
import { conflict } from './attendanceAccess.js';
import { clockOf, dateKeyOf } from './attendanceTime.js';

// The profile screens of the store manager, kitchen supervisor and kitchen staff (/v1/profile/*). Every call is about the
// caller's own account: the user id and store come from the token, never from the request.

const normalize = (role) => String(role || '').trim().replace(/-/g, '_').toUpperCase();
const ROLE_KEY = { STORE_MANAGER: 'store_manager', KITCHEN_SUPERVISOR: 'kitchen_supervisor', KITCHEN_STAFF: 'kitchen_staff' };
const DESIGNATION = { STORE_MANAGER: 'Store Operations Manager', KITCHEN_SUPERVISOR: 'Kitchen Operations Supervisor', KITCHEN_STAFF: 'Kitchen Staff' };
const PREF_DEFAULTS = { orderAlerts: true, inventoryAlerts: true, shiftAlerts: false, complaintAlerts: true, dailyReports: true, smsAlerts: false, pushNotifications: true };

/** The caller's own staff record (a StoreManager document) in their own store. */
async function ownRecord(user) {
    const role = normalize(user?.role);
    if (!ROLE_KEY[role]) throw new ForbiddenError('This is for the store team.');
    if (!isId(user.userId) || !isId(user.storeId)) throw new ForbiddenError('No store is linked to your account.');
    const staff = await StoreManager.findOne({ userId: toId(user.userId), storeId: String(user.storeId), status: { $ne: 'DELETED' } });
    if (!staff) throw new NotFoundError('Your staff record was not found.');
    return { role, staff };
}

const iso = (d) => (d ? new Date(d).toISOString() : null);

function userDto(role, staff, store, lastLoginAt) {
    const p = staff.personalDetails || {};
    return {
        fullName: staff.name, email: staff.email, phone: staff.phone, gender: p.gender || '', dateOfBirth: p.dateOfBirth || '', address: p.address || '',
        employeeId: staff.employeeCode, designation: role === 'KITCHEN_STAFF' ? staff.role || DESIGNATION[role] : DESIGNATION[role], role: ROLE_KEY[role],
        storeName: store?.storeName || staff.storeName || '', joiningDate: iso(staff.joinedDate), status: staff.status, lastLogin: iso(lastLoginAt),
        profileImage: staff.profileImage && !/placeholder/.test(staff.profileImage) ? staff.profileImage : '', reportingManager: staff.reportingManager || '',
        emergencyContact: { name: p.emergencyContactName || '', phone: p.emergencyContact || '', relation: p.emergencyContactRelation || '' },
    };
}

const prefsOf = (staff) => ({ ...PREF_DEFAULTS, ...(staff.notificationPrefs?.toObject?.() ?? staff.notificationPrefs ?? {}) });

// ---- sessions (one per login; a login is one refresh-token family) ----------------------------

const familyOf = (t) => t.familyId || String(t._id);
async function currentFamily(user, refreshToken) {
    if (!refreshToken) return null;
    const t = await RefreshToken.findOne({ userId: toId(user.userId), tokenHash: RefreshToken.hashToken(String(refreshToken)), revoked: false }).lean();
    return t ? { id: t._id, family: familyOf(t), familyId: t.familyId || null } : null;
}

export async function listSessions(user, refreshToken) {
    const [live, current] = await Promise.all([
        RefreshToken.find({ userId: toId(user.userId), revoked: false, rotatedAt: null, expiresAt: { $gt: new Date() } }).sort({ updatedAt: -1 }).lean(),
        currentFamily(user, refreshToken),
    ]);
    return live.map((t) => ({
        id: familyOf(t), device: t.deviceId ? `Device ${String(t.deviceId).slice(0, 8)}` : 'Web browser', browser: '', ipAddress: '',
        lastActive: ago(t.updatedAt), current: !!current && current.family === familyOf(t),
    }));
}

/** DELETE /profile/sessions/:id : sign one login out (its refresh tokens are deleted; its access token lapses within minutes). */
export async function deleteSession(user, id) {
    const match = [{ familyId: String(id) }];
    if (isId(id)) match.push({ _id: toId(id) });
    const res = await RefreshToken.deleteMany({ userId: toId(user.userId), $or: match });
    if (!res.deletedCount) throw new NotFoundError('Session not found');
    return { removed: res.deletedCount };
}

/** DELETE /profile/sessions?scope=other|all */
export async function deleteSessions(user, scope, refreshToken) {
    const userId = toId(user.userId);
    if (scope === 'all') return { removed: (await RefreshToken.deleteMany({ userId })).deletedCount };
    if (scope !== 'other') throw new ValidationError('scope: must be "other" or "all"');
    const current = await currentFamily(user, refreshToken);
    if (!current) throw new ValidationError('Cannot tell which session is yours; send your refresh token or use scope=all.');
    const keep = { _id: { $ne: current.id }, ...(current.familyId ? { familyId: { $ne: current.familyId } } : {}) };
    return { removed: (await RefreshToken.deleteMany({ userId, ...keep })).deletedCount };
}

// ---- performance and activity -----------------------------------------------------------------

export async function performance(user) {
    const { role, staff } = await ownRecord(user);
    const since = daysAgo(29);
    const storeId = toId(user.storeId);
    const mine = { assignedTo: toId(user.userId), createdAt: { $gte: since } };
    const [orders, tickets, delayedStore, rating, tasks] = await Promise.all([
        FoodOrder.countDocuments({ storeId, createdAt: { $gte: since } }),
        FoodSupportTicket.countDocuments({ storeId, createdAt: { $gte: since } }),
        KitchenTask.countDocuments({ storeId, status: 'delayed', createdAt: { $gte: since } }),
        FoodOrder.aggregate([{ $match: { storeId, 'ratings.store.rating': { $gte: 1 }, 'ratings.store.ratedAt': { $gte: since } } }, { $group: { _id: null, avg: { $avg: '$ratings.store.rating' } } }]),
        KitchenTask.find(mine).select('status startedAt completedAt').lean(),
    ]);
    const done = tasks.filter((t) => t.status === 'completed');
    const minutes = done.filter((t) => t.startedAt && t.completedAt).map((t) => (new Date(t.completedAt) - new Date(t.startedAt)) / 60000).filter((m) => m >= 0);
    const avg = minutes.length ? round1(minutes.reduce((a, b) => a + b, 0) / minutes.length) : 0;
    const years = staff.joinedDate ? round1((Date.now() - new Date(staff.joinedDate).getTime()) / (365.25 * 86400000)) : 0;
    return {
        ordersManaged: role === 'STORE_MANAGER' ? orders : 0,
        avgPrepTime: avg ? `${avg} mins` : 'N/A',
        delayedOrders: role === 'STORE_MANAGER' ? delayedStore : tasks.filter((t) => t.status === 'delayed').length,
        customerComplaints: role === 'STORE_MANAGER' ? tickets : 0,
        performanceRating: rating[0] ? round1(rating[0].avg) : 0,
        yearsOfService: years,
        ordersPrepared: done.length,
        avgPizzaTime: avg ? `${avg} mins` : 'N/A',
        personalRating: 0,
    };
}

/** The caller's own recent actions: clock-ins and outs and the kitchen tasks they worked on. */
export async function activityLogs(user) {
    const { staff } = await ownRecord(user);
    const [att, tasks] = await Promise.all([
        StoreAttendance.find({ storeId: toId(user.storeId), staffId: staff._id }).sort({ date: -1 }).limit(15).lean(),
        KitchenTask.find({ assignedTo: toId(user.userId), storeId: toId(user.storeId), status: { $in: ['completed', 'in_progress', 'delayed'] } }).sort({ updatedAt: -1 }).limit(15).lean(),
    ]);
    const stamp = (d) => `${dateKeyOf(new Date(d))} ${clockOf(new Date(d))}`;
    const events = [];
    for (const a of att) {
        if (a.checkInAt) events.push({ at: a.checkInAt, module: 'Attendance', action: a.late ? `Clocked in (${a.lateMinutes} min late)` : 'Clocked in', description: `Shift day ${a.date}` });
        if (a.checkOutAt) events.push({ at: a.checkOutAt, module: 'Attendance', action: 'Clocked out', description: `${a.totalHours} hours worked` });
    }
    for (const t of tasks) {
        events.push({ at: t.completedAt || t.startedAt || t.updatedAt, module: 'Orders', action: t.status === 'completed' ? 'Completed a kitchen task' : 'Working on a kitchen task', description: t.slot ? String(t.slot).replace('_', ' ') : 'Order supervision' });
    }
    return events.sort((x, y) => new Date(y.at) - new Date(x.at)).slice(0, 20).map((e, i) => ({ id: `act-${i + 1}`, time: stamp(e.at), module: e.module, action: e.action, description: e.description }));
}

// ---- the profile ------------------------------------------------------------------------------

export async function getProfile(user, refreshToken) {
    const { role, staff } = await ownRecord(user);
    const [store, account, attendance, perf, activities, sessions] = await Promise.all([
        FoodStore.findById(toId(user.storeId)).select('storeName address').lean(),
        User.findById(toId(user.userId)).select('lastLoginAt').lean(),
        profileAttendance(user),
        performance(user),
        activityLogs(user),
        listSessions(user, refreshToken),
    ]);
    const address = store?.address;
    return {
        user: userDto(role, staff, store, account?.lastLoginAt),
        store: {
            name: store?.storeName || staff.storeName || '',
            address: typeof address === 'string' ? address : [address?.line1, address?.city, address?.state, address?.pincode].filter(Boolean).join(', '),
            openingTime: '', closingTime: '', managerName: role === 'STORE_MANAGER' ? staff.name : staff.reportingManager || '',
        },
        attendanceSummary: attendance.summary,
        performanceSummary: perf,
        recentActivities: activities.slice(0, 5),
        activeSessions: sessions,
        notifications: prefsOf(staff),
    };
}

/** PUT /profile/personal : only the fields the Personal Info tab edits. Email and role are not editable here. */
export async function updatePersonal(user, body) {
    const { role, staff } = await ownRecord(user);
    const account = await User.findById(toId(user.userId));
    if (!account) throw new AuthError('Profile not found');

    if (body.phone !== undefined && body.phone !== staff.phone) {
        const taken = await User.findOne({ _id: { $ne: account._id }, mobile: body.phone }).select('_id').lean();
        if (taken) throw conflict('This phone number is already in use.');
        account.mobile = body.phone;
        staff.phone = body.phone;
    }
    if (body.fullName !== undefined) {
        staff.name = body.fullName;
        const [first, ...rest] = body.fullName.split(/\s+/);
        await Profile.updateOne({ userId: account._id }, { $set: { firstName: first, lastName: rest.join(' ') } });
    }
    staff.personalDetails = staff.personalDetails || {};
    for (const k of ['gender', 'dateOfBirth', 'address']) if (body[k] !== undefined) staff.personalDetails[k] = body[k];
    if (body.emergencyContact) {
        const e = body.emergencyContact;
        if (e.name !== undefined) staff.personalDetails.emergencyContactName = e.name;
        if (e.phone !== undefined) staff.personalDetails.emergencyContact = e.phone;
        if (e.relation !== undefined) staff.personalDetails.emergencyContactRelation = e.relation;
    }
    staff.markModified('personalDetails');
    await account.save();
    await staff.save();
    const store = await FoodStore.findById(toId(user.storeId)).select('storeName').lean();
    return userDto(role, staff, store, account.lastLoginAt);
}

/**
 * PUT /profile/change-password. Same strength rule as every other password change. Every other login is signed out (its
 * refresh tokens are deleted); the caller's own stays when they send their refresh token.
 */
export async function changePassword(user, body) {
    await ownRecord(user);
    const account = await User.findById(toId(user.userId));
    if (!account) throw new AuthError('Profile not found');
    // 400, not 401: the screens treat a 401 as an expired session and would try to sign the person out
    if (!(await account.comparePassword(body.currentPassword))) throw new ValidationError('Current password is incorrect');
    assertPasswordStrength(body.newPassword, 'New password');
    if (body.newPassword === body.currentPassword) throw new ValidationError('newPassword: choose a password different from the current one');
    account.password = body.newPassword;   // hashed by the User pre-save hook
    await account.save();

    const current = await currentFamily(user, body.refreshToken);
    const keep = current ? { _id: { $ne: current.id }, ...(current.familyId ? { familyId: { $ne: current.familyId } } : {}) } : {};
    const { deletedCount } = await RefreshToken.deleteMany({ userId: account._id, ...keep });
    return { signedOutSessions: deletedCount };
}

/** POST /profile/photo (multipart, field "file", images only: see the route) */
export async function uploadPhoto(user, file, upload = uploadImageBuffer) {
    if (!file?.buffer) throw new ValidationError('file: an image is required');
    const { staff } = await ownRecord(user);
    const url = String((await upload(file.buffer, 'food/staff/profile')) || '').trim();
    if (!url) throw new ValidationError('The image could not be saved. Try again.');
    staff.profileImage = url;
    await staff.save();
    await Profile.updateOne({ userId: toId(user.userId) }, { $set: { profilePhoto: url } });
    return { profileImage: url };
}

export async function updateNotifications(user, body) {
    const { staff } = await ownRecord(user);
    staff.notificationPrefs = { ...prefsOf(staff), ...body };
    await staff.save();
    return prefsOf(staff);
}

/** What each role may open (the Permissions tab). A read-only description of the role, not a setting. */
export async function permissions(user) {
    const role = normalize(user?.role);
    if (!ROLE_KEY[role]) throw new ForbiddenError('This is for the store team.');
    const manager = role === 'STORE_MANAGER'; const staff = role === 'KITCHEN_STAFF';
    return {
        Dashboard: true, IncomingOrders: !staff, ActiveOrders: true, KitchenQueue: true, PizzaStation: true, BakingStation: true, PackagingStation: true,
        DeliveryOperations: manager, Inventory: !staff, StockRequests: !staff, WasteManagement: true, StaffManagement: manager, Reports: manager,
    };
}

export { profileAttendance as attendance };
