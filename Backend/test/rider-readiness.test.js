// Before a delivery partner takes orders:
//   - bank and payment details (account holder, number, IFSC, UPI id): optional at signup (skip), required to go online
//     and to accept an order;
//   - the delivery wallet: recharges + COD deposits minus the COD cash collected (it goes below zero after cash orders).
//     To accept an order the balance must be at least that order's franchise minimum, set by the franchise admin.
//   The super admin sees every rider's wallet and payout details, and every franchise's minimum.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose, PAYOUT } from './helpers/fixture.js';

let fx; let A; let B; let pizza;
const oid = (v) => new mongoose.Types.ObjectId(String(v));
const riders = () => mongoose.connection.collection('food_delivery_partners');
const deposits = () => mongoose.connection.collection('food_delivery_cash_deposits');
const SETTINGS = '/v1/food/admin/delivery/wallet-settings';
const R = (p) => `/v1/food/delivery/orders/${p}`;
const ok = (res, status = 200) => { assert.equal(res.status, status, JSON.stringify(res.body)); return res.body.data; };
const own = () => ({ storeId: oid(A.storeId), franchiseId: oid(A.franchiseId) });

const placeReadyOrder = async (paymentMethod = 'cash') => {
    const res = await fx.call('POST', '/v1/food/orders', A.customerToken, {
        items: [{ itemId: String(pizza._id), name: 'Margherita', price: 200, quantity: 1, size: 'Regular', kind: 'product' }],
        address: { street: '1 Test Street', city: 'Indore', state: 'MP' }, storeId: A.storeId, paymentMethod,
    });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    const id = String(res.body.data.order._id);
    ok(await fx.call('PATCH', `/v1/food/store/orders/${id}/accept`, A.managerToken, { estimatedPreparationTime: 15 }));
    for (const s of ['preparing', 'baking', 'packaging', 'ready']) ok(await fx.call('PATCH', `/v1/food/store/orders/${id}/stage`, A.managerToken, { stage: s }));
    return id;
};
const recharge = (riderId, amount, purpose = 'wallet_recharge') => deposits().insertOne({
    deliveryPartnerId: oid(riderId), amount, purpose, status: 'Completed', paymentMethod: 'razorpay', razorpayOrderId: `o_${Date.now()}_${Math.random()}`, createdAt: new Date(), updatedAt: new Date(),
});
const walletOf = async (token) => ok(await fx.call('GET', '/v1/food/delivery/wallet', token)).wallet.deliveryWallet;

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    const { Product } = await import('../src/modules/food/admin/models/product.model.js');
    pizza = await Product.create({ name: 'Margherita', categoryId: new mongoose.Types.ObjectId(), status: 'Active', sizes: [{ size: 'Regular', price: 200 }], price: 200 });
});
after(async () => { await fx?.teardown(); });

describe('signup: bank and payment details are optional (skip)', () => {
    const base = () => ({ name: 'New Rider', phone: `97${String(Date.now()).slice(-8)}`, city: 'Indore', state: 'MP', vehicleType: 'bike' });
    test('filled in at signup: saved on the rider', async () => {
        const body = { ...base(), bankAccountHolderName: 'New Rider', bankAccountNumber: '987654321012', bankIfscCode: 'sbin0001234', bankName: 'SBI', upiId: 'new.rider@okaxis' };
        ok(await fx.call('POST', '/v1/food/delivery/register', null, body), 201);
        const row = await riders().findOne({ phone: body.phone });
        assert.deepEqual([row.bankAccountNumber, row.bankIfscCode, row.upiId, row.status], ['987654321012', 'SBIN0001234', 'new.rider@okaxis', 'pending']);
    });
    test('skipped: the signup still goes through, with no bank details', async () => {
        const body = base();
        ok(await fx.call('POST', '/v1/food/delivery/register', null, body), 201);
        const row = await riders().findOne({ phone: body.phone });
        assert.equal(row.bankAccountNumber, undefined);
    });
    test('wrong IFSC or UPI is refused', async () => {
        assert.equal((await fx.call('POST', '/v1/food/delivery/register', null, { ...base(), bankIfscCode: 'NOPE' })).status, 400);
        assert.equal((await fx.call('POST', '/v1/food/delivery/register', null, { ...base(), upiId: 'not-a-upi' })).status, 400);
    });
});

