// Store pricing (/v1/store-pricing, /v1/bulk-price-update, /v1/copy-pricing, /v1/price-history/:productId):
// role and scope from the token, price history on every change, and the store price replacing the catalogue
// price in a real order (server-side pricing from C1).
//
// Catalogue: Margherita (Regular 200, Large 400) and Garlic Bread (no sizes, 150).
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A; let B; let pizza; let bread; let sup; let staff;
const CATEGORY = new mongoose.Types.ObjectId();

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    const { Product } = await import('../src/modules/food/admin/models/product.model.js');
    const { CategoryProduct } = await import('../src/modules/food/admin/models/categoryProduct.model.js');
    await CategoryProduct.collection.insertOne({ _id: CATEGORY, label: 'Veg Pizzas' });
    pizza = await Product.create({ name: 'Margherita', categoryId: CATEGORY, status: 'Active', sizes: [{ size: 'Regular', price: 200 }, { size: 'Large', price: 400 }], price: 200 });
    bread = await Product.create({ name: 'Garlic Bread', categoryId: CATEGORY, status: 'Active', price: 150 });
    sup = fx.claim('KITCHEN_SUPERVISOR', { franchiseId: A.franchiseId, storeId: A.storeId });
    staff = fx.claim('KITCHEN_STAFF', { franchiseId: A.franchiseId, storeId: A.storeId });
});
after(async () => { await fx?.teardown(); });

const rowId = (store, product) => `${store.storeId}_${product._id}`;
const ok = (res, status = 200) => { assert.equal(res.status, status, JSON.stringify(res.body)); return res.body.data; };
const put = (token, store, product, body) => fx.call('PUT', `/v1/store-pricing/${rowId(store, product)}`, token, body);
const history = (token, product, qs = '') => fx.call('GET', `/v1/price-history/${product._id}${qs}`, token);
const ADDRESS = { street: '1 Test Street', city: 'Indore', state: 'MP' };
/** Places a real order and returns what the server stored for the first line. */
async function orderLine(store, product, size, token = store.customerToken) {
    const res = await fx.call('POST', '/v1/food/orders', token, {
        storeId: store.storeId, address: ADDRESS, paymentMethod: 'cash', pricing: { subtotal: 1, total: 1 },
        items: [{ itemId: String(product._id), name: product.name, price: 1, quantity: 1, kind: 'product', ...(size ? { size } : {}) }],
    });
    if (res.status !== 201) return { status: res.status, error: res.body.error };
    const order = await fx.models.FoodOrder.findById(res.body.data.order._id).lean();
    return { status: 201, price: order.items[0].price, subtotal: order.pricing.subtotal };
}

