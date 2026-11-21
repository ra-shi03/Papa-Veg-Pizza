// The rider's Raise a ticket screen: what it sends, and what it needs back (the new ticket's id, to open it straight away).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture } from './helpers/fixture.js';

let fx; let rider; let other;
const T = '/v1/food/delivery/support-tickets';
before(async () => { fx = await createFixture(); rider = await fx.partner(); other = await fx.partner(); });
after(async () => { await fx?.teardown(); });

test('a ticket from a suggested topic is created and opens by its id; only its rider can read it', async () => {
    const res = await fx.call('POST', T, rider.token, { subject: 'Wallet recharge not added', description: 'Paid 500 at 10 pm, balance still shows 0.', category: 'payment', priority: 'high' });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    const t = res.body.data;
    assert.ok(t._id && t.ticketId);
    assert.deepEqual([t.category, t.priority, t.status], ['payment', 'high', 'open']);
    const one = await fx.call('GET', `${T}/${t._id}`, rider.token);
    assert.equal(one.status, 200);
    assert.notEqual((await fx.call('GET', `${T}/${t._id}`, other.token)).status, 200);
});
test('too short a topic or description is refused with a message the screen shows', async () => {
    const a = await fx.call('POST', T, rider.token, { subject: 'ab', description: 'long enough description', category: 'order', priority: 'low' });
    assert.equal(a.status, 400);
    assert.ok(a.body.error);
    assert.equal((await fx.call('POST', T, rider.token, { subject: 'Order issue', description: 'short', category: 'order', priority: 'low' })).status, 400);
});

// ---- who handles a rider's ticket: the store manager, the franchise admin (and the super admin) ----
import { mongoose } from './helpers/fixture.js';
const oid = (v) => new mongoose.Types.ObjectId(String(v));

test('a ticket reaches the rider\'s store manager and franchise admin, who reply and move it; nobody else sees it', async () => {
    const A = fx.F.A; const B = fx.F.B;
    const mine = await fx.partner('approved', { storeId: oid(A.storeId), franchiseId: oid(A.franchiseId) });
    const made = await fx.call('POST', T, mine.token, { subject: 'Customer not reachable', description: 'Called 3 times, phone switched off.', category: 'order', priority: 'urgent' });
    assert.equal(made.status, 201, JSON.stringify(made.body));
    const id = made.body.data._id;
    const row = await mongoose.connection.collection('food_delivery_support_tickets').findOne({ _id: oid(id) });
    assert.deepEqual([String(row.storeId), String(row.franchiseId)], [A.storeId, A.franchiseId], 'stamped with the rider\'s store and franchise');

    const ids = async (token, path) => ((await fx.call('GET', path, token)).body.data?.tickets || []).map((t) => String(t._id));
    const STORE = '/v1/food/store/rider-tickets';
    const FRAN = '/v1/food/admin/delivery/rider-tickets';
    assert.ok((await ids(A.managerToken, STORE)).includes(id), 'store manager sees it');
    assert.ok((await ids(A.adminToken, FRAN)).includes(id), 'franchise admin sees it');
    assert.ok((await ids(fx.SA, FRAN)).includes(id), 'super admin sees it');
    assert.ok(!(await ids(B.managerToken, STORE)).includes(id), 'another store does not');
    assert.ok(!(await ids(B.adminToken, FRAN)).includes(id), 'another franchise does not');
    assert.equal((await fx.call('GET', `${STORE}/${id}`, B.managerToken)).status, 404);
    assert.equal((await fx.call('PATCH', `${FRAN}/${id}`, B.adminToken, { status: 'resolved' })).status, 404);
    for (const t of [A.customerToken, mine.token]) assert.equal((await fx.call('GET', STORE, t)).status, 403);

    // the store manager replies: it becomes in progress, and the rider reads the reply
    const replied = await fx.call('PATCH', `${STORE}/${id}`, A.managerToken, { adminResponse: 'We called the customer, please wait 5 minutes.' });
    assert.equal(replied.status, 200, JSON.stringify(replied.body));
    assert.equal(replied.body.data.status, 'in_progress');
    assert.equal(replied.body.data.handledBy.role, 'STORE_MANAGER');
    const seen = (await fx.call('GET', `${T}/${id}`, mine.token)).body.data;
    assert.match(seen.adminResponse || seen.ticket?.adminResponse || '', /wait 5 minutes/);
    // the store manager can resolve but not close; the franchise admin closes
    assert.equal((await fx.call('PATCH', `${STORE}/${id}`, A.managerToken, { status: 'closed' })).status, 403);
    assert.equal((await fx.call('PATCH', `${STORE}/${id}`, A.managerToken, { status: 'resolved' })).status, 200);
    const closed = await fx.call('PATCH', `${FRAN}/${id}`, A.adminToken, { status: 'closed', adminResponse: 'Closed after the delivery was completed.' });
    assert.equal(closed.status, 200);
    assert.deepEqual(closed.body.data.activity.map((a) => [a.byRole, a.status]), [['STORE_MANAGER', 'in_progress'], ['STORE_MANAGER', 'resolved'], ['FRANCHISE_ADMIN', 'closed']]);
    // a closed ticket stays closed for the store manager; the franchise admin can reopen it
    assert.equal((await fx.call('PATCH', `${STORE}/${id}`, A.managerToken, { status: 'open' })).status, 409);
    assert.equal((await fx.call('PATCH', `${FRAN}/${id}`, A.adminToken, { status: 'open' })).status, 200);
    // empty updates and bad statuses are refused
    assert.equal((await fx.call('PATCH', `${FRAN}/${id}`, A.adminToken, {})).status, 400);
    assert.equal((await fx.call('PATCH', `${FRAN}/${id}`, A.adminToken, { status: 'nope' })).status, 400);
});

