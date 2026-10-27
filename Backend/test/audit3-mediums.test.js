// docs/audit3.md follow-up: M1 (admin catalogue lists were open, query values reached Mongo as operators) and the
// mediums a signed-out caller or a customer could use: M2 (public order lookup guessing) and M3 (customer upload).
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A; let B; let draftId;
before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    const categoryId = new mongoose.Types.ObjectId();
    await mongoose.connection.collection('categoryproducts').insertOne({ _id: categoryId, label: 'Audit Cat', status: 'Active', sort: 1, createdAt: new Date() });
    const draft = await mongoose.connection.collection('products').insertOne({
        name: `Draft Secret ${fx.ts}`, categoryId, status: 'Draft', sizes: [{ size: 'Regular', price: 100 }], createdAt: new Date(), updatedAt: new Date(),
    });
    draftId = String(draft.insertedId);
});
after(async () => { await fx?.teardown(); });

const ADMIN_LISTS = [
    '/v1/food/admin/products', '/v1/food/admin/products/stats', '/v1/food/admin/category-products',
    '/v1/food/admin/category-products/categories', '/v1/food/admin/categories', '/v1/food/admin/addons',
    '/v1/food/admin/addons/stats', '/v1/food/admin/addons/stats/public', '/v1/food/admin/combos', '/v1/food/admin/combos/stats',
];
const PUBLIC_MENU = [
    '/v1/food/admin/menu/public', '/v1/food/admin/products/public', '/v1/food/products/public',
    '/v1/food/admin/category-products/public', '/v1/food/admin/categories/public', '/v1/food/categories/public',
    '/v1/food/categories', '/v1/food/admin/addons/public', '/v1/food/combos/public', '/v1/food/admin/combos/public',
];
const ids = (res) => (Array.isArray(res.body.data) ? res.body.data : res.body.data?.products || []).map((p) => String(p._id));

describe('M1: admin catalogue lists need an admin sign-in', () => {
    test('signed out -> 401 on every admin list', async () => {
        for (const path of ADMIN_LISTS) assert.equal((await fx.call('GET', path)).status, 401, path);
    });
    test('customer, store manager and delivery partner -> 403', async () => {
        const rider = await fx.partner('approved');
        for (const path of ADMIN_LISTS) {
            assert.equal((await fx.call('GET', path, A.customerToken)).status, 403, `customer ${path}`);
            assert.equal((await fx.call('GET', path, A.managerToken)).status, 403, `manager ${path}`);
            assert.equal((await fx.call('GET', path, rider.token)).status, 403, `rider ${path}`);
        }
    });
    test('super admin reads them all; franchise admin the lists the admin router already allowed it', async () => {
        // The admin router's own guards are unchanged: stats, add-ons and combos sit behind its requireSuperAdmin.
        const franchiseOk = new Set(['/v1/food/admin/products', '/v1/food/admin/category-products',
            '/v1/food/admin/category-products/categories', '/v1/food/admin/categories', '/v1/food/admin/addons/stats/public']);
        for (const path of ADMIN_LISTS) {
            assert.equal((await fx.call('GET', path, fx.SA)).status, 200, `super admin ${path}`);
            assert.equal((await fx.call('GET', path, A.adminToken)).status, franchiseOk.has(path) ? 200 : 403, `franchise admin ${path}`);
        }
        assert.ok(ids(await fx.call('GET', '/v1/food/admin/products', fx.SA)).includes(draftId), 'admin list has drafts');
    });
    test('the public menu routes stay public and never show a draft product', async () => {
        for (const path of PUBLIC_MENU) assert.equal((await fx.call('GET', path)).status, 200, path);
        assert.ok(!ids(await fx.call('GET', '/v1/food/products/public')).includes(draftId));
        assert.ok(!ids(await fx.call('GET', '/v1/food/admin/products/public')).includes(draftId));
    });
});

