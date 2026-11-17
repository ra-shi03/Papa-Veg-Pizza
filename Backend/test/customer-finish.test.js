// Finishing the customer app and the cross-role fixes that customers feel:
// hero banner setting, active-only public categories, Razorpay webhook signature, problem reports and the order chat,
// kitchen item rejection repricing, scheduled orders held until their slot, the OTP SMS brand.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A; let B;
const ok = (res, status = 200) => { assert.equal(res.status, status, JSON.stringify(res.body)); return res.body.data; };

before(async () => { fx = await createFixture(); A = fx.F.A; B = fx.F.B; });
after(async () => { await fx?.teardown(); });

// ---------------------------------------------------------------------------------------------------------------
describe('hero banner (Under 250)', () => {
    const ADMIN = '/v1/settings/hero-banners/under-250';
    const PUBLIC = `${ADMIN}/public`;
    const good = { imageUrl: 'https://res.cloudinary.com/demo/image/upload/hero.jpg', title: 'Pizzas under 250', link: '/user/offers', isActive: true };

    test('public read is empty before anything is saved', async () => {
        assert.equal(ok(await fx.call('GET', PUBLIC, null)), null);
    });

    test('only the super admin writes: anonymous, customer, franchise admin and store manager are refused', async () => {
        assert.equal((await fx.call('PUT', ADMIN, null, good)).status, 401);
        for (const token of [A.customerToken, A.adminToken, A.managerToken]) {
            const res = await fx.call('PUT', ADMIN, token, good);
            assert.ok([401, 403].includes(res.status), `status ${res.status}`);
        }
        assert.equal((await fx.call('GET', ADMIN, A.adminToken)).status, 403);
        assert.equal(ok(await fx.call('GET', PUBLIC, null)), null, 'nothing was saved by the refused writes');
    });

    test('validation: https image, app path or https link, an active banner needs an image, unknown key', async () => {
        const bad = [
            { ...good, imageUrl: 'http://example.com/a.jpg' },
            { ...good, imageUrl: 'javascript:alert(1)' },
            { ...good, link: 'javascript:alert(1)' },
            { ...good, link: '//evil.example.com' },
            { ...good, title: 'x'.repeat(81) },
            { ...good, imageUrl: '' },
        ];
        for (const body of bad) assert.equal((await fx.call('PUT', ADMIN, fx.SA, body)).status, 400, JSON.stringify(body));
        assert.equal((await fx.call('PUT', '/v1/settings/hero-banners/gourmet', fx.SA, good)).status, 400, 'Gourmet is gone');
    });

    test('the super admin saves it; the public read has display fields only, and updates at once', async () => {
        const saved = ok(await fx.call('PUT', ADMIN, fx.SA, { ...good, createdAt: 'x', _id: 'y', updatedByName: 'hacker' }));
        assert.equal(saved.imageUrl, good.imageUrl);
        assert.notEqual(saved.updatedByName, 'hacker', 'audit fields are not taken from the body');
        const pub = ok(await fx.call('GET', PUBLIC, null));
        assert.deepEqual(Object.keys(pub).sort(), ['imageUrl', 'link', 'title']);
        assert.deepEqual(pub, { imageUrl: good.imageUrl, title: good.title, link: good.link });
        ok(await fx.call('PUT', ADMIN, fx.SA, { ...good, title: 'New title' }));
        assert.equal(ok(await fx.call('GET', PUBLIC, null)).title, 'New title', 'the cache is cleared on save');
    });

    test('switched off means no banner for customers', async () => {
        ok(await fx.call('PUT', ADMIN, fx.SA, { ...good, isActive: false }));
        assert.equal(ok(await fx.call('GET', PUBLIC, null)), null);
    });
});

