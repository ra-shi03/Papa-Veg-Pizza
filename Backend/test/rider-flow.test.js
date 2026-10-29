// N-H1 / N-M1 (audit4): the rider leg of an order, end to end with real tokens.
// customer places a cash order -> manager accepts (with a kitchen supervisor) -> kitchen stages -> store assigns a rider
// -> rider accepts -> reached pickup -> pickup -> reached drop -> customer OTP -> delivered.
// Every rider step must come in order, only from the assigned rider, and a refused step changes nothing.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose, PASSWORD } from './helpers/fixture.js';

let fx; let A;
let sup; let rider; let otherRider; let pizza; let FoodTransaction;
let phoneSeq = 0;

const login = async (email) => (await fx.call('POST', '/v1/auth/store/login', null, { email, password: PASSWORD })).body.data.accessToken;
const makeStaff = async (role, tag) => {
    const email = `${tag}${fx.ts}@example.invalid`;
    const res = await fx.call('POST', '/v1/food/store/staff', A.managerToken, { fullName: `Name ${tag}`, email, phone: `6${String(++phoneSeq).padStart(2, '0')}${String(fx.ts).slice(-7)}`, password: PASSWORD, role });
    assert.equal(res.status, 201, `create ${tag}: ${JSON.stringify(res.body)}`);
    return { id: res.body.data.userId, token: await login(email) };
};

const ADDRESS = { street: '1 Test Street', city: 'Indore', state: 'MP' };
const placeOrder = async () => {
    const res = await fx.call('POST', '/v1/food/orders', A.customerToken, {
        items: [{ itemId: String(pizza._id), name: 'Margherita', price: 200, quantity: 1, size: 'Regular', kind: 'product' }],
        address: ADDRESS, storeId: A.storeId, paymentMethod: 'cash',
    });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    return String(res.body.data.order._id);
};

const R = (path) => `/v1/food/delivery/orders/${path}`;
const step = {
    accept: (id, who = rider) => fx.call('PATCH', R(`${id}/accept`), who.token, {}),
    reachedPickup: (id, who = rider) => fx.call('PATCH', R(`${id}/reached-pickup`), who.token, {}),
    pickup: (id, who = rider) => fx.call('PATCH', R(`${id}/confirm-pickup`), who.token, { confirmedOrderId: id }),
    reachedDrop: (id, who = rider) => fx.call('PATCH', R(`${id}/reached-drop`), who.token, {}),
    verifyOtp: (id, otp, who = rider) => fx.call('POST', R(`${id}/verify-drop-otp`), who.token, { otp }),
    complete: (id, body = {}, who = rider) => fx.call('PATCH', R(`${id}/complete`), who.token, body),
};
const storeAccept = (id) => fx.call('PATCH', `/v1/food/store/orders/${id}/accept`, A.managerToken, { kitchenSupervisorId: sup.id, estimatedPreparationTime: 15 });
const stage = (id, s) => fx.call('PATCH', `/v1/food/store/orders/${id}/stage`, sup.token, { stage: s });
const assignRider = (id, who = rider) => fx.call('POST', '/v1/store/delivery/assign', A.managerToken, { orderId: id, riderId: who.id });

/** What the customer sees (GET /food/orders/:id with their own token). */
const customerView = async (id) => {
    const res = await fx.call('GET', `/v1/food/orders/${id}`, A.customerToken);
    assert.equal(res.status, 200, JSON.stringify(res.body));
    return res.body.data.order;
};
const db = (id) => fx.models.FoodOrder.findById(id).select('+deliveryOtp').lean();
/** The parts of an order a refused step must not touch. */
const snapshot = async (id) => {
    const o = await db(id);
    const { failedAttempts, ...otp } = o.deliveryVerification?.dropOtp || {}; // the try counter is checked on its own
    void failedAttempts;
    return JSON.stringify([o.orderStatus, o.deliveryState, otp, o.dispatch?.status, String(o.dispatch?.deliveryPartnerId), o.payment?.status, (o.statusHistory || []).length]);
};
const ledgerEntries = async (id, kind) =>
    ((await FoodTransaction.findOne({ orderId: new mongoose.Types.ObjectId(id) }).lean())?.history || []).filter((h) => h.kind === kind).length;

