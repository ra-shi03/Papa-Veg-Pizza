// Bulk orders: the customer picks a store and takeaway or delivery, the store confirms, prepares and hands over, the customer
// follows it and gets an email at each step, and the super admin and franchise admin only view.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture } from './helpers/fixture.js';

let fx; let A; let B; let BulkOrderInquiry; let emails; let pizza; let items;
const PUBLIC = '/v1/food/bulk-order/inquiry';
const ok = (res, status = 200) => { assert.equal(res.status, status, JSON.stringify(res.body)); return res.body.data; };
const form = (extra = {}) => ({ items, name: 'Ravi Kumar', phone: '98123 45678', email: 'ravi@example.com', type: 'virtual_party', fulfilment: 'takeaway', storeId: A.storeId, eventDate: '2026-12-20', partySize: 'Corporate Gathering (20-50 people)', query: '40 pizzas please', ...extra });
const place = (extra, token = A.customerToken) => fx.call('POST', PUBLIC, token, form(extra));
const store = (path, method = 'GET', body, token = A.managerToken) => fx.call(method, `/v1/food/store/bulk-orders${path}`, token, body);

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    ({ BulkOrderInquiry } = await import('../src/modules/food/orders/models/bulkOrderInquiry.model.js'));
    const { Product } = await import('../src/modules/food/admin/models/product.model.js');
    const mongoose = (await import('./helpers/fixture.js')).mongoose;
    pizza = await Product.create({ name: 'Farmhouse', categoryId: new mongoose.Types.ObjectId(), status: 'Active', sizes: [{ size: 'Medium', price: 300 }, { size: 'Large', price: 450 }], basePrice: 300, price: 300 });
    items = [{ itemId: String(pizza._id), size: 'Large', quantity: 40 }];
    const { setEmailSenderForTests } = await import('../src/utils/email.js');
    emails = [];
    setEmailSenderForTests(async (mail) => { emails.push(mail); return true; });
});
after(async () => { await fx?.teardown(); });

describe('placing a bulk order', () => {
    test('needs real details: name, 10-digit phone, email, a store and (for delivery) an address', async () => {
        const bad = async (extra, re) => { const r = await place(extra); assert.equal(r.status, 400, JSON.stringify(extra)); assert.match(r.body.message || r.body.error, re); };
        await bad({ email: 'not-an-email' }, /email/i);
        await bad({ phone: '1' }, /10-digit/);
        await bad({ name: '' }, /name/i);
        await bad({ storeId: undefined }, /store/i);
        await bad({ storeId: '6afc00000000000000000000' }, /not taking orders/);
        await bad({ fulfilment: 'delivery' }, /address/i);
        await bad({ type: 'hacked' }, /./);
        await bad({ items: [] }, /at least one item/i);
        await bad({ items: [{ itemId: String(pizza._id), size: 'Large', quantity: 0 }] }, /at least 1/);
        await bad({ items: [{ itemId: String(pizza._id), size: 'Large', quantity: 9999 }] }, /too many/i);
        await bad({ items: [{ itemId: '6afc00000000000000000001', quantity: 2 }] }, /./);
        await bad({ items: [{ itemId: String(pizza._id), size: 'Huge', quantity: 2 }] }, /not sold in size/);
        assert.equal((await place({ name: { $gt: '' } })).status, 400, 'an object is not a name');
        assert.equal(await BulkOrderInquiry.countDocuments({ email: 'not-an-email' }), 0);
    });

    test('a takeaway order gets a reference, is linked to the customer and the customer is emailed', async () => {
        const o = ok(await place(), 201);
        await new Promise((r) => setTimeout(r, 200)); // the email goes out after the answer
        assert.match(o.reference, /^BO-\d{6}$/);
        assert.equal(o.status, 'new');
        assert.equal(o.fulfilment, 'takeaway');
        assert.equal(o.phone, '9812345678');
        assert.equal(o.storeId, A.storeId);
        const mail = emails.find((m) => /new|received/i.test(m.subject) && m.to === 'ravi@example.com');
        assert.ok(mail && mail.text.includes(o.reference));
    });

    test('the items are priced at the store\'s prices, the client\'s prices are ignored, and the same item is added up', async () => {
        const o = ok(await place({ items: [{ itemId: String(pizza._id), size: 'Large', quantity: 10, price: 1 }, { itemId: String(pizza._id), size: 'Large', quantity: 30 }, { itemId: String(pizza._id), size: 'Medium', quantity: 2 }] }), 201);
        assert.deepEqual(o.items.map((i) => [i.name, i.size, i.price, i.quantity]), [['Farmhouse', 'Large', 450, 40], ['Farmhouse', 'Medium', 300, 2]]);
        assert.equal(o.estimatedTotal, 40 * 450 + 2 * 300);
    });

    test('a delivery order keeps its address', async () => {
        const o = ok(await place({ fulfilment: 'delivery', address: { street: '12 MG Road', city: 'Indore', state: 'MP', pincode: '452001', landmark: 'Near the park' } }), 201);
        assert.equal(o.fulfilment, 'delivery');
        assert.equal(o.address.street, '12 MG Road');
        assert.equal(o.address.pincode, '452001');
    });

    test('a store bulk order needs a signed-in customer (it becomes a real order); a payment method must be cod or online', async () => {
        const guest = await fx.call('POST', PUBLIC, null, form({ email: 'guest@example.com' }));
        assert.equal(guest.status, 400);
        assert.match(guest.body.message || guest.body.error, /sign in/i);
        assert.equal((await place({ paymentMethod: 'cheque' })).status, 400);
    });

    test('an e-gift voucher inquiry needs no store and stays with the super admin', async () => {
        const o = ok(await fx.call('POST', PUBLIC, null, { name: 'Corp Buyer', phone: '9812345670', email: 'corp@example.com', type: 'egift_voucher', partySize: '100 - 500 Vouchers' }), 201);
        assert.equal(o.storeId, null);
    });
});

