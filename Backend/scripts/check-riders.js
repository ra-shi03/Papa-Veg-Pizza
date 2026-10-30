// Read-only. Run from Backend/:  node scripts/check-riders.js
// Delivery partners by status and by franchise: counts only, no names, phones or other personal data.
// "Shared fleet" = approved riders with no franchise (approved before franchise admins approved riders); they keep
// working for every store near them until a franchise claims a rider by approving it.
import mongoose from 'mongoose';
import { config } from '../src/config/env.js';
import { FoodDeliveryPartner } from '../src/modules/food/delivery/models/deliveryPartner.model.js';
import { FoodFranchise } from '../src/modules/food/franchise/models/franchise.model.js';

async function main() {
  if (!config.mongodbUri) {
    console.log('MONGO_URI is not set');
    process.exit(1);
  }
  await mongoose.connect(config.mongodbUri, { serverSelectionTimeoutMS: 8000, connectTimeoutMS: 10000 });
  try {
    const byStatus = await FoodDeliveryPartner.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }, { $sort: { _id: 1 } }]);
    const total = byStatus.reduce((a, r) => a + r.n, 0);
    console.log(`\nDelivery partners: ${total}`);
    for (const r of byStatus) console.log(`  ${String(r._id || 'none').padEnd(10)} ${r.n}`);

    const byFranchise = await FoodDeliveryPartner.aggregate([
      { $group: { _id: { f: '$franchiseId', s: '$status' }, n: { $sum: 1 } } },
    ]);
    const names = new Map((await FoodFranchise.find({}).select('name').lean()).map((f) => [String(f._id), f.name]));
    const rows = new Map();
    for (const r of byFranchise) {
      const key = r._id.f ? String(r._id.f) : '';
      if (!rows.has(key)) rows.set(key, {});
      rows.get(key)[r._id.s || 'none'] = r.n;
    }
    console.log('\nBy franchise (pending / approved / suspended / rejected)');
    for (const [key, c] of [...rows.entries()].sort((a, b) => (a[0] ? 1 : 0) - (b[0] ? 1 : 0))) {
      const label = key ? (names.get(key) || `unknown franchise ${key.slice(-6)}`) : 'No franchise (shared fleet / unclaimed)';
      console.log(`  ${label.padEnd(40)} ${c.pending || 0} / ${c.approved || 0} / ${c.suspended || 0} / ${c.rejected || 0}`);
    }
    const shared = await FoodDeliveryPartner.countDocuments({ status: 'approved', franchiseId: null, storeId: null });
    console.log(`\nApproved riders with no franchise (shared fleet, work for every store near them): ${shared}\n`);
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

main().catch((err) => {
  console.log(`check-riders failed (${err.name})`);
  process.exit(1);
});
