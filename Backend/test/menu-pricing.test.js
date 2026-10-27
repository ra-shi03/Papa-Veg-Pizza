// The customer menu for a store shows the store's price (Store Pricing), the same price an order is charged.
// Catalogue: Margherita (Regular 200, Large 400), Garlic Bread (no sizes, 150), Farmhouse (Regular 250, Large 450).
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A; let B; let margherita; let bread; let farmhouse;
const CATEGORY = new mongoose.Types.ObjectId();
const ADDRESS = { street: '1 Test Street', city: 'Indore', state: 'MP' };

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    const { Product } = await import('../src/modules/food/admin/models/product.model.js');
    const { CategoryProduct } = await import('../src/modules/food/admin/models/categoryProduct.model.js');
    await CategoryProduct.collection.insertOne({ _id: CATEGORY, label: 'Veg Pizzas' });
    margherita = await Product.create({ name: 'Margherita', categoryId: CATEGORY, status: 'Active', sizes: [{ size: 'Regular', price: 200 }, { size: 'Large', price: 400 }], price: 200 });
    bread = await Product.create({ name: 'Garlic Bread', categoryId: CATEGORY, status: 'Active', price: 150 });
    farmhouse = await Product.create({ name: 'Farmhouse', categoryId: CATEGORY, status: 'Active', sizes: [{ size: 'Regular', price: 250 }, { size: 'Large', price: 450 }], price: 250 });
    // store A is in Indore, store B in Delhi (the checkout picks the nearest approved store)
    await fx.models.FoodStore.updateOne({ _id: A.storeId }, { $set: { latitude: 22.72, longitude: 75.86 } });
    await fx.models.FoodStore.updateOne({ _id: B.storeId }, { $set: { latitude: 28.61, longitude: 77.2 } });
});
after(async () => { await fx?.teardown(); });

const ok = (res) => { assert.equal(res.status, 200, JSON.stringify(res.body)); return res.body; };
const rowId = (store, product) => `${store.storeId}_${product._id}`;
const setPrice = async (store, product, body) => ok(await fx.call('PUT', `/v1/store-pricing/${rowId(store, product)}`, store.adminToken, body));
const menu = async (qs = '') => ok(await fx.call('GET', `/v1/food/admin/menu/public${qs}`)).data;
const products = async (qs = '') => ok(await fx.call('GET', `/v1/food/admin/products/public${qs}`)).data;
const byName = (list) => Object.fromEntries(list.map((p) => [p.name, p]));
/** What a real order charges for one unit of this product and size at this store. */
async function charged(store, product, size) {
    const res = await fx.call('POST', '/v1/food/orders', store.customerToken, {
        storeId: store.storeId, address: ADDRESS, paymentMethod: 'cash', pricing: { subtotal: 1, total: 1 },
        items: [{ itemId: String(product._id), name: product.name, price: 1, quantity: 1, kind: 'product', ...(size ? { size } : {}) }],
    });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    return (await fx.models.FoodOrder.findById(res.body.data.order._id).lean()).items[0].price;
}
/** Every size the menu shows for every product must cost exactly that in an order. */
async function assertMenuMatchesOrders(store, list) {
    for (const p of list) {
        const prod = { _id: p._id, name: p.name };
        if (p.sizes?.length) for (const s of p.sizes) assert.equal(await charged(store, prod, s.size), s.price, `${p.name} ${s.size}`);
        else assert.equal(await charged(store, prod), p.price, p.name);
        if (p.sizes?.length) assert.equal(p.price, Math.min(...p.sizes.map((s) => s.price)), `${p.name} headline price is the cheapest size`);
    }
}

describe('catalogue prices when no store is asked for', () => {
    test('no store, an unknown store, and a store without rules all show the catalogue', async () => {
        await setPrice(A, margherita, { smallPrice: 180, largePrice: 350 });
        const plain = byName((await menu()).products);
        assert.deepEqual(plain.Margherita.sizes.map((s) => s.price), [200, 400]);
        assert.equal(plain['Garlic Bread'].price, 150);
        const bogus = byName((await menu(`?storeId=${new mongoose.Types.ObjectId()}`)).products);
        assert.deepEqual(bogus.Margherita.sizes.map((s) => s.price), [200, 400]);
        const b = byName((await menu(`?storeId=${B.storeId}`)).products);
        assert.deepEqual(b.Margherita.sizes.map((s) => s.price), [200, 400]);
    });
});

