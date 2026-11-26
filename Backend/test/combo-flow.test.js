// A combo order, from the customer's cart all the way to the door:
//   customer places a Combo Builder combo and a meal combo -> the store sees what is inside -> the kitchen gets one card per
//   pizza (dips and drinks go to the packer) -> packaging -> a rider is assigned, picks up and delivers.
// At every leg the contents of the combo must be there for the person doing that job.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose, PASSWORD } from './helpers/fixture.js';

let fx; let A;
let chef; let baker; let packer; let rider; let p1; let p2; let combo; let KitchenItem;
let phoneSeq = 0;
const ADDRESS = { street: '1 Test Street', city: 'Indore', state: 'MP' };

// kitchen staff have no login: the store manager adds them, the franchise admin approves, the manager clocks them in and
// works the stations for them (fx.staff)
const makeStaff = (role, tag) => fx.staff('A', role, tag);

before(async () => {
    fx = await createFixture(); A = fx.F.A;
    const { Product } = await import('../src/modules/food/admin/models/product.model.js');
    const { FoodCombo } = await import('../src/modules/food/admin/models/combo.model.js');
    const { ComboPage } = await import('../src/modules/food/settings/models/comboPage.model.js');
    ({ KitchenItem } = await import('../src/modules/food/store/models/kitchenItem.model.js'));
    const cat = new mongoose.Types.ObjectId();
    p1 = await Product.create({ name: 'Classic Margherita', categoryId: cat, status: 'Active', sizes: [{ size: 'Medium', price: 300 }], price: 300 });
    p2 = await Product.create({ name: 'Paneer Tikka', categoryId: cat, status: 'Active', sizes: [{ size: 'Medium', price: 350 }], price: 350 });
    await ComboPage.create({ isActive: true, offerName: '1 PLUS 1 Offer', slotCount: 2, sizeName: 'Medium', discountType: 'flat', discountValue: 60, eligibleProductIds: [p1._id, p2._id] });
    combo = await FoodCombo.create({ name: 'Double Veg Pizza Meal', price: 149, status: 'active', items: [
        { name: 'Wow Pizza', quantity: 1, choices: [{ name: 'Corn Paneer', productId: p1._id, size: 'Regular' }] },
        { name: 'Chatpati Chilli Dip', quantity: 1 },
        { name: 'Drink', quantity: 1, choices: [{ name: 'Coke' }, { name: 'Lahori Jeera' }] },
    ] });
    chef = await makeStaff('Pizza Maker', 'cfchef');
    baker = await makeStaff('Baker', 'cfbaker');
    packer = await makeStaff('Packager', 'cfpacker');
    rider = await fx.partner();
    await mongoose.connection.collection('food_delivery_partners').updateMany({ _id: new mongoose.Types.ObjectId(rider.id) }, { $set: { storeId: new mongoose.Types.ObjectId(A.storeId), franchiseId: new mongoose.Types.ObjectId(A.franchiseId) } });
});
after(async () => { await fx?.teardown(); });

const S = '/v1/food/store';
const placeOrder = async (items) => {
    const res = await fx.call('POST', '/v1/food/orders', A.customerToken, { items, address: ADDRESS, storeId: A.storeId, paymentMethod: 'cash' });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    return String(res.body.data.order._id);
};
const builderLine = (over = {}) => ({ itemId: 'combo-offer-x', name: 'Pizza Combo', price: 1, quantity: 2, size: '', kind: 'product', comboLines: [{ productId: String(p1._id) }, { productId: String(p2._id) }], ...over });
const mealLine = { itemId: '', name: 'x', price: 1, quantity: 1, size: '', kind: 'product' };

