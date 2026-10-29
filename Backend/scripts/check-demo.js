// Read-only demo readiness check. Run from Backend/:  node scripts/check-demo.js
// Reports the env settings that matter for a demo and, for every store, whether an order can be taken and
// delivered. It only reads: no writes, and it prints no secrets (no URIs, tokens or phone numbers).
// Exit code 1 when any check FAILs (WARN does not fail).
import mongoose from 'mongoose';
import { config } from '../src/config/env.js';
import { isProductionDefaultOtpOn } from '../src/core/otp/otp.service.js';
import { FoodStore } from '../src/modules/food/store/models/store.model.js';
import { StoreManager } from '../src/modules/food/franchise/models/storeManager.model.js';
import { FoodDeliveryPartner } from '../src/modules/food/delivery/models/deliveryPartner.model.js';
import { Role } from '../src/core/roles/models/role.model.js';
import { UserRole } from '../src/core/roles/models/userRole.model.js';
import { openStoreIds } from '../src/modules/food/franchise/services/storeHours.js';

const LOCAL = /^(localhost|127\.|0\.0\.0\.0|\[?::1\]?$)/i;
const PASS = 'PASS';
const FAIL = 'FAIL';
const WARN = 'WARN';

const hostOf = (origin) => {
  try {
    return new URL(origin.includes('://') ? origin : `http://${origin}`).hostname;
  } catch (_) {
    return origin;
  }
};

function envChecks() {
  const origins = String(process.env.FRONTEND_URL || '').split(',').map((s) => s.trim()).filter(Boolean);
  const nonLocal = origins.filter((o) => !LOCAL.test(hostOf(o)));
  const prodOtp = isProductionDefaultOtpOn();
  const phones = config.testOtpPhones.length;
  const otpSwitch = config.useDefaultOtp
    ? 'ON (dev default OTP, never active in production)'
    : prodOtp
      ? 'ON in production (USE_DEFAULT_OTP + ALLOW_DEFAULT_OTP_IN_PRODUCTION)'
      : config.useDefaultOtpRequested
        ? 'requested but inactive (production also needs ALLOW_DEFAULT_OTP_IN_PRODUCTION=true)'
        : 'OFF';
  return [
    ['FRONTEND_URL', origins.length === 0 ? FAIL : nonLocal.length === 0 ? FAIL : PASS,
      origins.length === 0 ? 'not set' : nonLocal.length === 0 ? 'only local addresses' : `${nonLocal.length} public origin(s) of ${origins.length}`],
    ['JWT_ACCESS_EXPIRES', config.jwtAccessExpiresIn === '7d' ? FAIL : PASS, `is ${config.jwtAccessExpiresIn}${config.jwtAccessExpiresIn === '7d' ? ' (must not be 7d)' : ''}`],
    ['NODE_ENV', config.nodeEnv === 'production' ? PASS : WARN, config.nodeEnv || 'not set'],
    ['Default-OTP switch', prodOtp && phones === 0 ? FAIL : prodOtp ? WARN : PASS, otpSwitch],
    ['TEST_OTP_PHONES', phones > 0 ? PASS : prodOtp ? FAIL : WARN,
      phones > 0 ? `set (${phones} number(s))` : prodOtp ? 'empty while the switch is on: anyone can sign in with 123456' : 'not set'],
  ];
}

async function storeChecks() {
  const stores = await FoodStore.find({}).select('storeName code approvalStatus isActive').sort({ storeName: 1 }).lean();
  if (stores.length === 0) return { rows: [], riders: 0, ridersFresh: 0 };
  const ids = stores.map((s) => s._id);

  const open = await openStoreIds(ids);

  const supRole = await Role.findOne({ code: 'KITCHEN_SUPERVISOR' }).select('_id').lean();
  const links = supRole ? await UserRole.find({ storeId: { $in: ids }, roleId: supRole._id }).select('userId storeId').lean() : [];
  const staff = links.length
    ? await StoreManager.find({ userId: { $in: links.map((l) => l.userId) }, status: 'Active' }).select('userId').lean()
    : [];
  const activeUsers = new Set(staff.map((s) => String(s.userId)));
  const supervisors = new Map();
  for (const l of links) {
    if (activeUsers.has(String(l.userId))) supervisors.set(String(l.storeId), (supervisors.get(String(l.storeId)) || 0) + 1);
  }

  // Riders are not tied to a store: dispatch offers an order to any approved, online rider.
  const riders = await FoodDeliveryPartner.countDocuments({ status: 'approved', availabilityStatus: 'online' });
  const fresh = await FoodDeliveryPartner.countDocuments({
    status: 'approved', availabilityStatus: 'online', lastLocationAt: { $gt: new Date(Date.now() - 10 * 60 * 1000) },
  });

  const rows = stores.map((s) => {
    const approved = s.approvalStatus === 'Approved' && s.isActive !== false;
    const isOpen = open.has(String(s._id));
    const sup = supervisors.get(String(s._id)) || 0;
    return { name: s.storeName || s.code || String(s._id), approved, isOpen, sup, riders };
  });
  return { rows, riders, ridersFresh: fresh };
}

const mark = (ok) => (ok ? PASS : FAIL);

async function main() {
  let failed = false;
  console.log('\nEnvironment');
  const env = envChecks();
  const w = Math.max(...env.map((r) => r[0].length));
  for (const [name, result, note] of env) {
    if (result === FAIL) failed = true;
    console.log(`  ${result.padEnd(4)}  ${name.padEnd(w)}  ${note}`);
  }

  console.log('\nStores');
  const uri = config.mongodbUri;
  if (!uri) {
    console.log('  FAIL  MONGO_URI is not set, cannot read stores');
    process.exit(1);
  }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 10000 });
    const { rows, riders, ridersFresh } = await storeChecks();
    if (rows.length === 0) {
      console.log('  FAIL  no stores found');
      failed = true;
    } else {
      const nw = Math.max(5, ...rows.map((r) => r.name.length));
      const head = `  ${'Store'.padEnd(nw)}  Approved  Open now  Supervisor  Rider online  Result`;
      console.log(head);
      for (const r of rows) {
        const ok = r.approved && r.isOpen && r.sup > 0 && r.riders > 0;
        if (!ok) failed = true;
        console.log(`  ${r.name.padEnd(nw)}  ${mark(r.approved).padEnd(8)}  ${mark(r.isOpen).padEnd(8)}  ${(r.sup > 0 ? PASS : FAIL).padEnd(10)}  ${(r.riders > 0 ? PASS : FAIL).padEnd(12)}  ${ok ? PASS : FAIL}`);
      }
      console.log(`\n  Approved online riders on the platform: ${riders} (${ridersFresh} with a GPS fix in the last 10 minutes)`);
    }
  } catch (err) {
    console.log(`  FAIL  could not read the database (${err.name})`);
    failed = true;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
  console.log(failed ? '\nNot ready for the demo.\n' : '\nReady for the demo.\n');
  process.exit(failed ? 1 : 0);
}

main();