describe('the menu shows the store price and the order charges it', () => {
    test('menu and product list for store A: new prices, same shape, same fields', async () => {
        const plain = (await menu()).products.find((p) => p.name === 'Margherita');
        const a = (await menu(`?storeId=${A.storeId}`)).products.find((p) => p.name === 'Margherita');
        assert.deepEqual(a.sizes.map((s) => [s.size, s.price]), [['Regular', 180], ['Large', 350]]);
        assert.equal(a.price, 180);
        assert.deepEqual(Object.keys(a).sort(), Object.keys(plain).sort(), 'response shape unchanged');
        assert.deepEqual(a.sizes.map((s) => Object.keys(s).sort()), plain.sizes.map((s) => Object.keys(s).sort()));
        assert.equal(a.categoryId.label, 'Veg Pizzas', 'populated fields kept');
        const list = byName(await products(`?storeId=${A.storeId}`));
        assert.deepEqual(list.Margherita.sizes.map((s) => s.price), [180, 350]);
    });
    test('menu price == price charged in a real order, for every product and size', async () => {
        await setPrice(A, bread, { mediumPrice: 120 });
        await setPrice(A, farmhouse, { smallPrice: 260, largePrice: 430 });
        const list = (await menu(`?storeId=${A.storeId}`)).products;
        assert.equal(list.length, 3);
        await assertMenuMatchesOrders(A, list);
        // store B still shows and charges the catalogue
        await assertMenuMatchesOrders(B, (await menu(`?storeId=${B.storeId}`)).products);
        assert.equal(byName(await products(`?storeId=${B.storeId}`)).Margherita.sizes[0].price, 200);
    });
    test('a running promotion shows the special price on the regular size, as the order charges it', async () => {
        await setPrice(A, margherita, { availability: 'PROMOTION ACTIVE', specialPrice: 99, startDate: '2020-01-01', endDate: '2099-12-31' });
        const list = (await menu(`?storeId=${A.storeId}`)).products;
        assert.deepEqual(list.find((p) => p.name === 'Margherita').sizes.map((s) => s.price), [99, 350]);
        await assertMenuMatchesOrders(A, list);
        await setPrice(A, margherita, { availability: 'AVAILABLE', startDate: '', endDate: '' });
    });
    test('a disabled rule shows the catalogue again', async () => {
        ok(await fx.call('PUT', '/v1/store-pricing/bulk-action', A.adminToken, { pricingIds: [rowId(A, margherita)], action: 'DISABLE' }));
        const m = byName((await menu(`?storeId=${A.storeId}`)).products).Margherita;
        assert.deepEqual(m.sizes.map((s) => s.price), [200, 400]);
        ok(await fx.call('PUT', '/v1/store-pricing/bulk-action', A.adminToken, { pricingIds: [rowId(A, margherita)], action: 'ENABLE' }));
    });
    test('the customer\'s location picks the same store checkout will use', async () => {
        const nearA = byName((await menu('?lat=22.7&lng=75.8')).products);
        assert.deepEqual(nearA.Margherita.sizes.map((s) => s.price), [180, 350]);
        const nearB = byName((await menu('?lat=28.6&lng=77.2')).products);
        assert.deepEqual(nearB.Margherita.sizes.map((s) => s.price), [200, 400]);
        const resolved = ok(await fx.call('GET', '/v1/food/stores/resolve?lat=22.7&lng=75.8')).data;
        assert.equal(resolved.storeId, A.storeId);
        const junk = byName((await menu('?lat=abc&lng=xyz')).products);
        assert.deepEqual(junk.Margherita.sizes.map((s) => s.price), [200, 400]);
    });
});

describe('products a store marked unavailable', () => {
    test('are hidden from that store\'s menu and product list only, and cannot be ordered there', async () => {
        ok(await fx.call('PUT', '/v1/store-pricing/bulk-action', A.adminToken, { pricingIds: [rowId(A, farmhouse)], action: 'MARK_UNAVAILABLE' }));
        const a = (await menu(`?storeId=${A.storeId}`)).products.map((p) => p.name).sort();
        assert.deepEqual(a, ['Garlic Bread', 'Margherita']);
        assert.deepEqual((await products(`?storeId=${A.storeId}`)).map((p) => p.name).sort(), ['Garlic Bread', 'Margherita']);
        assert.equal((await menu(`?storeId=${B.storeId}`)).products.length, 3);
        assert.equal((await menu()).products.length, 3, 'no store: the whole catalogue');
        const res = await fx.call('POST', '/v1/food/orders', A.customerToken, {
            storeId: A.storeId, address: ADDRESS, paymentMethod: 'cash',
            items: [{ itemId: String(farmhouse._id), name: 'Farmhouse', price: 1, quantity: 1, kind: 'product', size: 'Regular' }],
        });
        assert.equal(res.status, 400);
    });
    test('they come back when the store makes them available again', async () => {
        await setPrice(A, farmhouse, { availability: 'AVAILABLE' });
        assert.equal((await menu(`?storeId=${A.storeId}`)).products.length, 3);
    });
});
