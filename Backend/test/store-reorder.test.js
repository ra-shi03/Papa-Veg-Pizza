// Completed Orders -> Reorder: the store manager places a finished order again for the same customer.
// It goes through the normal order placement: today's prices from the menu, cash on delivery, the customer is told.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A; let B; let chef; let Product; let pizza;
const CATEGORY = new mongoose.Types.ObjectId();
const oid = (v) => new mongoose.Types.ObjectId(String(v));
const ADDRESS = { street: '1 Test Street', city: 'Indore', state: 'MP' };
const R = (id) => `/v1/food/store/orders/${id}/reorder`;
const msg = (res) => res.body.message || res.body.error;

/** A customer order of store A (Large + Cheese Burst + Olives + extra cheese x2, and a Regular x1), then delivered. */
async function deliveredOrder() {
    const res = await fx.call('POST', '/v1/food/orders', A.customerToken, {
        storeId: A.storeId, paymentMethod: 'cash', address: ADDRESS,
        items: [
            { itemId: String(pizza._id), name: 'Margherita', price: 1, quantity: 2, size: 'Large', crust: 'Cheese Burst', toppings: ['Olives'], extraCheese: true, kind: 'product' },
            { itemId: String(pizza._id), name: 'Margherita', price: 1, quantity: 1, size: 'Regular', kind: 'product' },
        ],
    });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    const id = res.body.data.order._id;
    await fx.models.FoodOrder.updateOne({ _id: id }, { $set: { orderStatus: 'delivered' } });
    return id;
}

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    ({ Product } = await import('../src/modules/food/admin/models/product.model.js'));
    const { Addon } = await import('../src/modules/food/admin/models/addon.model.js');
    const crust = await Addon.create({ name: 'Cheese Burst', type: 'Crust', prices: [{ size: 'Regular', price: 40 }, { size: 'Large', price: 70 }] });
    const topping = await Addon.create({ name: 'Olives', type: 'Topping', prices: [{ size: 'Regular', price: 30 }, { size: 'Large', price: 50 }] });
    pizza = await Product.create({
        name: 'Margherita', categoryId: CATEGORY, status: 'Active',
        sizes: [{ size: 'Regular', price: 200 }, { size: 'Large', price: 400 }], price: 200, toppings: [topping._id], crusts: [crust._id],
    });
    chef = await fx.staff('A', 'Pizza Maker', 'rchef');
});
after(async () => { await fx?.teardown(); });

