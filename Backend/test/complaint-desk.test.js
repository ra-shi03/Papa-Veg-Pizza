// Customer Complaints desk of the franchise admin (/v1/food/admin/stores/complaints/desk), end to end:
// the customer sends a complaint -> the store manager and the franchise admin both see it -> the admin
// adds notes, resolves and closes it -> the customer reads the outcome.
// A franchise admin only ever touches its own stores' complaints; store staff and customers are refused.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A; let B;
const D = '/v1/food/admin/stores/complaints/desk';
const get = (token, path = '') => fx.call('GET', `${D}${path}`, token);
const post = (token, path, body = {}) => fx.call('POST', `${D}${path}`, token, body);
const newOrder = async (f, total = 400) => {
    const ref = `CD${fx.ts}${Math.floor(Math.random() * 1e6)}`;
    const r = await fx.models.FoodOrder.collection.insertOne({
        order_id: ref, orderId: ref, userId: new mongoose.Types.ObjectId(f.customerId), storeId: new mongoose.Types.ObjectId(f.storeId), franchiseId: new mongoose.Types.ObjectId(f.franchiseId),
        orderStatus: 'delivered', payment: { method: 'cash', status: 'paid' }, pricing: { subtotal: total, total },
        deliveryAddress: { street: '1 Test Rd', city: 'Pune', state: 'MH' }, customerName: 'Alice Rao', customerPhone: '9876543210',
        items: [{ itemId: 'x', name: 'Margherita', quantity: 2, size: 'Medium', price: total / 2 }],
        statusHistory: [], createdAt: new Date(Date.now() - 3600000), updatedAt: new Date(),
    });
    return String(r.insertedId);
};
const raise = (f, orderId, issueType = 'Missing Item', description = 'Garlic bread was missing') =>
    fx.call('POST', '/v1/food/user/support/ticket', f.customerToken, { type: 'order', orderId, issueType, description });

before(async () => { fx = await createFixture(); A = fx.F.A; B = fx.F.B; });
after(async () => { await fx?.teardown(); });

describe('who sees the complaints', () => {
    let a1; let b1;
    before(async () => {
        a1 = (await raise(A, await newOrder(A))).body.data.ticket._id;
        b1 = (await raise(B, await newOrder(B))).body.data.ticket._id;
    });

    test('the store manager sees its own complaint (store screen)', async () => {
        const res = await fx.call('GET', '/v1/food/store/complaints', A.managerToken);
        assert.equal(res.status, 200);
        assert.ok(res.body.data.complaints.some((c) => c._id === a1));
    });

    test('a franchise admin lists its own stores only, with the numbers and the filter lists', async () => {
        const res = await get(A.adminToken);
        assert.equal(res.status, 200, JSON.stringify(res.body));
        const d = res.body.data;
        const ids = d.complaints.map((c) => c._id);
        assert.ok(ids.includes(a1) && !ids.includes(b1));
        const c = d.complaints.find((x) => x._id === a1);
        assert.match(c.ticketNumber, /^TKT-[0-9A-F]{6}$/);
        assert.equal(c.status, 'Open');
        assert.equal(c.priority, 'Medium');
        assert.equal(c.category, 'Missing Item');
        assert.equal(c.storeId, A.storeId);
        assert.ok(c.storeName && c.storeName !== 'N/A');
        assert.equal(c.customerName, 'Alice Rao');
        assert.ok(d.stats.openComplaints >= 1);
        assert.deepEqual(d.stores.map((s) => s.id), [A.storeId], 'only its own stores');
        assert.ok(d.categories.includes('Missing Item'));
        assert.equal(JSON.stringify(d).includes('_raw'), false);
    });

    test('filters, search and sorting', async () => {
        assert.equal((await get(A.adminToken, '?status=Resolved')).body.data.complaints.length, 0);
        assert.equal((await get(A.adminToken, '?status=Open')).body.data.complaints.some((c) => c._id === a1), true);
        assert.equal((await get(A.adminToken, '?category=Late%20Delivery')).body.data.complaints.length, 0);
        assert.equal((await get(A.adminToken, '?search=alice')).body.data.complaints.some((c) => c._id === a1), true);
        assert.equal((await get(A.adminToken, '?search=nobody-here')).body.data.complaints.length, 0);
        assert.equal((await get(A.adminToken, `?storeId=${B.storeId}`)).body.data.complaints.length, 0, 'another franchise\'s store returns nothing');
        assert.equal((await get(A.adminToken, '?sortBy=priority&sortOrder=asc&limit=1&page=1')).status, 200);
    });

    test('the super admin sees both franchises', async () => {
        const ids = (await get(fx.SA, '?limit=100')).body.data.complaints.map((c) => c._id);
        assert.ok(ids.includes(a1) && ids.includes(b1));
    });

    test('store staff and customers are refused', async () => {
        for (const token of [A.managerToken, A.customerToken, null]) {
            assert.ok([401, 403].includes((await get(token)).status));
            assert.ok([401, 403].includes((await post(token, `/${a1}/resolve`, { remarks: 'x' })).status));
        }
    });

    test('another franchise\'s complaint is 404 for every action', async () => {
        assert.equal((await get(A.adminToken, `/${b1}`)).status, 404);
        assert.equal((await post(A.adminToken, `/${b1}/resolve`, { remarks: 'ok' })).status, 404);
        assert.equal((await post(A.adminToken, `/${b1}/close`, {})).status, 404);
        assert.equal((await post(A.adminToken, `/${b1}/notes`, { note: 'hi' })).status, 404);
        assert.equal((await get(A.adminToken, '/junk')).status, 404);
    });
});

