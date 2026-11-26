// Kitchen staff no longer sign in (client decision 2026-11-26, docs/kitchen-staff-removal.md): the store manager runs them
// from the store panel. This converts the kitchen staff that already exist. Nothing is deleted: every staff record,
// order, task, attendance and payout record stays, so history still reads correctly.
//
//   staff record         -> staffKind: 'kitchen_staff'  (status unchanged: an Active person stays Active and can still be put on stations)
//   user account         -> isActive: false             (sign-in shows "Kitchen staff no longer sign in ...")
//   refresh tokens       -> revoked                     (an open session cannot be renewed; old access tokens are refused anyway)
//   orders in the kitchen, their open tasks and pizza cards
//                        -> the staff record id is added next to the old User id (kitchen.staff.<station>.staffId,
//                           task.staffId, card.chefStaffId / bakerStaffId), so the manager's screens show who is on each station
//   staff email index    -> unique only where an email is set (kitchen staff may have none)
//
// Run: node scripts/convert-kitchen-staff.js           dry run: reads only and prints what would change
//      node scripts/convert-kitchen-staff.js --apply   writes the changes
// Only counts are printed (no names, emails or ids).
import mongoose from 'mongoose';
import { pathToFileURL } from 'url';
import { config } from '../src/config/env.js';
import { User } from '../src/core/users/models/user.model.js';
import { Role } from '../src/core/roles/models/role.model.js';
import { UserRole } from '../src/core/roles/models/userRole.model.js';
import { RefreshToken } from '../src/core/auth/models/refreshToken.model.js';
import { StoreManager, fixStaffEmailIndex } from '../src/modules/food/franchise/models/storeManager.model.js';
import { FoodOrder } from '../src/modules/food/orders/models/order.model.js';
import { KitchenTask } from '../src/modules/food/store/models/kitchenTask.model.js';
import { KitchenItem } from '../src/modules/food/store/models/kitchenItem.model.js';

const SLOTS = ['pizza_chef', 'baking_chef', 'packaging_staff'];
const OPEN_ORDERS = ['created', 'confirmed', 'preparing', 'ready_for_pickup', 'reached_pickup'];

