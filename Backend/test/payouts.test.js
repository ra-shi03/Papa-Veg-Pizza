// Payouts: super admin -> franchise -> store -> riders / kitchen staff (modules/food/payouts).
// Amounts come only from delivered orders; one open request per payee and payer; paid / rejected once, with a reference
// that cannot be reused; scoped to the caller's own store / franchise; payouts wait 24 hours after payout details change;
// "not received" is decided one level up. Store A and B are in different franchises; one rider delivers for both.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A; let B; let rider; let kitchen;
const oid = (v) => new mongoose.Types.ObjectId(String(v));
const ok = (res, status = 200) => { assert.equal(res.status, status, JSON.stringify(res.body)); return res.body.data; };
const DAY = 86400000;
const BANK = { accountHolderName: 'Store Owner', accountNumber: '123456789012', ifscCode: 'HDFC0001234', bankName: 'HDFC' };
let seq = 0;

async function delivered(f, riderId, { riderEarning, subtotal = 400, packagingFee = 20, storeCommission = 40, ago = 2 * DAY }) {
    const at = new Date(Date.now() - ago);
    await fx.models.FoodOrder.collection.insertOne({
        order_id: `PO${fx.ts}${++seq}`, userId: oid(f.customerId), storeId: oid(f.storeId), franchiseId: oid(f.franchiseId), orderStatus: 'delivered',
        dispatch: { status: 'accepted', deliveryPartnerId: oid(riderId) }, deliveryState: { deliveredAt: at }, riderEarning,
        pricing: { subtotal, packagingFee, storeCommission, total: subtotal + packagingFee }, items: [], createdAt: at, updatedAt: at,
    });
}

const R = '/v1/food/delivery/payouts';
const S = '/v1/food/store/payouts';
const FR = '/v1/food/franchise/payouts';
const P = '/v1/food/admin/payouts';
const pay = (token, base, id, ref = `UTR${++seq}${fx.ts}`, extra = {}) => fx.call('POST', `${base}/${id}/pay`, token, { method: 'bank_transfer', reference: ref, ...extra });

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    rider = await fx.partner('approved', { franchiseId: oid(A.franchiseId) });
    await delivered(A, rider.id, { riderEarning: 80 });                       // cleared at store A
    await delivered(A, rider.id, { riderEarning: 30, ago: 60 * 60 * 1000 });  // delivered an hour ago: on hold
    await delivered(B, rider.id, { riderEarning: 60 });                       // cleared at store B
    kitchen = await fx.staff('A', 'Pizza Maker', 'paystaff', { clockIn: false });
});
after(async () => { await fx?.teardown(); });

