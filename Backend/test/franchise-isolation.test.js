// P0 item 3: franchise admin A must not see, change or delete anything that belongs to franchise B.
// Foreign records are reported as 404 (not 403), so A cannot even tell they exist.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture } from './helpers/fixture.js';

let fx; let A; let B;
before(async () => { fx = await createFixture(); A = fx.F.A; B = fx.F.B; });
after(async () => { await fx?.teardown(); });

const idOf = (x) => String(x?._id ?? x?.id ?? x);
const ids = (arr) => (arr || []).map(idOf);
const orderIds = (body) => ids(body?.data?.orders || body?.data?.docs || body?.data);

describe('stores', () => {
    test('A\'s store list contains A\'s store and not B\'s', async () => {
        const res = await fx.call('GET', '/v1/stores?limit=1000', A.adminToken);
        assert.equal(res.status, 200);
        assert.ok(ids(res.body.data.stores).includes(A.storeId));
        assert.ok(!ids(res.body.data.stores).includes(B.storeId));
        assert.ok(res.body.data.stores.every((s) => idOf(s.franchiseId) === A.franchiseId));
    });
    test('?franchiseId=B cannot widen the scope', async () => {
        const res = await fx.call('GET', `/v1/stores?franchiseId=${B.franchiseId}`, A.adminToken);
        assert.ok(!ids(res.body.data.stores).includes(B.storeId));
        assert.ok(ids(res.body.data.stores).includes(A.storeId));
    });
    test('A cannot read B\'s store by id or by code (404)', async () => {
        assert.equal((await fx.call('GET', `/v1/stores/${B.storeId}`, A.adminToken)).status, 404);
        assert.equal((await fx.call('GET', `/v1/stores/TSB${fx.ts}`, A.adminToken)).status, 404);
    });
    test('A can read its own store (200)', async () => {
        assert.equal((await fx.call('GET', `/v1/stores/${A.storeId}`, A.adminToken)).status, 200);
    });
    test('A cannot edit B\'s store (404) and B\'s store is unchanged', async () => {
        const before = await fx.models.FoodStore.findById(B.storeId).lean();
        const res = await fx.call('PATCH', `/v1/stores/${B.storeId}`, A.adminToken, { storeName: 'HACKED', status: 'Inactive' });
        const after = await fx.models.FoodStore.findById(B.storeId).lean();
        assert.equal(res.status, 404);
        assert.equal(after.storeName, before.storeName);
        assert.equal(after.isActive, before.isActive);
    });
    test('A cannot delete B\'s store (404) and it still exists', async () => {
        assert.equal((await fx.call('DELETE', `/v1/stores/${B.storeId}`, A.adminToken)).status, 404);
        assert.ok(await fx.models.FoodStore.exists({ _id: B.storeId }));
    });
    test('store KPIs only count A\'s franchise', async () => {
        const res = await fx.call('GET', '/v1/stores/dashboard-kpis', A.adminToken);
        const mine = await fx.models.FoodStore.countDocuments({ franchiseId: A.franchiseId, status: { $ne: 'DELETED' } });
        assert.equal(res.body.data.totalStores, mine);
    });
    test('/v1/food/admin/stores: A sees only its own; foreign id -> 404', async () => {
        const list = await fx.call('GET', '/v1/food/admin/stores?limit=1000', A.adminToken);
        assert.ok(ids(list.body.data.stores).includes(A.storeId));
        assert.ok(!ids(list.body.data.stores).includes(B.storeId));
        assert.equal((await fx.call('GET', `/v1/food/admin/stores/${B.storeId}`, A.adminToken)).status, 404);
        assert.equal((await fx.call('GET', `/v1/food/admin/stores/${A.storeId}`, A.adminToken)).status, 200);
    });
    test('super admin sees every franchise and can narrow with ?franchiseId=', async () => {
        const all = await fx.call('GET', '/v1/food/admin/stores?limit=1000', fx.SA);
        assert.ok(ids(all.body.data.stores).includes(A.storeId) && ids(all.body.data.stores).includes(B.storeId));
        const one = await fx.call('GET', `/v1/food/admin/stores?limit=1000&franchiseId=${B.franchiseId}`, fx.SA);
        assert.ok(ids(one.body.data.stores).includes(B.storeId) && !ids(one.body.data.stores).includes(A.storeId));
    });
});

