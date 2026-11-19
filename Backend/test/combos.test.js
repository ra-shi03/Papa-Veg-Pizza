// Combos, from the customer's cart to the stored order line.
//
//   Combo Builder combo ("pick 2 pizzas"): the app sends which pizzas; the server prices them from the combo page settings
//                         (size + discount) and ignores any price the app sends
//   Meal combo (made by the super admin): the combo's own price; the customer's choices (drink, pizza) are checked
//   Both: the order line records what is inside (components): the pizzas the kitchen makes, and the dips / drinks packed
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A;
let p1; let p2; let p3; let outOfScope; let ComboPage; let combo; let inactive;
const CATEGORY = new mongoose.Types.ObjectId();
const ADDRESS = { street: '1 Test Street', city: 'Indore', state: 'MP' };

before(async () => {
    fx = await createFixture(); A = fx.F.A;
    const { Product } = await import('../src/modules/food/admin/models/product.model.js');
    const { FoodCombo } = await import('../src/modules/food/admin/models/combo.model.js');
    ({ ComboPage } = await import('../src/modules/food/settings/models/comboPage.model.js'));
    const mk = (name, medium, extra = {}) => Product.create({ name, categoryId: CATEGORY, status: 'Active', sizes: [{ size: 'Medium', price: medium }, { size: 'Large', price: medium + 100 }], price: medium, ...extra });
    p1 = await mk('Classic Margherita', 300);
    p2 = await mk('Paneer Tikka', 350);
    p3 = await mk('Farm Veggie', 400);
    outOfScope = await Product.create({ name: 'Small Only Pizza', categoryId: CATEGORY, status: 'Active', sizes: [{ size: 'Small', price: 100 }], price: 100 });
    await ComboPage.create({ isActive: true, offerName: '1 PLUS 1 Offer', slotCount: 2, sizeName: 'Medium', discountType: 'flat', discountValue: 60, eligibleProductIds: [p1._id, p2._id, p3._id] });
    combo = await FoodCombo.create({
        name: 'Double Veg Pizza Meal', price: 149, status: 'active',
        items: [
            { name: 'Wow Pizza', quantity: 1, choices: [{ name: 'Corn Paneer', productId: p1._id, size: 'Regular' }, { name: 'Jalapeno Corn', productId: p2._id, size: 'Regular' }] },
            { name: 'Chatpati Chilli Dip', quantity: 1 },
            { name: '3 Potato Crispies', quantity: 1 },
            { name: 'Drink', quantity: 1, choices: [{ name: 'Coke' }, { name: 'Lahori Jeera' }] },
        ],
    });
    inactive = await FoodCombo.create({ name: 'Old Meal', price: 99, status: 'inactive', items: [{ name: 'Coke', quantity: 1 }] });
});
after(async () => { await fx?.teardown(); });

const place = (items, token = A.customerToken) => fx.call('POST', '/v1/food/orders', token, { items, address: ADDRESS, storeId: A.storeId, paymentMethod: 'cash', pricing: { subtotal: 1, total: 1 } });
const stored = async (res) => (await fx.models.FoodOrder.findById(res.body.data.order._id).lean());
const builder = (products, over = {}) => ({ itemId: 'combo-offer-whatever', name: 'Pizza Combo', price: 1, quantity: 1, size: '', kind: 'product', comboLines: products.map((p) => ({ productId: String(p._id) })), ...over });
const meal = (over = {}) => ({ itemId: String(combo._id), name: 'x', price: 1, quantity: 1, size: '', kind: 'product', ...over });
const slot = (name) => String(combo.items.find((i) => i.name === name)._id);

describe('Combo Builder combo', () => {
    test('is priced on the server from the combo settings: each pizza at the configured size minus the combo discount', async () => {
        const res = await place([builder([p1, p2], { price: 1 })]);   // the app claims Rs 1
        assert.equal(res.status, 201, JSON.stringify(res.body));
        const line = (await stored(res)).items[0];
        assert.equal(line.price, 530, '(300 - 60) + (350 - 60)');
        assert.equal(line.name, '1 PLUS 1 Offer');
        assert.equal(line.comboType, 'builder');
        assert.equal(line.itemId, `combo-offer-${p1._id}-${p2._id}`, 'the id is rebuilt by the server from the pizzas');
        assert.equal((await stored(res)).pricing.total, 530);
    });

    test('records what is inside: each pizza with size and crust, all made in the kitchen', async () => {
        const line = (await stored(await place([builder([p3, p1])]))).items[0];
        assert.deepEqual(line.components.map((c) => [c.name, c.size, c.kitchen, c.productId, c.quantity]), [
            ['Farm Veggie', 'Medium', true, String(p3._id), 1], ['Classic Margherita', 'Medium', true, String(p1._id), 1],
        ]);
        assert.match(line.notes, /Farm Veggie \(Medium\).*\+ Classic Margherita \(Medium\)/, 'the notes text is written by the server too');
    });

    test('the same pizza twice is allowed (2 of the same), and the quantity multiplies the price', async () => {
        const res = await place([builder([p1, p1], { quantity: 3 })]);
        assert.equal(res.status, 201);
        assert.equal((await stored(res)).pricing.total, 3 * 480);
    });

    test('refused: the wrong number of pizzas, a pizza that is not in the offer, an unknown id, an off switch', async () => {
        for (const lines of [[p1], [p1, p2, p3], [p1, outOfScope]]) {
            const res = await place([builder(lines)]);
            assert.equal(res.status, 400, lines.length + ' pizzas');
            assert.match(JSON.stringify(res.body), /build it again|no longer available/i);
        }
        assert.equal((await place([builder([{ _id: new mongoose.Types.ObjectId() }, p1])])).status, 400);
        await ComboPage.updateOne({}, { $set: { isActive: false } });
        const off = await place([builder([p1, p2])]);
        assert.equal(off.status, 400);
        assert.match(JSON.stringify(off.body), /not available/i);
        await ComboPage.updateOne({}, { $set: { isActive: true } });
        assert.equal((await place([builder([p1, p2])])).status, 201);
    });

    test('a change in the discount applies to the next order, never to an app that still shows the old price', async () => {
        await ComboPage.updateOne({}, { $set: { discountValue: 100 } });
        const res = await place([builder([p1, p2], { price: 530 })]);
        assert.equal((await stored(res)).items[0].price, 450, '(300 - 100) + (350 - 100)');
        await ComboPage.updateOne({}, { $set: { discountValue: 60 } });
    });

    test('the builder page and checkout agree on every price', async () => {
        const page = (await fx.call('GET', '/v1/settings/combo-page/build', A.customerToken)).body.data;
        const options = Object.fromEntries(page.options.map((o) => [o.id, o.finalPrice]));
        const res = await place([builder([p2, p3])]);
        assert.equal((await stored(res)).items[0].price, options[String(p2._id)] + options[String(p3._id)]);
    });
});

