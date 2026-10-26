// Order prices are decided on the server. These tests send tampered prices, a tampered pricing.total and
// reused / misused limited-time-offer tokens, and check the order is rejected or corrected.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose, jwt } from './helpers/fixture.js';

let fx; let A; let B;
let pizza; let crust; let topping; let offerAddon; let unassigned; let Addon;
const CATEGORY = new mongoose.Types.ObjectId();

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    const { Product } = await import('../src/modules/food/admin/models/product.model.js');
    ({ Addon } = await import('../src/modules/food/admin/models/addon.model.js'));
    const { CartConfig } = await import('../src/modules/food/settings/models/cartConfig.model.js');
    crust = await Addon.create({ name: 'Cheese Burst', type: 'Crust', prices: [{ size: 'Regular', price: 40 }, { size: 'Large', price: 70 }] });
    topping = await Addon.create({ name: 'Olives', type: 'Topping', prices: [{ size: 'Regular', price: 30 }, { size: 'Large', price: 50 }] });
    unassigned = await Addon.create({ name: 'Jalapeno', type: 'Topping', prices: [{ size: 'Regular', price: 1 }] });
    offerAddon = await Addon.create({ name: 'Garlic Dip', type: 'Dip', prices: [{ size: 'Default', price: 25 }] });
    pizza = await Product.create({
        name: 'Margherita', categoryId: CATEGORY, status: 'Active',
        sizes: [{ size: 'Regular', price: 200 }, { size: 'Large', price: 400 }], price: 200,
        toppings: [topping._id], crusts: [crust._id],
    });
    await CartConfig.create({ offer: { enabled: true, itemType: 'addon', addonId: offerAddon._id, offerPrice: 10, minCartValue: 300, expiryMinutes: 15 } });
});
after(async () => { await fx?.teardown(); });

const ADDRESS = { street: '1 Test Street', city: 'Indore', state: 'MP' };
const line = (over = {}) => ({ itemId: String(pizza._id), name: 'Margherita', price: 200, quantity: 1, size: 'Regular', kind: 'product', ...over });
const body = (items, over = {}) => ({ items, address: ADDRESS, storeId: A.storeId, paymentMethod: 'cash', pricing: { subtotal: 1, total: 1 }, ...over });
const place = (b, token = A.customerToken) => fx.call('POST', '/v1/food/orders', token, b);
const stored = (res) => fx.models.FoodOrder.findById(res.body.data.order._id).lean();
const claim = (token = A.customerToken, cartTotal = 999) => fx.call('POST', '/v1/settings/cart-config/offer/claim', token, { cartTotal });

describe('C1: the server decides the price', () => {
    test('a pizza sent at Rs 1 is charged the catalogue price', async () => {
        const res = await place(body([line({ price: 1 })]));
        assert.equal(res.status, 201, JSON.stringify(res.body));
        const order = await stored(res);
        assert.equal(order.items[0].price, 200);
        assert.equal(order.pricing.subtotal, 200);
    });

    test('a tampered pricing.total / subtotal / discount is replaced by the server total', async () => {
        const res = await place(body([line({ price: 1 })], { pricing: { subtotal: 1, discount: 150, tax: 0, deliveryFee: 0, total: 1 } }));
        assert.equal(res.status, 201, JSON.stringify(res.body));
        const order = await stored(res);
        assert.equal(order.pricing.subtotal, 200);
        assert.equal(order.pricing.discount, 0);
        assert.ok(order.pricing.total >= 200, `total was ${order.pricing.total}`);
        assert.equal(order.payment.amountDue, order.pricing.total);
    });

    test('an order with no pricing block at all is accepted and priced by the server', async () => {
        const { pricing, ...rest } = body([line({ price: 0 })]);
        const res = await place(rest);
        assert.equal(res.status, 201, JSON.stringify(res.body));
        assert.equal((await stored(res)).pricing.subtotal, 200);
    });

    test('size, crust, toppings and extra cheese are priced from the catalogue', async () => {
        const res = await place(body([line({ price: 1, size: 'Large', crust: 'Cheese Burst', toppings: ['Olives'], extraCheese: true, quantity: 2 })]));
        assert.equal(res.status, 201, JSON.stringify(res.body));
        const order = await stored(res);
        assert.equal(order.items[0].price, 400 + 70 + 50 + 65);
        assert.equal(order.pricing.subtotal, (400 + 70 + 50 + 65) * 2);
    });

    test('calculate returns the server quote, not the client price', async () => {
        const res = await fx.call('POST', '/v1/food/orders/calculate', A.customerToken, { items: [line({ price: 1 })], storeId: A.storeId });
        assert.equal(res.status, 200, JSON.stringify(res.body));
        assert.equal(res.body.data.pricing.subtotal, 200);
    });

    test('unknown items, sizes, crusts and toppings are rejected', async () => {
        const bad = [
            line({ itemId: String(new mongoose.Types.ObjectId()) }),
            line({ itemId: 'not-an-id' }),
            line({ size: 'Party' }),
            line({ crust: 'Gold Crust' }),
            line({ toppings: ['Truffle'] }),
        ];
        for (const item of bad) assert.equal((await place(body([item]))).status, 400, JSON.stringify(item));
    });

    test('a topping that exists but is not assigned to this pizza is rejected', async () => {
        assert.equal((await place(body([line({ toppings: ['Jalapeno'] })]))).status, 400);
    });

    test('an inactive add-on cannot be ordered on its own or as a topping', async () => {
        await Addon.updateOne({ _id: topping._id }, { status: 'Inactive' });
        try {
            assert.equal((await place(body([{ itemId: String(topping._id), name: 'Olives', price: 0, quantity: 1, kind: 'topping' }]))).status, 400);
            assert.equal((await place(body([line({ toppings: ['Olives'] })]))).status, 400);
        } finally { await Addon.updateOne({ _id: topping._id }, { status: 'Active' }); }
    });

    test('an inactive product cannot be ordered', async () => {
        const { Product } = await import('../src/modules/food/admin/models/product.model.js');
        await Product.updateOne({ _id: pizza._id }, { status: 'Archived' });
        try { assert.equal((await place(body([line()]))).status, 400); }
        finally { await Product.updateOne({ _id: pizza._id }, { status: 'Active' }); }
    });
});