// ---------------------------------------------------------------------------------------------------------------
describe('public categories', () => {
    test('only active categories; the full list is not public', async () => {
        const { CategoryProduct } = await import('../src/modules/food/admin/models/categoryProduct.model.js');
        await CategoryProduct.create({ label: 'Active Pizzas', status: 'Active' });
        await CategoryProduct.create({ label: 'Hidden Pizzas', status: 'Inactive' });
        for (const path of ['/v1/food/categories/public', '/v1/food/admin/category-products/public', '/v1/food/admin/categories/public']) {
            const res = await fx.call('GET', path, null);
            assert.equal(res.status, 200, path);
            const labels = (res.body.data || []).map((c) => c.label);
            assert.ok(labels.includes('Active Pizzas'), path);
            assert.ok(!labels.includes('Hidden Pizzas'), `${path} listed an inactive category`);
        }
    });
});

// ---------------------------------------------------------------------------------------------------------------
describe('Razorpay webhook signature', () => {
    const SECRET = 'whsec_test_secret';
    let helper;
    const send = (raw, signature) => {
        let r = fx.api.post('/api/v1/payments/webhook/razorpay').set('Content-Type', 'application/json');
        if (signature !== undefined) r = r.set('X-Razorpay-Signature', signature);
        return r.send(raw);
    };

    before(async () => {
        helper = await import('../src/modules/food/orders/helpers/razorpay.helper.js');
        helper.setRazorpayCredentials({ keyId: 'rzp_test', keySecret: 'sk', webhookSecret: SECRET });
    });
    after(() => helper.setRazorpayCredentials(null));

    test('a correct signature is accepted; wrong, short, long and missing signatures are 400, never a crash', async () => {
        const raw = JSON.stringify({ event: 'payment.unknown', payload: {} });
        const good = crypto.createHmac('sha256', SECRET).update(raw).digest('hex');
        assert.equal((await send(raw, good)).status, 200);
        for (const sig of [good.replace(/.$/, good.endsWith('0') ? '1' : '0'), good.slice(0, 10), `${good}00`, '', 'x']) {
            assert.equal((await send(raw, sig)).status, 400, `signature ${sig.slice(0, 12)}`);
        }
        assert.equal((await send(raw, undefined)).status, 400);
    });

    test('the comparison is constant-time (source check)', () => {
        const src = readFileSync('src/core/payments/controllers/razorpayWebhook.controller.js', 'utf8');
        assert.ok(!/expected\s*!==\s*signature/.test(src));
        assert.match(src, /safeEqual\(expected, signature\)/);
    });
});