describe('meal combo', () => {
    test('is the combo\'s own price; with no choice sent, the first option of each slot (what the menu shows)', async () => {
        const res = await place([meal({ quantity: 2, price: 1 })]);
        assert.equal(res.status, 201, JSON.stringify(res.body));
        const o = await stored(res);
        assert.equal(o.items[0].price, 149);
        assert.equal(o.pricing.total, 298);
        assert.equal(o.items[0].name, 'Double Veg Pizza Meal');
        assert.equal(o.items[0].comboType, 'meal');
        assert.deepEqual(o.items[0].components.map((c) => [c.label, c.name, c.kitchen]), [
            ['Wow Pizza', 'Corn Paneer', true], ['', 'Chatpati Chilli Dip', false], ['', '3 Potato Crispies', false], ['Drink', 'Coke', false],
        ]);
    });

    test('the customer\'s choices are stored: the pizza and the drink', async () => {
        const res = await place([meal({ comboChoices: { [slot('Wow Pizza')]: 'Jalapeno Corn', [slot('Drink')]: 'Lahori Jeera' } })]);
        const line = (await stored(res)).items[0];
        const parts = Object.fromEntries(line.components.map((c) => [c.label || c.name, c]));
        assert.equal(parts['Wow Pizza'].name, 'Jalapeno Corn');
        assert.equal(parts['Wow Pizza'].productId, String(p2._id));
        assert.equal(parts['Wow Pizza'].slot, slot('Wow Pizza'), 'kept so the same meal can be ordered again');
        assert.equal(parts['Drink'].name, 'Lahori Jeera');
        assert.equal(parts['Drink'].kitchen, false, 'a drink is packed, not made');
        assert.equal(line.notes, 'Wow Pizza: Jalapeno Corn (Regular) + Chatpati Chilli Dip + 3 Potato Crispies + Drink: Lahori Jeera');
    });

    test('an option the combo does not have is refused', async () => {
        const res = await place([meal({ comboChoices: { [slot('Drink')]: 'Red Bull' } })]);
        assert.equal(res.status, 400);
        assert.match(JSON.stringify(res.body), /Red Bull/);
    });

    test('a deactivated combo is "no longer available", as before', async () => {
        const res = await place([{ itemId: String(inactive._id), name: 'Old Meal', price: 99, quantity: 1, size: '', kind: 'product' }]);
        assert.equal(res.status, 400);
        assert.match(JSON.stringify(res.body), /no longer available/i);
    });

    test('what the app sends for the contents is never trusted: notes and price are the server\'s', async () => {
        const res = await place([meal({ notes: 'FREE PIZZA x10', comboLines: undefined })]);
        const line = (await stored(res)).items[0];
        assert.doesNotMatch(line.notes, /FREE/);
        assert.equal(line.price, 149);
    });
});

describe('what the customer reads back (for "order again")', () => {
    test('the order carries the components and the type, and a plain item carries none', async () => {
        const res = await place([builder([p1, p2]), { itemId: String(p1._id), name: 'Classic Margherita', price: 300, quantity: 1, size: 'Medium', kind: 'product' }]);
        assert.equal(res.status, 201, JSON.stringify(res.body));
        const read = await fx.call('GET', `/v1/food/orders/${res.body.data.order._id}`, A.customerToken);
        assert.equal(read.status, 200, JSON.stringify(read.body).slice(0, 200));
        const items = (read.body.data.order || read.body.data).items;
        assert.equal(items[0].comboType, 'builder');
        assert.equal(items[0].components.length, 2);
        assert.equal(items[0].components[0].productId, String(p1._id));
        assert.ok(!items[1].components?.length, 'a normal line has no components');
    });
});
