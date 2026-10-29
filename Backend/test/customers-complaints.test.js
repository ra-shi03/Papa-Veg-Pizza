// Store manager panel: customers, complaints, reviews (/v1/food/store/customers | complaints | reviews),
// and the franchise scoping of the admin complaints and customers endpoints.
//
//   store manager      -> own store; replies to reviews, responds to and resolves complaints; full phone (the
//                         Customers screens mask the email, complaints and reviews show it)
//   kitchen supervisor -> own store, read only, phone and email masked
//   franchise admin, super admin -> Customers screens read only via ?storeId= (nearby-people.test.js)
//   kitchen staff, customers -> 403 on the store screens; franchise / super admin -> 403 on complaints and reviews
//   another store / franchise -> 404
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose, PASSWORD } from './helpers/fixture.js';

let fx; let A; let B;
let sup; let chef; let bSup;          // { id, token }
let both;                             // a customer who ordered at A and at B: { id, token, mobile, email }
let phoneSeq = 0; let orderSeq = 0;
const orders = {};                    // name -> { id, ref }

const login = async (email) => (await fx.call('POST', '/v1/auth/store/login', null, { email, password: PASSWORD })).body.data.accessToken;
const makeStaff = async (managerToken, role, tag) => {
    const email = `${tag}${fx.ts}@example.invalid`;
    const res = await fx.call('POST', '/v1/food/store/staff', managerToken, { fullName: `Name ${tag}`, email, phone: `7${String(++phoneSeq).padStart(2, '0')}${String(fx.ts).slice(-7)}`, password: PASSWORD, role });
    assert.equal(res.status, 201, `create ${tag}: ${JSON.stringify(res.body)}`);
    return { id: res.body.data.userId, token: await login(email) };
};
/** An order at store `f` for customer `userId`. */
async function order(f, userId, { total = 400, status = 'delivered', rating, comment = '', name = 'Test Customer', phone = '9000000000', daysAgo = 1, items } = {}) {
    const ref = `CC${fx.ts}${orderSeq++}`;
    const doc = {
        order_id: ref, orderId: ref, userId: new mongoose.Types.ObjectId(userId), storeId: new mongoose.Types.ObjectId(f.storeId), franchiseId: new mongoose.Types.ObjectId(f.franchiseId),
        orderStatus: status, payment: { method: 'cash', status: status === 'delivered' ? 'paid' : 'cod_pending' }, pricing: { subtotal: total, total },
        deliveryAddress: { street: '1 Test Rd', city: 'Pune', state: 'MH' }, customerName: name, customerPhone: phone,
        items: items || [{ itemId: 'x', name: 'Margherita', quantity: 2, size: 'Medium', price: total / 2 }],
        statusHistory: [{ at: new Date(), byRole: 'SYSTEM', from: '', to: 'created', note: 'Order placed' }],
        createdAt: new Date(Date.now() - daysAgo * 86400000), updatedAt: new Date(),
    };
    if (rating) doc.ratings = { store: { rating, comment, ratedAt: new Date(Date.now() - daysAgo * 86400000) } };
    const r = await fx.models.FoodOrder.collection.insertOne(doc);
    return { id: String(r.insertedId), ref };
}