/** An order taken as far as `until`: 'accepted' (store) | 'riderAccepted' | 'ready' | 'pickedUp' | 'atDrop'. */
const orderAt = async (until) => {
    const id = await placeOrder();
    assert.equal((await storeAccept(id)).status, 200);
    if (until === 'accepted') return id;
    if (until !== 'riderAccepted') {
        for (const s of ['preparing', 'baking', 'packaging', 'ready']) assert.equal((await stage(id, s)).status, 200, s);
    }
    assert.equal((await assignRider(id)).status, 200);
    assert.equal((await step.accept(id)).status, 200);
    if (until === 'riderAccepted' || until === 'ready') return id;
    assert.equal((await step.pickup(id)).status, 200);
    if (until === 'pickedUp') return id;
    assert.equal((await step.reachedDrop(id)).status, 200);
    return id;
};

before(async () => {
    fx = await createFixture(); A = fx.F.A;
    const { Product } = await import('../src/modules/food/admin/models/product.model.js');
    ({ FoodTransaction } = await import('../src/modules/food/orders/models/foodTransaction.model.js'));
    pizza = await Product.create({ name: 'Margherita', categoryId: new mongoose.Types.ObjectId(), status: 'Active', sizes: [{ size: 'Regular', price: 200 }], price: 200 });
    sup = await makeStaff('Kitchen Supervisor', 'rfsup');
    rider = await fx.partner();
    otherRider = await fx.partner();
    // store A's own riders, so the store can assign them wherever they are (who is near whom: nearby-people.test.js)
    const own = { storeId: new mongoose.Types.ObjectId(A.storeId), franchiseId: new mongoose.Types.ObjectId(A.franchiseId) };
    await mongoose.connection.collection('food_delivery_partners').updateMany({ _id: { $in: [rider.id, otherRider.id].map((id) => new mongoose.Types.ObjectId(id)) } }, { $set: own });
});
after(async () => { await fx?.teardown(); });