// ---------------------------------------------------------------------------------------------------------------
describe('report a problem and the order chat', () => {
    const T = '/v1/food/user/support/ticket';
    const insert = async (key, { status = 'delivered', ago = 5 * 60000, f = A } = {}) => {
        const at = new Date(Date.now() - ago);
        const r = await fx.models.FoodOrder.collection.insertOne({
            order_id: `RP${key}${fx.ts}`, orderId: `RP${key}${fx.ts}`, userId: new mongoose.Types.ObjectId(f.customerId), storeId: new mongoose.Types.ObjectId(f.storeId),
            franchiseId: new mongoose.Types.ObjectId(f.franchiseId), orderStatus: status, payment: { method: 'cash', status: 'paid' },
            pricing: { subtotal: 300, total: 300 }, deliveryAddress: { street: '1 Rd', city: 'Pune', state: 'MH' }, customerName: 'C', customerPhone: '9000000000',
            items: [{ itemId: 'x', name: 'Margherita', quantity: 1, size: 'Medium', price: 300 }], statusHistory: [], createdAt: at, updatedAt: at,
        });
        return String(r.insertedId);
    };
    const report = (orderId, body = {}, token = A.customerToken) => fx.call('POST', T, token, { type: 'order', orderId, issueType: 'Missing item', description: 'No garlic bread', ...body });

    test('a just-delivered order can be reported once; a second open report is 409 with the first one to continue', async () => {
        const id = await insert('a');
        const first = ok(await report(id), 201);
        const again = await report(id);
        assert.equal(again.status, 409, JSON.stringify(again.body));
        assert.equal(again.body.data.ticketId, first.ticket._id);
    });

    test('delivered more than 24 hours ago, cancelled, and not-yours are refused; an order still on its way is fine', async () => {
        const old = await insert('old', { ago: 25 * 3600000 });
        const res = await report(old);
        assert.equal(res.status, 400);
        assert.match(res.body.message, /24 hours/);
        assert.equal((await report(await insert('c', { status: 'cancelled_by_user' }))).status, 400);
        assert.equal((await report(await insert('b', { f: B }))).status, 404);
        assert.equal((await report(await insert('road', { status: 'picked_up' }), { issueType: 'Late delivery' })).status, 201);
    });

    test('at most three reports per order', async () => {
        const id = await insert('many');
        for (let i = 0; i < 3; i++) {
            const t = ok(await report(id, { issueType: `Other ${i}` }), 201).ticket;
            ok(await fx.call('PUT', `/v1/food/store/complaints/${t._id}/resolve`, A.managerToken, { actionTaken: 'Sorted' }));
        }
        assert.equal((await report(id)).status, 400);
    });

    test('the chat: the customer writes, the store answers, others see nothing; a resolved report is closed', async () => {
        const id = await insert('chat');
        const t = ok(await report(id), 201).ticket;
        const M = `/v1/food/user/support/ticket/${t._id}/messages`;
        assert.equal((await fx.call('POST', M, A.customerToken, { message: '   ' })).status, 400);
        ok(await fx.call('POST', M, A.customerToken, { message: 'It was the large one' }), 201);
        assert.equal((await fx.call('POST', M, B.customerToken, { message: 'hi' })).status, 404, "another customer's report");
        assert.equal((await fx.call('POST', M, null, { message: 'hi' })).status, 401);
        assert.ok([401, 403].includes((await fx.call('POST', M, A.managerToken, { message: 'hi' })).status));
        ok(await fx.call('POST', `/v1/food/store/complaints/${t._id}/respond`, A.managerToken, { message: 'We are sorry, sending it again' }));
        const mine = ok(await fx.call('GET', `/v1/food/user/support/my-tickets?orderId=${id}`, A.customerToken));
        assert.equal(mine.tickets.length, 1);
        assert.deepEqual(mine.tickets[0].responses.map((r) => [r.byRole, r.message]), [['Customer', 'It was the large one'], ['Store Manager', 'We are sorry, sending it again']]);
        assert.equal((await fx.call('GET', `/v1/food/user/support/my-tickets?orderId=${id}`, B.customerToken)).body.data.tickets.length, 0);
        ok(await fx.call('PUT', `/v1/food/store/complaints/${t._id}/resolve`, A.managerToken, { actionTaken: 'Replacement sent', refundAmount: 0 }));
        assert.equal((await fx.call('POST', M, A.customerToken, { message: 'thanks' })).status, 409);
    });

    test('emitting with no socket server running does nothing', async () => {
        const { emitSupportMessage } = await import('../src/modules/food/user/services/supportChat.js');
        assert.doesNotThrow(() => emitSupportMessage({ _id: 'x', userId: 'u', storeId: 's' }, { message: 'm', byRole: 'Customer', at: new Date() }));
    });
});

