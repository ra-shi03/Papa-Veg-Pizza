// Store dashboard (/v1/store/dashboard/*) and franchise dashboard (/v1/admin/dashboard/*):
// role and scope from the token, and the numbers on a seeded set of orders.
//
// Seeded at store A (franchise A), "today" unless noted:
//   o1 delivered   cash   500  (Margherita x2 @200 + Garlic Bread @100), rated 4, prep 20 min, picked up 40m ago, delivered 10m ago
//   o2 preparing   cash   300  kitchen stage baking, already late
//   o3 created     online 1000 not paid  -> an order, but not a sale
//   o4 ready       cash   200  prep 10 min
//   o5 cancelled   cash   700  -> an order, but not a sale
//   o6 picked up   cash   250  rider R1, picked up 50m ago (a late delivery)
//   y1 delivered   cash  1000  yesterday, rated 5
// Store B (franchise B): b1 delivered cash 9999 today.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose, PASSWORD } from './helpers/fixture.js';

let fx; let A; let B;
let sup; let chef;
const O = {};
const RIDER_BUSY = new mongoose.Types.ObjectId();
const RIDER_FREE = new mongoose.Types.ObjectId();
const CUSTOMER2 = new mongoose.Types.ObjectId();
let phoneSeq = 0; let seq = 0;