describe('going online needs bank and payment details', () => {
    test('without them: 400 PAYOUT_DETAILS_REQUIRED and the rider stays offline; going offline is always fine', async () => {
        const r = await fx.partner('approved', { payout: false, availabilityStatus: 'offline' });
        const res = await fx.call('PATCH', '/v1/food/delivery/availability', r.token, { status: 'online' });
        assert.equal(res.status, 400);
        assert.equal(res.body.code, 'PAYOUT_DETAILS_REQUIRED');
        assert.ok(res.body.data.missing.includes('UPI id'));
        assert.equal((await riders().findOne({ _id: oid(r.id) })).availabilityStatus, 'offline');
        ok(await fx.call('PATCH', '/v1/food/delivery/availability', r.token, { status: 'offline' }));
        // a location-only update is not a status change
        ok(await fx.call('PATCH', '/v1/food/delivery/availability', r.token, { latitude: 22.7, longitude: 75.8 }));
    });
    test('with them: online', async () => {
        const r = await fx.partner('approved', { availabilityStatus: 'offline' });
        ok(await fx.call('PATCH', '/v1/food/delivery/availability', r.token, { status: 'online' }));
        assert.equal((await riders().findOne({ _id: oid(r.id) })).availabilityStatus, 'online');
    });
});

describe('the delivery wallet minimum is set by the franchise admin', () => {
    test('franchise admin sets its own; bad amounts are 400', async () => {
        assert.equal(ok(await fx.call('GET', SETTINGS, A.adminToken)).riderWalletMinBalance, 0);
        assert.equal((await fx.call('PATCH', SETTINGS, A.adminToken, { riderWalletMinBalance: -5 })).status, 400);
        assert.equal(ok(await fx.call('PATCH', SETTINGS, A.adminToken, { riderWalletMinBalance: 500 })).riderWalletMinBalance, 500);
        assert.equal(ok(await fx.call('GET', SETTINGS, B.adminToken)).riderWalletMinBalance, 0, 'franchise B is untouched');
    });
    test('super admin sees every franchise\'s minimum but does not set it; others are 403', async () => {
        const all = ok(await fx.call('GET', SETTINGS, fx.SA)).franchises;
        assert.equal(all.find((f) => String(f._id) === A.franchiseId).riderWalletMinBalance, 500);
        assert.equal((await fx.call('PATCH', SETTINGS, fx.SA, { riderWalletMinBalance: 1 })).status, 403);
        for (const t of [A.managerToken, A.customerToken]) assert.equal((await fx.call('GET', SETTINGS, t)).status, 403);
    });
});