describe('orders', () => {
    test('A\'s order list has A\'s order, not B\'s', async () => {
        const res = await fx.call('GET', '/v1/food/admin/orders?limit=1000', A.adminToken);
        assert.equal(res.status, 200);
        assert.ok(orderIds(res.body).includes(A.orderId));
        assert.ok(!orderIds(res.body).includes(B.orderId));
    });
    test('?storeId=<B store> returns nothing for A', async () => {
        const res = await fx.call('GET', `/v1/food/admin/orders?limit=1000&storeId=${B.storeId}`, A.adminToken);
        assert.equal(res.status, 200);
        assert.equal(orderIds(res.body).length, 0);
    });
    test('A cannot open B\'s order by id or by public order id (404)', async () => {
        assert.equal((await fx.call('GET', `/v1/food/admin/orders/${B.orderId}`, A.adminToken)).status, 404);
        assert.equal((await fx.call('GET', `/v1/food/admin/orders/${B.orderRef}`, A.adminToken)).status, 404);
    });
    test('A can open its own order (200)', async () => {
        assert.equal((await fx.call('GET', `/v1/food/admin/orders/${A.orderId}`, A.adminToken)).status, 200);
    });
    test('/v1/food/franchise/orders returns only A\'s orders', async () => {
        const res = await fx.call('GET', '/v1/food/franchise/orders', A.adminToken);
        const text = JSON.stringify(res.body);
        assert.ok(text.includes(A.orderId) && !text.includes(B.orderId));
    });
    test('A cannot delete orders at all (super admin only)', async () => {
        assert.equal((await fx.call('DELETE', `/v1/food/admin/orders/${A.orderId}`, A.adminToken)).status, 403);
        assert.ok(await fx.models.FoodOrder.collection.findOne({ order_id: A.orderRef }));
    });
    test('super admin sees both franchises\' orders', async () => {
        const res = await fx.call('GET', '/v1/food/admin/orders?limit=1000', fx.SA);
        assert.ok(orderIds(res.body).includes(A.orderId) && orderIds(res.body).includes(B.orderId));
    });
});

describe('customers', () => {
    test('A lists A\'s customer, not B\'s', async () => {
        const res = await fx.call('GET', '/v1/food/admin/customers?limit=1000', A.adminToken);
        assert.equal(res.status, 200);
        assert.ok(ids(res.body.data.customers).includes(A.customerId));
        assert.ok(!ids(res.body.data.customers).includes(B.customerId));
    });
    test('A cannot open B\'s customer (404) but can open its own (200)', async () => {
        assert.equal((await fx.call('GET', `/v1/food/admin/customers/${B.customerId}`, A.adminToken)).status, 404);
        assert.equal((await fx.call('GET', `/v1/food/admin/customers/${A.customerId}`, A.adminToken)).status, 200);
    });
    test('the customers endpoint cannot be used to read staff / admin accounts (404)', async () => {
        assert.equal((await fx.call('GET', `/v1/food/admin/customers/${fx.superUser._id}`, A.adminToken)).status, 404);
        assert.equal((await fx.call('GET', `/v1/food/admin/customers/${B.adminUserId}`, A.adminToken)).status, 404);
    });
    test('A cannot deactivate a customer (super admin only)', async () => {
        assert.equal((await fx.call('PATCH', `/v1/food/admin/customers/${B.customerId}/status`, A.adminToken, { isActive: false })).status, 403);
        assert.notEqual((await fx.models.User.findById(B.customerId).lean()).isActive, false);
    });
    test('super admin sees both customers', async () => {
        const res = await fx.call('GET', '/v1/food/admin/customers?limit=1000', fx.SA);
        assert.ok(ids(res.body.data.customers).includes(A.customerId) && ids(res.body.data.customers).includes(B.customerId));
    });
});

describe('store managers', () => {
    test('A lists A\'s manager, not B\'s', async () => {
        const res = await fx.call('GET', '/v1/store-managers', A.adminToken);
        assert.ok(ids(res.body.data).includes(A.managerId));
        assert.ok(!ids(res.body.data).includes(B.managerId));
    });
    test('A cannot read, edit or delete B\'s manager (404) and nothing changes', async () => {
        const before = await fx.models.StoreManager.findById(B.managerId).lean();
        assert.equal((await fx.call('GET', `/v1/store-managers/${B.managerId}`, A.adminToken)).status, 404);
        assert.equal((await fx.call('PATCH', `/v1/store-managers/${B.managerId}`, A.adminToken, { name: 'HACKED', status: 'Suspended' })).status, 404);
        assert.equal((await fx.call('DELETE', `/v1/store-managers/${B.managerId}`, A.adminToken)).status, 404);
        const after = await fx.models.StoreManager.findById(B.managerId).lean();
        assert.equal(after.name, before.name);
        assert.equal(after.status, before.status);
    });
    test('A cannot move its manager into B\'s store (400)', async () => {
        const res = await fx.call('PATCH', `/v1/store-managers/${A.managerId}`, A.adminToken, { storeId: B.storeId });
        assert.equal(res.status, 400);
        assert.equal((await fx.models.StoreManager.findById(A.managerId).lean()).storeId, A.storeId);
    });
    test('A cannot create a manager in B\'s store (400) and no login account is created', async () => {
        const email = `intruder${fx.ts}@example.invalid`;
        const res = await fx.api.post('/api/v1/store-managers').set(fx.bearer(A.adminToken))
            .field('name', 'Intruder').field('email', email).field('phone', `53${String(fx.ts).slice(-8)}`)
            .field('employeeCode', `INT${fx.ts}`).field('storeId', B.storeId).field('password', 'Reg#Test-Pass1').field('status', 'Active');
        assert.equal(res.status, 400);
        assert.ok(!(await fx.models.User.exists({ email })));
    });
    test('super admin sees both managers', async () => {
        const res = await fx.call('GET', '/v1/store-managers', fx.SA);
        assert.ok(ids(res.body.data).includes(A.managerId) && ids(res.body.data).includes(B.managerId));
    });
});