describe('handling a complaint', () => {
    let id; let orderId;
    before(async () => {
        orderId = await newOrder(A, 600);
        id = (await raise(A, orderId, 'Food Quality', 'Pizza was cold')).body.data.ticket._id;
    });

    test('details: the customer, the order and a first timeline entry', async () => {
        const res = await get(A.adminToken, `/${id}`);
        assert.equal(res.status, 200);
        const d = res.body.data;
        assert.equal(d.customer.fullName, 'Alice Rao');
        assert.equal(d.order.amount, 600);
        assert.equal(d.order.items[0].name, 'Margherita');
        assert.equal(d.logs.at(-1).action, 'Complaint Created');
        assert.deepEqual(d.notes, []);
    });

    test('escalation, assignment, SLA and the placeholder customer fields are gone', async () => {
        // the route is gone: it falls through to the super-admin-only routes below it, so a franchise admin gets a refusal
        assert.ok([403, 404].includes((await post(A.adminToken, `/${id}/escalate`, { escalateTo: 'HQ' })).status), 'no escalate route');
        assert.ok([403, 404].includes((await post(A.adminToken, `/${id}/assign`, { assignedTo: 'Anyone' })).status), 'no assign route');
        assert.equal((await get(A.adminToken, `/${id}`)).body.data.status, 'Open', 'and nothing changed');
        const d = (await get(A.adminToken, `/${id}`)).body.data;
        const list = (await get(A.adminToken)).body.data;
        for (const key of ['escalated', 'escalatedTo', 'handlingTimeHours', 'assignedTo']) assert.ok(!(key in d), key);
        assert.ok(!('assignees' in list), 'no list of people to assign to');
        for (const key of ['isVerified', 'loyaltyPoints', 'tags']) assert.ok(!(key in d.customer), key);
        for (const key of ['escalated', 'avgResolutionTimeHours']) assert.ok(!(key in list.stats), key);
        assert.equal((await get(A.adminToken, '?status=Escalated')).body.data.complaints.length, 0, 'there is no Escalated status');
    });

    test('notes: added, listed (newest first), removed; only the desk sees them', async () => {
        assert.equal((await post(A.adminToken, `/${id}/notes`, { note: '   ' })).status, 400);
        await post(A.adminToken, `/${id}/notes`, { note: 'Called the customer' });
        const res = await post(A.adminToken, `/${id}/notes`, { note: 'Sent a coupon' });
        assert.equal(res.status, 201);
        assert.deepEqual(res.body.data.notes.map((n) => n.note), ['Sent a coupon', 'Called the customer']);
        const customer = await fx.call('GET', '/v1/food/user/support/my-tickets', A.customerToken);
        assert.equal(JSON.stringify(customer.body).includes('Called the customer'), false, 'internal notes never reach the customer');
        const del = await fx.call('DELETE', `${D}/${id}/notes/${res.body.data.notes[1]._id}`, A.adminToken);
        assert.equal(del.status, 200);
        assert.deepEqual(del.body.data.notes.map((n) => n.note), ['Sent a coupon']);
        assert.equal((await fx.call('DELETE', `${D}/${id}/notes/${new mongoose.Types.ObjectId()}`, A.adminToken)).status, 404);
    });

    test('close needs a resolution first', async () => {
        assert.equal((await post(A.adminToken, `/${id}/close`, { closingRemarks: 'done' })).status, 400);
    });

    test('resolve: validates, records the promised refund, and the customer reads the outcome', async () => {
        assert.equal((await post(A.adminToken, `/${id}/resolve`, {})).status, 400, 'remarks are required');
        assert.equal((await post(A.adminToken, `/${id}/resolve`, { resolutionType: 'Refund', refundAmount: 9999, remarks: 'Refunded' })).status, 400, 'more than the order total');
        assert.equal((await post(A.adminToken, `/${id}/resolve`, { resolutionType: 'Refund', refundAmount: -5, remarks: 'x' })).status, 400);
        const res = await post(A.adminToken, `/${id}/resolve`, { resolutionType: 'Refund', refundAmount: 250, remarks: 'Refund of 250 for the cold pizza' });
        assert.equal(res.status, 200, JSON.stringify(res.body));
        assert.equal(res.body.data.status, 'Resolved');
        assert.match(res.body.data.resolution, /Refund: Refund of 250/);
        assert.ok(res.body.data.logs.some((l) => l.action === 'Refund Promised' && l.newValue === '₹250'));
        // once
        assert.equal((await post(A.adminToken, `/${id}/resolve`, { remarks: 'again' })).status, 400);
        // the customer sees how it was resolved, with the refund, and no internal fields
        const mine = (await fx.call('GET', '/v1/food/user/support/my-tickets', A.customerToken)).body.data.tickets.find((t) => t._id === id);
        assert.equal(mine.status, 'resolved');
        assert.equal(mine.resolution.refundAmount, 250);
        assert.match(mine.resolution.actionTaken, /cold pizza/);
        assert.equal('notes' in mine, false);
        // the store manager's screen shows it resolved, and cannot resolve it again
        assert.equal((await fx.call('GET', `/v1/food/store/complaints/${id}`, A.managerToken)).body.data.status, 'resolved');
        assert.equal((await fx.call('PUT', `/v1/food/store/complaints/${id}/resolve`, A.managerToken, { actionTaken: 'again' })).status, 400);
    });

    test('close and lock: once, then nothing more can be done', async () => {
        const res = await post(A.adminToken, `/${id}/close`, { closingRemarks: 'Customer happy' });
        assert.equal(res.status, 200);
        assert.equal(res.body.data.status, 'Closed');
        assert.equal((await post(A.adminToken, `/${id}/close`, {})).status, 400);
        assert.equal((await post(A.adminToken, `/${id}/notes`, { note: 'x' })).status, 201, 'notes can still be added');
        assert.equal((await get(A.adminToken, '?status=Closed')).body.data.complaints.some((c) => c._id === id), true);
    });
});

