// Final security audit (docs/audit3.md): regression tests for what the audit found and fixed, plus a sweep that
// fails when a new route is added without authentication or a role guard.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createFixture, mongoose } from './helpers/fixture.js';
import { listRoutes } from './helpers/routes.js';

let fx; let A; let B; let app;
before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    ({ default: app } = await import('../src/app.js'));
});
after(async () => { await fx?.teardown(); });

const ok = (res, status = 200) => { assert.equal(res.status, status, JSON.stringify(res.body)); return res.body.data; };
const reviewed = JSON.parse(readFileSync(new URL('./fixtures/reviewed-routes.json', import.meta.url), 'utf8'));

describe('route sweep: every route is guarded, or reviewed as public / sign-in-only', () => {
    test('routes without authMiddleware are exactly the reviewed public ones', () => {
        const open = listRoutes(app).filter((r) => !r.auth).map((r) => `${r.method} ${r.path}`).sort();
        const unexpected = open.filter((r) => !reviewed.publicRoutes.includes(r));
        assert.deepEqual(unexpected, [], 'new route without authMiddleware: review it, then add it to test/fixtures/reviewed-routes.json');
        const gone = reviewed.publicRoutes.filter((r) => !open.includes(r));
        assert.deepEqual(gone, [], 'a reviewed public route is now guarded or removed: update the list');
    });
    test('every signed-in route has a role guard, except the reviewed sign-in-only ones', () => {
        const routes = listRoutes(app).filter((r) => r.auth && !r.roles.length && !r.other.length).map((r) => `${r.method} ${r.path}`).sort();
        assert.deepEqual(routes.filter((r) => !reviewed.authOnlyRoutes.includes(r)), [], 'new route with authMiddleware but no role guard');
        assert.deepEqual(reviewed.authOnlyRoutes.filter((r) => !routes.includes(r)), []);
    });
    test('the routes of Features 1-6 are all behind authMiddleware and a role guard', () => {
        const mine = /^\/api\/v1\/(food\/store\/|tasks|store\/|admin\/dashboard|complaints|store-performance|operating-hours|stores\/:id\/(hours|status|performance)|store-pricing|bulk-price-update|copy-pricing|price-history|orders$|inventory$|reviews$|users$|food\/zones|food\/franchise)/;
        const rows = listRoutes(app).filter((r) => mine.test(r.path));
        assert.ok(rows.length > 150, `found ${rows.length}`);
        for (const r of rows) {
            assert.ok(r.auth, `${r.method} ${r.path} has no authMiddleware`);
            assert.ok(r.roles.length > 0 || r.other.length > 0, `${r.method} ${r.path} has no role guard`);
        }
    });
});

describe('H: a store manager cannot touch their own manager account through the staff endpoints', () => {
    let kitchen;
    before(async () => {
        const k = await fx.call('POST', '/v1/food/store/staff', A.managerToken, {
            fullName: 'Kit Chen', email: `kit${fx.ts}@example.invalid`, phone: `7${String(fx.ts).slice(-9)}`, password: 'Passw0rd!Strong9', role: 'Pizza Maker',
        });
        assert.equal(k.status, 201, JSON.stringify(k.body));
        kitchen = { id: k.body.data._id, userId: String(k.body.data.userId) };
    });
    const S = '/v1/food/store/staff';
    test('the manager\'s own record is 404 for read, edit, status, shift, leave and delete', async () => {
        for (const target of [A.managerId]) {
            assert.equal((await fx.call('GET', `${S}/${target}`, A.managerToken)).status, 404, 'get');
            assert.equal((await fx.call('PATCH', `${S}/${target}`, A.managerToken, { role: 'Baker' })).status, 404, 'edit/demote');
            assert.equal((await fx.call('PATCH', `${S}/${target}/status`, A.managerToken, { status: 'Suspended' })).status, 404, 'suspend');
            assert.equal((await fx.call('PATCH', `${S}/${target}/shift`, A.managerToken, { shiftId: 'Night' })).status, 404, 'shift');
            assert.equal((await fx.call('PATCH', `${S}/${target}/leave`, A.managerToken, { leaveType: 'x', startDate: '2030-01-01', endDate: '2030-01-02' })).status, 404, 'leave');
            assert.equal((await fx.call('DELETE', `${S}/${target}`, A.managerToken)).status, 404, 'delete');
        }
        const users = mongoose.connection.collection('users');
        const u = await users.findOne({ _id: new mongoose.Types.ObjectId(String(A.managerUserId)) });
        assert.ok(u && u.isActive !== false, 'the manager account is untouched');
        assert.equal(await mongoose.connection.collection('storemanagers').countDocuments({ _id: new mongoose.Types.ObjectId(A.managerId) }), 1);
    });
    test('the staff list shows kitchen staff only', async () => {
        const list = ok(await fx.call('GET', S, A.managerToken));
        assert.deepEqual(list.map((s) => s._id), [kitchen.id]);
    });
    test('kitchen staff of the store can still be managed; another store\'s cannot', async () => {
        ok(await fx.call('PATCH', `${S}/${kitchen.id}/status`, A.managerToken, { status: 'Suspended' }));
        ok(await fx.call('PATCH', `${S}/${kitchen.id}/shift`, A.managerToken, { shiftId: 'Evening' }));
        assert.equal((await fx.call('PATCH', `${S}/${kitchen.id}/status`, B.managerToken, { status: 'Active' })).status, 404);
        assert.equal((await fx.call('DELETE', `${S}/${kitchen.id}`, B.managerToken)).status, 404);
        ok(await fx.call('DELETE', `${S}/${kitchen.id}`, A.managerToken));
    });
});