const minsAgo = (m) => new Date(Date.now() - m * 60000);
const login = async (email) => (await fx.call('POST', '/v1/auth/store/login', null, { email, password: PASSWORD })).body.data.accessToken;
const makeStaff = async (role, tag) => {
    const email = `${tag}${fx.ts}@example.invalid`;
    const res = await fx.call('POST', '/v1/food/store/staff', A.managerToken, { fullName: `Name ${tag}`, email, phone: `7${String(++phoneSeq).padStart(2, '0')}${String(fx.ts).slice(-7)}`, password: PASSWORD, role });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    return { id: res.body.data.userId, token: await login(email) };
};
async function seed(f, { status, total, method = 'cash', paid, at = minsAgo(0.05), user, items, rating, kitchen, history = [], rider }) {
    const ref = `DB${fx.ts}${seq++}`;
    const doc = {
        order_id: ref, orderId: ref, userId: user || new mongoose.Types.ObjectId(f.customerId), storeId: new mongoose.Types.ObjectId(f.storeId), franchiseId: new mongoose.Types.ObjectId(f.franchiseId),
        orderStatus: status, payment: { method, status: paid ? 'paid' : method === 'cash' ? 'cod_pending' : 'created' }, pricing: { subtotal: total, total },
        deliveryAddress: { street: '1 Test Rd', city: 'Pune', state: 'MH' }, customerName: 'Seeded Customer', customerPhone: '9000000000',
        items: items || [{ itemId: 'x', name: 'Margherita', quantity: 1, price: total }],
        statusHistory: [{ at, byRole: 'SYSTEM', from: '', to: 'created', note: 'Order placed' }, ...history],
        kitchen: { stage: 'pending', ...kitchen }, createdAt: at, updatedAt: new Date(),
    };
    if (rating) doc.ratings = { store: { rating, comment: '', ratedAt: at } };
    if (rider) doc.dispatch = { deliveryPartnerId: rider, status: 'assigned' };
    const r = await fx.models.FoodOrder.collection.insertOne(doc);
    return { id: String(r.insertedId), ref };
}

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    await fx.models.FoodOrder.deleteMany({}); // start from the seeded set only (the fixture adds one order per store)
    sup = await makeStaff('Kitchen Supervisor', 'dsup');
    chef = await makeStaff('Pizza Maker', 'dchef');
    const onLeave = await makeStaff('Pizza Maker', 'dleave');
    await fx.models.StoreManager.updateOne({ userId: new mongoose.Types.ObjectId(onLeave.id) }, { $set: { status: 'On Leave' } });

    O.o1 = await seed(A, {
        status: 'delivered', total: 500, rating: 4, at: minsAgo(60),
        items: [{ itemId: 'm', name: 'Margherita', quantity: 2, price: 200 }, { itemId: 'g', name: 'Garlic Bread', quantity: 1, price: 100 }],
        kitchen: { stage: 'ready', acceptedAt: minsAgo(55), readyAt: minsAgo(35) },
        history: [{ at: minsAgo(40), byRole: 'DELIVERY_PARTNER', from: 'ready_for_pickup', to: 'picked_up' }, { at: minsAgo(10), byRole: 'DELIVERY_PARTNER', from: 'picked_up', to: 'delivered' }],
    });
    O.o2 = await seed(A, { status: 'preparing', total: 300, kitchen: { stage: 'baking', acceptedAt: minsAgo(25), expectedReadyAt: minsAgo(5) } });
    O.o3 = await seed(A, { status: 'created', total: 1000, method: 'razorpay', paid: false });
    O.o4 = await seed(A, { status: 'ready_for_pickup', total: 200, user: CUSTOMER2, kitchen: { stage: 'ready', acceptedAt: minsAgo(20), readyAt: minsAgo(10) } });
    O.o5 = await seed(A, { status: 'cancelled_by_store', total: 700, user: CUSTOMER2 });
    O.o6 = await seed(A, { status: 'picked_up', total: 250, user: CUSTOMER2, rider: RIDER_BUSY, history: [{ at: minsAgo(50), byRole: 'DELIVERY_PARTNER', from: 'ready_for_pickup', to: 'picked_up' }] });
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1); yesterday.setHours(12, 0, 0, 0);
    O.y1 = await seed(A, { status: 'delivered', total: 1000, rating: 5, at: yesterday });
    O.b1 = await seed(B, { status: 'delivered', total: 9999, rating: 2 });

    // riders: one busy on o6, one free and online; both are store A's own riders (who is near whom: nearby-people.test.js)
    const own = { storeId: new mongoose.Types.ObjectId(A.storeId), franchiseId: new mongoose.Types.ObjectId(A.franchiseId) };
    await mongoose.connection.collection('food_delivery_partners').insertMany([
        { _id: RIDER_BUSY, name: 'Rider Busy', phone: '9111111111', status: 'approved', availabilityStatus: 'online', ...own },
        { _id: RIDER_FREE, name: 'Rider Free', phone: '9222222222', status: 'approved', availabilityStatus: 'online', ...own },
    ]);
    // stock: one counted ingredient below its reorder level, with an active critical alert
    const ing = await mongoose.connection.collection('food_store_ingredients').insertOne({
        storeId: new mongoose.Types.ObjectId(A.storeId), ingredientName: 'Mozzarella', nameKey: 'mozzarella', category: 'Cheese', unit: 'KG',
        currentStock: 0, minimumStock: 5, reorderLevel: 10, costPerUnit: 400, supplierName: 'Dairy Co', tracked: true, createdAt: new Date(), updatedAt: new Date(),
    });
    await mongoose.connection.collection('food_inventory_alerts').insertOne({
        storeId: new mongoose.Types.ObjectId(A.storeId), ingredientId: ing.insertedId, ingredientName: 'Mozzarella', alertType: 'low_stock',
        currentStock: 0, minimumStock: 5, severity: 'critical', status: 'active', createdAt: new Date(), updatedAt: new Date(),
    });
    // a complaint about o1
    assert.equal((await fx.call('POST', '/v1/food/user/support/ticket', A.customerToken, { type: 'order', orderId: O.o1.id, issueType: 'Cold food', description: 'Pizza was cold' })).status, 201);
});
after(async () => { await fx?.teardown(); });

const SD = '/v1/store/dashboard';
const AD = '/v1/admin/dashboard';
const sget = async (token, widget, qs = '') => fx.call('GET', `${SD}/${widget}${qs}`, token);
const sdata = async (token, widget, qs = '') => {
    const r = await sget(token, widget, qs);
    assert.equal(r.status, 200, `${widget}: ${JSON.stringify(r.body)}`);
    return r.body.data;
};
const aget = async (token, path = '', qs = '') => {
    const r = await fx.call('GET', `${AD}${path}${qs}`, token);
    assert.equal(r.status, 200, `${path}: ${JSON.stringify(r.body)}`);
    return r.body.data;
};