describe('the whole order, as the customer sees it', () => {
    test('cash order -> accept -> kitchen -> rider -> wrong OTP refused -> right OTP -> delivered, once', async () => {
        const id = await placeOrder();
        assert.equal((await customerView(id)).orderStatus, 'created');

        assert.equal((await storeAccept(id)).status, 200);
        assert.equal((await customerView(id)).orderStatus, 'confirmed');

        assert.equal((await stage(id, 'preparing')).status, 200);
        assert.equal((await customerView(id)).orderStatus, 'preparing');
        for (const s of ['baking', 'packaging']) assert.equal((await stage(id, s)).status, 200, s);
        assert.equal((await customerView(id)).orderStatus, 'preparing');
        assert.equal((await stage(id, 'ready')).status, 200);
        assert.equal((await customerView(id)).orderStatus, 'ready_for_pickup');

        assert.equal((await assignRider(id)).status, 200);
        const acc = await step.accept(id);
        assert.equal(acc.status, 200, JSON.stringify(acc.body));

        const rp = await step.reachedPickup(id);
        assert.equal(rp.status, 200, JSON.stringify(rp.body));
        assert.equal(rp.body.data.order.deliveryState.status, 'reached_pickup');

        const pu = await step.pickup(id);
        assert.equal(pu.status, 200, JSON.stringify(pu.body));
        assert.equal(pu.body.data.order.orderStatus, 'picked_up');
        let seen = await customerView(id);
        assert.equal(seen.orderStatus, 'picked_up');
        assert.equal(seen.handoverOtp, undefined, 'no OTP before the rider reaches the customer');

        const rd = await step.reachedDrop(id);
        assert.equal(rd.status, 200, JSON.stringify(rd.body));
        seen = await customerView(id);
        assert.equal(seen.orderStatus, 'picked_up');
        assert.equal(seen.deliveryState.currentPhase, 'at_drop');
        assert.match(String(seen.handoverOtp), /^\d{4}$/, 'the customer now sees the OTP');
        const otp = String(seen.handoverOtp);
        const wrong = otp === '0000' ? '1111' : '0000';

        const before = await snapshot(id);
        const bad = await step.verifyOtp(id, wrong);
        assert.equal(bad.status, 400);
        assert.equal(await snapshot(id), before, 'a wrong OTP changes nothing');
        assert.equal((await step.complete(id, { otp: wrong })).status, 400);
        assert.equal(await snapshot(id), before);

        // The delivery app verifies in its OTP dialog and again just before completing: both answer 200.
        assert.equal((await step.verifyOtp(id, otp)).status, 200);
        assert.equal((await step.verifyOtp(id, otp)).status, 200);
        assert.equal((await customerView(id)).deliveryVerification.dropOtp.verified, true);

        const done = await step.complete(id, { otp, rating: 5, paymentMethod: 'cash' });
        assert.equal(done.status, 200, JSON.stringify(done.body));
        assert.equal(done.body.data.order.orderStatus, 'delivered');
        seen = await customerView(id);
        assert.equal(seen.orderStatus, 'delivered');
        assert.equal(seen.handoverOtp, undefined);

        const stored = await db(id);
        assert.equal(stored.payment.status, 'paid');
        assert.equal(await ledgerEntries(id, 'cod_marked_paid_on_delivery'), 1, 'COD recorded once');
        assert.equal((stored.statusHistory || []).filter((h) => h.to === 'delivered').length, 1);
    });

    test('completing with the OTP in the complete call itself (no separate verify) also works', async () => {
        const id = await orderAt('atDrop');
        const otp = String((await customerView(id)).handoverOtp);
        const done = await step.complete(id, { otp, paymentMethod: 'cash' });
        assert.equal(done.status, 200, JSON.stringify(done.body));
        assert.equal((await customerView(id)).orderStatus, 'delivered');
    });
});