describe('the customer follows it', () => {
    test('sees only their own bulk orders, with store, status and history', async () => {
        const mine = ok(await fx.call('GET', '/v1/food/user/bulk-orders', A.customerToken)).orders;
        assert.ok(mine.length >= 2 && mine.every((o) => o.reference));
        assert.ok(mine[0].storeName);
        assert.deepEqual(ok(await fx.call('GET', '/v1/food/user/bulk-orders', B.customerToken)).orders, []);
        assert.equal((await fx.call('GET', `/v1/food/user/bulk-orders/${mine[0].id}`, B.customerToken)).status, 404);
        assert.equal((await fx.call('GET', '/v1/food/user/bulk-orders', null)).status, 401);
    });

    test('can cancel a request the store has not confirmed, once', async () => {
        const o = ok(await place({ query: 'to cancel' }), 201);
        ok(await fx.call('POST', `/v1/food/user/bulk-orders/${o.id}/cancel`, A.customerToken, {}));
        assert.equal((await fx.call('POST', `/v1/food/user/bulk-orders/${o.id}/cancel`, A.customerToken, {})).status, 400);
        assert.equal((await fx.call('POST', `/v1/food/user/bulk-orders/${o.id}/cancel`, B.customerToken, {})).status, 400, 'not another customer\'s');
    });
});

describe('the store handles it', () => {
    let id; let ref;
    before(async () => { const o = ok(await place({ query: 'for the store' }), 201); id = o.id; ref = o.reference; });

    test('only the store manager of that store sees it', async () => {
        const list = ok(await store('')).orders;
        assert.ok(list.some((o) => o.id === id));
        assert.ok(!ok(await store('', 'GET', undefined, B.managerToken)).orders.some((o) => o.id === id));
        assert.equal((await store(`/${id}`, 'GET', undefined, B.managerToken)).status, 404);
        assert.equal((await store('', 'GET', undefined, A.customerToken)).status, 403);
        assert.equal((await store('', 'GET', undefined, A.adminToken)).status, 403);
    });

    test('the type and search filters narrow the list', async () => {
        assert.ok(ok(await store('?status=new')).orders.every((o) => o.status === 'new'));
        assert.ok(ok(await store(`?search=${ref}`)).orders.every((o) => o.reference === ref));
    });

    test('steps must be in order; a decline needs a reason', async () => {
        assert.equal((await store(`/${id}/status`, 'POST', { status: 'preparing' })).status, 400, 'not confirmed yet');
        assert.equal((await store(`/${id}/reject`, 'POST', {})).status, 400);
    });

    test('confirm with an amount and note: the customer is emailed', async () => {
        const o = ok(await store(`/${id}/confirm`, 'POST', { quotedAmount: 12500, note: 'Ready by 6 pm' })).order;
        assert.equal(o.status, 'confirmed');
        assert.equal(o.quotedAmount, 12500);
        assert.equal(o.estimatedTotal, 18000, 'the estimate from the items stays on record');
        assert.ok(emails.some((m) => /confirmed/i.test(m.subject) && m.text.includes('12,500')));
        assert.equal((await store(`/${id}/confirm`, 'POST', {})).status, 400, 'only once');
    });

    test('then preparing, ready, completed', async () => {
        for (const st of ['preparing', 'ready', 'completed']) assert.equal(ok(await store(`/${id}/status`, 'POST', { status: st })).order.status, st);
        const mine = ok(await fx.call('GET', `/v1/food/user/bulk-orders/${id}`, A.customerToken)).order;
        assert.deepEqual(mine.history.map((h) => h.status), ['new', 'confirmed', 'preparing', 'ready', 'completed']);
        assert.ok(emails.some((m) => /completed/i.test(m.subject)));
    });

    test('a decline gives the customer the reason; a confirmed order can be cancelled by the store with a reason', async () => {
        const o1 = ok(await place({ query: 'to decline' }), 201).id;
        ok(await store(`/${o1}/reject`, 'POST', { reason: 'We are fully booked that day' }));
        assert.ok(emails.some((m) => /declined/i.test(m.subject) && m.text.includes('fully booked')));
        const o2 = ok(await place({ query: 'to cancel by store' }), 201).id;
        ok(await store(`/${o2}/confirm`, 'POST', {}));
        assert.equal((await store(`/${o2}/cancel`, 'POST', {})).status, 400, 'reason required');
        assert.equal(ok(await store(`/${o2}/cancel`, 'POST', { reason: 'Oven broke down' })).order.status, 'cancelled');
    });
});