const S = '/v1/food/store';
const get = (token, path) => fx.call('GET', `${S}${path}`, token);
const MGR_A = () => A.managerToken;
const MGR_B = () => B.managerToken;

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    sup = await makeStaff(A.managerToken, 'Kitchen Supervisor', 'ccsup');
    chef = await makeStaff(A.managerToken, 'Pizza Maker', 'ccchef');
    bSup = await makeStaff(B.managerToken, 'Kitchen Supervisor', 'ccbsup');

    const user = await fx.models.User.create({ mobile: `8${String(fx.ts).slice(-9)}`, email: `both${fx.ts}@example.invalid`, loginType: 'OTP', primaryRole: fx.roles.CUSTOMER._id, isActive: true });
    both = { id: String(user._id), token: fx.tokenFor(user, 'CUSTOMER'), mobile: user.mobile, email: user.email };
    await fx.models.User.updateOne({ _id: A.customerId }, { $set: { email: `alice${fx.ts}@example.invalid` } });

    // Store A: Alice (A's customer) orders 3 times (one rated 5, one rated 2), "both" twice. Store B: Bob once, "both" once.
    orders.a1 = await order(A, A.customerId, { total: 3000, rating: 5, comment: 'Lovely pizza', name: 'Alice Rao', phone: '9876543210', daysAgo: 3 });
    orders.a2 = await order(A, A.customerId, { total: 2500, rating: 2, comment: 'Cold and late', name: 'Alice Rao', phone: '9876543210', daysAgo: 2 });
    orders.a3 = await order(A, A.customerId, { total: 500, status: 'preparing', name: 'Alice Rao', phone: '9876543210', daysAgo: 0 });
    orders.ab1 = await order(A, both.id, { total: 300, name: 'Both Kumar', phone: both.mobile, daysAgo: 5 });
    orders.ab2 = await order(A, both.id, { total: 200, rating: 3, name: 'Both Kumar', phone: both.mobile, daysAgo: 4 });
    orders.b1 = await order(B, B.customerId, { total: 999, rating: 4, comment: 'Good', name: 'Bob Das', phone: '9123456780', daysAgo: 1 });
    orders.bb1 = await order(B, both.id, { total: 7000, name: 'Both Kumar', phone: both.mobile, daysAgo: 1 });
});
after(async () => { await fx?.teardown(); });

const raiseComplaint = (customerToken, orderId, issueType = 'Missing Items', description = 'Garlic bread was missing') =>
    fx.call('POST', '/v1/food/user/support/ticket', customerToken, { type: 'order', orderId, issueType, description });

describe('who may open the store screens', () => {
    const paths = ['/customers/orders', '/complaints', '/reviews'];
    for (const path of paths) {
        test(`GET ${S}${path}: anonymous 401; kitchen staff, customers (and admins outside Customers) 403; manager and supervisor 200`, async () => {
            assert.equal((await fx.call('GET', `${S}${path}`)).status, 401);
            const refused = path === '/customers/orders' ? [chef.token, A.customerToken] : [chef.token, A.customerToken, A.adminToken, fx.SA];
            for (const token of refused) assert.equal((await get(token, path)).status, 403, path);
            assert.equal((await get(MGR_A(), path)).status, 200);
            assert.equal((await get(sup.token, path)).status, 200);
        });
    }
});