const STORE_WIDGETS = ['today-sales', 'today-orders', 'active-orders', 'prep-time', 'pending-deliveries', 'low-stock', 'staff-duty', 'customer-rating',
    'hourly-sales', 'order-status', 'top-products', 'live-orders', 'kitchen-performance', 'delivery-overview', 'inventory-alerts', 'staff-overview',
    'recent-complaints', 'activity-logs'];
const SUPERVISOR_OK = ['today-orders', 'active-orders', 'prep-time', 'pending-deliveries', 'live-orders', 'order-status', 'kitchen-performance', 'delivery-overview'];

describe('store dashboard: who sees what', () => {
    test('anonymous 401; kitchen staff and customers 403 on every widget; the manager 200 on every widget', async () => {
        for (const w of STORE_WIDGETS) {
            assert.equal((await fx.call('GET', `${SD}/${w}`)).status, 401, w);
            assert.equal((await sget(chef.token, w)).status, 403, w);
            assert.equal((await sget(A.customerToken, w)).status, 403, w);
            assert.equal((await sget(A.managerToken, w)).status, 200, w);
        }
    });
    test('the kitchen supervisor gets kitchen and order widgets only', async () => {
        for (const w of STORE_WIDGETS) assert.equal((await sget(sup.token, w)).status, SUPERVISOR_OK.includes(w) ? 200 : 403, w);
    });
    test('a store role always gets its own store; another store\'s id is 404; the screen\'s placeholder id means "my store"', async () => {
        assert.equal((await sget(B.managerToken, 'today-orders', `?storeId=${A.storeId}`)).status, 404);
        assert.equal((await sget(sup.token, 'today-orders', `?storeId=${B.storeId}`)).status, 404);
        assert.equal((await sdata(A.managerToken, 'today-orders', '?storeId=st-indore-01')).totalOrders, 6);
        assert.equal((await sdata(A.managerToken, 'today-orders', `?storeId=${A.storeId}`)).totalOrders, 6);
        assert.equal((await sdata(B.managerToken, 'today-orders')).totalOrders, 1);
    });
    test('a franchise admin drills into its own stores only; a super admin into any; both must name the store', async () => {
        assert.equal((await sget(A.adminToken, 'today-sales')).status, 400);
        assert.equal((await sdata(A.adminToken, 'today-sales', `?storeId=${A.storeId}`)).todaySales, 1250);
        assert.equal((await sget(A.adminToken, 'today-sales', `?storeId=${B.storeId}`)).status, 404);
        assert.equal((await sget(B.adminToken, 'today-sales', `?storeId=${A.storeId}`)).status, 404);
        assert.equal((await sdata(fx.SA, 'today-sales', `?storeId=${B.storeId}`)).todaySales, 9999);
        assert.equal((await sget(fx.SA, 'today-sales', '?storeId=64b000000000000000000001')).status, 404);
    });
});

