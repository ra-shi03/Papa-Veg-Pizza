// P0 items 2 and 3: every protected route answers 401 without a token and 403 with the wrong role.
// Allowed roles are checked to get PAST the guard (anything but 401/403), so a route that is
// simply broken shut cannot pass for "secure".
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture } from './helpers/fixture.js';

let fx; let tokens;
before(async () => {
    fx = await createFixture();
    const { F } = fx;
    tokens = {
        anonymous: null,
        customer: F.A.customerToken,
        delivery: fx.claim('DELIVERY_PARTNER'),
        'store-manager': F.A.managerToken,
        'kitchen-staff': fx.claim('kitchen-staff', { franchiseId: F.A.franchiseId, storeId: F.A.storeId }),
        'franchise-admin': F.A.adminToken,
        superadmin: fx.SA,
    };
});
after(async () => { await fx?.teardown(); });

const guarded = (status) => status === 401 || status === 403;

/** matrix: [method, path, allowedRoles]; every other role (and anonymous) must be refused. */
function runMatrix(title, rows) {
    describe(title, () => {
        for (const [method, path, allowed] of rows) {
            test(`${method} ${path}`, async () => {
                for (const [role, token] of Object.entries(tokens)) {
                    const res = await fx.call(method, path.replace(':A', fx.F.A.storeId), token, method === 'GET' ? undefined : {});
                    if (role === 'anonymous') assert.equal(res.status, 401, `anonymous must get 401, got ${res.status}`);
                    else if (allowed.includes(role)) assert.ok(!guarded(res.status), `${role} must pass the guard, got ${res.status}`);
                    else assert.equal(res.status, 403, `${role} must get 403, got ${res.status}`);
                }
            });
        }
    });
}

const ADMINS = ['franchise-admin', 'superadmin'];
const SUPER = ['superadmin'];

// Previously wide open (no auth at all)
runMatrix('stores / managers / approvals: super admin + franchise admin only', [
    ['GET', '/v1/stores', ADMINS],
    ['GET', '/v1/stores/dashboard-kpis', ADMINS],
    ['PATCH', '/v1/stores/:A', ADMINS],
    ['PUT', '/v1/stores/:A', ADMINS],
    ['DELETE', '/v1/stores/64b000000000000000000001', ADMINS],
    ['GET', '/v1/store-managers', ADMINS],
    ['POST', '/v1/store-managers', ADMINS],
    ['GET', '/v1/store-approvals', ADMINS],
    ['GET', '/v1/store-approvals/dashboard', ADMINS],
    ['POST', '/v1/store-approvals/64b000000000000000000001/submit', ADMINS],
]);

// Decisions on applications belong to the platform
runMatrix('store approval decisions: super admin only', [
    ['PATCH', '/v1/store-approvals/64b000000000000000000001/approve', SUPER],
    ['PATCH', '/v1/store-approvals/64b000000000000000000001/reject', SUPER],
    ['PATCH', '/v1/store-approvals/64b000000000000000000001/request-changes', SUPER],
    ['PATCH', '/v1/store-approvals/64b000000000000000000001/documents/x/verify', SUPER],
]);

runMatrix('/v1/food/admin: platform-wide routes are super admin only', [
    ['GET', '/v1/food/admin/franchises', SUPER],
    ['POST', '/v1/food/admin/franchises', SUPER],
    ['GET', `/v1/food/admin/franchises/64b000000000000000000001`, SUPER],
    ['PATCH', `/v1/food/admin/franchises/64b000000000000000000001`, SUPER],
    ['DELETE', `/v1/food/admin/franchises/64b000000000000000000001`, SUPER],
    ['GET', '/v1/food/admin/dashboard-stats', SUPER],
    ['GET', '/v1/food/admin/fee-settings', SUPER],
    ['PUT', '/v1/food/admin/fee-settings', SUPER],
    ['GET', '/v1/food/admin/business-settings', SUPER],
    ['GET', '/v1/food/admin/stores/pending', SUPER],
    ['GET', '/v1/food/admin/stores/:A/analytics', SUPER],
    ['POST', '/v1/food/admin/regions', SUPER],
    ['GET', '/v1/food/admin/delivery/partners', SUPER],
    ['GET', '/v1/food/admin/offers', SUPER],
    ['GET', '/v1/food/admin/withdrawals', SUPER],
    ['GET', '/v1/food/admin/sidebar-badges', SUPER],
    ['PATCH', '/v1/food/admin/customers/64b000000000000000000001/status', SUPER],
    ['DELETE', '/v1/food/admin/orders/64b000000000000000000001', SUPER],
    ['GET', '/v1/food/admin/refunds', SUPER],
    ['GET', '/v1/food/admin/bulk-orders', SUPER],
    ['PUT', '/v1/food/admin/bulk-orders/config', SUPER],
    ['GET', '/v1/food/admin/app-config', SUPER],
    ['PUT', '/v1/food/admin/app-config', SUPER],
    ['GET', '/v1/admin/queues', SUPER],
]);

runMatrix('/v1/food/admin: franchise-scoped routes are open to franchise admin + super admin only', [
    ['GET', '/v1/food/admin/stores', ADMINS],
    ['GET', '/v1/food/admin/stores/:A', ADMINS],
    ['GET', '/v1/food/admin/orders', ADMINS],
    ['GET', '/v1/food/admin/customers', ADMINS],
    ['GET', '/v1/food/admin/franchises/my-franchise', ADMINS],
    ['GET', '/v1/food/admin/regions', ADMINS],
    ['GET', '/v1/food/admin/zones', ADMINS],
    ['GET', '/v1/food/admin/territories', ADMINS],
]);