describe('who sees what', () => {
    test('franchise admin: its own store x every catalogue product; stats', async () => {
        const d = ok(await fx.call('GET', '/v1/store-pricing?limit=50', A.adminToken));
        assert.equal(d.totalCount, 2);
        assert.ok(d.pricing.every((r) => r.storeId === A.storeId));
        const p = d.pricing.find((r) => r.productId === String(pizza._id));
        assert.equal(p._id, rowId(A, pizza));
        assert.deepEqual([p.smallPrice, p.mediumPrice, p.largePrice], [200, 200, 400]);
        assert.equal(p.categoryName, 'Veg Pizzas');
        assert.equal(p.updatedBy, 'Catalogue');
        assert.equal(d.pricing.find((r) => r.productId === String(bread._id)).mediumPrice, 150);
        assert.deepEqual(d.stats, { totalStoresCount: 1, totalProductsCount: 2, customPricingCount: 0, promotionalPricingCount: 0, unavailableProductsCount: 0 });
        assert.equal(ok(await fx.call('GET', '/v1/store-pricing', fx.SA)).totalCount, 4);
    });
    test('store manager: reads its own store only, cannot write', async () => {
        assert.equal(ok(await fx.call('GET', '/v1/store-pricing', A.managerToken)).totalCount, 2);
        ok(await fx.call('GET', `/v1/store-pricing/${rowId(A, pizza)}`, A.managerToken));
        ok(await history(A.managerToken, pizza));
        assert.equal((await fx.call('GET', `/v1/store-pricing/${rowId(B, pizza)}`, A.managerToken)).status, 404);
        assert.equal((await fx.call('GET', `/v1/store-pricing?storeId=${B.storeId}`, A.managerToken)).status, 404);
        assert.equal((await put(A.managerToken, A, pizza, { smallPrice: 1 })).status, 403);
        assert.equal((await fx.call('POST', '/v1/bulk-price-update', A.managerToken, { value: 5, selectedStoreIds: [A.storeId] })).status, 403);
        assert.equal((await fx.call('POST', '/v1/copy-pricing', A.managerToken, { sourceStoreId: A.storeId, destinationStoreIds: [B.storeId] })).status, 403);
        assert.equal((await fx.call('PUT', '/v1/store-pricing/bulk-action', A.managerToken, { pricingIds: [rowId(A, pizza)], action: 'DISABLE' })).status, 403);
    });
    test('kitchen roles and customers 403; anonymous 401', async () => {
        for (const token of [sup, staff, A.customerToken]) {
            assert.equal((await fx.call('GET', '/v1/store-pricing', token)).status, 403);
            assert.equal((await history(token, pizza)).status, 403);
            assert.equal((await put(token, A, pizza, { smallPrice: 1 })).status, 403);
        }
        assert.equal((await fx.call('GET', '/v1/store-pricing')).status, 401);
    });
    test('another franchise\'s store is 404 for reads and writes', async () => {
        assert.equal((await fx.call('GET', `/v1/store-pricing/${rowId(B, pizza)}`, A.adminToken)).status, 404);
        assert.equal((await put(A.adminToken, B, pizza, { smallPrice: 1 })).status, 404);
        assert.equal((await fx.call('PUT', '/v1/store-pricing/bulk-action', A.adminToken, { pricingIds: [rowId(B, pizza)], action: 'DISABLE' })).status, 404);
        assert.equal((await fx.call('POST', '/v1/bulk-price-update', A.adminToken, { value: 5, selectedStoreIds: [B.storeId] })).status, 404);
        assert.equal((await fx.call('POST', '/v1/copy-pricing', A.adminToken, { sourceStoreId: A.storeId, destinationStoreIds: [B.storeId], copyAllProducts: true })).status, 404);
        assert.equal((await fx.call('GET', '/v1/store-pricing/not-an-id', A.adminToken)).status, 404);
    });
});