describe('steps out of order are refused (409) and change nothing', () => {
    test('pickup before the kitchen has finished', async () => {
        const id = await orderAt('riderAccepted');
        assert.equal((await db(id)).orderStatus, 'confirmed');
        const before = await snapshot(id);
        const res = await step.pickup(id);
        assert.equal(res.status, 409);
        assert.match(res.body.error, /kitchen has not finished/);
        assert.equal(await snapshot(id), before);

        assert.equal((await stage(id, 'preparing')).status, 200);
        assert.equal((await step.pickup(id)).status, 409, 'still cooking');
        assert.equal((await stage(id, 'ready')).status, 200, 'the kitchen can still finish: the rider did not lock it out');
        assert.equal((await step.pickup(id)).status, 200);
    });

    test('skip pickup: reached drop, verify OTP and complete before pickup', async () => {
        const id = await orderAt('ready');
        const before = await snapshot(id);
        for (const res of [await step.reachedDrop(id), await step.verifyOtp(id, '1234'), await step.complete(id, { otp: '1234', paymentMethod: 'cash' })]) {
            assert.equal(res.status, 409, JSON.stringify(res.body));
        }
        assert.equal(await snapshot(id), before);
        assert.equal((await customerView(id)).orderStatus, 'ready_for_pickup');
    });

    test('skip the OTP: complete without reached drop, or with no OTP', async () => {
        const id = await orderAt('pickedUp');
        let before = await snapshot(id);
        const noDrop = await step.complete(id, { paymentMethod: 'cash' });
        assert.equal(noDrop.status, 409);
        assert.match(noDrop.body.error, /reached drop first/);
        assert.equal((await step.complete(id, { otp: '1234', paymentMethod: 'cash' })).status, 409, 'no OTP exists yet, so none can match');
        assert.equal(await snapshot(id), before);

        assert.equal((await step.reachedDrop(id)).status, 200);
        before = await snapshot(id);
        const noOtp = await step.complete(id, { paymentMethod: 'cash' });
        assert.equal(noOtp.status, 400);
        assert.match(noOtp.body.error, /OTP is required/);
        assert.equal(await snapshot(id), before);
        assert.equal((await customerView(id)).orderStatus, 'picked_up');
    });

    test('every step twice: the second is refused', async () => {
        const id = await orderAt('ready');
        assert.equal((await step.reachedPickup(id)).status, 200);
        let before = await snapshot(id);
        assert.equal((await step.reachedPickup(id)).status, 409);
        assert.equal(await snapshot(id), before);

        assert.equal((await step.pickup(id)).status, 200);
        before = await snapshot(id);
        assert.equal((await step.pickup(id)).status, 409);
        assert.equal((await step.reachedPickup(id)).status, 409, 'cannot go back to the store');
        assert.equal(await snapshot(id), before);

        assert.equal((await step.reachedDrop(id)).status, 200);
        before = await snapshot(id);
        assert.equal((await step.reachedDrop(id)).status, 409);
        assert.equal(await snapshot(id), before, 'the OTP is not regenerated');

        const otp = String((await customerView(id)).handoverOtp);
        assert.equal((await step.complete(id, { otp, paymentMethod: 'cash' })).status, 200);
        before = await snapshot(id);
        const again = await step.complete(id, { otp, paymentMethod: 'cash' });
        assert.equal(again.status, 409);
        assert.match(again.body.error, /already delivered/);
        assert.equal(await snapshot(id), before);
        assert.equal(await ledgerEntries(id, 'cod_marked_paid_on_delivery'), 1, 'COD is not recorded twice');
        for (const res of [await step.reachedDrop(id), await step.pickup(id), await step.verifyOtp(id, otp)]) assert.equal(res.status, 409);
    });

    test('two completes at the same moment: one wins, COD recorded once', async () => {
        const id = await orderAt('atDrop');
        const otp = String((await customerView(id)).handoverOtp);
        const results = await Promise.all([step.complete(id, { otp, paymentMethod: 'cash' }), step.complete(id, { otp, paymentMethod: 'cash' })]);
        assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
        assert.equal(await ledgerEntries(id, 'cod_marked_paid_on_delivery'), 1);
    });
});

describe('only the assigned rider, after accepting', () => {
    test("another rider gets 403 on every step and changes nothing", async () => {
        const id = await orderAt('atDrop');
        const otp = String((await customerView(id)).handoverOtp);
        const before = await snapshot(id);
        for (const res of [
            await step.reachedPickup(id, otherRider), await step.pickup(id, otherRider), await step.reachedDrop(id, otherRider),
            await step.verifyOtp(id, otp, otherRider), await step.complete(id, { otp, paymentMethod: 'cash' }, otherRider),
        ]) assert.equal(res.status, 403, JSON.stringify(res.body));
        assert.equal(await snapshot(id), before);
    });

    test('a rider who was offered the order but has not accepted it cannot run the steps', async () => {
        const id = await placeOrder();
        assert.equal((await storeAccept(id)).status, 200);
        for (const s of ['preparing', 'ready']) assert.equal((await stage(id, s)).status, 200);
        assert.equal((await assignRider(id, otherRider)).status, 200);
        const before = await snapshot(id);
        for (const res of [await step.reachedPickup(id, otherRider), await step.pickup(id, otherRider)]) {
            assert.equal(res.status, 409);
            assert.match(res.body.error, /Accept this order/);
        }
        assert.equal(await snapshot(id), before);
    });
});