describe('rider withdrawals (paid by each store)', () => {
    let reqA; let reqB;
    test('balance per store from delivered orders; the last hour is on hold', async () => {
        const d = ok(await fx.call('GET', R, rider.token));
        const at = (f) => d.stores.find((s) => s.storeId === f.storeId);
        assert.deepEqual([at(A).available, at(A).onHold, at(B).available], [80, 30, 60]);
        assert.equal(d.totals.available, 140);
    });
    test('Withdraw makes one request per store; pressing it again is refused while they wait', async () => {
        const made = ok(await fx.call('POST', R, rider.token, {}), 201).requests;
        assert.equal(made.length, 2);
        reqA = made.find((p) => p.storeId === A.storeId); reqB = made.find((p) => p.storeId === B.storeId);
        assert.deepEqual([reqA.amount, reqB.amount], [80, 60]);
        assert.match(reqA.bank.accountNumber, /^•+\d{4}$/, 'the rider sees their own account masked');
        assert.equal((await fx.call('POST', R, rider.token, {})).status, 409);
    });
    test('an amount in the body is ignored: the server decides it', async () => {
        const other = await fx.partner('approved');
        await delivered(A, other.id, { riderEarning: 150 });
        const made = ok(await fx.call('POST', R, other.token, { amount: 99999 }), 201).requests;
        assert.deepEqual(made.map((p) => p.amount), [150]);
    });
    test('two Withdraw presses at the same moment make one request per store, never two', async () => {
        const fast = await fx.partner('approved');
        await delivered(A, fast.id, { riderEarning: 200 });
        const results = await Promise.all([1, 2, 3].map(() => fx.call('POST', R, fast.token, {})));
        assert.equal(results.filter((r) => r.status === 201).length, 1, JSON.stringify(results.map((r) => r.status)));
        assert.equal(await mongoose.connection.collection('food_payouts').countDocuments({ payeeId: oid(fast.id), status: 'pending' }), 1);
    });
    test('only that store\'s manager sees and pays it; other roles and stores cannot', async () => {
        const incomingA = ok(await fx.call('GET', S, A.managerToken)).incoming.map((p) => p.id);
        assert.ok(incomingA.includes(reqA.id) && !incomingA.includes(reqB.id));
        assert.equal(ok(await fx.call('GET', S, A.managerToken)).incoming.find((p) => p.id === reqA.id).bank.accountNumber, '123456789012', 'the payer sees the full account');
        assert.equal((await pay(B.managerToken, S, reqA.id)).status, 404);
        for (const t of [kitchen.token, A.adminToken, A.customerToken, rider.token]) assert.equal((await pay(t, S, reqA.id)).status, 403);
        assert.equal((await pay(A.adminToken, FR, reqA.id)).status, 404, 'a franchise admin cannot pay a rider');
        assert.equal((await pay(fx.SA, P, reqA.id)).status, 404, 'nor the super admin');
    });
    test('paying needs a method and a reference; it is paid once', async () => {
        assert.equal((await fx.call('POST', `${S}/${reqA.id}/pay`, A.managerToken, { method: 'bank_transfer' })).status, 400);
        assert.equal((await fx.call('POST', `${S}/${reqA.id}/pay`, A.managerToken, { method: 'cheque', reference: 'ABCD1234' })).status, 400);
        const paid = ok(await pay(A.managerToken, S, reqA.id, 'UTRSTOREA0001')).payout;
        assert.equal(paid.status, 'paid');
        assert.equal((await pay(A.managerToken, S, reqA.id, 'UTRSTOREA0002')).status, 409);
        const d = ok(await fx.call('GET', R, rider.token));
        assert.equal(d.stores.find((s) => s.storeId === A.storeId).available, 0);
        const wallet = ok(await fx.call('GET', '/v1/food/delivery/wallet', rider.token)).wallet;
        assert.equal(wallet.totalWithdrawn, 80);
        assert.ok(wallet.transactions.some((t) => t.type === 'withdrawal' && t.status === 'Completed' && t.reference === 'UTRSTOREA0001'));
    });
    test('the same reference cannot be used for a second payout of that store', async () => {
        const again = await fx.partner('approved');
        await delivered(A, again.id, { riderEarning: 120 });
        const [req] = ok(await fx.call('POST', R, again.token, {}), 201).requests;
        assert.equal((await pay(A.managerToken, S, req.id, 'UTR-STOREA-0001')).status, 409, 'spaces and dashes do not make it new');
        ok(await pay(A.managerToken, S, req.id, 'UTRSTOREA0003'));
    });
    test('rejecting needs a reason the rider sees; the amount returns to the balance', async () => {
        assert.equal((await fx.call('POST', `${S}/${reqB.id}/reject`, B.managerToken, { reason: 'no' })).status, 400);
        ok(await fx.call('POST', `${S}/${reqB.id}/reject`, B.managerToken, { reason: 'Bank account name does not match' }));
        assert.equal((await pay(B.managerToken, S, reqB.id)).status, 409, 'a rejected request cannot be paid');
        const wallet = ok(await fx.call('GET', '/v1/food/delivery/wallet', rider.token)).wallet;
        assert.ok(wallet.transactions.some((t) => t.status === 'Rejected' && t.failureReason === 'Bank account name does not match'));
        assert.equal(ok(await fx.call('GET', R, rider.token)).stores.find((s) => s.storeId === B.storeId).available, 60);
    });
    test('"not received": the rider reports, the franchise admin of that store decides; not paid reverses it', async () => {
        assert.equal((await fx.call('POST', `${R}/${reqA.id}/not-received`, rider.token, { note: 'short' })).status, 400);
        ok(await fx.call('POST', `${R}/${reqA.id}/not-received`, rider.token, { note: 'Checked my HDFC account, nothing came in.' }));
        assert.equal((await fx.call('POST', `${R}/${reqA.id}/not-received`, rider.token, { note: 'Checked my HDFC account again today.' })).status, 409);
        const decide = (t, outcome = 'not_paid') => fx.call('POST', `${FR}/${reqA.id}/resolve-dispute`, t, { outcome, resolution: 'Bank statement shows no transfer.' });
        assert.equal((await decide(A.managerToken)).status, 403);
        assert.equal((await decide(B.adminToken)).status, 404);
        const done = ok(await decide(A.adminToken)).payout;
        assert.equal(done.status, 'reversed');
        assert.equal(ok(await fx.call('GET', R, rider.token)).stores.find((s) => s.storeId === A.storeId).available, 80);
    });
    test('changing the bank account holds withdrawals for 24 hours', async () => {
        ok(await fx.call('PATCH', '/v1/food/delivery/profile/bank-details', rider.token, { documents: { bankDetails: { accountNumber: '999988887777' } } }));
        const res = await fx.call('POST', R, rider.token, {});
        assert.equal(res.status, 409, JSON.stringify(res.body));
        assert.match(res.body.message || res.body.error, /changed recently/);
    });
});