/** Finds the kitchen staff accounts and, with `apply`, converts them. Returns counts only. */
export async function convertKitchenStaff({ apply = false } = {}) {
  const roles = await Role.find({ code: { $in: ['KITCHEN_STAFF', 'KITCHEN-STAFF', 'kitchen_staff', 'kitchen-staff'] } }).select('_id').lean();
  const roleIds = roles.map((r) => r._id);

  // An account is kitchen staff when its main role is the kitchen staff role, or it holds a kitchen staff role link.
  const [byPrimary, byLink] = roleIds.length
    ? await Promise.all([
      User.find({ primaryRole: { $in: roleIds } }).select('_id').lean(),
      UserRole.find({ roleId: { $in: roleIds } }).select('userId').lean(),
    ])
    : [[], []];
  const userIds = [...new Set([...byPrimary.map((u) => String(u._id)), ...byLink.map((l) => String(l.userId))])]
    .map((id) => new mongoose.Types.ObjectId(id));

  const records = userIds.length
    ? await StoreManager.find({ userId: { $in: userIds }, role: { $not: /manager|supervisor/i } }).select('_id userId staffKind').lean()
    : [];
  const staffOfUser = new Map(records.map((r) => [String(r.userId), r._id]));
  const recordUserIds = records.map((r) => r.userId);

  const recordFilter = { _id: { $in: records.map((r) => r._id) }, staffKind: { $ne: 'kitchen_staff' } };
  const userFilter = { _id: { $in: userIds }, isActive: { $ne: false } };
  const tokenFilter = { userId: { $in: userIds }, revoked: false };

  // Orders still open that name a converted person by their User id only
  const slotOr = SLOTS.flatMap((s) => [{ [`kitchen.staff.${s}.userId`]: { $in: recordUserIds }, [`kitchen.staff.${s}.staffId`]: null }]);
  slotOr.push({ 'kitchen.packaging.staff.userId': { $in: recordUserIds }, 'kitchen.packaging.staff.staffId': null });
  const orders = recordUserIds.length
    ? await FoodOrder.find({ orderStatus: { $in: OPEN_ORDERS }, $or: slotOr }).select('_id kitchen.staff kitchen.packaging.staff').lean()
    : [];
  const taskFilter = { assignedTo: { $in: recordUserIds }, staffId: null, status: { $ne: 'completed' } };
  const openOrderIds = recordUserIds.length
    ? await FoodOrder.distinct('_id', { orderStatus: { $in: ['confirmed', 'preparing'] } })
    : [];
  const itemFilter = { orderId: { $in: openOrderIds }, $or: [{ chefId: { $in: recordUserIds }, chefStaffId: null }, { bakerId: { $in: recordUserIds }, bakerStaffId: null }] };

  const counts = {
    kitchenStaffAccounts: userIds.length,
    staffRecordsToMark: await StoreManager.countDocuments(recordFilter),
    usersToSwitchOff: await User.countDocuments(userFilter),
    sessionsToRevoke: await RefreshToken.countDocuments(tokenFilter),
    openOrdersToLink: orders.length,
    openTasksToLink: recordUserIds.length ? await KitchenTask.countDocuments(taskFilter) : 0,
    pizzaCardsToLink: recordUserIds.length ? await KitchenItem.countDocuments(itemFilter) : 0,
    applied: false,
  };

  if (apply) {
    const [r, u, t] = await Promise.all([
      StoreManager.updateMany(recordFilter, { $set: { staffKind: 'kitchen_staff' } }),
      User.updateMany(userFilter, { $set: { isActive: false } }),
      RefreshToken.updateMany(tokenFilter, { $set: { revoked: true } }),
    ]);

    const orderOps = orders.map((o) => {
      const set = {};
      for (const s of SLOTS) {
        const p = o.kitchen?.staff?.[s];
        if (p?.userId && !p.staffId && staffOfUser.has(String(p.userId))) set[`kitchen.staff.${s}.staffId`] = staffOfUser.get(String(p.userId));
      }
      const pk = o.kitchen?.packaging?.staff;
      if (pk?.userId && !pk.staffId && staffOfUser.has(String(pk.userId))) set['kitchen.packaging.staff.staffId'] = staffOfUser.get(String(pk.userId));
      return { updateOne: { filter: { _id: o._id }, update: { $set: set } } };
    }).filter((op) => Object.keys(op.updateOne.update.$set).length);
    const ordersLinked = orderOps.length ? (await FoodOrder.bulkWrite(orderOps, { ordered: false })).modifiedCount : 0;

    let tasksLinked = 0;
    let cardsLinked = 0;
    for (const [userId, staffId] of staffOfUser) {
      const uid = new mongoose.Types.ObjectId(userId);
      tasksLinked += (await KitchenTask.updateMany({ ...taskFilter, assignedTo: uid }, { $set: { staffId } })).modifiedCount;
      cardsLinked += (await KitchenItem.updateMany({ orderId: { $in: openOrderIds }, chefId: uid, chefStaffId: null }, { $set: { chefStaffId: staffId } })).modifiedCount;
      cardsLinked += (await KitchenItem.updateMany({ orderId: { $in: openOrderIds }, bakerId: uid, bakerStaffId: null }, { $set: { bakerStaffId: staffId } })).modifiedCount;
    }

    await fixStaffEmailIndex();
    Object.assign(counts, {
      staffRecordsMarked: r.modifiedCount, usersSwitchedOff: u.modifiedCount, sessionsRevoked: t.modifiedCount,
      ordersLinked, tasksLinked, cardsLinked,
    });
  }
  counts.applied = !!apply;
  return counts;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const apply = process.argv.includes('--apply');
  if (!config.mongodbUri) {
    console.log('MONGO_URI is not set.');
    process.exit(1);
  }
  try {
    await mongoose.connect(config.mongodbUri, { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 10000 });
    const c = await convertKitchenStaff({ apply });
    console.log(apply ? 'Kitchen staff accounts: changes written' : 'Kitchen staff accounts: dry run (nothing written; add --apply to write)');
    const rows = [
      ['Kitchen staff accounts found', c.kitchenStaffAccounts],
      [apply ? 'Staff records marked as kitchen staff' : 'Staff records to mark as kitchen staff', apply ? c.staffRecordsMarked ?? 0 : c.staffRecordsToMark],
      [apply ? 'Logins switched off' : 'Logins to switch off', apply ? c.usersSwitchedOff ?? 0 : c.usersToSwitchOff],
      [apply ? 'Sessions revoked' : 'Sessions to revoke', apply ? c.sessionsRevoked ?? 0 : c.sessionsToRevoke],
      [apply ? 'Open orders linked to staff records' : 'Open orders to link to staff records', apply ? c.ordersLinked ?? 0 : c.openOrdersToLink],
      [apply ? 'Open tasks linked' : 'Open tasks to link', apply ? c.tasksLinked ?? 0 : c.openTasksToLink],
      [apply ? 'Pizza cards linked' : 'Pizza cards to link', apply ? c.cardsLinked ?? 0 : c.pizzaCardsToLink],
    ];
    rows.forEach(([label, n]) => console.log(`  ${label}: ${n}`));
  } catch (err) {
    console.log(`Could not run (${err.name}).`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}
