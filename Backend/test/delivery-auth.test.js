// authMiddleware and delivery-partner tokens:
//  - a partner token works only for an APPROVED partner record, and a status change locks it out on the next request
//  - a partner token is never satisfied by a User (customer / admin) and a customer token never matches a partner
//  - a partner token cannot reach admin, franchise, store or customer-only routes
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A; let partner;
before(async () => { fx = await createFixture(); A = fx.F.A; partner = await fx.partner(); });
after(async () => { await fx?.teardown(); });

// a route only delivery partners are meant to use, and that has no other precondition
const RIDER_ROUTE = '/v1/food/delivery/orders/current';
const setStatus = (status) => mongoose.connection.collection('food_delivery_partners').updateOne({ _id: new mongoose.Types.ObjectId(partner.id) }, { $set: { status } });
const passes = (res) => res.status !== 401 && res.status !== 403;

describe('partner status is checked on every request', () => {
    test('approved: the token works', async () => {
        await setStatus('approved');
        assert.ok(passes(await fx.call('GET', RIDER_ROUTE, partner.token)));
    });
    for (const status of ['suspended', 'rejected', 'pending']) {
        test(`${status}: locked out on the very next request, and back in when approved again`, async () => {
            await setStatus('approved');
            assert.ok(passes(await fx.call('GET', RIDER_ROUTE, partner.token)));
            await setStatus(status);
            const res = await fx.call('GET', RIDER_ROUTE, partner.token);
            assert.equal(res.status, 401, JSON.stringify(res.body));
            await setStatus('approved');
            assert.ok(passes(await fx.call('GET', RIDER_ROUTE, partner.token)));
        });
    }
    test('a deleted partner and an unknown id get 401', async () => {
        const gone = await fx.partner();
        await mongoose.connection.collection('food_delivery_partners').deleteOne({ _id: new mongoose.Types.ObjectId(gone.id) });
        assert.equal((await fx.call('GET', RIDER_ROUTE, gone.token)).status, 401);
        assert.equal((await fx.call('GET', RIDER_ROUTE, fx.tokenFor(new mongoose.Types.ObjectId(), 'DELIVERY_PARTNER'))).status, 401);
    });
    test('a suspended partner is refused everywhere, not just on delivery routes', async () => {
        const rider = await fx.partner('suspended');
        for (const path of [RIDER_ROUTE, '/v1/food/zones/nearby?lat=1&lng=1', `/v1/food/payments/delivery/${rider.id}/wallet`]) {
            assert.equal((await fx.call('GET', path, rider.token)).status, 401, path);
        }
    });
});

describe('a partner token is never satisfied by a User, and a customer token never matches a partner', () => {
    test('a DELIVERY_PARTNER token carrying a customer, admin or manager id is refused', async () => {
        for (const id of [A.customerId, A.adminUserId, A.managerUserId, fx.superUser._id]) {
            assert.equal((await fx.call('GET', RIDER_ROUTE, fx.tokenFor(id, 'DELIVERY_PARTNER'))).status, 401, String(id));
        }
    });
    test('a customer token carrying a partner id is refused (no such user), even for an approved partner', async () => {
        const rider = await fx.partner();
        for (const role of ['CUSTOMER', 'USER']) {
            assert.equal((await fx.call('GET', '/v1/food/orders', fx.tokenFor(rider.id, role))).status, 401, role);
        }
        assert.equal((await fx.call('GET', RIDER_ROUTE, fx.tokenFor(rider.id, 'CUSTOMER'))).status, 401);
    });
    test('a real customer, with their own id, cannot use delivery routes', async () => {
        assert.equal((await fx.call('GET', RIDER_ROUTE, A.customerToken)).status, 403);
        assert.equal((await fx.call('GET', '/v1/food/zones/nearby?lat=1&lng=1', A.customerToken)).status, 403);
    });
});

describe('a partner token cannot reach admin, store or customer-only routes', () => {
    const ROUTES = [
        ['GET', '/v1/stores'], ['POST', '/v1/stores'], ['GET', '/v1/store-managers'], ['GET', '/v1/store-approvals'],
        ['GET', '/v1/food/admin/franchises'], ['POST', '/v1/food/admin/franchises'], ['GET', '/v1/food/admin/fee-settings'], ['GET', '/v1/food/admin/offers'],
        ['GET', '/v1/admin/dashboard'], ['GET', '/v1/store/dashboard/today-sales'], ['GET', '/v1/store/riders'], ['POST', '/v1/store/delivery/assign'],
        ['GET', '/v1/store-pricing'], ['PUT', '/v1/store-pricing/x_y'], ['POST', '/v1/bulk-price-update'], ['GET', '/v1/operating-hours'], ['PATCH', '/v1/operating-hours/bulk-update'],
        ['GET', '/v1/store-performance'], ['GET', '/v1/orders?storeId=x'], ['GET', '/v1/inventory?storeId=x'],
        ['GET', '/v1/food/store/inventory'], ['GET', '/v1/food/store/staff'], ['GET', '/v1/food/store/orders'], ['GET', '/v1/food/store/kitchen'],
        ['GET', '/v1/food/store/customers'], ['GET', '/v1/food/store/complaints'], ['GET', '/v1/food/store/reviews'],
        ['GET', '/v1/food/franchise/orders'], ['POST', '/v1/complaints/resolve'],
        ['GET', '/v1/food/orders'], ['POST', '/v1/food/orders'], ['POST', '/v1/food/orders/calculate'], ['GET', '/v1/food/user/profile'],
    ];
    for (const [method, path] of ROUTES) {
        test(`${method} ${path} -> 403`, async () => {
            const res = await fx.call(method, path, partner.token, method === 'GET' ? undefined : {});
            assert.equal(res.status, 403, JSON.stringify(res.body));
        });
    }
});