describe('a store price overrides the catalogue price in a real order', () => {
    test('before any rule: catalogue price at both stores', async () => {
        assert.deepEqual(await orderLine(A, pizza, 'Regular'), { status: 201, price: 200, subtotal: 200 });
        assert.deepEqual(await orderLine(B, pizza, 'Regular'), { status: 201, price: 200, subtotal: 200 });
    });
    test('store A charges its own price; store B keeps the catalogue price', async () => {
        const row = ok(await put(A.adminToken, A, pizza, { smallPrice: 180, largePrice: 350, reason: 'Local pricing' }));
        assert.equal(row.smallPrice, 180);
        assert.equal(row.isCustom, true);
        assert.equal(row.updatedBy, 'Franchise Admin');
        assert.deepEqual(await orderLine(A, pizza, 'Regular'), { status: 201, price: 180, subtotal: 180 });
        assert.deepEqual(await orderLine(A, pizza, 'Large'), { status: 201, price: 350, subtotal: 350 });
        assert.deepEqual(await orderLine(B, pizza, 'Regular'), { status: 201, price: 200, subtotal: 200 });
        // the client's price (1) is still ignored
        ok(await put(A.adminToken, A, bread, { mediumPrice: 120 }));
        assert.deepEqual(await orderLine(A, bread), { status: 201, price: 120, subtotal: 120 });
    });
    test('a running promotion charges the special price', async () => {
        const today = new Date().toISOString().slice(0, 10);
        assert.equal((await put(A.adminToken, A, pizza, { availability: 'PROMOTION ACTIVE', specialPrice: 99 })).status, 400, 'a promotion needs dates');
        ok(await put(A.adminToken, A, pizza, { availability: 'PROMOTION ACTIVE', specialPrice: 99, startDate: '2020-01-01', endDate: '2099-12-31' }));
        assert.equal((await orderLine(A, pizza, 'Regular')).price, 99);
        assert.equal((await orderLine(A, pizza, 'Large')).price, 350, 'the special price is for the regular/medium size');
        ok(await put(A.adminToken, A, pizza, { startDate: '2020-01-01', endDate: '2020-01-31' }));
        assert.equal((await orderLine(A, pizza, 'Regular')).price, 180, 'an expired promotion is ignored');
        ok(await put(A.adminToken, A, pizza, { availability: 'AVAILABLE', startDate: today, endDate: today }));
    });
    test('unavailable at a store: the order is refused there, not elsewhere', async () => {
        ok(await fx.call('PUT', '/v1/store-pricing/bulk-action', A.adminToken, { pricingIds: [rowId(A, pizza)], action: 'MARK_UNAVAILABLE' }));
        const r = await orderLine(A, pizza, 'Regular');
        assert.equal(r.status, 400);
        assert.match(r.error, /no longer available/);
        assert.equal((await orderLine(B, pizza, 'Regular')).status, 201);
    });
    test('a disabled rule falls back to the catalogue; enabling brings the store price back', async () => {
        ok(await put(A.adminToken, A, pizza, { availability: 'AVAILABLE' }));
        ok(await fx.call('PUT', '/v1/store-pricing/bulk-action', A.adminToken, { pricingIds: [rowId(A, pizza)], action: 'DISABLE' }));
        assert.equal((await orderLine(A, pizza, 'Regular')).price, 200);
        ok(await fx.call('PUT', '/v1/store-pricing/bulk-action', A.adminToken, { pricingIds: [rowId(A, pizza)], action: 'ENABLE' }));
        assert.equal((await orderLine(A, pizza, 'Regular')).price, 180);
    });
});

