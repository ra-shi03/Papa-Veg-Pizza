// Read-only. Run from Backend/:  node scripts/check-nearby.js
// For each store: its coordinates and city, and how many approved, pending and online riders and how many nearby
// customers fall inside NEARBY_RADIUS_KM (the same rule the store panel and auto-dispatch use). It writes nothing and
// prints no secrets (no URIs, phones or names).
import mongoose from 'mongoose';
import { config } from '../src/config/env.js';
import { FoodStore } from '../src/modules/food/store/models/store.model.js';
import { FoodDeliveryPartner } from '../src/modules/food/delivery/models/deliveryPartner.model.js';
import { User } from '../src/core/users/models/user.model.js';
import { Role } from '../src/core/roles/models/role.model.js';
import { nearbyRadiusKm, storeArea, nearbyAddressFilter } from '../src/modules/food/store/services/nearby.js';
import { riderScope } from '../src/modules/food/store/services/storeDelivery.service.js';

const fmt = (n) => (Number.isFinite(n) ? n.toFixed(4) : '-');

async function main() {
  if (!config.mongodbUri) {
    console.log('MONGO_URI is not set, cannot read stores');
    process.exit(1);
  }
  await mongoose.connect(config.mongodbUri, { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 10000 });
  try {
    console.log(`\nNearby radius: ${nearbyRadiusKm()} km (NEARBY_RADIUS_KM)\n`);
    const stores = await FoodStore.find({}).select('storeName code latitude longitude city franchiseId zoneId approvalStatus').sort({ storeName: 1 }).lean();
    if (!stores.length) console.log('No stores found.');
    const customerRole = await Role.findOne({ code: 'CUSTOMER' }).select('_id').lean();
    let allEmpty = true;
    for (const s of stores) {
      const { filter } = await riderScope(s);
      const area = await storeArea(s._id);
      const riders = await FoodDeliveryPartner.find(filter).select('status availabilityStatus').lean();
      const approved = riders.filter((r) => r.status === 'approved').length;
      const pending = riders.filter((r) => r.status === 'pending').length;
      const online = riders.filter((r) => r.status === 'approved' && r.availabilityStatus === 'online').length;
      const customers = customerRole
        ? await User.countDocuments({ primaryRole: customerRole._id, isDeleted: { $ne: true }, ...nearbyAddressFilter(area, { list: 'addresses', point: 'location', city: 'city' }) })
        : 0;
      if (riders.length || customers) allEmpty = false;
      const warn = !area.center && !area.polygon ? '  WARN: no coordinates and no zone, only the city matches' : '';
      console.log(`${s.storeName || s.code || s._id}${s.approvalStatus ? ` [${s.approvalStatus}]` : ''}`);
      console.log(`  coordinates: ${fmt(s.latitude)}, ${fmt(s.longitude)}   city: ${s.city || '-'}   zone: ${s.zoneId ? 'yes' : 'no'}${warn}`);
      console.log(`  riders: ${approved} approved, ${pending} pending, ${online} online   nearby customers: ${customers}\n`);
    }
    if (stores.length && allEmpty) console.log('No rider or customer is near any store: check store coordinates / city and where riders and customers are.\n');
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

main().catch((err) => {
  console.log(`check-nearby failed (${err.name})`);
  process.exit(1);
});
