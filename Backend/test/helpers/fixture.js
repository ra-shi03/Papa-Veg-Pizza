// Shared fixture for the security regression tests.
//
// - Runs against a THROWAWAY database on the cluster in MONGODB_URI (named pvp_test_<pid>_<time>),
//   created here and dropped in teardown(). The real database is never read or written.
// - Everything is set up through the real HTTP API where possible, so the tests exercise the same
//   middleware, controllers and scoping code as production.
// - No email, push notification, SMS or Cloudinary call is made.

// Environment must be fixed BEFORE the app (and src/config/env.js) is imported.
process.env.NODE_ENV = process.env.NODE_ENV === 'production' ? 'production' : 'test'; // a test file may opt in to production mode (set before importing this file)
process.env.RATE_LIMIT_MAX = '1000000';
process.env.AUTH_RATE_LIMIT_MAX = '1000000';
process.env.EMAIL_HOST = '';
process.env.EMAIL_USER = '';
process.env.FIREBASE_SERVICE_ACCOUNT = '';
process.env.FIREBASE_SERVICE_ACCOUNT_PATH = '';
// Never talk to the real SMS provider from a test
process.env.SMS_INDIA_HUB_API_KEY = '';
process.env.SMS_INDIA_HUB_USERNAME = '';
process.env.SMS_INDIA_HUB_SENDER_ID = '';
process.env.SMS_INDIA_HUB_DLT_TEMPLATE_ID = '';
process.env.RAZORPAY_KEY_ID = '';
process.env.RAZORPAY_KEY_SECRET = '';
process.env.CLOUDINARY_CLOUD_NAME = 'test';
process.env.CLOUDINARY_API_KEY = 'test';
process.env.CLOUDINARY_API_SECRET = 'test';

await import('dotenv/config');

import http from 'node:http';
import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';

export const PASSWORD = 'Reg#Test-Pass1';

