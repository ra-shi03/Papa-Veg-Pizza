import mongoose from 'mongoose';
import { StoreManager } from '../../franchise/models/storeManager.model.js';
import { Role } from '../../../../core/roles/models/role.model.js';
import { UserRole } from '../../../../core/roles/models/userRole.model.js';

// Kitchen staff are staff records the store manager runs: no email, no password, no login (client decision 2026-11-26,
// docs/kitchen-staff-removal.md). This file is the one place that says which StoreManager records are kitchen staff:
//   - records marked staffKind: 'kitchen_staff' (everything the store manager adds now, and converted ones), and
//   - records from before that marker, recognised by their KITCHEN_STAFF role link (until scripts/convert-kitchen-staff.js
//     has marked them).
// A store manager is never kitchen staff. Former kitchen supervisors are only included when asked for (`retired`).

export const KITCHEN_STAFF_KIND = 'kitchen_staff';
const LEGACY_CODES = ['KITCHEN_STAFF'];
const RETIRED_CODES = ['KITCHEN_SUPERVISOR'];

const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ''));
const oid = (v) => new mongoose.Types.ObjectId(String(v));

async function linkedUserIds(codes, storeIds) {
  const roles = await Role.find({ code: { $in: codes } }).select('_id').lean();
  if (!roles.length) return [];
  const filter = { roleId: { $in: roles.map((r) => r._id) } };
  if (storeIds) filter.storeId = { $in: storeIds.map(String).filter(isId).map(oid) };
  return (await UserRole.find(filter).select('userId').lean()).map((l) => l.userId).filter(Boolean);
}

/**
 * A StoreManager filter that matches the kitchen staff records (of `storeIds` when given; the caller still adds its own
 * storeId condition). `retired: true` also matches the kept records of former kitchen supervisors.
 */
export async function kitchenStaffFilter(storeIds = null, { retired = false } = {}) {
  const legacy = await linkedUserIds(retired ? [...LEGACY_CODES, ...RETIRED_CODES] : LEGACY_CODES, storeIds);
  const or = [{ staffKind: KITCHEN_STAFF_KIND }];
  if (legacy.length) or.push({ userId: { $in: legacy } });
  return { $or: or };
}

/** The kitchen staff records of one store (lean), narrowed by `extra`; deleted records never. */
export async function kitchenStaffOf(storeId, extra = {}, opts = {}) {
  const kitchen = await kitchenStaffFilter([storeId], opts);
  return StoreManager.find({ $and: [kitchen, { storeId: String(storeId), status: { $ne: 'DELETED' } }, extra] }).lean();
}

/** One kitchen staff record of one store by its record id (a pre-change User id is also accepted), or null. */
export async function findKitchenStaffRecord(storeId, id, extra = {}) {
  if (!isId(id)) return null;
  const kitchen = await kitchenStaffFilter([storeId]);
  return StoreManager.findOne({
    $and: [kitchen, { storeId: String(storeId), status: { $ne: 'DELETED' } }, { $or: [{ _id: oid(id) }, { userId: oid(id) }] }, extra],
  }).lean();
}

/** The person on a station slot / card as an id string: the staff record, or for old orders the User id. */
export const personKey = (p) => (p?.staffId ? String(p.staffId) : p?.userId ? String(p.userId) : '');

/** A station-slot value for a staff record (what is written on orders and packaging). */
export const slotOf = (member, at = new Date()) => ({
  staffId: member._id,
  ...(member.userId ? { userId: member.userId } : {}),
  name: member.name || '',
  assignedAt: at,
});
