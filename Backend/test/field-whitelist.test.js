// P0 item 4: update endpoints copy only the fields their forms send, and franchiseId comes from the
// token. Attacker-controlled fields in the same request must be ignored, not rejected loudly.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture } from './helpers/fixture.js';

let fx; let A; let B;
before(async () => { fx = await createFixture(); A = fx.F.A; B = fx.F.B; });
after(async () => { await fx?.teardown(); });

const OTHER = '64b0000000000000000000ee';

describe('createStore', () => {
    const body = (extra = {}) => ({
        storeName: 'WL STORE', storeCode: `WL${Date.now()}`, storeType: 'DELIVERY_CARRYOUT', phone: '9999999999', email: `wl${Date.now()}@example.invalid`,
        address: { line1: 'a', city: 'c', state: 's', pincode: '110001', coordinates: [77.2, 28.6] }, status: 'Active', ...extra,
    });
    test('franchiseId is taken from the token, not the body', async () => {
        const res = await fx.call('POST', '/v1/stores', A.adminToken, body({ franchiseId: B.franchiseId }));
        assert.equal(res.status, 201);
        assert.equal(String((await fx.models.FoodStore.findById(res.body.data._id).lean()).franchiseId), A.franchiseId);
    });
    test('approvalStatus in the body cannot skip approval', async () => {
        const res = await fx.call('POST', '/v1/stores', A.adminToken, body({ approvalStatus: 'Approved', approvedAt: '2020-01-01' }));
        const doc = await fx.models.FoodStore.findById(res.body.data._id).lean();
        assert.notEqual(doc.approvalStatus, 'Approved');
        assert.ok(!doc.approvedAt);
    });
});

describe('updateStore', () => {
    test('legit form fields are saved', async () => {
        const res = await fx.call('PATCH', `/v1/stores/${A.storeId}`, A.adminToken, {
            storeName: 'Renamed A', phone: '8888888888', status: 'Inactive', address: { line1: '2 New Rd', city: 'C2', state: 'S2', pincode: '110002', coordinates: [77.3, 28.7] },
        });
        assert.equal(res.status, 200);
        const doc = await fx.models.FoodStore.findById(A.storeId).lean();
        assert.equal(doc.storeName, 'Renamed A');
        assert.equal(doc.phone, '8888888888');
        assert.equal(doc.isActive, false);
        assert.equal(doc.address, '2 New Rd');
    });
    test('franchiseId / approval / documents / isActive in the body are ignored', async () => {
        const before = await fx.models.FoodStore.findById(A.storeId).lean();
        const res = await fx.call('PATCH', `/v1/stores/${A.storeId}`, A.adminToken, {
            franchiseId: B.franchiseId, approvalStatus: 'Rejected', approvedAt: '2020-01-01', documents: [{ name: 'evil' }], rejectionReason: 'x', isActive: !before.isActive, _id: OTHER,
        });
        const after = await fx.models.FoodStore.findById(A.storeId).lean();
        assert.equal(res.status, 200);
        assert.equal(String(after.franchiseId), A.franchiseId);
        assert.equal(after.approvalStatus, before.approvalStatus);
        assert.equal(after.isActive, before.isActive);
        assert.equal(String(after._id), A.storeId);
        assert.deepEqual(after.documents, before.documents);
    });
});

describe('updateStoreManager', () => {
    test('legit fields are saved', async () => {
        const res = await fx.call('PATCH', `/v1/store-managers/${A.managerId}`, A.adminToken, { name: 'Renamed Manager', phone: '9000000099' });
        assert.equal(res.status, 200);
        assert.equal((await fx.models.StoreManager.findById(A.managerId).lean()).name, 'Renamed Manager');
    });
    test('userId / role / franchiseId / password / lastLoginAt in the body are ignored', async () => {
        const before = await fx.models.StoreManager.findById(A.managerId).lean();
        const userBefore = await fx.models.User.findById(before.userId).lean();
        const res = await fx.call('PATCH', `/v1/store-managers/${A.managerId}`, A.adminToken, {
            userId: OTHER, role: 'Super Admin', franchiseId: B.franchiseId, password: 'hacked', lastLoginAt: '2020-01-01', _id: OTHER,
        });
        const after = await fx.models.StoreManager.findById(A.managerId).lean();
        assert.equal(res.status, 200);
        assert.equal(String(after.userId), String(before.userId));
        assert.equal(after.role, before.role);
        assert.equal(String((await fx.models.User.findById(before.userId).lean()).password), String(userBefore.password));
    });
});