describe('bulk update, copy and history', () => {
    test('bulk price update: +10% on the chosen products of the chosen stores', async () => {
        const d = ok(await fx.call('POST', '/v1/bulk-price-update', A.adminToken, {
            categoryId: 'all', increaseType: 'PERCENTAGE', value: 10, applyTo: 'SELECTED_STORES', selectedStoreIds: [A.storeId], selectedProductIds: [String(bread._id)],
        }));
        assert.equal(d.affectedCount, 1);
        assert.equal((await orderLine(A, bread)).price, 132); // 120 + 10%
        assert.equal(ok(await fx.call('GET', `/v1/store-pricing/${rowId(A, pizza)}`, A.adminToken)).smallPrice, 180, 'other products untouched');
        assert.equal((await fx.call('POST', '/v1/bulk-price-update', A.adminToken, { value: 10, selectedStoreIds: [A.storeId], selectedProductIds: ['prod-1'] })).status, 404);
        assert.equal((await fx.call('POST', '/v1/bulk-price-update', A.adminToken, { value: 10, selectedStoreIds: [A.storeId], categoryId: 'cat-1' })).status, 404);
        // ALL_STORES means every store of the caller's franchise only
        const all = ok(await fx.call('POST', '/v1/bulk-price-update', A.adminToken, { increaseType: 'FIXED', value: 5, applyTo: 'ALL_STORES', selectedProductIds: [String(bread._id)] }));
        assert.equal(all.affectedCount, 1);
        assert.equal((await orderLine(B, bread)).price, 150);
        assert.equal((await orderLine(A, bread)).price, 137);
    });
    test('copy pricing from store A to store B (super admin)', async () => {
        const d = ok(await fx.call('POST', '/v1/copy-pricing', fx.SA, { sourceStoreId: A.storeId, destinationStoreIds: [B.storeId], copyAllProducts: true, selectedProductIds: ['mock-1', 'mock-2'] }));
        assert.deepEqual(d, { success: true, affectedStoresCount: 1, affectedProductsCount: 2 });
        assert.equal((await orderLine(B, pizza, 'Regular')).price, 180);
        assert.equal((await orderLine(B, bread)).price, 137);
        assert.equal((await fx.call('POST', '/v1/copy-pricing', fx.SA, { sourceStoreId: A.storeId, destinationStoreIds: [A.storeId], copyAllProducts: true })).status, 400);
    });
    test('reset to catalogue', async () => {
        ok(await fx.call('PUT', '/v1/store-pricing/bulk-action', B.adminToken, { pricingIds: [rowId(B, pizza), rowId(B, bread)], action: 'DELETE_RULES' }));
        assert.equal((await orderLine(B, pizza, 'Regular')).price, 200);
        const row = ok(await fx.call('GET', `/v1/store-pricing/${rowId(B, pizza)}`, B.adminToken));
        assert.equal(row.updatedBy, 'Catalogue');
        assert.equal(row.isCustom, false);
    });
    test('every change is in the history, each franchise sees only its own stores', async () => {
        const a = ok(await history(A.adminToken, pizza, '?limit=50'));
        // A pizza: edit, promo on, promo expired, back to available, unavailable, available, disable, enable
        assert.equal(a.totalCount, 8);
        assert.ok(a.history.every((h) => h.storeId === A.storeId && h.productName === 'Margherita'));
        const first = a.history.at(-1);
        assert.equal(first.oldPrice.smallPrice, 200);
        assert.equal(first.newPrice.smallPrice, 180);
        assert.equal(first.reason, 'Local pricing');
        assert.equal(first.changedBy, 'Franchise Admin');
        const b = ok(await history(B.adminToken, pizza, '?limit=50'));
        assert.deepEqual(b.history.map((h) => h.reason), ['Reset to catalogue price', `Copied from TEST STORE A`]);
        assert.equal(ok(await history(fx.SA, pizza, '?limit=50')).totalCount, 10);
        assert.equal(ok(await history(A.adminToken, bread, `?storeId=${A.storeId}`)).totalCount, 3);
        assert.equal((await history(A.adminToken, pizza, `?storeId=${B.storeId}`)).status, 404);
    });
    test('list filters and stats follow the saved rules', async () => {
        ok(await fx.call('PUT', '/v1/store-pricing/bulk-action', A.adminToken, { pricingIds: [rowId(A, bread)], action: 'ACTIVATE_PROMOTION', payload: {} }));
        const d = ok(await fx.call('GET', '/v1/store-pricing?availability=PROMOTION%20ACTIVE', A.adminToken));
        assert.deepEqual(d.pricing.map((r) => r.productName), ['Garlic Bread']);
        assert.equal(d.stats.customPricingCount, 2);
        assert.equal(d.stats.promotionalPricingCount, 1);
        assert.equal(ok(await fx.call('GET', '/v1/store-pricing?search=marg', A.adminToken)).totalCount, 1);
        assert.equal(ok(await fx.call('GET', `/v1/store-pricing?categoryId=${CATEGORY}`, A.adminToken)).totalCount, 2);
    });
    test('bad input is a 400', async () => {
        assert.equal((await put(A.adminToken, A, pizza, { smallPrice: -5 })).status, 400);
        assert.equal((await put(A.adminToken, A, pizza, { startDate: '2026-05-10', endDate: '2026-05-01' })).status, 400);
        assert.equal((await put(A.adminToken, A, pizza, { availability: 'SOMETIMES' })).status, 400);
        assert.equal((await fx.call('PUT', '/v1/store-pricing/bulk-action', A.adminToken, { pricingIds: [rowId(A, pizza)], action: 'EXPLODE' })).status, 400);
    });
});