describe('H: uploads have size and count limits', () => {
    const post = (files, size = 1024) => {
        let req = fx.api.post(`/api/v1/store-approvals/${A.storeId}/documents`).set(fx.bearer(A.adminToken));
        for (let i = 0; i < files; i++) req = req.attach(`doc${i}`, Buffer.alloc(size, 1), { filename: `d${i}.pdf`, contentType: 'application/pdf' });
        return req;
    };
    test('too many files is a 400, an oversized file is a 413 (not a crash)', async () => {
        const many = await post(21);
        assert.equal(many.status, 400, JSON.stringify(many.body));
        const big = await post(1, 51 * 1024 * 1024);
        assert.equal(big.status, 413, JSON.stringify(big.body));
        assert.match(big.body.error, /too large/i);
    });
    test('the same limits apply to store manager creation', async () => {
        const res = await fx.api.post('/api/v1/store-managers').set(fx.bearer(A.adminToken))
            .field('name', 'X').attach('profileImageFile', Buffer.alloc(51 * 1024 * 1024, 1), { filename: 'big.png', contentType: 'image/png' });
        assert.equal(res.status, 413);
    });
});

describe('Truecaller login stays closed until the signature is really verified', () => {
    test('no payload logs anyone in', async () => {
        for (const path of ['/v1/auth/user/verify-truecaller', '/v1/food/auth/user/verify-truecaller']) {
            const res = await fx.call('POST', path, null, { payload: { phone: '+919999999999', firstName: 'Mallory' } });
            assert.equal(res.status, 501, JSON.stringify(res.body));
            assert.ok(!JSON.stringify(res.body).includes('accessToken'));
        }
        assert.equal(await mongoose.connection.collection('users').countDocuments({ mobile: '919999999999' }), 0, 'no account was created');
    });
});

describe('public store and offers (customer app)', () => {
    test('a store shows only public fields; unknown, malformed and unapproved stores are 404', async () => {
        const s = ok(await fx.call('GET', `/v1/food/stores/${A.storeId}`));
        assert.deepEqual(Object.keys(s).sort(), ['_id', 'address', 'city', 'isOpen', 'latitude', 'longitude', 'phone', 'pincode', 'state', 'storeId', 'storeName', 'zoneId']);
        assert.equal(s.storeName, 'TEST STORE A');
        assert.equal((await fx.call('GET', `/v1/food/stores/${new mongoose.Types.ObjectId()}`)).status, 404);
        assert.equal((await fx.call('GET', '/v1/food/stores/not-an-id')).status, 404);
        await fx.models.FoodStore.updateOne({ _id: B.storeId }, { $set: { approvalStatus: 'Pending' } });
        assert.equal((await fx.call('GET', `/v1/food/stores/${B.storeId}`)).status, 404);
        await fx.models.FoodStore.updateOne({ _id: B.storeId }, { $set: { approvalStatus: 'Approved', isActive: false } });
        assert.equal((await fx.call('GET', `/v1/food/stores/${B.storeId}`)).status, 404);
        await fx.models.FoodStore.updateOne({ _id: B.storeId }, { $set: { isActive: true } });
        assert.equal((await fx.call('GET', '/v1/food/stores/resolve?lat=1&lng=1')).status, 200, 'resolve is still reachable (not shadowed by :id)');
    });
    test('offers: only coupons a customer may use now', async () => {
        const day = 86400000;
        const base = { discountType: 'percentage', discountValue: 10, status: 'active', storeScope: 'all', createdAt: new Date(), updatedAt: new Date() };
        const rows = [
            { couponCode: 'LIVE10', ...base },
            { couponCode: 'HIDDEN', ...base, showInCart: false },
            { couponCode: 'PAUSED', ...base, status: 'paused' },
            { couponCode: 'OLD', ...base, endDate: new Date(Date.now() - day) },
            { couponCode: 'SOON', ...base, startDate: new Date(Date.now() + day) },
            { couponCode: 'USEDUP', ...base, usageLimit: 1, usedCount: 1 },
            { couponCode: 'ONLYB', ...base, storeScope: 'selected', storeId: new mongoose.Types.ObjectId(B.storeId) },
        ];
        const { FoodOffer } = await import('../src/modules/food/admin/models/offer.model.js');
        await FoodOffer.insertMany(rows);
        const codes = async (q = '') => ok(await fx.call('GET', `/v1/food/offers/public${q}`)).allOffers.map((o) => o.couponCode).sort();
        assert.deepEqual(await codes(), ['LIVE10']);
        assert.deepEqual(await codes(`?storeId=${B.storeId}`), ['LIVE10', 'ONLYB']);
        const [live] = ok(await fx.call('GET', '/v1/food/offers/public')).allOffers;
        assert.deepEqual(Object.keys(live).sort(), ['_id', 'couponCode', 'customerScope', 'description', 'discountType', 'discountValue', 'endDate', 'id', 'maxDiscount', 'minOrderValue', 'offerType', 'showInCart', 'startDate', 'status', 'title']);
        assert.equal(live.title, '10% OFF');
    });
});

describe('delivery partner tokens on sign-in-only routes', () => {
    test('a partner cannot rewrite a profile through the generic profile route', async () => {
        const rider = await fx.partner();
        const res = await fx.call('PUT', '/v1/auth/profile/personal', rider.token, { phone: '9000000099', firstName: 'X' });
        assert.ok(res.status >= 400, JSON.stringify(res.body));
        assert.equal(await mongoose.connection.collection('users').countDocuments({ mobile: '9000000099' }), 0);
    });
});
