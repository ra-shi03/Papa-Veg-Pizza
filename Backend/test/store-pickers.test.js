// Step 7, small mismatches the frontend calls: /v1/stores/dropdown, /v1/stores/list and
// GET /v1/store-approvals/:id/documents. All are franchise-scoped; a store manager sees only their store.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture } from './helpers/fixture.js';

let fx; let A; let B;
before(async () => { fx = await createFixture(); A = fx.F.A; B = fx.F.B; });
after(async () => { await fx?.teardown(); });

const idsOf = (rows, key) => (rows || []).map((r) => r[key]);

describe('GET /v1/stores/dropdown (franchise admin report filters)', () => {
    test('anonymous 401; customer and store manager 403', async () => {
        assert.equal((await fx.call('GET', '/v1/stores/dropdown')).status, 401);
        assert.equal((await fx.call('GET', '/v1/stores/dropdown', A.customerToken)).status, 403);
        assert.equal((await fx.call('GET', '/v1/stores/dropdown', A.managerToken)).status, 403);
    });
    test('a franchise admin gets only their franchise\'s approved stores, in the { storeId, storeName } shape', async () => {
        const res = await fx.call('GET', '/v1/stores/dropdown', A.adminToken);
        assert.equal(res.status, 200);
        assert.deepEqual(idsOf(res.body.data, 'storeId'), [A.storeId]);
        assert.equal(res.body.data[0].storeName, 'TEST STORE A');
    });
    test('super admin sees every franchise\'s stores', async () => {
        const res = await fx.call('GET', '/v1/stores/dropdown', fx.SA);
        assert.ok(idsOf(res.body.data, 'storeId').includes(A.storeId) && idsOf(res.body.data, 'storeId').includes(B.storeId));
    });
    test('it is not swallowed by /v1/stores/:id', async () => {
        assert.equal((await fx.call('GET', `/v1/stores/${A.storeId}`, A.adminToken)).status, 200);
    });
});

describe('GET /v1/stores/list (store manager dashboard)', () => {
    test('anonymous 401; customer 403', async () => {
        assert.equal((await fx.call('GET', '/v1/stores/list')).status, 401);
        assert.equal((await fx.call('GET', '/v1/stores/list', A.customerToken)).status, 403);
    });
    test('kitchen staff cannot use it (403)', async () => {
        assert.equal((await fx.call('GET', '/v1/stores/list', fx.claim('kitchen-staff', { franchiseId: A.franchiseId, storeId: A.storeId }))).status, 403);
    });
    test('a store manager gets only their own store, as { stores: [{ _id, name }] }', async () => {
        const res = await fx.call('GET', '/v1/stores/list', A.managerToken);
        assert.equal(res.status, 200);
        assert.deepEqual(idsOf(res.body.stores, '_id'), [A.storeId]);
        assert.equal(res.body.stores[0].name, 'TEST STORE A');
        assert.deepEqual(res.body.data, res.body.stores);
        assert.deepEqual(idsOf((await fx.call('GET', '/v1/stores/list', B.managerToken)).body.stores, '_id'), [B.storeId]);
    });
    test('a franchise admin gets their franchise\'s stores only', async () => {
        const res = await fx.call('GET', '/v1/stores/list', A.adminToken);
        assert.deepEqual(idsOf(res.body.stores, '_id'), [A.storeId]);
    });
    test('a manager token with no store gets an empty list, not every store', async () => {
        const t = fx.tokenFor(A.managerUserId, 'store-manager', { franchiseId: A.franchiseId, storeId: null });
        assert.deepEqual((await fx.call('GET', '/v1/stores/list', t)).body.stores, []);
    });
});

describe('GET /v1/store-approvals/:id/documents', () => {
    test('anonymous 401; store manager 403', async () => {
        assert.equal((await fx.call('GET', `/v1/store-approvals/${A.storeId}/documents`)).status, 401);
        assert.equal((await fx.call('GET', `/v1/store-approvals/${A.storeId}/documents`, A.managerToken)).status, 403);
    });
    test('own store -> 200 with the document list; another franchise\'s store -> 404', async () => {
        await fx.models.FoodStore.updateOne({ _id: A.storeId }, { $push: { documents: { type: 'GST', name: 'gst.pdf', url: 'https://example.com/gst.pdf' } } });
        const res = await fx.call('GET', `/v1/store-approvals/${A.storeId}/documents`, A.adminToken);
        assert.equal(res.status, 200);
        assert.equal(res.body.data.documents.length, 1);
        assert.equal(res.body.data.documents[0].url, 'https://example.com/gst.pdf');
        assert.equal((await fx.call('GET', `/v1/store-approvals/${B.storeId}/documents`, A.adminToken)).status, 404);
    });
    test('super admin can read any store\'s documents', async () => {
        assert.equal((await fx.call('GET', `/v1/store-approvals/${B.storeId}/documents`, fx.SA)).status, 200);
    });
});