describe('store reorder', () => {
    test('the same picks again for that customer, at TODAY\'s price, cash on delivery, waiting in Incoming', async () => {
        const old = await deliveredOrder();
        await Product.updateOne({ _id: pizza._id }, { $set: { 'sizes.1.price': 500 } });   // the Large went up since
        const res = await fx.call('POST', R(old), A.managerToken, { lines: [{ index: 0, quantity: 1 }, { index: 1, quantity: 3 }], items: [{ price: 1 }] });
        assert.equal(res.status, 201, JSON.stringify(res.body));
        assert.match(msg(res), /today's prices/);
        const made = await fx.models.FoodOrder.findById(res.body.data._id).lean();
        assert.equal(String(made.userId), A.customerId);
        assert.equal(String(made.storeId), A.storeId);
        assert.deepEqual([made.orderStatus, made.payment.method, made.payment.status], ['created', 'cash', 'cod_pending']);
        assert.deepEqual(made.items.map((i) => [i.size, i.crust, i.quantity]), [['Large', 'Cheese Burst', 1], ['Regular', '', 3]]);
        assert.deepEqual(made.items[0].selectedAddons.map((a) => a.name).sort(), ['Cheese Burst', 'Extra Cheese', 'Olives']);
        assert.equal(made.items[0].price, 500 + 70 + 50 + 65, 'today\'s price, not the old bill');
        assert.equal(made.pricing.subtotal, 500 + 70 + 50 + 65 + 200 * 3);
        assert.equal(made.deliveryAddress.street, ADDRESS.street);
        assert.match(made.note, /^Reorder of #/);
        const incoming = (await fx.call('GET', '/v1/food/store/orders?view=incoming', A.managerToken)).body.data;
        assert.ok(incoming.some((o) => String(o._id) === String(made._id)), 'in Incoming Orders');
        // a second click a moment later does not place it twice
        assert.equal((await fx.call('POST', R(old), A.managerToken, { lines: [{ index: 0, quantity: 1 }] })).status, 409);
        await Product.updateOne({ _id: pizza._id }, { $set: { 'sizes.1.price': 400 } });
    });

    test('the Completed Orders list names each line by its place, so the screen can send it', async () => {
        const old = await deliveredOrder();
        const list = (await fx.call('GET', '/v1/food/store/orders?view=completed', A.managerToken)).body.data;
        const row = list.find((o) => String(o._id) === String(old));
        assert.deepEqual(row.items.map((i) => [i.lineIndex, i.isReward]), [[0, false], [1, false]]);
    });

    test('bad requests: nothing chosen, unknown or repeated line, quantity out of range, an order not completed', async () => {
        const old = await deliveredOrder();
        for (const lines of [[], [{ index: 5, quantity: 1 }], [{ index: 0, quantity: 1 }, { index: 0, quantity: 1 }], [{ index: 0, quantity: 0 }], [{ index: 0, quantity: 21 }], [{ index: 0, quantity: 1.5 }]]) {
            assert.equal((await fx.call('POST', R(old), A.managerToken, { lines })).status, 400, JSON.stringify(lines));
        }
        await fx.models.FoodOrder.updateOne({ _id: old }, { $set: { orderStatus: 'preparing' } });
        assert.equal((await fx.call('POST', R(old), A.managerToken, { lines: [{ index: 0, quantity: 1 }] })).status, 400);
    });

    test('an item no longer sold is refused and no order is made', async () => {
        const old = await deliveredOrder();
        const before = await fx.models.FoodOrder.countDocuments({ userId: oid(A.customerId) });
        await Product.updateOne({ _id: pizza._id }, { $set: { status: 'Inactive' } });
        try {
            const res = await fx.call('POST', R(old), A.managerToken, { lines: [{ index: 1, quantity: 1 }] });
            assert.equal(res.status, 400, JSON.stringify(res.body));
            assert.equal(await fx.models.FoodOrder.countDocuments({ userId: oid(A.customerId) }), before);
        } finally {
            await Product.updateOne({ _id: pizza._id }, { $set: { status: 'Active' } });
        }
    });

    test('a free reward line and a train order cannot be repeated', async () => {
        const old = await deliveredOrder();
        await fx.models.FoodOrder.updateOne({ _id: old }, { $push: { items: { itemId: 'reward:abc', name: 'Garlic Bread (Reward)', price: 0, quantity: 1, kind: 'product' } } });
        const res = await fx.call('POST', R(old), A.managerToken, { lines: [{ index: 2, quantity: 1 }] });
        assert.equal(res.status, 400);
        assert.match(msg(res), /free reward/);
        await fx.models.FoodOrder.updateOne({ _id: old }, { $set: { orderMethod: 'train' } });
        assert.equal((await fx.call('POST', R(old), A.managerToken, { lines: [{ index: 0, quantity: 1 }] })).status, 400);
    });

    test('who: kitchen staff 403, another store 404, a blocked customer refused', async () => {
        const old = await deliveredOrder();
        const lines = [{ index: 1, quantity: 1 }];
        assert.equal((await fx.call('POST', R(old), chef.token, { lines })).status, 403);
        assert.equal((await fx.call('POST', R(old), B.managerToken, { lines })).status, 404);
        await fx.models.User.updateOne({ _id: A.customerId }, { $set: { isBlocked: true } });
        try {
            const res = await fx.call('POST', R(old), A.managerToken, { lines });
            assert.equal(res.status, 400);
            assert.match(msg(res), /blocked/);
        } finally {
            await fx.models.User.updateOne({ _id: A.customerId }, { $set: { isBlocked: false } });
        }
    });
});

describe('reorder: a saved line back into what the cart sends', () => {
    test('meal combo keeps each slot\'s choice, builder combo its pizzas, a product its picks; never a price', async () => {
        const { cartLineFrom } = await import('../src/modules/food/store/services/storeReorder.service.js');
        const meal = cartLineFrom({ itemId: 'c1', name: 'Party Combo', price: 499, comboType: 'meal', components: [
            { name: 'Coke', slot: 's1' }, { name: 'Garlic Dip', slot: '' }, { name: 'Paneer Pizza', slot: 's2', productId: 'p9' }] }, 2);
        assert.deepEqual([meal.quantity, meal.comboChoices, meal.price], [2, { s1: 'Coke', s2: 'Paneer Pizza' }, undefined]);
        const builder = cartLineFrom({ itemId: 'combo-offer-a-b', name: 'Pizza Combo', comboType: 'builder', components: [{ name: 'A', productId: 'a' }, { name: 'B', productId: 'b' }] }, 1);
        assert.deepEqual(builder.comboLines, [{ productId: 'a' }, { productId: 'b' }]);
        const product = cartLineFrom({ itemId: 'p1', name: 'Farmhouse', price: 999, size: 'Large', crust: 'Thin', selectedAddons: [
            { name: 'Thin', type: 'Crust' }, { name: 'Olives', type: 'Topping' }, { name: 'Coke', type: 'Beverage' }, { name: 'Extra Cheese', type: 'cheese' }] }, 1);
        assert.deepEqual([product.size, product.crust, product.toppings, product.meals, product.extraCheese, product.price], ['Large', 'Thin', ['Olives'], ['Coke'], true, undefined]);
    });
});
