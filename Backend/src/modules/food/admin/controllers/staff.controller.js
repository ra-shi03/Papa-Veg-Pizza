import mongoose from 'mongoose';
import { User } from '../../../../core/users/models/user.model.js';
import { Profile } from '../../../../core/users/models/profile.model.js';
import { Role } from '../../../../core/roles/models/role.model.js';
import { UserRole } from '../../../../core/roles/models/userRole.model.js';
import { RefreshToken } from '../../../../core/auth/models/refreshToken.model.js';
import { FoodFranchise } from '../../franchise/models/franchise.model.js';
import { FoodStore } from '../../store/models/store.model.js';
import { assertPasswordStrength, generateTempPassword } from '../../../../utils/password.js';

// Staff accounts are ordinary User + Profile + UserRole records, exactly what the admin login
// reads, so every account created here can sign in.

const normalizeRole = (role) => {
    const r = String(role || '').trim().replace(/_/g, '-').toLowerCase();
    return r === 'super-admin' ? 'superadmin' : r;
};
const roleCodeOf = (role) => normalizeRole(role).toUpperCase().replace(/-/g, '_');

// Who may manage whom, and how far their reach goes (from the token, never from the request body).
const MANAGEABLE = {
    superadmin: { roles: ['franchise-admin'], scope: 'all', denyCreate: 'Super admin can only create franchise admins.' },
    'franchise-admin': { roles: ['store-manager'], scope: 'franchise', denyCreate: 'Franchise admin can only create store managers.' },
    'store-manager': { roles: ['kitchen-staff', 'kitchen-supervisor'], scope: 'store', denyCreate: 'Store managers can only create kitchen staff or kitchen supervisors.' }
};

const ROLE_LABELS = {
    'franchise-admin': 'Franchise Admin',
    'store-manager': 'Store Manager',
    'kitchen-supervisor': 'Kitchen Supervisor',
    'kitchen-staff': 'Kitchen Staff'
};

const fail = (res, status, message) => res.status(status).json({ success: false, message });

const callerRule = (req, res) => {
    const rule = MANAGEABLE[normalizeRole(req.user?.role)];
    if (!rule) {
        fail(res, 403, 'Access denied: You are not authorized to manage staff.');
        return null;
    }
    return rule;
};

const toObjectId = (value) => (mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : null);

// Filter limiting a userRoles query to what the caller may touch.
const scopeFilter = (req, rule) => {
    if (rule.scope === 'franchise') {
        const franchiseId = toObjectId(req.user?.franchiseId);
        return franchiseId ? { franchiseId } : null;
    }
    if (rule.scope === 'store') {
        const storeId = toObjectId(req.user?.storeId);
        return storeId ? { storeId } : null;
    }
    return {};
};

const roleDocsFor = async (roles) => Role.find({ code: { $in: roles.map(roleCodeOf) } }).lean();