// ---------------------------------------------------------------------------------------------------------------
describe('kitchen rejects an item: the bill drops', () => {
    test('the maths: food, coupon share, GST again, fees stay', async () => {
        const { repriceAfterRejection } = await import('../src/modules/food/store/services/itemRejectionPricing.js');
        const pricing = { subtotal: 1000, discount: 100, tax: 54, packagingFee: 10, deliveryFee: 30, platformFee: 5, handlingFee: 7, gstRate: 5, total: 1000 - 100 + 10 + 30 + 5 + 7 + 54 };
        const r = repriceAfterRejection(pricing, [{ price: 400, quantity: 1 }]);
        // 600 food, discount 60, GST 5% of (600 - 60 + 7) = 27, total 600 + 52 + 27 - 60 = 619
        assert.deepEqual(r.pricing, { subtotal: 600, discount: 60, tax: 27, total: 619 });
        assert.equal(r.reduction, 1000 - 100 + 10 + 30 + 5 + 7 + 54 - 619);
        assert.equal(repriceAfterRejection(pricing, []), null);
        assert.equal(repriceAfterRejection({ ...pricing, subtotal: 0 }, [{ price: 10, quantity: 1 }]), null);
    });

    const makeOrder = async (key, paymentStatus) => {
        const _id = new mongoose.Types.ObjectId();
        await fx.models.FoodOrder.collection.insertOne({
            _id, order_id: `IR${key}${fx.ts}`, orderId: `IR${key}${fx.ts}`, userId: new mongoose.Types.ObjectId(A.customerId), storeId: new mongoose.Types.ObjectId(A.storeId),
            franchiseId: new mongoose.Types.ObjectId(A.franchiseId), orderStatus: 'preparing',
            items: [{ itemId: 'a', name: 'Margherita', price: 400, quantity: 1 }, { itemId: 'b', name: 'Farmhouse', price: 600, quantity: 1 }],
            deliveryAddress: { street: '1 Rd', city: 'Pune', state: 'MH' },
            pricing: { subtotal: 1000, discount: 0, tax: 60, packagingFee: 10, deliveryFee: 0, platformFee: 5, handlingFee: 0, gstRate: 5, total: 1075 },
            payment: { method: paymentStatus === 'paid' ? 'razorpay' : 'cash', status: paymentStatus, amountDue: 1075 }, statusHistory: [], createdAt: new Date(), updatedAt: new Date(),
        });
        const { FoodTransaction } = await import('../src/modules/food/orders/models/foodTransaction.model.js');
        await FoodTransaction.create({
            orderId: _id, userId: A.customerId, storeId: A.storeId, paymentMethod: paymentStatus === 'paid' ? 'razorpay' : 'cash', status: 'pending',
            pricing: { subtotal: 1000, tax: 60, total: 1075 }, payment: { method: 'cash', status: paymentStatus, amountDue: 1075 },
            amounts: { totalCustomerPaid: 1075, storeShare: 900, storeCommission: 100, riderShare: 30, platformNetProfit: 45, taxAmount: 60 },
        });
        return _id;
    };

    test('cash order: the rider collects the lower total, and the ledger follows', async () => {
        const { applyItemRejection } = await import('../src/modules/food/store/services/itemRejectionPricing.js');
        const id = await makeOrder('cash', 'cod_pending');
        const order = await fx.models.FoodOrder.findById(id);
        const res = await applyItemRejection(order, [order.items[1]], { reason: 'Out of paneer' });
        await order.save();
        assert.equal(res.refund, null);
        const o = await fx.models.FoodOrder.findById(id).lean();
        assert.deepEqual([o.pricing.subtotal, o.pricing.originalTotal, o.pricing.rejectedItemsAmount], [400, 1075, 600]);
        assert.equal(o.pricing.total, o.payment.amountDue, 'cash due equals the new total');
        assert.ok(o.pricing.total < 1075);
        const { FoodTransaction } = await import('../src/modules/food/orders/models/foodTransaction.model.js');
        const tx = await FoodTransaction.findOne({ orderId: id }).lean();
        assert.deepEqual([tx.pricing.total, tx.payment.amountDue, tx.amounts.totalCustomerPaid], [o.pricing.total, o.pricing.total, o.pricing.total]);
    });

    test('paid online order: a pending refund for the difference, no change to what was paid', async () => {
        const { applyItemRejection } = await import('../src/modules/food/store/services/itemRejectionPricing.js');
        const { Refund } = await import('../src/core/payments/models/refund.model.js');
        const id = await makeOrder('paid', 'paid');
        const order = await fx.models.FoodOrder.findById(id);
        const res = await applyItemRejection(order, [order.items[0]], { reason: 'Oven down' });
        await order.save();
        const refund = await Refund.findOne({ orderId: id }).lean();
        assert.equal(refund.status, 'pending');
        assert.equal(refund.amount, res.reduction);
        assert.equal(refund.metadata.source, 'item-rejection');
        const o = await fx.models.FoodOrder.findById(id).lean();
        assert.equal(o.payment.status, 'paid');
        assert.equal(o.payment.amountDue, 1075, 'the paid amount is left alone');
    });
});