describe('confirming without an amount uses the items\' total', () => {
    test('quotedAmount defaults to the estimate', async () => {
        const o = ok(await place({ query: 'default amount' }), 201);
        const done = ok(await store(`/${o.id}/confirm`, 'POST', {})).order;
        assert.equal(done.quotedAmount, 18000);
    });
});

describe('super admin and franchise admin only view', () => {
    test('the super admin sees every bulk order with its store, but cannot change or delete a store\'s order', async () => {
        const list = ok(await fx.call('GET', '/v1/food/admin/bulk-orders', fx.SA)).inquiries;
        const mine = list.find((o) => o.storeName);
        assert.ok(mine && mine.reference && mine.fulfilment);
        assert.equal((await fx.call('PATCH', `/v1/food/admin/bulk-orders/${mine.id}/status`, fx.SA, { status: 'completed' })).status, 403);
        assert.equal((await fx.call('DELETE', `/v1/food/admin/bulk-orders/${mine.id}`, fx.SA)).status, 403);
    });

    test('the super admin still handles inquiries with no store, with a valid status only', async () => {
        const list = ok(await fx.call('GET', '/v1/food/admin/bulk-orders', fx.SA)).inquiries;
        const egift = list.find((o) => o.type === 'egift_voucher');
        assert.equal((await fx.call('PATCH', `/v1/food/admin/bulk-orders/${egift.id}/status`, fx.SA, { status: 'banana' })).status, 400);
        assert.equal(ok(await fx.call('PATCH', `/v1/food/admin/bulk-orders/${egift.id}/status`, fx.SA, { status: 'contacted', adminNotes: 'called' })).status, 'contacted');
    });

    test('a franchise admin sees only its own franchise\'s orders, and nothing to act on', async () => {
        const a = ok(await fx.call('GET', '/v1/food/franchise/bulk-orders', A.adminToken)).orders;
        assert.ok(a.length > 0 && a.every((o) => o.storeId === A.storeId));
        assert.deepEqual(ok(await fx.call('GET', '/v1/food/franchise/bulk-orders', B.adminToken)).orders, []);
        assert.equal((await fx.call('GET', '/v1/food/franchise/bulk-orders', A.managerToken)).status, 403);
        assert.equal((await fx.call('POST', `/v1/food/franchise/bulk-orders/${a[0].id}/confirm`, A.adminToken, {})).status, 404, 'no action routes');
    });
});