describe('M1: query values cannot carry Mongo operators', () => {
    const bad = ['price[$gt]=0', 'name[$ne]=x', 'status[$ne]=Active', 'status[$regex]=.*', '$where=1', 'a.b=1', 'category[x][$ne]=1', 'status=Active&status=Draft'];
    test('admin lists: operator, dotted or repeated keys -> 400', async () => {
        for (const path of ['/v1/food/admin/products', '/v1/food/admin/category-products', '/v1/food/admin/addons', '/v1/food/admin/combos']) {
            for (const q of bad) assert.equal((await fx.call('GET', `${path}?${q}`, fx.SA)).status, 400, `${path}?${q}`);
        }
    });
    test('public catalogue: the same is refused for anonymous callers', async () => {
        for (const path of ['/v1/food/products/public', '/v1/food/admin/menu/public', '/v1/food/categories/public', '/v1/food/combos/public', '/v1/food/admin/addons/public']) {
            for (const q of ['price[$gt]=0', 'name[$ne]=x', 'category[$ne]=x']) {
                const res = await fx.call('GET', `${path}?${q}`);
                assert.equal(res.status, 400, `${path}?${q}`);
                assert.equal(res.body.success, false);
            }
        }
    });
    test('?status[$ne]=x on the admin list no longer returns the drafts it used to expose', async () => {
        const res = await fx.call('GET', '/v1/food/admin/products?status[$ne]=Active');
        assert.notEqual(res.status, 200);
        assert.ok(!JSON.stringify(res.body).includes(draftId));
    });
    test('staff list (same pattern, M6): operators -> 400', async () => {
        for (const q of ['status[$ne]=x', 'search[$regex]=a', 'a.b=1']) {
            assert.equal((await fx.call('GET', `/v1/food/store/staff?${q}`, A.managerToken)).status, 400, q);
        }
    });
    test('regex characters in search text are matched literally, not run (no 500, no ReDoS)', async () => {
        for (const s of ['(a+)+$', '[', '.*', '\\']) {
            const q = encodeURIComponent(s);
            assert.equal((await fx.call('GET', `/v1/food/admin/products?search=${q}`, fx.SA)).status, 200, `products ${s}`);
            assert.equal((await fx.call('GET', `/v1/food/admin/products?category=${q}`, fx.SA)).status, 200, `category ${s}`);
            assert.equal((await fx.call('GET', `/v1/food/products/public?search=${q}`)).status, 200, `public ${s}`);
            assert.equal((await fx.call('GET', `/v1/food/admin/category-products?search=${q}`, fx.SA)).status, 200, `categories ${s}`);
            assert.equal((await fx.call('GET', `/v1/food/admin/combos?search=${q}`, fx.SA)).status, 200, `combos ${s}`);
            assert.equal((await fx.call('GET', `/v1/food/admin/addons?type=${q}&status=${q}`, fx.SA)).status, 200, `addons ${s}`);
            assert.equal((await fx.call('GET', `/v1/food/store/staff?search=${q}`, A.managerToken)).status, 200, `staff ${s}`);
        }
        const all = ids(await fx.call('GET', '/v1/food/admin/products', fx.SA));
        assert.deepEqual(ids(await fx.call('GET', '/v1/food/admin/products?search=.*', fx.SA)), [], '".*" is literal text now');
        assert.ok(all.length > 0);
    });
    test('normal filters still work', async () => {
        const res = await fx.call('GET', '/v1/food/admin/products?status=Draft&page=1&limit=10', fx.SA);
        assert.equal(res.status, 200);
        assert.ok(ids(res).includes(draftId));
        assert.equal(res.body.pagination.limit, 10);
        assert.equal((await fx.call('GET', `/v1/food/admin/products?search=${encodeURIComponent(`Draft Secret ${fx.ts}`)}`, fx.SA)).body.data.length, 1);
    });
});

describe('M3: the customer profile image upload takes images only', () => {
    const upload = (token, buf, filename, contentType) => fx.api.post('/api/v1/food/user/profile/profile-image')
        .set(fx.bearer(token)).attach('file', buf, { filename, contentType });
    test('HTML, a script named .png, and a PDF are refused (400)', async () => {
        assert.equal((await upload(A.customerToken, Buffer.from('<html><script>alert(1)</script></html>'), 'x.html', 'text/html')).status, 400);
        assert.equal((await upload(A.customerToken, Buffer.from('<svg onload=alert(1)>'), 'x.png', 'image/png')).status, 400);
        assert.equal((await upload(A.customerToken, Buffer.from('%PDF-1.4 x'), 'x.pdf', 'application/pdf')).status, 400);
    });
    test('an image over 5 MB is 413', async () => {
        const big = Buffer.alloc(6 * 1024 * 1024); big.set([0x89, 0x50, 0x4e, 0x47]);
        assert.equal((await upload(A.customerToken, big, 'big.png', 'image/png')).status, 413);
    });
});

// Last: these use up the lookup limits of this test process.
describe('M2: public order lookup limits failed guesses', () => {
    const lookup = (orderId, phone) => fx.call('POST', '/v1/food/orders/history', null, { orderId, phone });
    const fakeRef = () => `FOD-${Math.floor(1000000 + Math.random() * 9000000)}`;
    const fakePhone = () => `9${Math.floor(100000000 + Math.random() * 900000000)}`;
    test('successful lookups are not limited', async () => {
        for (let i = 0; i < 8; i += 1) assert.equal((await lookup(A.orderRef, A.phone)).status, 200);
        assert.equal((await fx.call('POST', '/v1/food/orders/track', null, { orderId: A.orderRef, phone: A.phone })).status, 200);
    });
    test('5 wrong numbers for one order: the 6th try is 429, even with the right number', async () => {
        for (let i = 0; i < 5; i += 1) assert.equal((await lookup(B.orderRef, fakePhone())).status, 404);
        const res = await lookup(B.orderRef, B.phone);
        assert.equal(res.status, 429);
        assert.equal(res.body.success, false);
        assert.equal((await fx.call('GET', `/v1/food/orders/track?orderId=%23${B.orderRef.toLowerCase()}&phone=${B.phone}`)).status, 429, 'same order, other spelling and route');
    });
    test('10 made-up orders for one number: further lookups for that number are 429', async () => {
        for (let i = 0; i < 10; i += 1) assert.equal((await lookup(fakeRef(), A.phone)).status, 404);
        assert.equal((await lookup(A.orderRef, `+91 ${A.phone}`)).status, 429);
    });
    test('one caller guessing different orders and numbers is stopped at 30 misses', async () => {
        let blockedAt = 0;
        for (let i = 1; i <= 31 && !blockedAt; i += 1) {
            const res = await lookup(fakeRef(), fakePhone());
            if (res.status === 429) blockedAt = i; else assert.equal(res.status, 404);
        }
        assert.ok(blockedAt > 0, 'never limited');
    });
});
