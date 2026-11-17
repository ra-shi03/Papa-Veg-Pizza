// Orders the customer collects at the store (takeaway, in-car, dine-in, created methods): no delivery fee, no rider,
// the order goes to the store the customer chose, and the store hands it over to finish it.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A; let pizza; let FoodOrder;
const ok = (res, status = 200) => { assert.equal(res.status, status, JSON.stringify(res.body)); return res.body.data; };
const items = () => [{ itemId: String(pizza._id), name: 'Margherita', price: 200, quantity: 1, size: 'Regular', kind: 'product' }];
const place = (extra = {}) => fx.call('POST', '/v1/food/orders', A.customerToken, {
    items: items(), storeId: A.storeId, address: { label: 'Home', name: 'Asha', phone: '9812345678', street: '1 Test Street', city: 'Indore', state: 'MP' },
    customerName: 'Asha', customerPhone: '9812345678', paymentMethod: 'cash', ...extra,
});

before(async () => {
    fx = await createFixture(); A = fx.F.A;
    const { Product } = await import('../src/modules/food/admin/models/product.model.js');
    ({ FoodOrder } = await import('../src/modules/food/orders/models/order.model.js'));
    const { FoodFeeSettings } = await import('../src/modules/food/admin/models/feeSettings.model.js');
    pizza = await Product.create({ name: 'Margherita', categoryId: new mongoose.Types.ObjectId(), status: 'Active', sizes: [{ size: 'Regular', price: 200 }], basePrice: 200, price: 200 });
    await FoodFeeSettings.create({ deliveryFee: 40, gstRate: 5, isActive: true });
});
after(async () => { await fx?.teardown(); });

describe('pickup orders', () => {
    test('the quote and the order carry no delivery fee for a pickup method; delivery still pays it', async () => {
        const quote = (orderMethod) => fx.call('POST', '/v1/food/orders/calculate', A.customerToken, { storeId: A.storeId, items: items(), ...(orderMethod ? { orderMethod } : {}) });
        assert.equal(ok(await quote()).pricing.deliveryFee, 40);
        assert.equal(ok(await quote('takeaway')).pricing.deliveryFee, 0);
        assert.equal(ok(await quote('incar')).pricing.deliveryFee, 0);
        const d = ok(await place(), 201).order;
        assert.equal(d.pricing.deliveryFee, 40);
        assert.equal(d.isPickup, false);
    });

    test('takeaway: placed at the chosen store, address is the store, flagged as pickup, fee is zero', async () => {
        const o = ok(await place({ orderMethod: 'takeaway' }), 201).order;
        assert.equal(o.orderMethod, 'takeaway');
        assert.equal(o.isPickup, true);
        assert.equal(o.pricing.deliveryFee, 0);
        assert.match(o.deliveryAddress.street, /^Collect at /);
        assert.equal(String(o.storeId?._id || o.storeId), A.storeId);
    });

    test('no rider is dispatched for it and the store cannot assign one', async () => {
        ok(await fx.call('PUT', '/v1/settings/order-methods', fx.SA, { methods: [{ id: 'dinein', enabled: true, scope: 'all' }] }));
        const o = ok(await place({ orderMethod: 'dinein' }), 201).order;
        const dispatch = await import('../src/modules/food/orders/services/order-dispatch.service.js');
        await FoodOrder.updateOne({ _id: o._id }, { $set: { orderStatus: 'confirmed' } });
        assert.equal(await dispatch.tryAutoAssign(o._id), null);
        const fresh = await FoodOrder.findById(o._id).lean();
        assert.equal(fresh.dispatch.status, 'unassigned');
        const rider = await fx.partner();
        const res = await fx.call('POST', '/v1/store/delivery/assign', A.managerToken, { orderId: String(o._id), riderId: String(rider.id) });
        assert.equal(res.status, 400, JSON.stringify(res.body));
        assert.match(res.body.message || res.body.error, /collected at the store/);
    });

    test('Ready Orders lists it as collect; the store hands it over and it is delivered', async () => {
        const o = ok(await place({ orderMethod: 'incar' }), 201).order;
        await FoodOrder.updateOne({ _id: o._id }, { $set: { orderStatus: 'ready_for_pickup' } });
        const list = ok(await fx.call('GET', '/v1/store/orders/ready', A.managerToken));
        const row = (Array.isArray(list) ? list : list.orders || []).find((r) => r._id === String(o._id));
        assert.equal(row.isPickup, true);
        assert.equal(row.deliveryStatus, 'collect');
        const done = ok(await fx.call('PATCH', `/v1/store/orders/${o._id}/pickup`, A.managerToken, {}));
        assert.equal(done.orderStatus, 'delivered');
        const fresh = await FoodOrder.findById(o._id).lean();
        assert.equal(fresh.orderStatus, 'delivered');
        assert.ok(fresh.deliveryState.deliveredAt);
        assert.equal((await fx.call('PATCH', `/v1/store/orders/${o._id}/pickup`, A.managerToken, {})).status, 400, 'only once');
    });

    test('riders never see a pickup order in their feed', async () => {
        const o = ok(await place({ orderMethod: 'takeaway' }), 201).order;
        await FoodOrder.updateOne({ _id: o._id }, { $set: { orderStatus: 'confirmed' } });
        const rider = await fx.partner();
        const res = await fx.call('GET', '/v1/food/delivery/orders/available', rider.token);
        const text = JSON.stringify(res.body);
        assert.ok(!text.includes(String(o._id)));
    });
});

