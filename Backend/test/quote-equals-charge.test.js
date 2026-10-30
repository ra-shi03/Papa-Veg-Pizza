// The cart shows the quote from POST /v1/food/orders/calculate; the order must charge exactly that, whatever prices,
// totals or discounts the client sends (C1). Also covers the routes added with the cart offers / scheduled orders /
// nutrition / delivery login work (073a4dc): what is public returns display data only, the rest is super admin.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A; let pizza; let StoreHours;
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const on = (days, h, m = 0) => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate() + days, h, m); };
const ok = (res, status = 200) => { assert.equal(res.status, status, JSON.stringify(res.body)); return res.body.data; };
const PRICING_KEYS = ['subtotal', 'tax', 'packagingFee', 'deliveryFee', 'platformFee', 'handlingFee', 'discount', 'total'];

before(async () => {
    fx = await createFixture(); A = fx.F.A;
    const { Product } = await import('../src/modules/food/admin/models/product.model.js');
    const { FoodOffer } = await import('../src/modules/food/admin/models/offer.model.js');
    const { FoodFeeSettings } = await import('../src/modules/food/admin/models/feeSettings.model.js');
    ({ StoreHours } = await import('../src/modules/food/franchise/models/storeHours.model.js'));
    pizza = await Product.create({ name: 'Margherita', categoryId: new mongoose.Types.ObjectId(), status: 'Active', price: 250 });
    await FoodOffer.create({ couponCode: 'SAVE20', discountType: 'percentage', discountValue: 20, maxDiscount: 80, minOrderValue: 400, status: 'active' });
    await FoodFeeSettings.create({ platformFee: 5, packagingFee: 10, handlingFee: 7, deliveryFee: 30, gstRate: 5, isActive: true });
    const week = Object.fromEntries(DAYS.map((d) => [d, { open: '00:00', close: '23:59', isClosed: false }]));
    for (const s of [fx.F.A, fx.F.B]) await StoreHours.findOneAndUpdate({ storeId: s.storeId }, { $set: { week, holidays: [] } }, { upsert: true });
});
after(async () => { await fx?.teardown(); });

const items = (qty, price = 1) => [{ itemId: String(pizza._id), name: 'Margherita', price, quantity: qty, kind: 'product' }];
const quote = (body) => fx.call('POST', '/v1/food/orders/calculate', A.customerToken, { storeId: A.storeId, ...body });
const place = (body) => fx.call('POST', '/v1/food/orders', A.customerToken, {
    storeId: A.storeId, address: { street: '1 Test St', city: 'Indore', state: 'MP' }, paymentMethod: 'cash', ...body,
});
const pick = (p) => Object.fromEntries(PRICING_KEYS.map((k) => [k, p[k]]));

describe('the order charges what the quote said', () => {
    for (const [title, makeBody] of [
        ['no coupon', () => ({ items: items(1) })],
        ['coupon applied (min order met)', () => ({ items: items(2), couponCode: 'save20' })],
        ['coupon below its minimum', () => ({ items: items(1), couponCode: 'SAVE20' })],
        ['scheduled for a later slot', () => ({ items: items(2), couponCode: 'SAVE20', scheduledAt: on(2, 13, 0).toISOString() })],
    ]) {
        test(`${title}: client price, total and discount are ignored`, async () => {
            const body = makeBody();
            const q = ok(await quote(body)).pricing;
            const res = await place({ ...body, items: body.items.map((i) => ({ ...i, price: 0.01 })), pricing: { subtotal: 1, tax: 0, deliveryFee: 0, discount: 9999, total: 1 } });
            const order = ok(res, 201).order;
            assert.deepEqual(pick(order.pricing), pick(q));
            const stored = await fx.models.FoodOrder.findById(order._id || order.id).lean();
            assert.equal(stored.pricing.total, q.total);
            assert.equal(stored.items[0].price, 250);
        });
    }
    test('the coupon maths: 20% of 500 capped at 80 -> 80 off; under the minimum -> 0', async () => {
        const q = ok(await quote({ items: items(2), couponCode: 'SAVE20' })).pricing;
        assert.deepEqual([q.subtotal, q.discount, q.platformFee, q.packagingFee, q.handlingFee], [500, 80, 5, 10, 7], 'fees from the super admin settings');
        assert.ok(q.tax > 0 && q.total === q.subtotal + q.packagingFee + q.deliveryFee + q.platformFee + q.handlingFee + q.tax - q.discount);
        assert.equal(ok(await quote({ items: items(1), couponCode: 'SAVE20' })).pricing.discount, 0);
        assert.equal(ok(await quote({ items: items(1), couponCode: 'NOPE' })).pricing.discount, 0);
    });
});

describe('routes added with 073a4dc', () => {
    test('GET /settings/delivery-login is display data only; changing it is super admin only', async () => {
        const data = ok(await fx.call('GET', '/v1/settings/delivery-login'));
        const allowed = new Set(['_id', '__v', 'createdAt', 'updatedAt', 'isActive', 'companyName', 'partnerBadgeText', 'loginTitle', 'loginSubtitle',
            'phoneLabel', 'phonePlaceholder', 'buttonText', 'riderBadgeImageUrl', 'cornerPlateImageUrl', 'termsText', 'termsLinkText',
            'privacyLinkText', 'badge1Text', 'badge2Text', 'supportButtonText', 'backButtonText', 'primaryColor', 'secondaryColor']);
        for (const k of Object.keys(data)) assert.ok(allowed.has(k), `unexpected field ${k}`);
        assert.equal((await fx.call('PUT', '/v1/settings/delivery-login', null, { loginTitle: 'x' })).status, 401);
        for (const token of [A.customerToken, A.managerToken, A.adminToken]) {
            assert.equal((await fx.call('PUT', '/v1/settings/delivery-login', token, { loginTitle: 'x' })).status, 403);
        }
        ok(await fx.call('PUT', '/v1/settings/delivery-login', fx.SA, { loginTitle: 'PARTNER LOGIN' }));
        assert.equal(ok(await fx.call('GET', '/v1/settings/delivery-login')).loginTitle, 'PARTNER LOGIN');
    });
    test('nutrition: public read; everything else super admin only', async () => {
        const pub = ok(await fx.call('GET', '/v1/settings/nutrition/public'));
        assert.deepEqual(Object.keys(pub).sort(), ['allergens', 'items', 'page']);
        for (const [method, path] of [['GET', '/v1/settings/nutrition/admin'], ['PUT', '/v1/settings/nutrition/page'], ['POST', '/v1/settings/nutrition/items'], ['POST', '/v1/settings/nutrition/items/starter']]) {
            assert.equal((await fx.call(method, path, null, {})).status, 401, path);
            for (const token of [A.customerToken, A.adminToken]) assert.equal((await fx.call(method, path, token, {})).status, 403, path);
        }
    });
    test('GET /food/stores/slots returns only the store id and name, opening state and slots', async () => {
        const data = ok(await fx.call('GET', '/v1/food/stores/slots'));
        assert.deepEqual(Object.keys(data).sort(), ['days', 'leadMinutes', 'openNow', 'scheduledOrdersEnabled', 'storeId', 'storeName']);
    });
});