describe('payment must be verified before complete', () => {
    test('QR chosen but not paid: refused, nothing recorded', async () => {
        const id = await orderAt('atDrop');
        const otp = String((await customerView(id)).handoverOtp);
        const res = await step.complete(id, { otp, paymentMethod: 'qr' });
        assert.equal(res.status, 400);
        assert.match(res.body.error, /QR payment/);
        assert.equal((await db(id)).orderStatus, 'picked_up');
        assert.equal(await ledgerEntries(id, 'cod_collect_qr_settled'), 0);
    });

    test('an online order not yet paid cannot be completed, and the rider cannot switch it to cash', async () => {
        const id = await orderAt('atDrop');
        const oid = new mongoose.Types.ObjectId(id);
        await fx.models.FoodOrder.updateOne({ _id: oid }, { $set: { 'payment.method': 'razorpay', 'payment.status': 'created' } });
        await FoodTransaction.updateOne({ orderId: oid }, { $set: { paymentMethod: 'razorpay', 'payment.method': 'razorpay', 'payment.status': 'created', status: 'pending' } });
        const otp = String((await customerView(id)).handoverOtp);
        const before = await snapshot(id);
        for (const paymentMethod of ['cash', 'qr', undefined]) {
            const res = await step.complete(id, { otp, paymentMethod });
            assert.equal(res.status, 400, `${paymentMethod}: ${JSON.stringify(res.body)}`);
            assert.match(res.body.error, /online payment/);
        }
        assert.equal(await snapshot(id), before);

        // Once the payment is verified it completes, and stays an online payment (no cash recorded).
        await fx.models.FoodOrder.updateOne({ _id: oid }, { $set: { 'payment.status': 'paid' } });
        await FoodTransaction.updateOne({ orderId: oid }, { $set: { 'payment.status': 'paid', status: 'captured' } });
        const done = await step.complete(id, { otp, paymentMethod: 'cash' });
        assert.equal(done.status, 200, JSON.stringify(done.body));
        assert.equal((await db(id)).payment.method, 'razorpay');
        assert.equal(await ledgerEntries(id, 'cod_marked_paid_on_delivery'), 0);
    });
});

describe('N-H1: the generic status route is gone', () => {
    test('PATCH /food/delivery/orders/:id/status is 404 for the assigned rider and changes nothing', async () => {
        const id = await orderAt('riderAccepted');
        const before = await snapshot(id);
        for (const orderStatus of ['delivered', 'cancelled_by_store', 'picked_up', 'ready_for_pickup']) {
            const res = await fx.call('PATCH', R(`${id}/status`), rider.token, { orderStatus });
            assert.equal(res.status, 404, `${orderStatus}: ${res.status}`);
        }
        assert.equal(await snapshot(id), before);
        assert.equal((await customerView(id)).orderStatus, 'confirmed');
    });
});

