import mongoose from 'mongoose';
import { FoodStore } from '../store/models/store.model.js';
import { NotFoundError } from '../../../core/auth/errors.js';
import { sendError } from '../../../utils/response.js';

// Franchise isolation for every admin query.
//
// The scope always comes from the signed-in token, never from the request:
//   super admin      -> { all: true }                      sees every franchise
//   franchise admin  -> { all: false, franchiseId }        sees only its own franchise
//   anyone else      -> rejected
//
// Records outside the caller's scope are reported as "not found" (404), so a franchise admin
// cannot even learn that another franchise's store / order / customer exists.

const normalizeRole = (role) => String(role || '').trim().replace(/_/g, '-').toUpperCase();
const SUPER_ADMIN_ROLES = new Set(['SUPERADMIN', 'SUPER-ADMIN', 'ADMIN']);

const toObjectId = (value) =>
    value && mongoose.Types.ObjectId.isValid(String(value)) ? new mongoose.Types.ObjectId(String(value)) : null;

export const isSuperAdmin = (user) => SUPER_ADMIN_ROLES.has(normalizeRole(user?.role));

/** Middleware: sets req.franchiseScope for super admins and franchise admins; 403 for everyone else. */
export const attachFranchiseScope = (req, res, next) => {
    if (isSuperAdmin(req.user)) {
        req.franchiseScope = { all: true, franchiseId: null };
        return next();
    }
    if (normalizeRole(req.user?.role) === 'FRANCHISE-ADMIN') {
        const franchiseId = toObjectId(req.user?.franchiseId);
        if (!franchiseId) return sendError(res, 403, 'No franchise is linked to your account');
        req.franchiseScope = { all: false, franchiseId };
        return next();
    }
    return sendError(res, 403, 'Admin access required');
};

/** Like attachFranchiseScope, but only for admins: other roles (customers, partners) pass through untouched. */
export const scopeIfAdmin = (req, res, next) =>
    isSuperAdmin(req.user) || normalizeRole(req.user?.role) === 'FRANCHISE-ADMIN' ? attachFranchiseScope(req, res, next) : next();

const scopeOf = (req) => {
    if (!req.franchiseScope) throw new Error('attachFranchiseScope must run before scoped handlers');
    return req.franchiseScope;
};

/**
 * The franchise condition to AND into a query on a collection that has a franchiseId field.
 * Empty for a super admin, who may optionally narrow to one franchise with ?franchiseId=.
 */
export const franchiseFilter = (req, field = 'franchiseId') => {
    const scope = scopeOf(req);
    if (!scope.all) return { [field]: scope.franchiseId };
    const requested = toObjectId(req.query?.franchiseId);
    return requested ? { [field]: requested } : {};
};

/** `filter` restricted to the caller's franchise. */
export const withFranchiseScope = (req, filter = {}, field = 'franchiseId') => {
    const condition = franchiseFilter(req, field);
    if (!Object.keys(condition).length) return filter;
    if (!Object.keys(filter).length) return condition;
    return { $and: [filter, condition] };
};

/**
 * Ids of the stores the caller may see, or null for "no restriction" (super admin without a
 * ?franchiseId= filter). Used for collections that only reference a store (orders, managers).
 */
export const scopedStoreIds = async (req) => {
    const condition = franchiseFilter(req);
    if (!Object.keys(condition).length) return null;
    const stores = await FoodStore.find(condition).select('_id').lean();
    return stores.map((s) => s._id);
};

/** The store as a lean doc if it exists and is inside the caller's scope; otherwise null. */
export const findScopedStore = async (req, storeId, select = '_id franchiseId') => {
    const id = toObjectId(storeId);
    if (!id) return null;
    return FoodStore.findOne(withFranchiseScope(req, { _id: id })).select(select).lean();
};

/** Throws a 404 unless the store exists and is inside the caller's scope. */
export const assertStoreInScope = async (req, storeId) => {
    const store = await findScopedStore(req, storeId);
    if (!store) throw new NotFoundError('Store not found');
    return store;
};