describe('store panel rows', () => {
    test('the ops list says pickup for a collected order and delivery for the rest', async () => {
        const pick = ok(await place({ orderMethod: 'takeaway' }), 201).order;
        const del = ok(await place(), 201).order;
        const list = ok(await fx.call('GET', '/v1/food/store/orders?view=incoming', A.managerToken));
        const rows = Array.isArray(list) ? list : list.orders || [];
        const by = Object.fromEntries(rows.map((r) => [r._id, r]));
        assert.equal(by[String(pick._id)]?.orderType, 'pickup');
        assert.equal(by[String(del._id)]?.orderType, 'delivery');
    });

    test('slots can be listed for the chosen pickup store', async () => {
        const res = await fx.call('GET', `/v1/food/stores/slots?storeId=${A.storeId}`, null);
        assert.equal(ok(res).storeId, A.storeId);
        assert.equal((await fx.call('GET', '/v1/food/stores/slots?storeId=not-an-id', null)).status, 400);
    });
});

describe('store panel: method label and type filter', () => {
    test('rows carry the method name, and the type and method filters narrow the list', async () => {
        const pick = ok(await place({ orderMethod: 'incar' }), 201).order;
        const del = ok(await place(), 201).order;
        const get = async (qs) => {
            const list = ok(await fx.call('GET', `/v1/food/store/orders?view=incoming${qs}`, A.managerToken));
            return Array.isArray(list) ? list : list.orders || [];
        };
        const all = await get('');
        assert.equal(all.find((r) => r._id === String(pick._id)).orderMethodLabel, 'In-Car');
        assert.equal(all.find((r) => r._id === String(del._id)).orderMethodLabel, 'Delivery');
        assert.ok(all[0].storeName && 'storeAddress' in all[0], 'rows carry the store details for receipts');
        assert.equal(all.find((r) => r._id === String(del._id)).subtotal, 200);
        const onlyPickup = await get('&orderType=pickup');
        assert.ok(onlyPickup.length && onlyPickup.every((r) => r.orderType === 'pickup'));
        const onlyDelivery = await get('&orderType=delivery');
        assert.ok(onlyDelivery.length && onlyDelivery.every((r) => r.orderType === 'delivery'));
        const incar = await get('&orderMethod=incar');
        assert.ok(incar.length && incar.every((r) => r.orderMethod === 'incar'));
    });
});