const nameOf = (profile) => [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim();

const serialize = (user, profile, userRole, roleCode) => ({
    _id: String(user._id),
    id: String(user._id),
    email: user.email || '',
    name: nameOf(profile),
    phone: user.mobile,
    mobile: user.mobile,
    role: normalizeRole(roleCode),
    franchiseId: userRole?.franchiseId ? String(userRole.franchiseId) : null,
    storeId: userRole?.storeId ? String(userRole.storeId) : null,
    isActive: user.isActive !== false,
    createdAt: user.createdAt
});

// The managed account's userRole, only if it is inside the caller's role + scope; otherwise null.
const findManagedUserRole = async (req, rule, userId) => {
    const scope = scopeFilter(req, rule);
    if (!scope || !toObjectId(userId)) return null;
    const roleDocs = await roleDocsFor(rule.roles);
    return UserRole.findOne({
        userId,
        roleId: { $in: roleDocs.map((r) => r._id) },
        status: { $ne: 'REMOVED' },
        ...scope
    });
};

export const createStaff = async (req, res, next) => {
    const session = await mongoose.startSession();
    try {
        const rule = callerRule(req, res);
        if (!rule) return;

        const { email, password, name, phone, mobile, role, franchiseId: bodyFranchiseId, storeId: bodyStoreId } = req.body || {};
        const targetRole = normalizeRole(role);

        if (!email || !role) return fail(res, 400, 'Email and role are required.');
        if (!rule.roles.includes(targetRole)) return fail(res, 403, rule.denyCreate);

        const normalizedEmail = String(email).trim().toLowerCase();
        if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) return fail(res, 400, 'A valid email is required.');
        const normalizedMobile = String(phone || mobile || '').replace(/\D/g, '');
        if (normalizedMobile.length < 10) return fail(res, 400, 'A valid phone number is required.');

        let temporaryPassword = null;
        if (password) {
            assertPasswordStrength(password);
        } else {
            temporaryPassword = generateTempPassword();
        }

        // Franchise and store come from the caller's token; only a super admin (who has none) names
        // the franchise, and it must exist. A franchise admin names the store, which must be theirs.
        let franchiseId = null;
        let storeId = null;
        if (rule.scope === 'all') {
            const franchise = toObjectId(bodyFranchiseId) && (await FoodFranchise.findById(bodyFranchiseId).select('_id').lean());
            if (!franchise) return fail(res, 400, 'A valid franchiseId is required.');
            franchiseId = franchise._id;
        } else if (rule.scope === 'franchise') {
            franchiseId = toObjectId(req.user?.franchiseId);
            if (!franchiseId) return fail(res, 403, 'No franchise is linked to your account.');
            const store = toObjectId(bodyStoreId) && (await FoodStore.findOne({ _id: bodyStoreId, franchiseId }).select('_id').lean());
            if (!store) return fail(res, 400, 'A valid storeId from your franchise is required.');
            storeId = store._id;
        } else {
            storeId = toObjectId(req.user?.storeId);
            if (!storeId) return fail(res, 403, 'You are not assigned to a store.');
            franchiseId = toObjectId(req.user?.franchiseId);
        }

        const existing = await User.findOne({ $or: [{ email: normalizedEmail }, { mobile: normalizedMobile }], isDeleted: { $ne: true } }).select('email').lean();
        if (existing) {
            return fail(res, 409, existing.email === normalizedEmail
                ? 'A user with this email already exists.'
                : 'A user with this phone number already exists.');
        }

        const roleCode = roleCodeOf(targetRole);
        let roleDoc = await Role.findOne({ code: roleCode }).lean();
        if (!roleDoc) {
            roleDoc = (await Role.create({ code: roleCode, name: ROLE_LABELS[targetRole], description: `${ROLE_LABELS[targetRole]} account`, isSystemRole: true })).toObject();
        }

        const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
        let newUser;
        await session.withTransaction(async () => {
            [newUser] = await User.create([{
                email: normalizedEmail,
                mobile: normalizedMobile,
                password: password || temporaryPassword, // hashed by the User pre-save hook
                loginType: 'PASSWORD',
                primaryRole: roleDoc._id,
                emailVerified: true,
                isActive: true
            }], { session });
            await Profile.create([{
                userId: newUser._id,
                firstName: parts[0] || '',
                lastName: parts.slice(1).join(' '),
                phone: normalizedMobile
            }], { session });
            await UserRole.create([{
                userId: newUser._id,
                roleId: roleDoc._id,
                franchiseId,
                storeId,
                assignedBy: req.user?.userId || null,
                assignedAt: new Date(),
                isPrimary: true,
                status: 'ACTIVE'
            }], { session });
        });

        return res.status(201).json({
            success: true,
            message: 'Staff user created successfully',
            data: {
                id: newUser._id,
                email: newUser.email,
                name: parts.join(' '),
                role: targetRole,
                ...(temporaryPassword ? { temporaryPassword } : {})
            }
        });
    } catch (err) {
        next(err);
    } finally {
        session.endSession();
    }
};

