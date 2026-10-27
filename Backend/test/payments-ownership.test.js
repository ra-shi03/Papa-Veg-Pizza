// Payment lookups are keyed by an id in the URL; each one must check that the record belongs to the
// caller (IDOR). Records outside the caller's reach answer 404.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture } from './helpers/fixture.js';

let fx; let A; let B;
before(async () => { fx = await createFixture(); A = fx.F.A; B = fx.F.B; });
after(async () => { await fx?.teardown(); });

const ORDER_ROUTES = ['payments', 'transactions', 'refunds'];
const orderPath = (orderId, kind) => `/v1/food/payments/orders/${orderId}/${kind}`;

describe('order payments / transactions / refunds', () => {
    for (const kind of ORDER_ROUTES) {
        test(`customer: own order -> 200, another customer's order -> 404 (${kind})`, async () => {
            assert.equal((await fx.call('GET', orderPath(A.orderId, kind), A.customerToken)).status, 200);
            assert.equal((await fx.call('GET', orderPath(B.orderId, kind), A.customerToken)).status, 404);
        });
        test(`franchise admin: own franchise's order -> 200, another franchise's -> 404 (${kind})`, async () => {
            assert.equal((await fx.call('GET', orderPath(A.orderId, kind), A.adminToken)).status, 200);
            assert.equal((await fx.call('GET', orderPath(B.orderId, kind), A.adminToken)).status, 404);
        });
        test(`super admin can read any order (${kind})`, async () => {
            assert.equal((await fx.call('GET', orderPath(A.orderId, kind), fx.SA)).status, 200);
            assert.equal((await fx.call('GET', orderPath(B.orderId, kind), fx.SA)).status, 200);
        });
        test(`a malformed or unknown order id -> 404, not a 500 (${kind})`, async () => {
            assert.equal((await fx.call('GET', orderPath('not-an-id', kind), A.customerToken)).status, 404);
            assert.equal((await fx.call('GET', orderPath('64b000000000000000000001', kind), A.adminToken)).status, 404);
        });
    }
});

describe('store wallet', () => {
    const path = (storeId) => `/v1/food/payments/store/${storeId}/wallet`;
    test('a store manager can open only their own store\'s wallet', async () => {
        assert.notEqual((await fx.call('GET', path(A.storeId), A.managerToken)).status, 404);
        assert.equal((await fx.call('GET', path(B.storeId), A.managerToken)).status, 404);
        assert.equal((await fx.call('GET', path(B.storeId), B.managerToken)).status !== 404, true);
    });
    test('a franchise admin can open only stores of their franchise', async () => {
        assert.notEqual((await fx.call('GET', path(A.storeId), A.adminToken)).status, 404);
        assert.equal((await fx.call('GET', path(B.storeId), A.adminToken)).status, 404);
    });
    test('super admin can open any store', async () => {
        assert.notEqual((await fx.call('GET', path(B.storeId), fx.SA)).status, 404);
    });
});

describe('delivery partner wallet', () => {
    const path = (id) => `/v1/food/payments/delivery/${id}/wallet`;
    // a delivery partner's id is the token's userId
    let partnerToken; let partnerId;
    before(async () => { ({ token: partnerToken, id: partnerId } = await fx.partner()); });
    const partner = () => partnerToken;
    test('a delivery partner can open only their own wallet', async () => {
        assert.notEqual((await fx.call('GET', path(partnerId), partner())).status, 404);
        assert.equal((await fx.call('GET', path(A.customerId), partner())).status, 404);
        assert.equal((await fx.call('GET', path('64b000000000000000000001'), partner())).status, 404);
    });
    test('franchise admins cannot read delivery wallets (the fleet is platform-wide)', async () => {
        assert.equal((await fx.call('GET', path(B.customerId), A.adminToken)).status, 403);
    });
    test('super admin can read any partner wallet', async () => {
        assert.notEqual((await fx.call('GET', path(A.customerId), fx.SA)).status, 404);
    });
});

describe('super admin dashboard stats', () => {
    test('GET /v1/food/admin/dashboard-stats works (no more "FoodAddon is not defined")', async () => {
        const res = await fx.call('GET', '/v1/food/admin/dashboard-stats', fx.SA);
        assert.equal(res.status, 200, JSON.stringify(res.body));
    });
});
