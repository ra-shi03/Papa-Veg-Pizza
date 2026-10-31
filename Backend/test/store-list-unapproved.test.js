// A store a franchise admin just created is a Draft until it is submitted and the super admin approves it. The Stores
// screen asks for ?includeUnapproved=true and must list it (tagged); pickers keep getting approved stores only, and
// another franchise never sees it.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture } from './helpers/fixture.js';

let fx; let A; let B; let storeId;
before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    const res = await fx.call('POST', '/v1/stores', A.adminToken, {
        storeName: `Draft Store ${fx.ts}`, storeCode: `DR${fx.ts}`, storeType: 'DELIVERY_CARRYOUT', phone: `97${String(fx.ts).slice(-8)}`,
        email: `draft${fx.ts}@example.invalid`, address: { line1: 'a', city: 'Indore', state: 'MP', pincode: '452001', coordinates: [75.85, 22.72] }, status: 'Active',
    });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    storeId = res.body.data._id;
});
after(async () => { await fx?.teardown(); });

const ids = async (token, qs = '') => {
    const res = await fx.call('GET', `/v1/stores${qs}`, token);
    assert.equal(res.status, 200, JSON.stringify(res.body));
    return res.body.data.stores.map((s) => String(s._id));
};

test('the new Draft store is hidden from pickers but listed for the Stores screen with its approval status', async () => {
    assert.ok(!(await ids(A.adminToken)).includes(storeId));
    assert.ok((await ids(A.adminToken, '?includeUnapproved=true')).includes(storeId));
    const list = (await fx.call('GET', '/v1/stores?includeUnapproved=true', A.adminToken)).body.data;
    assert.equal(list.stores.find((s) => String(s._id) === storeId).approvalStatus, 'Draft');
    assert.equal(list.totalCount, list.stores.length);
});

test('another franchise never sees it, with or without the flag', async () => {
    assert.ok(!(await ids(B.adminToken, '?includeUnapproved=true')).includes(storeId));
    assert.ok(!(await ids(B.adminToken)).includes(storeId));
});

test('once approved it shows in both lists', async () => {
    assert.equal((await fx.call('PATCH', `/v1/store-approvals/${storeId}/approve`, fx.SA, {})).status, 200);
    assert.ok((await ids(A.adminToken)).includes(storeId));
    assert.ok((await ids(A.adminToken, '?includeUnapproved=true')).includes(storeId));
});

test('creating a store with a code that is already used says so (409), and a missing address is a clear 400', async () => {
    const body = (over) => ({
        storeName: 'Second', storeCode: `DR${fx.ts}`, storeType: 'DELIVERY_CARRYOUT', phone: '9712345678', email: `s2${fx.ts}@example.invalid`,
        address: { line1: 'a', city: 'Indore', state: 'MP', pincode: '452001', coordinates: [75.85, 22.72] }, status: 'Active', ...over,
    });
    const dup = await fx.call('POST', '/v1/stores', A.adminToken, body());
    assert.equal(dup.status, 409);
    assert.match(dup.body.message, /store code already exists/);
    const noAddress = await fx.call('POST', '/v1/stores', A.adminToken, body({ storeCode: `NA${fx.ts}`, address: { city: 'Indore' } }));
    assert.equal(noAddress.status, 400);
    assert.ok(noAddress.body.message && !/E11000/.test(noAddress.body.message));
    assert.equal((await fx.call('POST', '/v1/stores', A.adminToken, body({ storeCode: `OK${fx.ts}` }))).status, 201);
});

test('a manager of a store still waiting for approval is listed, for its own franchise only', async () => {
    const draft = await fx.call('POST', '/v1/stores', A.adminToken, {
        storeName: 'Draft Mgr Store', storeCode: `DM${fx.ts}`, storeType: 'DELIVERY_CARRYOUT', phone: '9812345670',
        address: { line1: 'a', city: 'Indore', state: 'MP', pincode: '452001', coordinates: [75.85, 22.72] }, status: 'Active',
    });
    assert.equal(draft.status, 201, JSON.stringify(draft.body));
    const sid = draft.body.data._id;
    const mc = await fx.api.post('/api/v1/store-managers').set(fx.bearer(A.adminToken))
        .field('name', 'Draft Manager').field('email', `dm${fx.ts}@example.invalid`).field('phone', `55${String(fx.ts).slice(-8)}`)
        .field('employeeCode', `DM${fx.ts}`).field('storeId', sid).field('password', 'Passw0rd!x').field('status', 'Active').field('salary', '1000');
    assert.equal(mc.status, 201, JSON.stringify(mc.body));
    const mine = await fx.call('GET', '/v1/store-managers', A.adminToken);
    assert.ok(mine.body.data.some((m) => m.name === 'Draft Manager' && m.storeName === 'Draft Mgr Store'));
    const other = await fx.call('GET', '/v1/store-managers', B.adminToken);
    assert.ok(!other.body.data.some((m) => m.name === 'Draft Manager'));
});