describe('updateFranchise (super admin)', () => {
    test('ownerUserId / createdBy / direct isActive / ownerName in the body are ignored', async () => {
        const before = await fx.models.FoodFranchise.findById(B.franchiseId).lean();
        const res = await fx.call('PATCH', `/v1/food/admin/franchises/${B.franchiseId}`, fx.SA, {
            ownerUserId: OTHER, createdBy: OTHER, isActive: !before.isActive, ownerName: 'HACKED', _id: OTHER,
        });
        const after = await fx.models.FoodFranchise.findById(B.franchiseId).lean();
        assert.equal(res.status, 200);
        assert.equal(String(after.ownerUserId), String(before.ownerUserId));
        assert.equal(String(after.createdBy), String(before.createdBy));
        assert.equal(after.isActive, before.isActive);
        assert.equal(after.ownerName, before.ownerName);
    });
    test('the edit form\'s own fields still work (status -> isActive, name -> ownerName)', async () => {
        const res = await fx.call('PATCH', `/v1/food/admin/franchises/${B.franchiseId}`, fx.SA, { name: 'New Owner Name', status: 'INACTIVE', city: 'Pune' });
        assert.equal(res.status, 200);
        const doc = await fx.models.FoodFranchise.findById(B.franchiseId).lean();
        assert.equal(doc.ownerName, 'New Owner Name');
        assert.equal(doc.isActive, false);
        assert.equal(doc.city, 'Pune');
    });
});

// L8: createStoreManager copies only the fields its form sends.
describe('createStoreManager', () => {
    const newStore = async (code) => {
        const res = await fx.call('POST', '/v1/stores', A.adminToken, {
            storeName: `MGR STORE ${code}`, storeCode: `MG${code}${Date.now()}`, storeType: 'DELIVERY_CARRYOUT', phone: '9999999999', email: `mg${code}${Date.now()}@example.invalid`,
            address: { line1: 'a', city: 'c', state: 's', pincode: '110001', coordinates: [77.2, 28.6] }, status: 'Active',
        });
        assert.equal(res.status, 201, JSON.stringify(res.body));
        return res.body.data._id;
    };
    const create = (storeId, fields) => {
        let r = fx.api.post('/api/v1/store-managers').set(fx.bearer(A.adminToken));
        for (const [k, v] of Object.entries(fields)) r = r.field(k, typeof v === 'string' ? v : JSON.stringify(v));
        return r.field('storeId', storeId).field('status', 'Active');
    };
    const tag = Date.now();

    test('legit form fields are saved; role, storeName, userId and lastLoginAt are set by the server', async () => {
        const storeId = await newStore('a');
        const res = await create(storeId, {
            name: 'Real Manager', email: `real${tag}@example.invalid`, phone: `7${String(tag).slice(-9)}`, employeeCode: `RM${tag}`, password: 'Reg#Test-Pass1',
            salary: '1500', address: '1 Road', emergencyContact: '9000000000', reportingManager: 'Franchise Boss',
            // attacker-chosen values
            role: 'Super Admin', storeName: 'HACKED STORE', lastLoginAt: '2020-01-01', userId: B.adminUserId, profileImage: 'https://evil.example/x.png', _id: '64b0000000000000000000aa',
        });
        assert.equal(res.status, 201, JSON.stringify(res.body));
        const doc = await fx.models.StoreManager.findById(res.body.data._id).lean();
        assert.equal(doc.name, 'Real Manager');
        assert.equal(doc.reportingManager, 'Franchise Boss');
        assert.equal(doc.personalDetails.salary, 1500);
        assert.equal(doc.role, 'Store Manager');
        assert.equal(doc.storeName, `MGR STORE a`);
        assert.equal(doc.lastLoginAt, null);
        assert.notEqual(String(doc.userId), B.adminUserId);
        assert.notEqual(doc.profileImage, 'https://evil.example/x.png');
        assert.notEqual(String(doc._id), '64b0000000000000000000aa');
        // the new account really can log in with the password that was chosen
        const login = await fx.call('POST', '/v1/auth/store/login', null, { email: `real${tag}@example.invalid`, password: 'Reg#Test-Pass1' });
        assert.equal(login.status, 200);
    });
});
