import { FoodStore } from '../models/store.model.js';
import { StoreManager } from '../../franchise/models/storeManager.model.js';
import { Role } from '../../../../core/roles/models/role.model.js';
import { UserRole } from '../../../../core/roles/models/userRole.model.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../../../../core/auth/errors.js';
import { isId, toId } from '../../dashboard/services/dashboardAccess.js';

// Who may do what with shifts and attendance, decided from the token alone:
//   store manager      -> own store: manage shifts, read attendance, mark leave / absent for kitchen staff, clock in / out themselves
//   kitchen staff      -> clock in / out, and read only their own attendance and shifts
//   franchise admin    -> one store of their own franchise (?storeId=): read everything (managers and staff), mark leave /
//                         absent / present on behalf (with a reason) and decide leave requests when the manager is away;
//                         another franchise's store is 404
//   super admin        -> read only, ?storeId=
// A storeId in the query that is not the caller's own store is 404, never an error that tells it exists.

const normalize = (role) => String(role || '').trim().replace(/-/g, '_').toUpperCase();
const isSuper = (role) => role === 'SUPERADMIN' || role === 'SUPER_ADMIN';
export const KITCHEN_ROLE_CODES = ['KITCHEN_STAFF'];   // (the kitchen supervisor role is no longer used)
const STORE_ROLES = ['STORE_MANAGER', ...KITCHEN_ROLE_CODES];

/** Class-less 409 (errorHandler reads statusCode) */
export const conflict = (message) => Object.assign(new Error(message), { name: 'ConflictError', statusCode: 409 });

/** The kitchen staff of one store (StoreManager records, lean), optionally narrowed by `extra`. */
export async function kitchenStaffRecords(storeId, extra = {}) {
    const roles = await Role.find({ code: { $in: KITCHEN_ROLE_CODES } }).select('_id').lean();
    const links = await UserRole.find({ storeId, roleId: { $in: roles.map((r) => r._id) } }).select('userId').lean();
    return StoreManager.find({ storeId: String(storeId), userId: { $in: links.map((l) => l.userId) }, status: { $ne: 'DELETED' }, ...extra }).lean();
}

/** Everyone on the payroll of one store (the manager and the kitchen staff), optionally narrowed by `extra`. */
export const storePeopleRecords = (storeId, extra = {}) =>
    StoreManager.find({ storeId: String(storeId), status: { $nin: ['DELETED', 'Rejected', 'Pending Approval'] }, ...extra }).lean();

/** The caller's own staff record in their own store, or null. */
export const myStaffRecord = (user, storeId) =>
    isId(user?.userId) ? StoreManager.findOne({ userId: toId(user.userId), storeId: String(storeId), status: { $ne: 'DELETED' } }) : null;

/**
 * -> { role, store, me, canWrite, ownOnly }
 *   me       the caller's staff record (kitchen roles)
 *   canWrite only the store manager writes shifts and attendance
 *   ownOnly  kitchen staff see only their own records
 */
export async function attendanceScope(user, query = {}) {
    const role = normalize(user?.role);
    if (STORE_ROLES.includes(role)) {
        if (!isId(user.storeId)) throw new ForbiddenError('No store is linked to your account.');
        if (isId(query.storeId) && String(query.storeId) !== String(user.storeId)) throw new NotFoundError('Store not found');
        const store = await FoodStore.findById(toId(user.storeId)).select('_id franchiseId storeName').lean();
        if (!store) throw new NotFoundError('Store not found');
        const me = await myStaffRecord(user, store._id);
        if (!me && role !== 'STORE_MANAGER') throw new ForbiddenError('Your staff record was not found.');
        return { role, store, me, canWrite: role === 'STORE_MANAGER', canMark: role === 'STORE_MANAGER', isAdmin: false, ownOnly: role === 'KITCHEN_STAFF' };
    }
    if (role === 'FRANCHISE_ADMIN' || isSuper(role)) {
        if (!isId(query.storeId)) throw new ValidationError('Choose a store (storeId).');
        const filter = { _id: toId(query.storeId) };
        if (!isSuper(role)) {
            if (!isId(user.franchiseId)) throw new ForbiddenError('No franchise is linked to your account.');
            filter.franchiseId = toId(user.franchiseId);
        }
        const store = await FoodStore.findOne(filter).select('_id franchiseId storeName').lean();
        if (!store) throw new NotFoundError('Store not found');
        return { role, store, me: null, canWrite: false, canMark: role === 'FRANCHISE_ADMIN', isAdmin: role === 'FRANCHISE_ADMIN', ownOnly: false };
    }
    throw new ForbiddenError('You do not have access to this.');
}

export function assertCanWrite(scope) {
    if (!scope.canWrite) throw new ForbiddenError('Only the store manager can change shifts and attendance.');
}

/** Store manager or franchise admin (the franchise admin steps in when the manager is away). */
export function assertCanMark(scope) {
    if (!scope.canMark) throw new ForbiddenError('Only the store manager or the franchise admin can mark attendance.');
}

export const displayNameOf = async (user) => {
    const rec = isId(user?.userId) ? await StoreManager.findOne({ userId: toId(user.userId) }).select('name').lean() : null;
    return rec?.name || 'Store Manager';
};