test('store first, then its manager, then approval: the manager cannot sign in until the store is approved', async () => {
    const mk = async (code) => {
        const r = await fx.call('POST', '/v1/stores', A.adminToken, {
            storeName: `Flow ${code}`, storeCode: `${code}${fx.ts}`, storeType: 'DELIVERY_CARRYOUT', phone: '9822345670',
            address: { line1: 'a', city: 'Indore', state: 'MP', pincode: '452001', coordinates: [75.85, 22.72] }, status: 'Active',
        });
        assert.equal(r.status, 201, JSON.stringify(r.body));
        return r.body.data._id;
    };
    const sid = await mk('FL');

    // 1. submitting a store that has no manager yet is refused, with the reason
    const early = await fx.call('POST', `/v1/store-approvals/${sid}/submit`, A.adminToken, {});
    assert.equal(early.status, 400);
    assert.match(early.body.message, /store manager/i);

    // 2. the manager is created for that store: pending, and cannot sign in even asking to be Active
    const email = `flow${fx.ts}@example.invalid`;
    const mc = await fx.api.post('/api/v1/store-managers').set(fx.bearer(A.adminToken))
        .field('name', 'Flow Manager').field('email', email).field('phone', `54${String(fx.ts).slice(-8)}`)
        .field('employeeCode', `FL${fx.ts}`).field('storeId', sid).field('password', 'Passw0rd!x').field('status', 'Active').field('salary', '1000');
    assert.equal(mc.status, 201, JSON.stringify(mc.body));
    assert.equal(mc.body.data.status, 'Pending Approval');
    const login = () => fx.call('POST', '/v1/auth/store/login', null, { email, password: 'Passw0rd!x' });
    assert.notEqual((await login()).status, 200, 'cannot sign in before the store is approved');
    // editing it to Active does not get around that
    await fx.call('PUT', `/v1/store-managers/${mc.body.data._id}`, A.adminToken, { status: 'Active' });
    assert.notEqual((await login()).status, 200);
    assert.equal((await fx.models.StoreManager.findById(mc.body.data._id).lean()).status, 'Pending Approval');

    // 3. now the store can be submitted, and the approval list shows the manager with it
    assert.equal((await fx.call('POST', `/v1/store-approvals/${sid}/submit`, A.adminToken, {})).status, 200);
    const row = (await fx.call('GET', '/v1/store-approvals?status=Pending&limit=50', A.adminToken)).body.data.approvals.find((a) => String(a._id) === sid);
    assert.deepEqual([row.managerName, row.managerEmail, row.managerStatus], ['Flow Manager', email, 'Pending Approval']);

    // 4. the franchise admin cannot approve; the super admin can, and the manager is active and can sign in
    assert.equal((await fx.call('PATCH', `/v1/store-approvals/${sid}/approve`, A.adminToken, {})).status, 403);
    assert.equal((await fx.call('PATCH', `/v1/store-approvals/${sid}/approve`, fx.SA, {})).status, 200);
    assert.equal((await fx.models.StoreManager.findById(mc.body.data._id).lean()).status, 'Active');
    assert.equal((await login()).status, 200);
});