describe('a coupon resolution', () => {
    test('records the coupon code; a refund needs an order', async () => {
        const id = (await raise(A, await newOrder(A), 'Late Delivery', 'Arrived an hour late')).body.data.ticket._id;
        const res = await post(A.adminToken, `/${id}/resolve`, { resolutionType: 'Coupon Compensation', couponCode: 'SORRY100', remarks: 'Coupon sent' });
        assert.equal(res.status, 200);
        const mine = (await fx.call('GET', '/v1/food/user/support/my-tickets', A.customerToken)).body.data.tickets.find((t) => t._id === id);
        assert.equal(mine.resolution.couponIssued, 'SORRY100');
    });
});

describe('proof photos on a complaint', () => {
    const good = (n) => `https://res.cloudinary.com/test/image/upload/v1/customers/uploads/proof${n}.jpg`;
    let id;
    test('only our own uploads are kept (no other sites, no other folders, no repeats), at most three', async () => {
        const res = await fx.call('POST', '/v1/food/user/support/ticket', A.customerToken, {
            type: 'order', orderId: await newOrder(A), issueType: 'Food Quality', description: 'Burnt base, see photos',
            images: [good(1), good(1), 'https://evil.example/track.png', 'http://res.cloudinary.com/test/image/upload/v1/customers/uploads/x.jpg',
                'https://res.cloudinary.com/other/image/upload/v1/customers/uploads/x.jpg', 'https://res.cloudinary.com/test/image/upload/v1/stores/uploads/x.jpg', 'javascript:alert(1)', 42, good(2), good(3), good(4)],
        });
        assert.equal(res.status, 201, JSON.stringify(res.body));
        id = res.body.data.ticket._id;
        assert.deepEqual(res.body.data.ticket.images, [good(1), good(2), good(3)]);
    });
    test('a complaint without photos still works, and a non-list is ignored', async () => {
        const a = await fx.call('POST', '/v1/food/user/support/ticket', A.customerToken, { type: 'order', orderId: await newOrder(A), issueType: 'Late Delivery', description: 'Very late' });
        assert.equal(a.status, 201);
        assert.deepEqual(a.body.data.ticket.images, []);
        const b = await fx.call('POST', '/v1/food/user/support/ticket', A.customerToken, { type: 'order', orderId: await newOrder(A), issueType: 'Late Delivery', description: 'Very late', images: 'not-a-list' });
        assert.equal(b.status, 201);
        assert.deepEqual(b.body.data.ticket.images, []);
    });
    test('the customer, the store and the franchise desk all see the photos', async () => {
        const mine = (await fx.call('GET', '/v1/food/user/support/my-tickets', A.customerToken)).body.data.tickets.find((t) => t._id === id);
        assert.deepEqual(mine.images, [good(1), good(2), good(3)]);
        const store = await fx.call('GET', `/v1/food/store/complaints/${id}`, A.managerToken);
        assert.deepEqual(store.body.data.images, [good(1), good(2), good(3)]);
        const desk = await get(A.adminToken, `/${id}`);
        assert.deepEqual(desk.body.data.attachments, [good(1), good(2), good(3)]);
    });
});