describe('customers', () => {
    const list = async (token, qs = '') => (await get(token, `/customers/orders?limit=50${qs}`)).body.data;

    test('a store sees only its own customers, with totals from its own orders', async () => {
        const a = await list(MGR_A());
        assert.deepEqual(Object.keys(a.pagination).sort(), ['limit', 'page', 'pages', 'total']);
        const ids = a.customers.map((c) => c._id).sort();
        assert.deepEqual(ids, [A.customerId, both.id].sort());
        const alice = a.customers.find((c) => c._id === A.customerId);
        assert.equal(alice.name, 'Alice Rao');
        // the shared fixture also gives Alice one ₹100 order at store A
        assert.equal(alice.totalOrders, 4);
        assert.equal(alice.totalSpent, 6100);
        assert.equal(alice.recentOrder.orderNumber, orders.a3.ref);
        assert.equal(alice.recentOrder.orderStatus, 'preparing');
        const bothAtA = a.customers.find((c) => c._id === both.id);
        assert.equal(bothAtA.totalOrders, 2, 'only the orders at store A');
        assert.equal(bothAtA.totalSpent, 500);
        const b = await list(MGR_B());
        assert.deepEqual(b.customers.map((c) => c._id).sort(), [B.customerId, both.id].sort());
        assert.equal(b.customers.find((c) => c._id === both.id).totalSpent, 7000);
    });
    test('the manager sees the full phone and a masked email; the supervisor sees both masked', async () => {
        const full = (await list(MGR_A())).customers.find((c) => c._id === A.customerId);
        assert.equal(full.email, 'a***@example.invalid');
        assert.match(full.mobile, /^\d{10,11}$/);
        const masked = (await list(sup.token)).customers.find((c) => c._id === A.customerId);
        assert.match(masked.mobile, /^\d{2}\*{6,7}\d{2}$/);
        assert.equal(masked.email, 'a***@example.invalid');
        assert.equal(masked.name, 'Alice Rao');
    });
    test('filters, sorting and pagination', async () => {
        assert.deepEqual((await list(MGR_A(), '&search=alice')).customers.map((c) => c._id), [A.customerId]);
        assert.deepEqual((await list(MGR_A(), '&highValue=true')).customers.map((c) => c._id), [A.customerId]);
        assert.equal((await list(MGR_A(), '&returning=true')).customers.length, 2);
        assert.deepEqual((await list(MGR_A(), '&status=preparing')).customers.map((c) => c._id), [A.customerId]);
        assert.equal((await list(MGR_A(), '&sortBy=totalOrders&sortOrder=desc')).customers[0]._id, A.customerId);
        const page = (await get(MGR_A(), '/customers/orders?limit=1&page=2')).body.data;
        assert.equal(page.customers.length, 1);
        assert.equal(page.pagination.pages, 2);
    });
    test('profile: only a customer of this store; supervisor masked; bad ids 404', async () => {
        const res = await get(MGR_A(), `/customers/${A.customerId}`);
        assert.equal(res.status, 200);
        const d = res.body.data;
        assert.equal(d.customerProfile.totalOrders, 4);
        assert.equal(d.recentOrders.length, 4);
        assert.equal(d.reviews.length, 2);
        assert.ok(Array.isArray(d.complaints));
        assert.equal((await get(MGR_A(), `/customers/${B.customerId}`)).status, 404, 'never ordered at A');
        assert.equal((await get(MGR_B(), `/customers/${A.customerId}`)).status, 404);
        assert.equal((await get(MGR_A(), '/customers/not-an-id')).status, 404);
        const viaB = (await get(MGR_B(), `/customers/${both.id}`)).body.data;
        assert.equal(viaB.recentOrders.length, 1, 'B only sees its own orders of a shared customer');
        assert.match((await get(sup.token, `/customers/${A.customerId}`)).body.data.customerProfile.mobile, /\*/);
    });
    test('order details: own store only, in the screen\'s shape', async () => {
        const res = await get(MGR_A(), `/customers/orders/${orders.a1.id}`);
        assert.equal(res.status, 200);
        const d = res.body.data;
        assert.equal(d.order.orderNumber, orders.a1.ref);
        assert.equal(d.order.totalAmount, 3000);
        assert.equal(d.order.customerName, 'Alice Rao');
        assert.equal(d.order.customerMobile, '9876543210');
        assert.equal(d.items[0].name, 'Margherita');
        assert.equal(d.items[0].subtotal, 3000);
        assert.equal(d.payments[0].amount, 3000);
        assert.ok(Array.isArray(d.deliveryTracking) && Array.isArray(d.refunds));
        assert.equal((await get(sup.token, `/customers/orders/${orders.a1.id}`)).body.data.order.customerMobile, '98******10');
        for (const [token, id] of [[MGR_A(), orders.b1.id], [MGR_B(), orders.a1.id], [sup.token, orders.bb1.id]]) assert.equal((await get(token, `/customers/orders/${id}`)).status, 404);
    });
});