describe('accepting an order needs the wallet balance', () => {
    let rider; let id;
    before(async () => {
        rider = await fx.partner('approved', own());
        id = await placeReadyOrder('cash');
    });
    test('below the minimum: no offers, the store cannot assign, and accept is 400 WALLET_RECHARGE_REQUIRED', async () => {
        const w = await walletOf(rider.token);
        assert.deepEqual([w.balance, w.minBalance, w.shortBy, w.canAccept], [0, 500, 500, false]);
        const avail = ok(await fx.call('GET', '/v1/food/delivery/orders/available', rider.token));
        assert.ok(!(avail.data || avail.docs || []).some((o) => String(o._id || o.orderMongoId) === id), 'no offer from franchise A');
        assert.ok(avail.readiness.message);
        const list = ok(await fx.call('GET', '/v1/store/delivery/available-riders', A.managerToken));
        assert.ok(!JSON.stringify(list).includes(rider.id), 'not listed for Assign Rider');
        const assign = await fx.call('POST', '/v1/store/delivery/assign', A.managerToken, { orderId: id, riderId: rider.id });
        assert.equal(assign.status, 400);
        assert.match(assign.body.error, /wallet/i);
        // even if the order were handed to them, accept refuses
        await fx.models.FoodOrder.updateOne({ _id: id }, { $set: { 'dispatch.status': 'assigned', 'dispatch.deliveryPartnerId': oid(rider.id), 'dispatch.manual': true } });
        const res = await fx.call('PATCH', R(`${id}/accept`), rider.token, {});
        assert.equal(res.status, 400);
        assert.equal(res.body.code, 'WALLET_RECHARGE_REQUIRED');
        assert.equal(res.body.data.shortBy, 500);
    });
    test('a rider without payout details cannot accept either', async () => {
        const noBank = await fx.partner('approved', { payout: false, ...own() });
        await recharge(noBank.id, 1000);
        await fx.models.FoodOrder.updateOne({ _id: id }, { $set: { 'dispatch.deliveryPartnerId': oid(noBank.id) } });
        const res = await fx.call('PATCH', R(`${id}/accept`), noBank.token, {});
        assert.equal(res.status, 400);
        assert.equal(res.body.code, 'PAYOUT_DETAILS_REQUIRED');
        await fx.models.FoodOrder.updateOne({ _id: id }, { $set: { 'dispatch.deliveryPartnerId': oid(rider.id) } });
    });
    test('after a recharge the rider accepts; a COD delivery takes the wallet below zero; a new order needs a recharge again', async () => {
        await recharge(rider.id, 600);
        assert.equal((await walletOf(rider.token)).balance, 600);
        ok(await fx.call('PATCH', R(`${id}/accept`), rider.token, {}));
        ok(await fx.call('PATCH', R(`${id}/confirm-pickup`), rider.token, { confirmedOrderId: id, billImageUrl: 'https://img.test/bill.jpg' }));
        ok(await fx.call('PATCH', R(`${id}/reached-drop`), rider.token, {}));
        const otp = (await fx.models.FoodOrder.findById(id).select('+deliveryOtp').lean()).deliveryOtp;
        ok(await fx.call('PATCH', R(`${id}/complete`), rider.token, { otp, paymentMethod: 'cash', handoverPhotoUrl: 'https://img.test/door.jpg' }));
        const total = (await fx.models.FoodOrder.findById(id).lean()).pricing.total;
        const w = await walletOf(rider.token);
        assert.equal(w.codCollected, total);
        assert.equal(w.balance, 600 - total);
        assert.equal(w.canAccept, 600 - total >= 500);
        // a franchise with no minimum (B) still lets the rider take orders while the balance is at least ₹0
        assert.equal(ok(await fx.call('GET', SETTINGS, B.adminToken)).riderWalletMinBalance, 0);
    });
    test('a wallet recharge is not capped by the cash in hand (a COD settlement still is)', async () => {
        const fresh = await fx.partner('approved', own());
        const rechargeOrder = await fx.call('POST', '/v1/food/delivery/wallet/deposit/order', fresh.token, { amount: 750, purpose: 'wallet_recharge' });
        assert.equal(rechargeOrder.status, 201, JSON.stringify(rechargeOrder.body));
        assert.equal(rechargeOrder.body.data.purpose, 'wallet_recharge');
        const settle = await fx.call('POST', '/v1/food/delivery/wallet/deposit/order', fresh.token, { amount: 750 });
        assert.equal(settle.status, 400, 'no cash in hand to settle');
    });
});

describe('the super admin sees it all', () => {
    test('rider detail: wallet, recharges, payout details (with UPI) and what is missing; list: wallet balance', async () => {
        const r = await fx.partner('approved', own());
        await recharge(r.id, 300);
        const d = ok(await fx.call('GET', `/v1/food/admin/delivery/${r.id}`, fx.SA)).delivery;
        assert.equal(d.deliveryWallet.balance, 300);
        assert.equal(d.deliveryWallet.recharged, 300);
        assert.equal(d.walletDeposits[0].purpose, 'wallet_recharge');
        assert.equal(d.documents.bankDetails.upiId, PAYOUT.upiId);
        assert.deepEqual(d.payoutDetailsMissing, []);
        const list = ok(await fx.call('GET', '/v1/food/admin/delivery/partners?limit=500', fx.SA)).deliveryPartners;
        const row = list.find((x) => String(x._id) === r.id);
        assert.equal(row.walletBalance, 300);
        assert.equal(row.payoutDetailsComplete, true);
    });
    test('the franchise admin sees wallet balance and payout completeness on its own riders', async () => {
        const r = await fx.partner('approved', { payout: false, ...own() });
        const rows = ok(await fx.call('GET', '/v1/food/admin/delivery/partners?limit=500', A.adminToken)).deliveryPartners;
        const row = rows.find((x) => String(x._id) === r.id);
        assert.ok(row, 'listed');
        assert.equal(row.payoutDetailsComplete, false);
        assert.equal(row.walletBalance, 0);
    });
});
