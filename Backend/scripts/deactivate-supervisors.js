// The kitchen supervisor role was removed from the order flow (docs/supervisor-removal.md). This deactivates the
// existing kitchen supervisor accounts. Nothing is deleted: the user, the staff record, the role link and every order,
// task and attendance record stay as they are, so history still reads correctly.
//
//   user account        -> isActive: false   (sign-in shows "The kitchen supervisor role is no longer used ...")
//   staff record        -> status 'Suspended' (left alone when already Suspended, Rejected or DELETED)
//   refresh tokens      -> revoked            (an open session cannot be renewed)
//
// Run: node scripts/deactivate-supervisors.js           dry run: reads only and prints what would change
//      node scripts/deactivate-supervisors.js --apply   writes the changes
// Only counts are printed (no names, emails or ids).
import mongoose from 'mongoose';
import { pathToFileURL } from 'url';
import { config } from '../src/config/env.js';
import { User } from '../src/core/users/models/user.model.js';
import { Role } from '../src/core/roles/models/role.model.js';
import { UserRole } from '../src/core/roles/models/userRole.model.js';
import { RefreshToken } from '../src/core/auth/models/refreshToken.model.js';
import { StoreManager } from '../src/modules/food/franchise/models/storeManager.model.js';
import { FoodOrder } from '../src/modules/food/orders/models/order.model.js';

const KEEP_STATUS = ['Suspended', 'Rejected', 'DELETED'];
const IN_KITCHEN = ['confirmed', 'preparing'];

/** Finds the kitchen supervisor accounts and, with `apply`, deactivates them. Returns counts only. */
export async function deactivateSupervisors({ apply = false } = {}) {
  const roles = await Role.find({ code: { $in: ['KITCHEN_SUPERVISOR', 'KITCHEN-SUPERVISOR', 'kitchen_supervisor', 'kitchen-supervisor'] } })
    .select('_id').lean();
  const roleIds = roles.map((r) => r._id);

  // An account is a supervisor when its main role is the supervisor role, or it holds a supervisor role link.
  const [byPrimary, byLink] = roleIds.length
    ? await Promise.all([
      User.find({ primaryRole: { $in: roleIds } }).select('_id').lean(),
      UserRole.find({ roleId: { $in: roleIds } }).select('userId').lean(),
    ])
    : [[], []];
  const userIds = [...new Set([...byPrimary.map((u) => String(u._id)), ...byLink.map((l) => String(l.userId))])]
    .map((id) => new mongoose.Types.ObjectId(id));

  const staffFilter = { userId: { $in: userIds }, status: { $nin: KEEP_STATUS } };
  const userFilter = { _id: { $in: userIds }, isActive: { $ne: false } };
  const tokenFilter = { userId: { $in: userIds }, revoked: false };

  const counts = {
    supervisorAccounts: userIds.length,
    usersToDeactivate: await User.countDocuments(userFilter),
    staffRecordsToSuspend: await StoreManager.countDocuments(staffFilter),
    sessionsToRevoke: await RefreshToken.countDocuments(tokenFilter),
    // information only: these orders keep working, the stored supervisor is never a permission
    ordersInKitchenWithStoredSupervisor: userIds.length
      ? await FoodOrder.countDocuments({ orderStatus: { $in: IN_KITCHEN }, 'kitchen.supervisor.userId': { $in: userIds } })
      : 0,
    applied: false,
  };

  if (apply && userIds.length) {
    const [u, s, t] = await Promise.all([
      User.updateMany(userFilter, { $set: { isActive: false } }),
      StoreManager.updateMany(staffFilter, { $set: { status: 'Suspended' } }),
      RefreshToken.updateMany(tokenFilter, { $set: { revoked: true } }),
    ]);
    Object.assign(counts, { usersDeactivated: u.modifiedCount, staffRecordsSuspended: s.modifiedCount, sessionsRevoked: t.modifiedCount });
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
    const c = await deactivateSupervisors({ apply });
    console.log(apply ? 'Kitchen supervisor accounts: changes written' : 'Kitchen supervisor accounts: dry run (nothing written; add --apply to write)');
    const rows = [
      ['Supervisor accounts found', c.supervisorAccounts],
      [apply ? 'User accounts deactivated' : 'User accounts to deactivate', apply ? c.usersDeactivated ?? 0 : c.usersToDeactivate],
      [apply ? 'Staff records suspended' : 'Staff records to suspend', apply ? c.staffRecordsSuspended ?? 0 : c.staffRecordsToSuspend],
      [apply ? 'Sessions revoked' : 'Sessions to revoke', apply ? c.sessionsRevoked ?? 0 : c.sessionsToRevoke],
      ['Orders in the kitchen with a stored supervisor (unchanged, keep working)', c.ordersInKitchenWithStoredSupervisor],
    ];
    rows.forEach(([label, n]) => console.log(`  ${label}: ${n}`));
  } catch (err) {
    console.log(`Could not run (${err.name}).`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}
