import mongoose from 'mongoose';
import { FoodUser } from '../../../../core/users/user.model.js';
import { Role } from '../../../../core/roles/models/role.model.js';
import { UserRole } from '../../../../core/roles/models/userRole.model.js';
import { StoreManager } from '../models/storeManager.model.js';
import { FoodStore } from '../../store/models/store.model.js';
import { scopedStoreIds } from '../../shared/franchiseScope.js';
import { sendError, sendResponse } from '../../../../utils/response.js';

// Kitchen supervisors and kitchen staff added by a store manager wait here for the franchise admin (or the super admin).
// The scope comes from the token: a franchise admin only ever sees and decides on the staff of its own franchise's stores.

const KITCHEN_ROLE_CODES = ['KITCHEN_SUPERVISOR', 'KITCHEN_STAFF'];
const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ''));

async function kitchenUserIds(storeIds) {
    const roles = await Role.find({ code: { $in: KITCHEN_ROLE_CODES } }).select('_id').lean();
    const filter = { roleId: { $in: roles.map((r) => r._id) } };
    if (storeIds) filter.storeId = { $in: storeIds };
    const links = await UserRole.find(filter).select('userId').lean();
    return links.map((l) => l.userId);
}

// A staff record inside the caller's scope, or null (reported as 404 so another franchise's staff is not revealed)
async function findScopedStaff(req, id) {
    if (!isId(id)) return null;
    const storeIds = await scopedStoreIds(req);
    const staff = await StoreManager.findById(id);
    if (!staff || !staff.userId) return null;
    if (storeIds && !storeIds.some((s) => String(s) === String(staff.storeId))) return null;
    const kitchen = await kitchenUserIds(storeIds);
    return kitchen.some((u) => String(u) === String(staff.userId)) ? staff : null;
}

export const listStaffApprovals = async (req, res, next) => {
    try {
        const storeIds = await scopedStoreIds(req);
        const userIds = await kitchenUserIds(storeIds);
        const status = String(req.query.status || 'Pending Approval');
        const filter = { userId: { $in: userIds }, status: status === 'All' ? { $ne: 'DELETED' } : status };
        if (storeIds) filter.storeId = { $in: storeIds.map(String) };
        const rows = await StoreManager.find(filter).sort({ createdAt: -1 }).limit(200).lean();
        const stores = await FoodStore.find({ _id: { $in: rows.map((r) => r.storeId).filter(isId) } }).select('storeName').lean();
        const storeName = new Map(stores.map((s) => [String(s._id), s.storeName]));
        return sendResponse(res, 200, 'Staff approvals', {
            staff: rows.map((r) => ({
                _id: String(r._id),
                name: r.name,
                email: r.email,
                phone: r.phone,
                role: r.role,
                employeeCode: r.employeeCode,
                status: r.status,
                storeId: r.storeId,
                storeName: storeName.get(String(r.storeId)) || r.storeName || '',
                addedBy: r.reportingManager || '',
                shiftType: r.personalDetails?.shiftType || '',
                createdAt: r.createdAt,
                rejectionReason: r.approval?.rejectionReason || '',
            })),
        });
    } catch (err) {
        return next(err);
    }
};

async function decide(req, res, next, approve) {
    try {
        const staff = await findScopedStaff(req, req.params.id);
        if (!staff) return sendError(res, 404, 'Staff member not found');
        if (staff.status !== 'Pending Approval') return sendError(res, 409, `This request is already ${staff.status.toLowerCase()}.`);
        const reason = String(req.body?.reason || '').trim().slice(0, 300);
        if (!approve && !reason) return sendError(res, 400, 'Please give a reason for rejecting.');

        staff.status = approve ? 'Active' : 'Rejected';
        staff.approval = {
            decidedBy: isId(req.user?.userId) ? req.user.userId : null,
            decidedByName: String(req.user?.name || req.user?.email || ''),
            decidedAt: new Date(),
            rejectionReason: approve ? '' : reason,
        };
        await staff.save();
        // The account can sign in only once approved
        await FoodUser.findByIdAndUpdate(staff.userId, { $set: { isActive: approve } });
        return sendResponse(res, 200, approve ? 'Staff member approved' : 'Staff request rejected', { id: String(staff._id), status: staff.status });
    } catch (err) {
        return next(err);
    }
}

export const approveStaff = (req, res, next) => decide(req, res, next, true);
export const rejectStaff = (req, res, next) => decide(req, res, next, false);