runMatrix('/v1/food/payments: role gate per route group', [
    ['GET', '/v1/food/payments/wallet/balance', ['customer']],
    ['GET', '/v1/food/payments/wallet/transactions', ['customer']],
    ['GET', '/v1/food/payments/orders/64b000000000000000000001/payments', ['customer', ...ADMINS]],
    ['GET', '/v1/food/payments/store/64b000000000000000000001/wallet', ['store-manager', ...ADMINS]],
    ['GET', '/v1/food/payments/delivery/64b000000000000000000001/wallet', ['delivery', ...SUPER]],
    ['GET', '/v1/food/payments/admin/wallet', SUPER],
    ['GET', '/v1/food/payments/admin/finance/summary', SUPER],
    ['GET', '/v1/food/payments/admin/settlements', SUPER],
    ['POST', '/v1/food/payments/admin/settlements', SUPER],
    ['POST', '/v1/food/payments/admin/settlements/64b000000000000000000001/process', SUPER],
    ['GET', '/v1/food/payments/admin/refunds', SUPER],
]);

describe('routes with a franchise requirement', () => {
    const body = { storeName: 'X', storeCode: 'X1', phone: '1' };
    test('POST /v1/stores: anonymous 401; customer / store-manager / kitchen 403', async () => {
        assert.equal((await fx.call('POST', '/v1/stores', null, body)).status, 401);
        for (const r of ['customer', 'store-manager', 'kitchen-staff']) assert.equal((await fx.call('POST', '/v1/stores', tokens[r], body)).status, 403, r);
    });
    test('POST /v1/stores: a super admin has no franchise on the token -> 403, nothing created', async () => {
        const before = await fx.models.FoodStore.countDocuments();
        assert.equal((await fx.call('POST', '/v1/stores', tokens.superadmin, body)).status, 403);
        assert.equal(await fx.models.FoodStore.countDocuments(), before);
    });
    test('POST /v1/stores: a franchise admin passes the guard', async () => {
        assert.ok(!guarded((await fx.call('POST', '/v1/stores', tokens['franchise-admin'], { ...body, storeName: '' })).status));
    });
    test('GET /v1/food/franchise/orders: anonymous 401, other roles 403', async () => {
        assert.equal((await fx.call('GET', '/v1/food/franchise/orders')).status, 401);
        for (const r of ['customer', 'delivery', 'store-manager', 'kitchen-staff']) assert.equal((await fx.call('GET', '/v1/food/franchise/orders', tokens[r])).status, 403, r);
    });
    test('GET /v1/food/franchise/orders: franchise admin 200; super admin must name a franchise', async () => {
        assert.equal((await fx.call('GET', '/v1/food/franchise/orders', tokens['franchise-admin'])).status, 200);
        assert.equal((await fx.call('GET', '/v1/food/franchise/orders', tokens.superadmin)).status, 403);
        assert.equal((await fx.call('GET', `/v1/food/franchise/orders?franchiseId=${fx.F.A.franchiseId}`, tokens.superadmin)).status, 200);
    });
});

describe('/v1/food/admin/staff and the kitchen/store routes keep their own gates', () => {
    test('kitchen staff cannot manage staff', async () => {
        assert.equal((await fx.call('GET', '/v1/food/admin/staff', tokens['kitchen-staff'])).status, 403);
    });
    test('customers cannot read store orders', async () => {
        assert.equal((await fx.call('GET', '/v1/food/store/orders', tokens.customer)).status, 403);
    });
    test('anonymous callers cannot read store orders', async () => {
        assert.equal((await fx.call('GET', '/v1/food/store/orders')).status, 401);
    });
});

describe('public routes that must stay public', () => {
    for (const path of ['/v1/health', '/v1/food/admin/categories', '/v1/food/admin/products/public', '/v1/fcm-tokens/check']) {
        test(`GET ${path} needs no token`, async () => {
            assert.ok(!guarded((await fx.call('GET', path)).status));
        });
    }
});

describe('removed endpoints', () => {
    test('fcm test-set-token is gone (404)', async () => {
        assert.equal((await fx.call('GET', '/fcm-tokens/test-set-token/9999999999/abc')).status, 404);
        assert.equal((await fx.call('GET', '/v1/fcm-tokens/test-set-token/9999999999/abc')).status, 404);
    });
    test('fcm test-get-token is gone (404)', async () => {
        assert.equal((await fx.call('GET', '/fcm-tokens/test-get-token/9999999999')).status, 404);
    });
});

// N4: a token whose role is literally "ADMIN" is not a super admin (it is only the requireRoles('ADMIN') shorthand).
describe('the literal ADMIN role', () => {
    const adminToken = () => fx.tokenFor(fx.superUser, 'ADMIN');
    test('cannot use super-admin-only routes', async () => {
        assert.equal((await fx.call('GET', '/v1/food/admin/fee-settings', adminToken())).status, 403);
        assert.equal((await fx.call('GET', '/v1/admin/queues', adminToken())).status, 403);
    });
    test('does not get an all-franchise scope on franchise-scoped routes', async () => {
        assert.equal((await fx.call('GET', '/v1/food/admin/stores', adminToken())).status, 403);
    });
    test('the real super admin still gets through', async () => {
        assert.equal((await fx.call('GET', '/v1/food/admin/fee-settings', fx.SA)).status, 200);
        assert.equal((await fx.call('GET', '/v1/food/admin/stores', fx.SA)).status, 200);
    });
});