describe('complaints', () => {
    let aComplaint; let bComplaint;
    before(async () => {
        const a = await raiseComplaint(A.customerToken, orders.a2.id, 'Missing Items', 'Garlic bread was missing');
        assert.equal(a.status, 201, JSON.stringify(a.body));
        aComplaint = a.body.data.ticket._id;
        const b = await raiseComplaint(B.customerToken, orders.b1.id, 'Late Delivery', 'Came 40 minutes late');
        bComplaint = b.body.data.ticket._id;
    });
    const list = async (token, qs = '') => (await get(token, `/complaints?limit=50${qs}`)).body.data;

    test('a complaint about an order lands with that order\'s store only, in the screen\'s shape', async () => {
        const a = await list(MGR_A());
        assert.deepEqual(a.complaints.map((c) => c._id), [aComplaint]);
        const c = a.complaints[0];
        assert.equal(c.complaintType, 'missing_items');
        assert.equal(c.status, 'pending');
        assert.equal(c.priority, 'medium');
        assert.equal(c.customerName, 'Alice Rao');
        assert.equal(c.orderNumber, orders.a2.ref);
        assert.equal(c.customerEmail, `alice${fx.ts}@example.invalid`);
        assert.deepEqual(Object.keys(a.pagination).sort(), ['limit', 'page', 'pages', 'total']);
        assert.deepEqual((await list(MGR_B())).complaints.map((x) => x._id), [bComplaint]);
        const masked = (await list(sup.token)).complaints[0];
        assert.equal(masked.customerEmail, 'a***@example.invalid');
        assert.match(masked.customerMobile, /\*/);
    });
    test('filters', async () => {
        assert.equal((await list(MGR_A(), '&complaintType=missing_items')).complaints.length, 1);
        assert.equal((await list(MGR_A(), '&complaintType=late_delivery')).complaints.length, 0);
        assert.equal((await list(MGR_A(), '&status=pending')).complaints.length, 1);
        assert.equal((await list(MGR_A(), '&status=resolved')).complaints.length, 0);
        assert.equal((await list(MGR_A(), '&search=garlic')).complaints.length, 1);
        assert.equal((await list(MGR_A(), `&search=${orders.a2.ref}`)).complaints.length, 1);
    });
    test('details: own store only; includes the customer and the order', async () => {
        const res = await get(MGR_A(), `/complaints/${aComplaint}`);
        assert.equal(res.status, 200);
        assert.equal(res.body.data.customer._id, A.customerId);
        assert.equal(res.body.data.order.orderNumber, orders.a2.ref);
        assert.equal(res.body.data.order.items[0].name, 'Margherita');
        assert.equal((await get(sup.token, `/complaints/${aComplaint}`)).status, 200);
        for (const [token, id] of [[MGR_B(), aComplaint], [bSup.token, aComplaint], [MGR_A(), bComplaint], [MGR_A(), 'junk'], [MGR_A(), '64b000000000000000000001']]) {
            assert.equal((await get(token, `/complaints/${id}`)).status, 404, `${id}`);
        }
    });
    test('respond: manager only; moves it to investigating; other store 404', async () => {
        const respond = (token, id = aComplaint, message = 'Sorry! We are checking with the kitchen.') => fx.call('POST', `${S}/complaints/${id}/respond`, token, { message });
        assert.equal((await respond(sup.token)).status, 403);
        assert.equal((await respond(chef.token)).status, 403);
        assert.equal((await respond(MGR_B())).status, 404);
        assert.equal((await respond(MGR_A(), aComplaint, '')).status, 400);
        const res = await respond(MGR_A());
        assert.equal(res.status, 200, JSON.stringify(res.body));
        assert.equal(res.body.data.status, 'investigating');
        assert.equal(res.body.data.responses[0].byRole, 'Store Manager');
        assert.equal((await list(MGR_A(), '&status=investigating')).complaints.length, 1);
    });
    test('resolve: manager only; validates; records the promised refund without moving money; once', async () => {
        const resolve = (token, body, id = aComplaint) => fx.call('PUT', `${S}/complaints/${id}/resolve`, token, body);
        const good = { actionTaken: 'Refunded the garlic bread and issued a coupon', refundAmount: 120, couponIssued: 'SORRY50', evidenceImage: 'https://evil.example/x.png', staff: 'Someone Else' };
        assert.equal((await resolve(sup.token, good)).status, 403);
        assert.equal((await resolve(chef.token, good)).status, 403);
        assert.equal((await resolve(MGR_B(), good)).status, 404);
        assert.equal((await resolve(MGR_A(), { ...good, actionTaken: '' })).status, 400);
        assert.equal((await resolve(MGR_A(), { ...good, refundAmount: -5 })).status, 400);
        assert.equal((await resolve(MGR_A(), { ...good, refundAmount: 999999 })).status, 400, 'more than the order total');
        const res = await resolve(MGR_A(), good);
        assert.equal(res.status, 200, JSON.stringify(res.body));
        const c = res.body.data;
        assert.equal(c.status, 'resolved');
        assert.equal(c.resolution.refundAmount, 120);
        assert.equal(c.resolution.couponIssued, 'SORRY50');
        assert.equal(c.resolution.evidenceImage, '', 'only our own Cloudinary images');
        assert.notEqual(c.resolution.resolvedBy, 'Someone Else');
        assert.equal(c.resolvedBy, c.resolution.resolvedBy);
        const o = await fx.models.FoodOrder.findById(orders.a2.id).lean();
        assert.equal(o.payment.status, 'paid', 'no money moved');
        assert.equal(await mongoose.connection.collection('refunds').countDocuments({ orderId: new mongoose.Types.ObjectId(orders.a2.id) }), 0);
        assert.equal((await resolve(MGR_A(), good)).status, 400, 'twice');
        assert.equal((await fx.call('POST', `${S}/complaints/${aComplaint}/respond`, MGR_A(), { message: 'more' })).status, 400, 'already resolved');
    });
    test('the customer profile lists the customer\'s complaints at this store', async () => {
        const d = (await get(MGR_A(), `/customers/${A.customerId}`)).body.data;
        assert.deepEqual(d.complaints.map((c) => c._id), [aComplaint]);
    });
});