describe('store approvals', () => {
    test('A\'s approvals list shows only A\'s stores', async () => {
        const text = JSON.stringify((await fx.call('GET', '/v1/store-approvals?limit=1000', A.adminToken)).body);
        assert.ok(text.includes(A.storeId) && !text.includes(B.storeId));
    });
    test('A\'s approvals dashboard counts only A\'s franchise', async () => {
        const res = await fx.call('GET', '/v1/store-approvals/dashboard', A.adminToken);
        assert.equal(res.body.data.approvedStores, await fx.models.FoodStore.countDocuments({ franchiseId: A.franchiseId, approvalStatus: 'Approved' }));
    });
    test('A cannot submit B\'s store for approval (404)', async () => {
        assert.equal((await fx.call('POST', `/v1/store-approvals/${B.storeId}/submit`, A.adminToken)).status, 404);
    });
    test('A cannot approve or reject even its own store (403)', async () => {
        assert.equal((await fx.call('PATCH', `/v1/store-approvals/${A.storeId}/approve`, A.adminToken, {})).status, 403);
        assert.equal((await fx.call('PATCH', `/v1/store-approvals/${A.storeId}/reject`, A.adminToken, {})).status, 403);
    });
});

describe('franchises', () => {
    test('A cannot list, read, edit or delete franchises (403); B is untouched', async () => {
        assert.equal((await fx.call('GET', '/v1/food/admin/franchises', A.adminToken)).status, 403);
        assert.equal((await fx.call('GET', `/v1/food/admin/franchises/${B.franchiseId}`, A.adminToken)).status, 403);
        assert.equal((await fx.call('PATCH', `/v1/food/admin/franchises/${B.franchiseId}`, A.adminToken, { franchiseName: 'HACKED' })).status, 403);
        assert.equal((await fx.call('DELETE', `/v1/food/admin/franchises/${B.franchiseId}`, A.adminToken)).status, 403);
        assert.equal((await fx.models.FoodFranchise.findById(B.franchiseId).lean()).name, 'TEST Franchise B');
    });
    test('my-franchise returns A\'s own franchise', async () => {
        const res = await fx.call('GET', '/v1/food/admin/franchises/my-franchise', A.adminToken);
        assert.equal(res.status, 200);
        assert.equal(idOf(res.body.data.franchise), A.franchiseId);
    });
});

describe('the scope comes from the token, never from the request', () => {
    test('a franchise-admin token with no franchise gets 403, not "all franchises"', async () => {
        const t = fx.claim('franchise-admin', { franchiseId: null });
        for (const path of ['/v1/stores', '/v1/food/admin/stores', '/v1/food/admin/orders', '/v1/food/admin/customers', '/v1/store-managers', '/v1/store-approvals']) {
            assert.equal((await fx.call('GET', path, t)).status, 403, path);
        }
    });
    test('a token that claims franchise B but belongs to A\'s account sees B\'s data only as far as the signature allows (signed claims are trusted, so this is why secrets must stay secret)', async () => {
        // Documents the trust model: the signed token IS the scope. An unsigned/forged one is rejected elsewhere.
        const t = fx.tokenFor(A.adminUserId, 'franchise-admin', { franchiseId: B.franchiseId });
        const res = await fx.call('GET', '/v1/stores?limit=1000', t);
        assert.ok(ids(res.body.data.stores).every((id) => id === B.storeId));
    });
    test('store manager and kitchen staff cannot use the admin store / order / customer routes (403)', async () => {
        for (const token of [A.managerToken, fx.claim('kitchen-staff', { franchiseId: A.franchiseId, storeId: A.storeId })]) {
            for (const path of ['/v1/food/admin/stores', '/v1/food/admin/orders', '/v1/food/admin/customers']) {
                assert.equal((await fx.call('GET', path, token)).status, 403, path);
            }
        }
    });
});