describe('store payouts (paid by the franchise) and franchise payouts (paid by the super admin)', () => {
    let storeReq; let franchiseReq;
    test('a store needs a valid payout account before asking', async () => {
        assert.equal((await fx.call('POST', `${S}/request`, A.managerToken, {})).status, 400);
        assert.equal((await fx.call('PUT', `${S}/account`, A.managerToken, { ...BANK, ifscCode: 'BAD' })).status, 400);
        const account = ok(await fx.call('PUT', `${S}/account`, A.managerToken, BANK)).account;
        assert.match(account.accountNumber, /^•+9012$/);
    });
    test('the store asks for at most what it is owed; its franchise admin pays it, nobody else', async () => {
        const desk = ok(await fx.call('GET', S, A.managerToken));
        assert.ok(desk.balance.available > 0 && desk.balance.onHold > 0, JSON.stringify(desk.balance));
        assert.equal((await fx.call('POST', `${S}/request`, A.managerToken, { amount: desk.balance.available + 1 })).status, 400);
        storeReq = ok(await fx.call('POST', `${S}/request`, A.managerToken, {}), 201).payout;
        assert.equal(storeReq.amount, desk.balance.available);
        assert.equal((await fx.call('POST', `${S}/request`, A.managerToken, {})).status, 409);
        assert.equal((await pay(B.adminToken, FR, storeReq.id)).status, 404);
        assert.equal((await pay(A.managerToken, S, storeReq.id)).status, 404, 'a store cannot pay itself');
        assert.equal((await pay(fx.SA, P, storeReq.id)).status, 404);
        ok(await pay(A.adminToken, FR, storeReq.id));
        assert.equal(ok(await fx.call('GET', S, A.managerToken)).balance.available, 0);
    });
    test('the franchise asks the super admin; only the super admin pays it', async () => {
        ok(await fx.call('PUT', `${FR}/account`, A.adminToken, { accountHolderName: 'Franchise A', upiId: 'franchisea@okhdfc' }));
        franchiseReq = ok(await fx.call('POST', `${FR}/request`, A.adminToken, {}), 201).payout;
        assert.ok(franchiseReq.amount > 0);
        assert.equal((await pay(A.adminToken, FR, franchiseReq.id)).status, 404, 'a franchise cannot pay itself');
        assert.equal((await fx.call('GET', P, A.adminToken)).status, 403);
        ok(await pay(fx.SA, P, franchiseReq.id, 'NEFTSA0001', { method: 'upi' }));
        const all = ok(await fx.call('GET', P, fx.SA)).all.map((p) => p.kind);
        for (const k of ['franchise_payout', 'store_payout', 'rider_withdrawal']) assert.ok(all.includes(k), k);
    });
    test('changing a payout account holds the next request for 24 hours', async () => {
        await delivered(A, rider.id, { riderEarning: 10 });
        ok(await fx.call('PUT', `${S}/account`, A.managerToken, { ...BANK, accountNumber: '555566667777' }));
        const res = await fx.call('POST', `${S}/request`, A.managerToken, {});
        assert.equal(res.status, 409, JSON.stringify(res.body));
    });
});