describe('store dashboard: numbers', () => {
    const M = () => A.managerToken;
    test('KPI cards', async () => {
        assert.deepEqual(await sdata(M(), 'today-sales'), { todaySales: 1250, percentageChange: 25 }); // 500+300+200+250 vs 1000 yesterday
        assert.deepEqual(await sdata(M(), 'today-orders'), { totalOrders: 6 });
        assert.deepEqual(await sdata(M(), 'active-orders'), { activeOrders: 3 });       // o2, o3, o4
        assert.deepEqual(await sdata(M(), 'prep-time'), { avgPrepTime: 15 });           // (20 + 10) / 2
        assert.deepEqual(await sdata(M(), 'pending-deliveries'), { pendingDeliveries: 2 }); // o4 ready, o6 on the road
        assert.deepEqual(await sdata(M(), 'low-stock'), { lowStockItems: 1 });
        assert.deepEqual(await sdata(M(), 'staff-duty'), { staffOnDuty: 0 });           // nobody has clocked in yet (see 'staff widgets follow real clock-ins')
        assert.deepEqual(await sdata(M(), 'customer-rating'), { rating: 4.5 });         // 4 and 5
    });
    test('order status donut (today)', async () => {
        assert.deepEqual(await sdata(M(), 'order-status'), { incoming: 1, preparing: 0, baking: 1, packaging: 0, ready: 2, delivered: 1, cancelled: 1 });
    });
    test('sales chart: daily, weekly, monthly', async () => {
        const sum = (rows) => rows.reduce((n, r) => n + r.sales, 0);
        const daily = await sdata(M(), 'hourly-sales', '?filter=daily');
        assert.ok(daily.every((r) => /^\d{2} (AM|PM)$/.test(r.hour)));
        assert.equal(sum(daily), 1250);
        const weekly = await sdata(M(), 'hourly-sales', '?filter=weekly');
        assert.equal(weekly.length, 7);
        assert.equal(sum(weekly), 2250);
        assert.equal(weekly.at(-1).sales, 1250);
        assert.equal(weekly.at(-2).sales, 1000);
        const monthly = await sdata(M(), 'hourly-sales', '?filter=monthly');
        assert.equal(monthly.length, 6);
        assert.equal(sum(monthly), 2250);
    });
    test('top products (last 30 days, sales only)', async () => {
        const top = await sdata(M(), 'top-products');
        assert.deepEqual(top[0], { productName: 'Margherita', sold: 6, revenue: 2150 }); // o1 2x200, o2 300, o4 200, o6 250, y1 1000
        assert.deepEqual(top[1], { productName: 'Garlic Bread', sold: 1, revenue: 100 });
    });
    test('live order board', async () => {
        const live = await sdata(M(), 'live-orders');
        assert.deepEqual(live.incoming.map((o) => o.orderNumber), [O.o3.ref]);
        assert.deepEqual(live.preparing.map((o) => o.orderNumber), [O.o2.ref]);
        assert.deepEqual(live.ready.map((o) => o.orderNumber), [O.o4.ref]);
        assert.deepEqual(live.delivery.map((o) => o.orderNumber), [O.o6.ref]);
        assert.deepEqual(Object.keys(live.preparing[0]).sort(), ['amount', 'customer', 'eta', 'orderNumber', 'status']);
        assert.equal(live.preparing[0].eta, '0m', 'already late');
    });
    test('kitchen, delivery, inventory and staff widgets', async () => {
        const k = await sdata(M(), 'kitchen-performance');
        assert.equal(k.avgPrepTime, 15);
        assert.equal(k.delayedOrders, 1);
        for (const key of ['pizzaStation', 'bakingStation', 'packagingStation']) assert.ok(k[key] >= 0 && k[key] <= 100, key);
        assert.deepEqual(await sdata(M(), 'delivery-overview'), { availableRiders: 1, assignedRiders: 1, delayedDeliveries: 1 });
        const inv = await sdata(M(), 'inventory-alerts');
        assert.deepEqual(inv.lowStock, [{ ingredient: 'Mozzarella', availableQty: 0, minQty: 5, reorderLevel: 10, unit: 'KG', supplier: 'Dairy Co', severity: 'Critical' }]);
        assert.deepEqual(await sdata(M(), 'staff-overview'), { present: 0, late: 0, absent: 1 }); // nobody clocked in; one person is On Leave
    });
    test('staff widgets follow real clock-ins (not the count of active staff)', async () => {
        // a shift that started two hours ago, with the chef on it: the chef is late, the supervisor (no shift) is not
        const { formatClock } = await import('../src/modules/food/store/services/attendanceTime.js');
        const now = new Date();
        const start = formatClock((now.getHours() * 60 + now.getMinutes() - 120 + 1440) % 1440);
        const shift = await fx.call('POST', '/v1/store/shifts', A.managerToken, { shiftName: 'Dash shift', startTime: start, endTime: '11:59 PM', maxStaff: 5 });
        assert.equal(shift.status, 201, JSON.stringify(shift.body));
        const staffRec = await fx.models.StoreManager.findOne({ userId: new mongoose.Types.ObjectId(chef.id) }).lean();
        assert.equal((await fx.call('POST', `/v1/store/shifts/${shift.body.data._id}/assign`, A.managerToken, { staffIds: [String(staffRec._id)] })).status, 200);

        assert.equal((await fx.call('POST', '/v1/store/attendance/clock-in', sup.token)).status, 201);
        assert.deepEqual(await sdata(M(), 'staff-duty'), { staffOnDuty: 1 });
        assert.equal((await fx.call('POST', '/v1/store/attendance/clock-in', chef.token)).status, 201);
        assert.deepEqual(await sdata(M(), 'staff-duty'), { staffOnDuty: 2 });
        assert.deepEqual(await sdata(M(), 'staff-overview'), { present: 2, late: 1, absent: 1 });

        assert.equal((await fx.call('POST', '/v1/store/attendance/clock-out', chef.token)).status, 200);   // finished: worked today, no longer on duty
        assert.deepEqual(await sdata(M(), 'staff-duty'), { staffOnDuty: 1 });
        assert.deepEqual(await sdata(M(), 'staff-overview'), { present: 2, late: 1, absent: 1 });
        // the supervisor sees staff-duty only as the manager does: the widget is manager-only for them
        assert.equal((await sget(sup.token, 'staff-duty')).status, 403);
        // store B has nobody clocked in
        assert.deepEqual(await sdata(B.managerToken, 'staff-duty'), { staffOnDuty: 0 });
    });
    test('recent complaints and activity', async () => {
        const [c] = await sdata(M(), 'recent-complaints');
        assert.equal(c.orderNumber, O.o1.ref);
        assert.equal(c.issueType, 'Cold food');
        assert.equal(c.priority, 'Medium');
        assert.equal(c.status, 'Open');
        assert.match(c.time, /m ago$/);
        const log = await sdata(M(), 'activity-logs');
        assert.ok(log.length > 0);
        assert.deepEqual(Object.keys(log[0]).sort(), ['action', 'id', 'timestamp', 'type', 'user']);
        assert.ok(log.some((e) => e.type === 'delivery'));
        assert.equal((await sdata(B.managerToken, 'recent-complaints')).length, 0);
    });
    test('store B sees only its own numbers', async () => {
        assert.deepEqual(await sdata(B.managerToken, 'today-sales'), { todaySales: 9999, percentageChange: 0 });
        assert.equal((await sdata(B.managerToken, 'top-products'))[0].revenue, 9999);
        assert.deepEqual((await sdata(B.managerToken, 'inventory-alerts')).lowStock, []);
    });
    test('dashboard "Resolve" button resolves the open complaint of that order (manager only, own store)', async () => {
        const resolve = (token, body) => fx.call('POST', '/v1/complaints/resolve', token, body);
        assert.equal((await resolve(sup.token, { orderNumber: O.o1.ref, notes: 'x' })).status, 403);
        assert.equal((await resolve(chef.token, { orderNumber: O.o1.ref })).status, 403);
        assert.equal((await resolve(B.managerToken, { orderNumber: O.o1.ref })).status, 404);
        assert.equal((await resolve(A.managerToken, { orderNumber: O.o2.ref })).status, 404, 'no complaint on o2');
        const res = await resolve(A.managerToken, { storeId: 'st-indore-01', orderNumber: O.o1.ref, notes: 'Sent a fresh pizza' });
        assert.equal(res.status, 200, JSON.stringify(res.body));
        assert.equal(res.body.data.status, 'resolved');
        assert.equal((await sdata(A.managerToken, 'recent-complaints'))[0].status, 'Resolved');
        assert.equal((await resolve(A.managerToken, { orderNumber: O.o1.ref })).status, 404, 'nothing open any more');
    });
});