describe('a delivery bulk order runs on the rider system', () => {
    let o; let orderDoc; let rider; let FoodOrder;
    const delivery = (extra = {}) => place({ fulfilment: 'delivery', address: { street: '12 MG Road', city: 'Indore', state: 'MP', pincode: '452001', lat: 22.72, lng: 75.86 }, ...extra });
    const mine = async (id) => ok(await fx.call('GET', `/v1/food/user/bulk-orders/${id}`, A.customerToken)).order;
    const setOrder = (patch) => FoodOrder.updateOne({ _id: orderDoc._id }, { $set: patch });

    before(async () => {
        ({ FoodOrder } = await import('../src/modules/food/orders/models/order.model.js'));
        const { default: mongoose } = await import('mongoose');
        const _id = new mongoose.Types.ObjectId();
        await mongoose.connection.collection('food_delivery_partners').insertOne({
            _id, name: 'Test Rider', phone: '9811100099', status: 'approved', availabilityStatus: 'online', storeId: new mongoose.Types.ObjectId(A.storeId), createdAt: new Date(), updatedAt: new Date(),
        });
        rider = String(_id);
        o = ok(await delivery(), 201);
    });

    test('confirming makes a real delivery order with the agreed amount, to be paid in cash', async () => {
        const c = ok(await store(`/${o.id}/confirm`, 'POST', { quotedAmount: 15000 })).order;
        assert.ok(c.orderId);
        orderDoc = await FoodOrder.findById(c.orderId).lean();
        assert.equal(orderDoc.orderMethod, 'delivery');
        assert.equal(orderDoc.isPickup, false);
        assert.equal(orderDoc.pricing.total, 15000);
        assert.equal(orderDoc.payment.method, 'cash');
        assert.deepEqual(orderDoc.deliveryAddress.location.coordinates, [75.86, 22.72]);
        assert.equal(c.paymentStatus, 'pending');
        assert.equal(c.paymentMethod, 'cod');
    });

    test('it cannot be marked ready without a delivery partner, and the store cannot complete it by hand', async () => {
        ok(await store(`/${o.id}/status`, 'POST', { status: 'preparing' }));
        const r = await store(`/${o.id}/status`, 'POST', { status: 'ready' });
        assert.equal(r.status, 400);
        assert.match(r.body.message || r.body.error, /delivery partner/i);
        assert.equal((await store(`/${o.id}/status`, 'POST', { status: 'completed' })).status, 400);
    });

    test('the store sees its riders, assigns one, and the customer sees the rider', async () => {
        const riders = ok(await store(`/${o.id}/riders`)).riders;
        assert.ok(riders.some((x) => x._id === rider));
        assert.equal((await store(`/${o.id}/riders`, 'GET', undefined, B.managerToken)).status, 404, 'another store');
        const a = ok(await store(`/${o.id}/assign-rider`, 'POST', { riderId: rider })).order;
        assert.equal(a.rider.name, 'Test Rider');
        assert.equal(ok(await store(`/${o.id}/status`, 'POST', { status: 'ready' })).order.status, 'ready');
        assert.equal((await mine(o.id)).rider.name, 'Test Rider');
    });

    test('the rider\'s steps move the bulk order, and a paid order shows as paid', async () => {
        await setOrder({ orderStatus: 'picked_up' });
        assert.equal((await mine(o.id)).status, 'out_for_delivery');
        await setOrder({ orderStatus: 'delivered', 'payment.status': 'paid' });
        const done = await mine(o.id);
        assert.equal(done.status, 'completed');
        assert.equal(done.paymentStatus, 'paid');
        assert.ok(emails.some((m) => /out for delivery/i.test(m.subject)));
        assert.ok(emails.some((m) => /completed/i.test(m.subject)));
    });

    test('someone else\'s store cannot assign a rider', async () => {
        const o2 = ok(await delivery({ query: 'other' }), 201);
        ok(await store(`/${o2.id}/confirm`, 'POST', {}));
        assert.equal((await store(`/${o2.id}/assign-rider`, 'POST', { riderId: rider }, B.managerToken)).status, 404);
    });
});