describe('kitchen staff salaries', () => {
    const ym = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const lastMonth = () => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 2); return ym(d); };
    test('the manager records a salary as paid; the same month cannot be paid twice', async () => {
        const month = ym(new Date());
        const rec = (ref) => fx.call('POST', `${S}/salaries`, A.managerToken, { staffId: kitchen.staffId, period: month, amount: 15000, method: 'bank_transfer', reference: ref });
        assert.equal((await fx.call('POST', `${S}/salaries`, B.managerToken, { staffId: kitchen.staffId, period: month, amount: 15000, method: 'cash', reference: 'RCPT0001' })).status, 404, 'another store cannot pay this staff member');
        ok(await rec('SALUTR0001'), 201);
        assert.equal((await rec('SALUTR0002')).status, 409);
        const desk = ok(await fx.call('GET', `${S}/staff`, A.managerToken)).staff.find((s) => s.staffId === kitchen.staffId);
        assert.ok(desk.payouts.some((p) => p.period === month && p.status === 'paid'));
        assert.equal(desk.months.find((m) => m.period === month).state, 'paid');
    });
    test('the manager keeps the staff member\'s payout details (they have no login); other stores cannot', async () => {
        ok(await fx.call('PUT', `${S}/staff/${kitchen.staffId}/account`, A.managerToken, BANK));
        assert.equal((await fx.call('PUT', `${S}/staff/${kitchen.staffId}/account`, B.managerToken, BANK)).status, 404);
        assert.equal((await fx.call('PUT', `${S}/staff/${A.managerId}/account`, A.managerToken, BANK)).status, 404, 'the manager is not kitchen staff');
        const desk = ok(await fx.call('GET', `${S}/staff`, A.managerToken)).staff.find((s) => s.staffId === kitchen.staffId);
        assert.equal(desk.account.accountHolderName, BANK.accountHolderName);
    });
    test('a salary request a staff member made before the change is still paid by the manager (a changed amount needs a reason)', async () => {
        await mongoose.connection.collection('storemanagers').updateOne({ _id: oid(kitchen.staffId) }, { $set: { joinedDate: new Date(Date.now() - 120 * DAY), 'personalDetails.salary': 12000, 'personalDetails.salaryType': 'Monthly' } });
        const old = lastMonth();
        const { FoodPayout } = await import('../src/modules/food/payouts/models/payout.model.js');
        const made = await FoodPayout.create({
            kind: 'staff_salary', payeeType: 'staff', payeeId: oid(kitchen.staffId), payeeName: kitchen.name, payerType: 'store', payerId: oid(A.storeId),
            storeId: oid(A.storeId), franchiseId: oid(A.franchiseId), period: old, amount: 12000, status: 'pending', origin: 'request',
            activity: [{ action: 'requested', byRole: 'KITCHEN_STAFF', byName: kitchen.name }], activeKey: `salary:${kitchen.staffId}:${old}`,
        });
        assert.equal(ok(await fx.call('GET', `${S}/staff`, A.managerToken)).staff.find((s) => s.staffId === kitchen.staffId).months.find((m) => m.period === old).state, 'pending');
        assert.equal((await pay(A.managerToken, S, String(made._id), 'SALUTR0100', { amount: 11000 })).status, 400);
        const paid = ok(await pay(A.managerToken, S, String(made._id), 'SALUTR0101', { amount: 11000, note: '2 days unpaid leave' })).payout;
        assert.deepEqual([paid.status, paid.amount], ['paid', 11000]);
    });
    test('My salary is retired (410) and an old kitchen staff token cannot use the manager\'s payouts (403)', async () => {
        assert.equal((await fx.call('GET', S, kitchen.token)).status, 403);
        assert.equal((await fx.call('GET', '/v1/food/store/my-salary', A.managerToken)).status, 410);
        assert.equal((await fx.call('POST', '/v1/food/store/my-salary/request', kitchen.token, { period: ym(new Date()) })).status, 410);
    });
});

describe('old approval endpoints', () => {
    test('the super admin can no longer approve withdrawals outside the Payouts flow', async () => {
        assert.equal((await fx.call('PATCH', '/v1/food/admin/delivery/withdrawals/64b000000000000000000001', fx.SA, { status: 'approved' })).status, 410);
        assert.equal((await fx.call('PATCH', '/v1/food/admin/withdrawals/64b000000000000000000001', fx.SA, { status: 'approved' })).status, 410);
    });
});