test('a store that stops being approved signs its team out until it is approved again', async () => {
    const r = await fx.call('POST', '/v1/stores', A.adminToken, {
        storeName: 'Revoked', storeCode: `RV${fx.ts}`, storeType: 'DELIVERY_CARRYOUT', phone: '9832345670',
        address: { line1: 'a', city: 'Indore', state: 'MP', pincode: '452001', coordinates: [75.85, 22.72] }, status: 'Active',
    });
    const sid = r.body.data._id;
    const email = `rv${fx.ts}@example.invalid`;
    const mc = await fx.api.post('/api/v1/store-managers').set(fx.bearer(A.adminToken))
        .field('name', 'Revoked Manager').field('email', email).field('phone', `53${String(fx.ts).slice(-8)}`)
        .field('employeeCode', `RV${fx.ts}`).field('storeId', sid).field('password', 'Passw0rd!x').field('status', 'Active').field('salary', '1000');
    assert.equal(mc.status, 201, JSON.stringify(mc.body));
    const login = () => fx.call('POST', '/v1/auth/store/login', null, { email, password: 'Passw0rd!x' });
    const status = async () => (await fx.models.StoreManager.findById(mc.body.data._id).lean()).status;
    assert.equal((await fx.call('PATCH', `/v1/store-approvals/${sid}/approve`, fx.SA, {})).status, 200);
    const session = await login();
    assert.equal(session.status, 200);
    const token = session.body.data.accessToken;
    assert.equal((await fx.call('GET', '/v1/food/store/orders', token)).status, 200);

    for (const [action, body] of [['reject', { reason: 'x' }], ['request-changes', { instructions: 'x' }]]) {
        assert.equal((await fx.call('PATCH', `/v1/store-approvals/${sid}/${action}`, fx.SA, body)).status, 200, action);
        assert.equal(await status(), 'Pending Approval', action);
        assert.notEqual((await login()).status, 200, `${action}: cannot sign in`);
        assert.equal((await fx.call('GET', '/v1/food/store/orders', token)).status, 401, `${action}: the open session ends too`);
        assert.equal((await fx.call('PATCH', `/v1/store-approvals/${sid}/approve`, fx.SA, {})).status, 200);
        assert.equal(await status(), 'Active');
        assert.equal((await login()).status, 200, `${action}: approved again`);
    }
});

test('a suspended manager stays suspended through a rejection and a new approval', async () => {
    const r = await fx.call('POST', '/v1/stores', A.adminToken, {
        storeName: 'Keep', storeCode: `KP${fx.ts}`, storeType: 'DELIVERY_CARRYOUT', phone: '9842345670',
        address: { line1: 'a', city: 'Indore', state: 'MP', pincode: '452001', coordinates: [75.85, 22.72] }, status: 'Active',
    });
    const sid = r.body.data._id;
    await fx.call('PATCH', `/v1/store-approvals/${sid}/approve`, fx.SA, {});
    const mc = await fx.api.post('/api/v1/store-managers').set(fx.bearer(A.adminToken))
        .field('name', 'Kept Manager').field('email', `kp${fx.ts}@example.invalid`).field('phone', `52${String(fx.ts).slice(-8)}`)
        .field('employeeCode', `KP${fx.ts}`).field('storeId', sid).field('password', 'Passw0rd!x').field('status', 'Suspended').field('salary', '1000');
    assert.equal(mc.status, 201, JSON.stringify(mc.body));
    await fx.call('PATCH', `/v1/store-approvals/${sid}/reject`, fx.SA, { reason: 'x' });
    await fx.call('PATCH', `/v1/store-approvals/${sid}/approve`, fx.SA, {});
    assert.equal((await fx.models.StoreManager.findById(mc.body.data._id).lean()).status, 'Suspended');
});

test('GET /food/zones/public: active zones with name and polygon only, no sign-in needed', async () => {
    await fx.models.FoodStore.db.collection('food_zones').insertMany([
        { name: 'Pub Zone', zoneName: 'Pub Zone', regionId: new (await import('./helpers/fixture.js')).mongoose.Types.ObjectId(), country: 'India', isActive: true, secretNote: 'internal',
          coordinates: [{ latitude: 22.7, longitude: 75.8 }, { latitude: 22.7, longitude: 76 }, { latitude: 22.8, longitude: 76 }] },
        { name: 'Off Zone', zoneName: 'Off Zone', regionId: new (await import('./helpers/fixture.js')).mongoose.Types.ObjectId(), country: 'India', isActive: false,
          coordinates: [{ latitude: 1, longitude: 1 }, { latitude: 1, longitude: 2 }, { latitude: 2, longitude: 2 }] },
    ]);
    const res = await fx.call('GET', '/v1/food/zones/public');
    assert.equal(res.status, 200);
    const zones = res.body.data.zones;
    const z = zones.find((x) => x.name === 'Pub Zone');
    assert.deepEqual(Object.keys(z).sort(), ['_id', 'coordinates', 'name', 'serviceLocation']);
    assert.equal(z.coordinates.length, 3);
    assert.ok(!zones.some((x) => x.name === 'Off Zone'));
});