describe('a combo order, leg by leg', () => {
    let id;
    test('1 customer: a builder combo x2 and a meal combo are placed and priced by the server', async () => {
        id = await placeOrder([builderLine(), { ...mealLine, itemId: String(combo._id), comboChoices: { [String(combo.items[2]._id)]: 'Lahori Jeera' } }]);
        const o = await fx.models.FoodOrder.findById(id).lean();
        assert.equal(o.pricing.subtotal, 2 * 530 + 149, '2 x ((300-60)+(350-60)) + 149');
        assert.equal(o.items.length, 2);
        assert.deepEqual(o.items.map((i) => i.comboType), ['builder', 'meal']);
    });

    test('2 store: the new order lists both combos with their contents', async () => {
        const list = await fx.call('GET', `${S}/orders?view=incoming`, A.managerToken);
        assert.equal(list.status, 200, JSON.stringify(list.body).slice(0, 200));
        const mine = (list.body.data.orders || list.body.data).find((o) => JSON.stringify(o).includes('1 PLUS 1 Offer'));
        assert.ok(mine, 'the order is in the store list');
        const [b, m] = mine.items;
        assert.equal(b.comboType, 'builder');
        assert.deepEqual(b.components.map((c) => c.name), ['Classic Margherita', 'Paneer Tikka']);
        assert.deepEqual(m.components.map((c) => [c.name, c.kitchen]), [['Corn Paneer', true], ['Chatpati Chilli Dip', false], ['Lahori Jeera', false]]);
    });

    test('3 store accepts it and the manager assigns the team', async () => {
        assert.equal((await fx.call('PATCH', `${S}/orders/${id}/accept`, A.managerToken, { estimatedPreparationTime: 15 })).status, 200);
        for (const [who, role] of [[chef, 'pizza_chef'], [baker, 'baking_chef'], [packer, 'packaging_staff']]) {
            const r = await fx.call('PATCH', `${S}/orders/${id}/assign-staff`, A.managerToken, { staffId: who.id, role });
            assert.equal(r.status, 200, JSON.stringify(r.body));
        }
    });

    test('4 kitchen: one card per pizza (2 + 1), none for the dip or the drink; the board shows them', async () => {
        const board = (await fx.call('GET', `${S}/kitchen/preparation-board`, A.managerToken)).body.data;
        const mine = await KitchenItem.find({ orderId: id }).sort({ index: 1 }).lean();
        assert.deepEqual(mine.map((r) => [r.name, r.quantity, r.comboName]), [
            ['Classic Margherita', 2, '1 PLUS 1 Offer'], ['Paneer Tikka', 2, '1 PLUS 1 Offer'], ['Corn Paneer', 1, 'Double Veg Pizza Meal'],
        ]);
        assert.ok(board.length >= 3, 'the preparation board has the cards');
    });

    test('5 packaging: the packer sees the combos with the dip and the drink to put in the bag', async () => {
        for (const s of ['preparing', 'baking', 'packaging']) assert.equal((await fx.call('PATCH', `${S}/orders/${id}/stage`, A.managerToken, { stage: s })).status, 200, s);
        const pack = await fx.call('GET', `${S}/kitchen/packaging`, A.managerToken);
        assert.equal(pack.status, 200);
        const row = JSON.stringify(pack.body).includes('Chatpati Chilli Dip');
        assert.ok(row, 'the packaging list has the dip and the drink');
        assert.match(JSON.stringify(pack.body), /Lahori Jeera/);
    });

    test('6 delivery: the store hands over, the rider sees the order with its contents, picks up and delivers', async () => {
        assert.equal((await fx.call('PATCH', `${S}/orders/${id}/stage`, A.managerToken, { stage: 'ready' })).status, 200, 'the manager marks it ready for the packer');
        assert.equal((await fx.call('POST', '/v1/store/delivery/assign', A.managerToken, { orderId: id, riderId: rider.id })).status, 200);
        const R = (p) => `/v1/food/delivery/orders/${p}`;
        assert.equal((await fx.call('PATCH', R(`${id}/accept`), rider.token, {})).status, 200);
        // what the rider's app reads for this order carries the combo lines and what is in them
        const read = await fx.call('GET', R(id), rider.token);
        assert.equal(read.status, 200, JSON.stringify(read.body).slice(0, 200));
        const body = JSON.stringify(read.body);
        assert.match(body, /1 PLUS 1 Offer/);
        assert.match(body, /Classic Margherita/);
        assert.match(body, /Lahori Jeera/);
        assert.equal((await fx.call('PATCH', R(`${id}/reached-pickup`), rider.token, {})).status, 200);
        assert.equal((await fx.call('PATCH', R(`${id}/confirm-pickup`), rider.token, { confirmedOrderId: id, billImageUrl: 'https://img.test/bill.jpg' })).status, 200);
        assert.equal((await fx.call('PATCH', R(`${id}/reached-drop`), rider.token, {})).status, 200);
        const otp = String((await fx.call('GET', `/v1/food/orders/${id}`, A.customerToken)).body.data.order.handoverOtp);
        const done = await fx.call('PATCH', R(`${id}/complete`), rider.token, { otp, paymentMethod: 'cash', handoverPhotoUrl: 'https://example.com/proof.jpg' });
        assert.equal(done.status, 200, JSON.stringify(done.body));
        assert.equal((await fx.models.FoodOrder.findById(id).lean()).orderStatus, 'delivered');
    });

    test('7 customer: the delivered order still shows what was in each combo (for "order again")', async () => {
        const o = (await fx.call('GET', `/v1/food/orders/${id}`, A.customerToken)).body.data.order;
        assert.equal(o.items[0].components.length, 2);
        assert.equal(o.items[1].components.find((c) => c.label === 'Drink').name, 'Lahori Jeera');
    });
});