describe('franchise dashboard: who sees what', () => {
    const PATHS = ['', '/revenue', '/live-orders', '/store-performance', '/inventory-alerts', '/delivery-performance', '/customer-activity'];
    test('anonymous 401; store manager, supervisor, staff and customers 403; franchise and super admins 200 on every endpoint', async () => {
        for (const p of PATHS) {
            assert.equal((await fx.call('GET', `${AD}${p}`)).status, 401, p);
            for (const token of [A.managerToken, sup.token, chef.token, A.customerToken]) assert.equal((await fx.call('GET', `${AD}${p}`, token)).status, 403, p);
            for (const token of [A.adminToken, B.adminToken, fx.SA]) assert.equal((await fx.call('GET', `${AD}${p}`, token)).status, 200, p);
        }
    });
    test('drilling into a store: own store ok, another franchise\'s store 404', async () => {
        assert.equal((await fx.call('GET', `${AD}?storeId=${A.storeId}`, A.adminToken)).status, 200);
        assert.equal((await fx.call('GET', `${AD}?storeId=${B.storeId}`, A.adminToken)).status, 404);
        assert.equal((await fx.call('GET', `${AD}/live-orders?storeId=${A.storeId}`, B.adminToken)).status, 404);
        assert.equal((await fx.call('GET', `${AD}?storeId=junk`, A.adminToken)).status, 404);
        assert.equal((await fx.call('GET', `${AD}?date=custom&start=bad&end=bad`, A.adminToken)).status, 400);
    });
});