describe('the customer email', () => {
    // Customers who sign in with a mobile number and OTP have no email on the account: it is on their profile and orders
    const otpCustomer = async (tag) => {
        const user = await fx.models.User.create({ mobile: `6${String(fx.ts).slice(-8)}${tag}`, loginType: 'OTP', primaryRole: fx.roles.CUSTOMER._id, isActive: true });
        return { user, token: fx.tokenFor(user, 'CUSTOMER') };
    };
    const orderFor = async (user, email) => {
        const ref = `EM${fx.ts}${Math.floor(Math.random() * 1e6)}`;
        const r = await fx.models.FoodOrder.collection.insertOne({
            order_id: ref, orderId: ref, userId: user._id, storeId: new mongoose.Types.ObjectId(A.storeId), franchiseId: new mongoose.Types.ObjectId(A.franchiseId),
            orderStatus: 'delivered', payment: { method: 'cash', status: 'paid' }, pricing: { subtotal: 300, total: 300 },
            deliveryAddress: { street: '1 Test Rd', city: 'Pune', state: 'MH' }, customerName: 'Rashi', customerPhone: '9300990940', ...(email ? { customerEmail: email } : {}),
            items: [{ itemId: 'x', name: 'Margherita', quantity: 1, size: 'Medium', price: 300 }], statusHistory: [], createdAt: new Date(Date.now() - 3600000), updatedAt: new Date(),
        });
        return String(r.insertedId);
    };
    const complain = async (c, orderId) => (await fx.call('POST', '/v1/food/user/support/ticket', c.token, { type: 'order', orderId, issueType: 'Food Quality', description: 'Cold pizza' })).body.data.ticket._id;

    test('shown from the profile when the account has none (franchise desk and store screen)', async () => {
        const c = await otpCustomer(1);
        await fx.models.User.db.collection('profiles').insertOne({ userId: c.user._id, firstName: 'Rashi', email: 'rashi123@gmail.com' });
        const id = await complain(c, await orderFor(c.user, ''));
        assert.equal((await get(A.adminToken, `/${id}`)).body.data.customer.email, 'rashi123@gmail.com');
        const store = await fx.call('GET', `/v1/food/store/complaints/${id}`, A.managerToken);
        assert.equal(store.body.data.customerEmail, 'rashi123@gmail.com');
    });

    test('and from the latest order that has one when there is no profile email', async () => {
        const c = await otpCustomer(2);
        const id = await complain(c, await orderFor(c.user, 'from.order@example.com'));
        assert.equal((await get(A.adminToken, `/${id}`)).body.data.customer.email, 'from.order@example.com');
        assert.equal((await fx.call('GET', `/v1/food/store/complaints/${id}`, A.managerToken)).body.data.customerEmail, 'from.order@example.com');
    });

    test('empty when the customer never gave one', async () => {
        const c = await otpCustomer(3);
        const id = await complain(c, await orderFor(c.user, ''));
        assert.equal((await get(A.adminToken, `/${id}`)).body.data.customer.email, '');
    });
});