async function build(ctx) {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) throw new Error('MONGODB_URI is not set (Backend/.env): the regression tests need a MongoDB to run against.');

    const dbName = `pvp_test_${process.pid}_${Date.now().toString(36)}`;
    // Hard guard: only ever work in a database created for this run.
    if (!/^pvp_test_/.test(dbName)) throw new Error('refusing to run outside a pvp_test_* database');

    await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 20000 });
    if (mongoose.connection.name !== dbName) throw new Error(`connected to ${mongoose.connection.name}, expected ${dbName}`);

    // Housekeeping: a run that was killed or force-exited can leave its database behind, and the cluster
    // has a hard cap on collections. Drop our own leftovers (pvp_test_<pid>_<base36 time>) older than 30 min.
    try {
        const { databases } = await mongoose.connection.db.admin().listDatabases();
        for (const { name } of databases) {
            const m = /^pvp_test_\d+_([0-9a-z]+)$/.exec(name);
            if (m && name !== dbName && Date.now() - parseInt(m[1], 36) > 30 * 60 * 1000) {
                await mongoose.connection.client.db(name).dropDatabase();
            }
        }
    } catch { /* housekeeping only; never fail a run because of it */ }

    const { default: app } = await import('../../src/app.js');
    const m = async (path, name) => (await import(`../../src/${path}`))[name];
    const User = await m('core/users/models/user.model.js', 'User');
    const Role = await m('core/roles/models/role.model.js', 'Role');
    const UserRole = await m('core/roles/models/userRole.model.js', 'UserRole');
    const FoodOrder = await m('modules/food/orders/models/order.model.js', 'FoodOrder');
    const FoodStore = await m('modules/food/store/models/store.model.js', 'FoodStore');
    const StoreManager = await m('modules/food/franchise/models/storeManager.model.js', 'StoreManager');
    const FoodFranchise = await m('modules/food/franchise/models/franchise.model.js', 'FoodFranchise');
    const RefreshToken = await m('core/auth/models/refreshToken.model.js', 'RefreshToken');
    const AdminResetOtp = await m('core/admin/adminResetOtp.model.js', 'AdminResetOtp');
    const { signAccessToken } = await import('../../src/core/auth/token.util.js');

    // Build indexes (unique mobile/email) before the first insert.
    await Promise.all(Object.values(mongoose.models).map((model) => model.init().catch(() => {})));

    // One long-lived server for the whole run. (supertest(app) would start and stop a server per request,
    // which is flaky when several test files run in parallel.)
    ctx.server = http.createServer(app);
    await new Promise((resolve) => ctx.server.listen(0, '127.0.0.1', resolve));
    const api = request(`http://127.0.0.1:${ctx.server.address().port}`);
    const ts = Date.now();
    const models = { User, Role, UserRole, FoodOrder, FoodStore, StoreManager, FoodFranchise, RefreshToken, AdminResetOtp };

    // ---- roles + super admin (no API can create the first super admin)
    const roles = {};
    for (const [code, name] of [['SUPER_ADMIN', 'Super Admin'], ['FRANCHISE_ADMIN', 'Franchise Admin'], ['STORE_MANAGER', 'Store Manager'],
        ['KITCHEN_SUPERVISOR', 'Kitchen Supervisor'], ['KITCHEN_STAFF', 'Kitchen Staff'], ['CUSTOMER', 'Customer']]) {
        roles[code] = await Role.create({ code, name });
    }
    const superUser = await User.create({ email: `super${ts}@example.invalid`, mobile: '9100000001', password: PASSWORD, loginType: 'PASSWORD', primaryRole: roles.SUPER_ADMIN._id, isActive: true });
    await UserRole.create({ userId: superUser._id, roleId: roles.SUPER_ADMIN._id, isPrimary: true, status: 'ACTIVE' });

    const tokenFor = (user, role, scope = {}) =>
        signAccessToken({ userId: String(user._id ?? user), role, franchiseId: scope.franchiseId ?? null, storeId: scope.storeId ?? null });
    const bearer = (token) => (token ? { Authorization: `Bearer ${token}` } : {});
    /** call(method, path, token, body) -> supertest response (never throws on 4xx/5xx) */
    const call = (method, path, token, body) => {
        let r = api[method.toLowerCase()](`/api${path}`).set(bearer(token));
        if (body !== undefined && method.toUpperCase() !== 'GET') r = r.send(body);
        return r;
    };

    const SA = tokenFor(superUser, 'superadmin');

    // ---- two franchises, each: admin (logs in for real), approved store, manager, customer, order
    const F = {};
    for (const [k, d] of [['A', '41'], ['B', '42']]) {
        const email = `fa-${k.toLowerCase()}${ts}@example.invalid`;
        const cf = await call('POST', '/v1/food/admin/franchises', SA, {
            name: `Owner ${k}`, email, phone: `${d}${String(ts).slice(-8)}`, password: PASSWORD, franchiseName: `TEST Franchise ${k}`,
            franchiseCode: `T${k}${ts}`, city: 'X', state: 'Y', pincode: '110001', address: 'a',
        });
        if (cf.status !== 201) throw new Error(`fixture: create franchise ${k} -> ${cf.status} ${JSON.stringify(cf.body)}`);
        const franchiseId = cf.body.data.franchise._id;
        const login = await call('POST', '/v1/auth/franchise/login', null, { email, password: PASSWORD });
        if (login.status !== 200) throw new Error(`fixture: franchise ${k} login -> ${login.status} ${JSON.stringify(login.body)}`);
        const adminToken = login.body.data.accessToken;

        const st = await call('POST', '/v1/stores', adminToken, {
            storeName: `TEST STORE ${k}`, storeCode: `TS${k}${ts}`, storeType: 'DELIVERY_CARRYOUT', phone: `99999999${d}`, email: `store-${k.toLowerCase()}${ts}@example.invalid`,
            address: { line1: 'a', city: 'c', state: 's', pincode: '110001', coordinates: [77.2, 28.6] }, status: 'Active',
        });
        if (st.status !== 201) throw new Error(`fixture: create store ${k} -> ${st.status} ${JSON.stringify(st.body)}`);
        const storeId = st.body.data._id;
        const ap = await call('PATCH', `/v1/store-approvals/${storeId}/approve`, SA, {});
        if (ap.status !== 200) throw new Error(`fixture: approve store ${k} -> ${ap.status}`);

        const mgrEmail = `mgr-${k.toLowerCase()}${ts}@example.invalid`;
        const mc = await api.post('/api/v1/store-managers').set(bearer(adminToken))
            .field('name', `Manager ${k}`).field('email', mgrEmail).field('phone', `5${d}${String(ts).slice(-8)}`)
            .field('employeeCode', `EM${k}${ts}`).field('storeId', storeId).field('password', PASSWORD).field('status', 'Active').field('salary', '1000');
        if (mc.status !== 201) throw new Error(`fixture: create manager ${k} -> ${mc.status} ${JSON.stringify(mc.body)}`);
        const mgrLogin = await call('POST', '/v1/auth/store/login', null, { email: mgrEmail, password: PASSWORD });
        if (mgrLogin.status !== 200) throw new Error(`fixture: manager ${k} login -> ${mgrLogin.status}`);

        const customer = await User.create({ mobile: `6${d}${String(ts).slice(-8)}`, loginType: 'OTP', primaryRole: roles.CUSTOMER._id, isActive: true });
        const phone = `98${d}${String(ts).slice(-6)}`;
        const order = await FoodOrder.collection.insertOne({
            order_id: `TESTORD${k}${ts}`, orderId: `TESTORD${k}${ts}`, userId: customer._id, storeId: new mongoose.Types.ObjectId(storeId),
            franchiseId: new mongoose.Types.ObjectId(franchiseId), customerPhone: phone, orderStatus: 'created',
            payment: { method: 'cash', status: 'pending' }, pricing: { total: 100 }, items: [], createdAt: new Date(), updatedAt: new Date(),
        });

        F[k] = {
            franchiseId, storeId, email, adminToken, adminUserId: cf.body.data.admin._id,
            managerId: mc.body.data._id, managerUserId: mc.body.data.userId, managerEmail: mgrEmail, managerToken: mgrLogin.body.data.accessToken,
            customerId: String(customer._id), customerToken: tokenFor(customer, 'CUSTOMER'), orderId: String(order.insertedId), orderRef: `TESTORD${k}${ts}`, phone,
        };
    }

    return {
        api, call, bearer, tokenFor, models, ts, F, SA, superUser, roles,
        /** a signed token for an existing user, claiming any role/scope */
        claim: (role, scope) => tokenFor(F.A.adminUserId, role, scope),
    };
}

/**
 * Builds the fixture. The returned teardown() (also run automatically if setup fails) drops the
 * throwaway database and disconnects, so a failed run can neither leak data nor hang the process.
 */
export async function createFixture() {
    const ctx = { server: null };
    const dispose = async () => {
        try {
            if (ctx.server) {
                ctx.server.closeAllConnections?.();
                await new Promise((resolve) => ctx.server.close(resolve));
                ctx.server = null;
            }
            if (mongoose.connection.readyState === 1) {
                if (!/^pvp_test_/.test(mongoose.connection.name)) throw new Error('refusing to drop a non-test database');
                await mongoose.connection.dropDatabase();
            }
        } finally {
            await mongoose.disconnect();
        }
    };
    try {
        return { ...(await build(ctx)), teardown: dispose };
    } catch (error) {
        await dispose().catch(() => {});
        throw error;
    }
}

export { jwt, mongoose };