describe('reviews', () => {
    const list = async (token, qs = '') => (await get(token, `/reviews?limit=50${qs}`)).body.data;

    test('a store sees only reviews of its own orders, with sentiment from the rating', async () => {
        const a = await list(MGR_A());
        assert.deepEqual(a.reviews.map((r) => r._id).sort(), [orders.a1.id, orders.a2.id, orders.ab2.id].sort());
        const r1 = a.reviews.find((r) => r._id === orders.a1.id);
        assert.equal(r1.rating, 5);
        assert.equal(r1.reviewText, 'Lovely pizza');
        assert.equal(r1.sentiment, 'Positive');
        assert.equal(a.reviews.find((r) => r._id === orders.a2.id).sentiment, 'Negative');
        assert.equal(a.reviews.find((r) => r._id === orders.ab2.id).sentiment, 'Neutral');
        assert.equal(r1.orderNumber, orders.a1.ref);
        assert.deepEqual((await list(MGR_B())).reviews.map((r) => r._id), [orders.b1.id]);
        assert.match((await list(sup.token)).reviews.find((r) => r._id === orders.a1.id).customerMobile, /\*/);
    });
    test('filters', async () => {
        assert.equal((await list(MGR_A(), '&rating=5 Stars')).reviews.length, 1);
        assert.equal((await list(MGR_A(), '&sentiment=Negative')).reviews.length, 1);
        assert.equal((await list(MGR_A(), '&replyStatus=pending')).reviews.length, 3);
        assert.equal((await list(MGR_A(), '&replyStatus=replied')).reviews.length, 0);
        assert.equal((await list(MGR_A(), '&search=cold')).reviews.length, 1);
    });
    test('details: own store only; unrated orders are not reviews', async () => {
        const res = await get(MGR_A(), `/reviews/${orders.a1.id}`);
        assert.equal(res.status, 200);
        const d = res.body.data;
        assert.equal(d.review.rating, 5);
        assert.equal(d.customer._id, A.customerId);
        assert.equal(d.order.orderNumber, orders.a1.ref);
        assert.equal(d.orderItems[0].name, 'Margherita');
        assert.equal(d.customerStatistics.totalOrders, 4);
        assert.equal(d.customerStatistics.averageRatingGiven, '3.5');
        for (const [token, id] of [[MGR_B(), orders.a1.id], [MGR_A(), orders.b1.id], [MGR_A(), orders.a3.id], [MGR_A(), 'junk']]) assert.equal((await get(token, `/reviews/${id}`)).status, 404);
    });
    test('reply: manager only; the reply is shown and the filters follow', async () => {
        const reply = (token, id = orders.a2.id, text = 'Sorry it arrived cold. Your next order is on us.') => fx.call('POST', `${S}/reviews/${id}/reply`, token, { text, repliedBy: 'Someone Else' });
        assert.equal((await reply(sup.token)).status, 403);
        assert.equal((await reply(chef.token)).status, 403);
        assert.equal((await reply(MGR_B())).status, 404);
        assert.equal((await reply(MGR_A(), orders.a3.id)).status, 404, 'unrated order');
        assert.equal((await reply(MGR_A(), orders.a2.id, '')).status, 400);
        const res = await reply(MGR_A());
        assert.equal(res.status, 200, JSON.stringify(res.body));
        assert.match(res.body.data.reply.repliedBy, /^Store Manager \(/);
        assert.doesNotMatch(res.body.data.reply.repliedBy, /Someone Else/);
        assert.equal((await list(MGR_A(), '&replyStatus=replied')).reviews.length, 1);
        assert.equal((await get(sup.token, `/reviews/${orders.a2.id}`)).body.data.review.reply.text, 'Sorry it arrived cold. Your next order is on us.');
    });
});

describe('admin complaints and customers are franchise-scoped', () => {
    let aTicket; let bTicket;
    before(async () => {
        aTicket = (await raiseComplaint(both.token, orders.ab1.id, 'Wrong Order', 'Got a different pizza')).body.data.ticket._id;
        bTicket = (await raiseComplaint(both.token, orders.bb1.id, 'Food Quality', 'Burnt base')).body.data.ticket._id;
    });
    const ids = async (token, qs = '') => (await fx.call('GET', `/v1/food/admin/stores/complaints?limit=100${qs}`, token)).body.data.complaints.map((c) => String(c._id));

    test('super admin sees every store\'s complaints; a franchise admin only its own', async () => {
        const all = await ids(fx.SA);
        assert.ok(all.includes(aTicket) && all.includes(bTicket));
        const a = await ids(A.adminToken);
        assert.ok(a.includes(aTicket) && !a.includes(bTicket));
        const b = await ids(B.adminToken);
        assert.ok(b.includes(bTicket) && !b.includes(aTicket));
        assert.deepEqual(await ids(A.adminToken, `&storeId=${B.storeId}`), [], 'asking for another franchise\'s store returns nothing');
    });
    test('updating: a franchise admin only its own store\'s complaints (another\'s is 404); store staff and customers 403', async () => {
        const patch = (token, id, body) => fx.call('PATCH', `/v1/food/admin/stores/complaints/${id}`, token, body);
        assert.equal((await patch(A.adminToken, bTicket, { status: 'resolved' })).status, 404);
        assert.equal((await patch(A.adminToken, aTicket, { status: 'nonsense' })).status, 400);
        assert.equal((await patch(A.adminToken, aTicket, { status: 'in-progress', adminResponse: 'Looking into it' })).status, 200);
        assert.equal((await patch(fx.SA, bTicket, { adminResponse: 'Noted' })).status, 200);
        for (const token of [A.managerToken, A.customerToken]) assert.equal((await patch(token, aTicket, { status: 'resolved' })).status, 403);
        assert.equal((await patch(A.adminToken, 'junk', {})).status, 404);
    });
    test('/v1/food/admin/customers/:id: a franchise admin opens only its own stores\' customers', async () => {
        const open = (token, id) => fx.call('GET', `/v1/food/admin/customers/${id}`, token);
        assert.equal((await open(A.adminToken, A.customerId)).status, 200);
        assert.equal((await open(A.adminToken, B.customerId)).status, 404);
        assert.equal((await open(B.adminToken, A.customerId)).status, 404);
        assert.equal((await open(A.adminToken, both.id)).status, 200, 'ordered at A too');
        assert.equal((await open(fx.SA, B.customerId)).status, 200);
    });
});