describe('paying online', () => {
    let o; let orderDoc; let FoodOrder;
    before(async () => {
        ({ FoodOrder } = await import('../src/modules/food/orders/models/order.model.js'));
        o = ok(await place({ paymentMethod: 'online', query: 'online order' }), 201);
    });

    test('the choice is kept; nothing can be paid before the store confirms', async () => {
        assert.equal(o.paymentMethod, 'online');
        assert.equal(o.paymentStatus, 'pending');
        assert.equal((await fx.call('POST', `/v1/food/user/bulk-orders/${o.id}/pay`, A.customerToken, {})).status, 400);
    });

    test('after confirming it can be paid, but the store cannot prepare it until it is paid', async () => {
        const c = ok(await store(`/${o.id}/confirm`, 'POST', {})).order;
        assert.equal(c.canPayOnline, true);
        orderDoc = await FoodOrder.findById(c.orderId).lean();
        assert.equal(orderDoc.payment.method, 'razorpay');
        const r = await store(`/${o.id}/status`, 'POST', { status: 'preparing' });
        assert.equal(r.status, 400);
        assert.match(r.body.message || r.body.error, /pay online/i);
        // no payment gateway in the test: the customer is told so rather than shown a broken screen
        const pay = await fx.call('POST', `/v1/food/user/bulk-orders/${o.id}/pay`, A.customerToken, {});
        assert.equal(pay.status, 400);
        assert.match(pay.body.message || pay.body.error, /not available/i);
        assert.equal((await fx.call('POST', `/v1/food/user/bulk-orders/${o.id}/pay`, B.customerToken, {})).status, 404, 'another customer');
    });

    test('once paid, it shows as paid and preparing is allowed', async () => {
        await FoodOrder.updateOne({ _id: orderDoc._id }, { $set: { 'payment.status': 'paid' } });
        const mineNow = ok(await fx.call('GET', `/v1/food/user/bulk-orders/${o.id}`, A.customerToken)).order;
        assert.equal(mineNow.paymentStatus, 'paid');
        assert.equal(mineNow.canPayOnline, false);
        assert.equal(ok(await store(`/${o.id}/status`, 'POST', { status: 'preparing' })).order.status, 'preparing');
    });

    test('if the store cancels an order that was paid online, the money goes back to the customer\'s wallet', async () => {
        const before = (await fx.call('GET', '/v1/food/user/wallet/me', A.customerToken)).body.data.wallet.balance;
        const c = ok(await store(`/${o.id}/cancel`, 'POST', { reason: 'Oven broke down' })).order;
        assert.equal(c.status, 'cancelled');
        const after = (await fx.call('GET', '/v1/food/user/wallet/me', A.customerToken)).body.data.wallet.balance;
        assert.equal(after, before + 18000, 'the 40 pizzas total');
    });
});


describe('the delivery partner delivers a bulk order with the real rider steps', () => {
    test('accept, pick up, reach the customer, OTP and photo: the bulk order completes and the cash is recorded', async () => {
        const rider = await fx.partner();
        const { default: mongoose } = await import('mongoose');
        await mongoose.connection.collection('food_delivery_partners').updateOne({ _id: new mongoose.Types.ObjectId(rider.id) }, { $set: { storeId: new mongoose.Types.ObjectId(A.storeId), name: 'Rider Real' } });
        const o = ok(await place({ fulfilment: 'delivery', query: 'real rider', address: { street: '5 Palasia', city: 'Indore', state: 'MP', pincode: '452001' } }), 201);
        const c = ok(await store(`/${o.id}/confirm`, 'POST', { quotedAmount: 9000 })).order;
        ok(await store(`/${o.id}/status`, 'POST', { status: 'preparing' }));
        ok(await store(`/${o.id}/assign-rider`, 'POST', { riderId: rider.id }));
        ok(await store(`/${o.id}/status`, 'POST', { status: 'ready' }));
        const R = (path) => `/v1/food/delivery/orders/${c.orderId}/${path}`;
        assert.equal((await fx.call('PATCH', R('accept'), rider.token, {})).status, 200);
        const { FoodOrder: FO } = await import('../src/modules/food/orders/models/order.model.js');
        const pick = await fx.call('PATCH', R('confirm-pickup'), rider.token, { confirmedOrderId: c.orderId });
        assert.equal(pick.status, 200, JSON.stringify(pick.body));
        assert.equal(ok(await fx.call('GET', `/v1/food/user/bulk-orders/${o.id}`, A.customerToken)).order.status, 'out_for_delivery');
        assert.equal((await fx.call('PATCH', R('reached-drop'), rider.token, {})).status, 200);
        const otp = (await FO.findById(c.orderId).select('+deliveryOtp').lean()).deliveryOtp;
        const done = await fx.call('PATCH', R('complete'), rider.token, { otp, paymentMethod: 'cash', handoverPhotoUrl: 'https://example.com/proof.jpg' });
        assert.equal(done.status, 200, JSON.stringify(done.body));
        await new Promise((r) => setTimeout(r, 300));
        const finalOrder = ok(await fx.call('GET', `/v1/food/user/bulk-orders/${o.id}`, A.customerToken)).order;
        assert.equal(finalOrder.status, 'completed');
        assert.equal(finalOrder.paymentStatus, 'paid');
        assert.equal(finalOrder.rider.name, 'Rider Real');
    });
});

describe('a delivery address without a state still makes an order', () => {
    test('the store\'s state is used when the customer leaves it empty', async () => {
        const o = ok(await place({ fulfilment: 'delivery', query: 'no state', address: { street: '9 Vijay Nagar', city: 'Indore' } }), 201);
        const c = ok(await store(`/${o.id}/confirm`, 'POST', {})).order;
        assert.ok(c.orderId);
    });
});