export const getStaffList = async (req, res, next) => {
    try {
        const rule = callerRule(req, res);
        if (!rule) return;
        const scope = scopeFilter(req, rule);
        if (!scope) return fail(res, 403, 'No franchise or store is linked to your account.');

        // A super admin may narrow the list to one franchise.
        if (rule.scope === 'all' && toObjectId(req.query?.franchiseId)) scope.franchiseId = toObjectId(req.query.franchiseId);

        const roleDocs = await roleDocsFor(rule.roles);
        const codeById = Object.fromEntries(roleDocs.map((r) => [String(r._id), r.code]));
        const userRoles = await UserRole.find({ roleId: { $in: roleDocs.map((r) => r._id) }, status: { $ne: 'REMOVED' }, ...scope }).lean();
        const userIds = userRoles.map((ur) => ur.userId);

        const [users, profiles] = await Promise.all([
            User.find({ _id: { $in: userIds }, isDeleted: { $ne: true } }).select('-password').lean(),
            Profile.find({ userId: { $in: userIds } }).lean()
        ]);
        const profileByUser = Object.fromEntries(profiles.map((p) => [String(p.userId), p]));
        const roleByUser = Object.fromEntries(userRoles.map((ur) => [String(ur.userId), ur]));

        const data = users.map((u) => {
            const ur = roleByUser[String(u._id)];
            return serialize(u, profileByUser[String(u._id)], ur, codeById[String(ur?.roleId)]);
        });
        return res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
};

export const updateStaff = async (req, res, next) => {
    try {
        const rule = callerRule(req, res);
        if (!rule) return;
        const { id } = req.params;
        const { name, phone, mobile, isActive } = req.body || {};

        const userRole = await findManagedUserRole(req, rule, id);
        const user = userRole && (await User.findOne({ _id: id, isDeleted: { $ne: true } }));
        if (!user) return fail(res, 404, 'Staff user not found.');

        const newMobile = phone !== undefined || mobile !== undefined ? String(phone ?? mobile).replace(/\D/g, '') : null;
        if (newMobile !== null) {
            if (newMobile.length < 10) return fail(res, 400, 'A valid phone number is required.');
            if (newMobile !== user.mobile && (await User.exists({ mobile: newMobile, _id: { $ne: user._id } }))) {
                return fail(res, 409, 'A user with this phone number already exists.');
            }
            user.mobile = newMobile;
        }
        if (isActive !== undefined) user.isActive = Boolean(isActive);
        await user.save();

        const profile = (await Profile.findOne({ userId: user._id })) || new Profile({ userId: user._id });
        if (name !== undefined) {
            const parts = String(name).trim().split(/\s+/).filter(Boolean);
            profile.firstName = parts[0] || '';
            profile.lastName = parts.slice(1).join(' ');
        }
        if (newMobile !== null) profile.phone = newMobile;
        await profile.save();

        // A deactivated account is signed out everywhere.
        if (isActive !== undefined && !user.isActive) await RefreshToken.deleteMany({ userId: user._id });

        const roleDoc = await Role.findById(userRole.roleId).lean();
        return res.status(200).json({
            success: true,
            message: 'Staff updated successfully',
            data: serialize(user.toObject(), profile, userRole, roleDoc?.code)
        });
    } catch (err) {
        next(err);
    }
};

export const deleteStaff = async (req, res, next) => {
    try {
        const rule = callerRule(req, res);
        if (!rule) return;
        const { id } = req.params;

        const userRole = await findManagedUserRole(req, rule, id);
        const user = userRole && (await User.findOne({ _id: id, isDeleted: { $ne: true } }));
        if (!user) return fail(res, 404, 'Staff user not found.');

        // Soft delete: the account can no longer sign in, and the audit trail is kept.
        user.isDeleted = true;
        user.isActive = false;
        await user.save();
        await UserRole.updateMany({ userId: user._id }, { $set: { status: 'REMOVED' } });
        await RefreshToken.deleteMany({ userId: user._id });

        return res.status(200).json({ success: true, message: 'Staff deleted successfully' });
    } catch (err) {
        next(err);
    }
};