describe('franchise dashboard: numbers', () => {
    test('summary: franchise A only; super admin everything; ?franchiseId narrows; periods', async () => {
        const a = await aget(A.adminToken);
        assert.deepEqual(a, { revenue: 1250, orders: 4, activeStores: 1, activeRiders: 1, refunds: 0, lowStock: 1, avgOrderValue: 313, customerSatisfaction: 4.5 });
        const b = await aget(B.adminToken);
        assert.equal(b.revenue, 9999);
        assert.equal(b.lowStock, 0);
        assert.equal((await aget(fx.SA)).revenue, 11249);
        assert.equal((await aget(fx.SA, '', `?franchiseId=${B.franchiseId}`)).revenue, 9999);
        assert.equal((await aget(A.adminToken, '', '?date=week')).revenue, 2250);
        assert.equal((await aget(A.adminToken, '', '?date=yesterday')).revenue, 1000);
    });
    test('revenue trend: one point per day, last 7 days at least', async () => {
        const rows = await aget(A.adminToken, '/revenue');
        assert.equal(rows.length, 7);
        assert.equal(rows.at(-1).revenue, 1250);
        assert.equal(rows.at(-2).revenue, 1000);
        assert.ok(rows.every((r) => typeof r.date === 'string' && typeof r.revenue === 'number'));
    });
    test('live orders: own franchise only, with the widget\'s statuses', async () => {
        const rows = await aget(A.adminToken, '/live-orders');
        const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
        assert.deepEqual(Object.keys(byId).sort(), [O.o2.ref, O.o3.ref, O.o4.ref, O.o6.ref].sort());
        assert.equal(byId[O.o3.ref].status, 'confirmed');
        assert.equal(byId[O.o2.ref].status, 'baking');
        assert.equal(byId[O.o4.ref].status, 'packed');
        assert.equal(byId[O.o6.ref].status, 'out_for_delivery');
        assert.equal(byId[O.o6.ref].assignedStaff.rider, 'Rider Busy');
        assert.equal(byId[O.o6.ref].store, 'TEST STORE A');
        assert.equal((await aget(B.adminToken, '/live-orders')).length, 0);
    });
    test('store performance', async () => {
        const [a] = await aget(A.adminToken, '/store-performance');
        assert.deepEqual(a, { id: A.storeId, name: 'TEST STORE A', orders: 6, revenue: 1250, rating: 4.5, completion: 17 });
        const all = await aget(fx.SA, '/store-performance');
        assert.equal(all[0].id, B.storeId, 'sorted by revenue');
    });
    test('inventory alerts, deliveries, customers', async () => {
        const inv = await aget(A.adminToken, '/inventory-alerts');
        assert.equal(inv.length, 1);
        assert.equal(inv[0].ingredient, 'Mozzarella');
        assert.equal(inv[0].store, 'TEST STORE A');
        assert.equal(inv[0].reorderLevel, 10);
        assert.equal((await aget(B.adminToken, '/inventory-alerts')).length, 0);
        const d = await aget(A.adminToken, '/delivery-performance');
        assert.deepEqual(d.metrics, { activeRiders: 1, deliveredOrders: 1, avgDeliveryTime: 30, failedDeliveries: 0 });
        assert.equal(d.hourlyChart.reduce((n, h) => n + h.deliveries, 0), 1);
        assert.deepEqual(await aget(A.adminToken, '/customer-activity'), { newCustomers: 1, repeatCustomers: 2, loyaltyMembers: 0 });
    });
});