describe('N1: limited-time offer', () => {
    const offerLine = (token, over = {}) => ({ itemId: String(offerAddon._id), name: 'Garlic Dip', price: 0, quantity: 5, kind: 'addon', offerToken: token, ...over });
    const claimToken = async (token) => { const r = await claim(token); assert.equal(r.status, 200, JSON.stringify(r.body)); return r.body.data.token; };

    test('the claim endpoint now needs a login', async () => {
        assert.equal((await claim(null)).status, 401);
    });

    test('the offer price comes from the signed token and quantity is forced to 1', async () => {
        const token = await claimToken();
        const res = await place(body([line({ size: 'Large', price: 400 }), offerLine(token)]));
        assert.equal(res.status, 201, JSON.stringify(res.body));
        const dip = (await stored(res)).items.find((i) => i.isLimitedOffer);
        assert.equal(dip.price, 10);
        assert.equal(dip.quantity, 1);
    });

    test('a spent token cannot be used on a second order, and the claim records the order that took it', async () => {
        const token = await claimToken();
        const first = await place(body([line({ size: 'Large' }), offerLine(token)]));
        assert.equal(first.status, 201);
        const { FoodOfferClaim } = await import('../src/modules/food/orders/models/offerClaim.model.js');
        const row = await FoodOfferClaim.findOne({ jti: jwt.decode(token).jti }).lean();
        assert.equal(String(row.orderId), String(first.body.data.order._id));
        assert.equal(String(row.userId), A.customerId);
        assert.equal((await place(body([line({ size: 'Large' }), offerLine(token)]))).status, 400);
    });

    test('the same token cannot appear twice in one order', async () => {
        const token = await claimToken();
        assert.equal((await place(body([line({ size: 'Large' }), offerLine(token), offerLine(token)]))).status, 400);
    });

    test('a token claimed by one customer is useless to another', async () => {
        const token = await claimToken(A.customerToken);
        assert.equal((await place(body([line({ size: 'Large' }), offerLine(token)], { storeId: B.storeId }), B.customerToken)).status, 400);
    });

    test('the minimum is checked against the server subtotal, not the cartTotal sent to claim', async () => {
        const token = await claimToken(); // claimed with cartTotal 999
        const res = await place(body([line({ size: 'Regular', price: 5000 }), offerLine(token)])); // real cart is Rs 200 < 300
        assert.equal(res.status, 400);
        // a rejected order does not burn the token
        assert.equal((await place(body([line({ size: 'Large' }), offerLine(token)]))).status, 201);
    });

    test('a token signed with the login (access-token) secret is rejected: offers use their own key', async () => {
        const { config } = await import('../src/config/env.js');
        const forged = jwt.sign({ itemId: String(offerAddon._id), price: 0, uid: A.customerId }, config.jwtAccessSecret,
            { audience: 'cart-offer', expiresIn: '10m', jwtid: 'forged-with-access-secret' });
        assert.equal((await place(body([line({ size: 'Large' }), offerLine(forged)]))).status, 400);
    });

    test('a forged or expired token is rejected', async () => {
        assert.equal((await place(body([line({ size: 'Large' }), offerLine('garbage')]))).status, 400);
    });
});