// ---------------------------------------------------------------------------------------------------------------
describe('scheduled orders wait for their slot', () => {
    const make = async (key, scheduledAt) => {
        const r = await fx.models.FoodOrder.collection.insertOne({
            order_id: `SC${key}${fx.ts}`, orderId: `SC${key}${fx.ts}`, userId: new mongoose.Types.ObjectId(A.customerId), storeId: new mongoose.Types.ObjectId(A.storeId),
            franchiseId: new mongoose.Types.ObjectId(A.franchiseId), orderStatus: 'confirmed', scheduledAt, items: [{ itemId: 'a', name: 'Pizza', price: 300, quantity: 1 }],
            deliveryAddress: { street: '1 Rd', city: 'Pune', state: 'MH' }, pricing: { subtotal: 300, total: 300 }, payment: { method: 'cash', status: 'cod_pending' },
            dispatch: { status: 'unassigned', deliveryPartnerId: null, offeredTo: [] }, statusHistory: [], createdAt: new Date(), updatedAt: new Date(),
        });
        return String(r.insertedId);
    };

    test('the filter: unscheduled and soon-due orders pass, far-off ones do not', async () => {
        const { dispatchDueFilter, DISPATCH_LEAD_MS } = await import('../src/modules/food/orders/services/order-schedule.service.js');
        const now = new Date();
        const far = await make('far', new Date(now.getTime() + 5 * 3600000));
        const soon = await make('soon', new Date(now.getTime() + DISPATCH_LEAD_MS - 60000));
        const plain = await make('plain', null);
        const due = (await fx.models.FoodOrder.find({ _id: { $in: [far, soon, plain] }, ...dispatchDueFilter(now) }).select('_id').lean()).map((d) => String(d._id));
        assert.deepEqual(due.sort(), [soon, plain].sort());
    });

    test('auto-dispatch skips a far-off scheduled order and starts for a due one', async () => {
        const { tryAutoAssign, dispatchDueScheduledOrders } = await import('../src/modules/food/orders/services/order-dispatch.service.js');
        const far = await make('far2', new Date(Date.now() + 5 * 3600000));
        assert.equal(await tryAutoAssign(far), null);
        const farDoc = await fx.models.FoodOrder.findById(far).lean();
        assert.equal(farDoc.dispatch.dispatchingAt, undefined, 'no rider search was started');
        const soon = await make('soon2', new Date(Date.now() + 20 * 60000));
        assert.ok(await dispatchDueScheduledOrders() >= 1, 'the sweep finds the due order');
        const soonDoc = await fx.models.FoodOrder.findById(soon).lean();
        assert.equal(soonDoc.dispatch.dispatchingAt, undefined, 'the search finished and released its lock');
    });
});

// ---------------------------------------------------------------------------------------------------------------
describe('OTP SMS brand', () => {
    test('the text says Papa Veg Pizza, not the old template brand', () => {
        const src = readFileSync('src/core/otp/otp.service.js', 'utf8');
        assert.ok(!src.includes('Foodelo'));
        assert.ok(src.includes('Welcome to the Papa Veg Pizza powered by SMSINDIAHUB'));
    });
});