describe('drop OTP: five tries, then 429 until the store resets it', () => {
    const resetOtp = (id, token) => fx.call('POST', `/v1/store/orders/${id}/reset-drop-otp`, token);
    const wrongOf = (otp) => (otp === '0000' ? '1111' : '0000');

    test('five wrong tries (verify or complete) are 400, the sixth is 429 even with the right OTP; nothing changes', async () => {
        const id = await orderAt('atDrop');
        const otp = String((await customerView(id)).handoverOtp);
        const wrong = wrongOf(otp);
        for (let i = 1; i <= 3; i++) assert.equal((await step.verifyOtp(id, wrong)).status, 400, `try ${i}`);
        for (let i = 4; i <= 5; i++) assert.equal((await step.complete(id, { otp: wrong, paymentMethod: 'cash' })).status, 400, `try ${i}`);
        const locked = await snapshot(id);
        for (const res of [await step.verifyOtp(id, otp), await step.complete(id, { otp, paymentMethod: 'cash' })]) {
            assert.equal(res.status, 429, JSON.stringify(res.body));
            assert.match(res.body.error, /store manager/);
        }
        assert.equal(await snapshot(id), locked);
        assert.equal((await db(id)).orderStatus, 'picked_up');
        assert.equal((await customerView(id)).orderStatus, 'picked_up');
    });

    test('the right OTP on the fifth try still works', async () => {
        const id = await orderAt('atDrop');
        const otp = String((await customerView(id)).handoverOtp);
        for (let i = 0; i < 4; i++) assert.equal((await step.verifyOtp(id, wrongOf(otp))).status, 400);
        assert.equal((await step.verifyOtp(id, otp)).status, 200);
        assert.equal((await step.complete(id, { otp, paymentMethod: 'cash' })).status, 200);
    });

    test('parallel guesses cannot get past the limit', async () => {
        const id = await orderAt('atDrop');
        const otp = String((await customerView(id)).handoverOtp);
        const res = await Promise.all(Array.from({ length: 12 }, () => step.verifyOtp(id, wrongOf(otp))));
        assert.equal(res.filter((r) => r.status === 400).length, 5);
        assert.equal(res.filter((r) => r.status === 429).length, 7);
        assert.equal((await db(id)).deliveryVerification.dropOtp.failedAttempts, 5);
    });

    test("the order's store manager resets it and the rider has five more tries", async () => {
        const id = await orderAt('atDrop');
        const otp = String((await customerView(id)).handoverOtp);
        for (let i = 0; i < 5; i++) await step.verifyOtp(id, wrongOf(otp));
        assert.equal((await step.verifyOtp(id, otp)).status, 429);
        const reset = await resetOtp(id, A.managerToken);
        assert.equal(reset.status, 200, JSON.stringify(reset.body));
        assert.equal(reset.body.data.failedAttempts, 0);
        assert.equal((await db(id)).deliveryVerification.dropOtp.failedAttempts, 0);
        assert.equal((await step.verifyOtp(id, wrongOf(otp))).status, 400, 'counting from zero again');
        assert.equal((await step.verifyOtp(id, otp)).status, 200);
        assert.equal((await step.complete(id, { otp, paymentMethod: 'cash' })).status, 200);
    });

    test('the super admin can reset it', async () => {
        const id = await orderAt('atDrop');
        const otp = String((await customerView(id)).handoverOtp);
        for (let i = 0; i < 5; i++) await step.verifyOtp(id, wrongOf(otp));
        assert.equal((await resetOtp(id, fx.SA)).status, 200);
        assert.equal((await step.verifyOtp(id, otp)).status, 200);
    });

    test('another store gets 404; the rider, a customer, a franchise admin and a kitchen supervisor are refused; nothing resets', async () => {
        const id = await orderAt('atDrop');
        const otp = String((await customerView(id)).handoverOtp);
        for (let i = 0; i < 5; i++) await step.verifyOtp(id, wrongOf(otp));
        assert.equal((await resetOtp(id, fx.F.B.managerToken)).status, 404, "store B's manager");
        assert.equal((await resetOtp(id, rider.token)).status, 403, 'the rider');
        assert.equal((await resetOtp(id, A.customerToken)).status, 403, 'a customer');
        assert.equal((await resetOtp(id, A.adminToken)).status, 403, 'franchise admin');
        assert.equal((await resetOtp(id, sup.token)).status, 403, 'kitchen supervisor');
        assert.equal((await resetOtp(id)).status, 401, 'signed out');
        assert.equal((await db(id)).deliveryVerification.dropOtp.failedAttempts, 5);
        assert.equal((await step.verifyOtp(id, otp)).status, 429);
    });

    test('an unknown order is 404 and an order that is not out for delivery is 400', async () => {
        assert.equal((await resetOtp(String(new mongoose.Types.ObjectId()), A.managerToken)).status, 404);
        const id = await orderAt('accepted');
        assert.equal((await resetOtp(id, A.managerToken)).status, 400);
    });
});