test('an older ticket with no stamp is matched through the rider\'s store; a rider with no store goes to the super admin only', async () => {
    const A = fx.F.A;
    const mine = await fx.partner('approved', { storeId: oid(A.storeId), franchiseId: oid(A.franchiseId) });
    await mongoose.connection.collection('food_delivery_support_tickets').insertOne({ deliveryPartnerId: oid(mine.id), ticketId: `OLD${Date.now()}`, subject: 'Old ticket', description: 'raised before routing existed', category: 'other', priority: 'low', status: 'open', createdAt: new Date(), updatedAt: new Date() });
    const list = (await fx.call('GET', '/v1/food/store/rider-tickets', A.managerToken)).body.data.tickets;
    assert.ok(list.some((t) => t.subject === 'Old ticket'));
    const lone = await fx.partner();
    const made = await fx.call('POST', T, lone.token, { subject: 'No store yet', description: 'I am not attached to any store.', category: 'account', priority: 'low' });
    const loneId = made.body.data._id;
    assert.ok(!(await fx.call('GET', '/v1/food/store/rider-tickets', A.managerToken)).body.data.tickets.some((t) => String(t._id) === loneId));
    assert.ok((await fx.call('GET', '/v1/food/admin/delivery/rider-tickets', fx.SA)).body.data.tickets.some((t) => String(t._id) === loneId));
});

test('a rider of the franchise with no store of their own (shared fleet) still reaches the store manager and franchise admin', async () => {
    const A = fx.F.A; const B = fx.F.B;
    const fleet = await fx.partner('approved', { franchiseId: oid(A.franchiseId) });
    await mongoose.connection.collection('food_delivery_support_tickets').insertOne({ deliveryPartnerId: oid(fleet.id), ticketId: `FLT${Date.now()}`, subject: 'Payout not received', description: 'raised before routing existed', category: 'payment', priority: 'medium', status: 'open', createdAt: new Date(), updatedAt: new Date() });
    const has = async (token, path) => ((await fx.call('GET', path, token)).body.data?.tickets || []).some((t) => t.subject === 'Payout not received' && t.deliveryPartner?._id === fleet.id);
    assert.ok(await has(A.adminToken, '/v1/food/admin/delivery/rider-tickets'), 'franchise admin');
    assert.ok(!(await has(B.adminToken, '/v1/food/admin/delivery/rider-tickets')), 'not another franchise');
});
