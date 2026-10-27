// Store performance (/v1/store-performance/*, /v1/stores/:id/performance) and the store details drawer
// (/v1/orders|inventory|reviews|users?storeId=): role and scope from the token, and the numbers on seeded orders.
//
// Seeded (all "today" unless noted). Franchise A has two stores, A and A2:
//   A  o1 delivered cash 500 (Margherita 2x200, Garlic Bread 100), rated 4, prep 20 min (on time), delivered 30 min after pickup, Chef Ravi + Rider One
//   A  o2 cancelled cash 300
//   A  o3 delivered cash 200 (Farmhouse, a catalogue product in "Veg Pizzas"), prep 10 min (late)
//   A  y1 delivered cash 1000 yesterday (Margherita), rated 5
//   A2 a2 delivered cash 800
//   B  b1 delivered cash 9999
// Stock at A: Mozzarella (400/kg) 4 kg used + 1 kg wasted -> 20% waste; out of stock, one active alert.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A; let B; let A2; let sup; let staff; let farmhouse;
const O = {};
const RIDER = new mongoose.Types.ObjectId();
const CATEGORY = new mongoose.Types.ObjectId();
let seq = 0;
const minsAgo = (m) => new Date(Date.now() - m * 60000);
const oid = (v) => new mongoose.Types.ObjectId(v);

async function seed(f, { status, total, at = minsAgo(1), items, rating, ratedAt = minsAgo(0.5), kitchen, history = [], rider }) {
    const ref = `SP${fx.ts}${seq++}`;
    const doc = {
        order_id: ref, orderId: ref, userId: oid(f.customerId), storeId: oid(f.storeId), franchiseId: oid(f.franchiseId),
        orderStatus: status, payment: { method: 'cash', status: 'cod_pending' }, pricing: { subtotal: total, total },
        deliveryAddress: { street: '1 Test Rd', city: 'Pune', state: 'MH' }, customerName: 'Seeded Customer', customerPhone: '9000000000',
        items: items || [{ itemId: 'x', name: 'Margherita', quantity: 1, price: total }],
        statusHistory: [{ at, byRole: 'SYSTEM', from: '', to: 'created' }, ...history],
        kitchen: { stage: 'pending', ...kitchen }, createdAt: at, updatedAt: new Date(),
    };
    if (rating) doc.ratings = { store: { rating, comment: rating === 4 ? 'Hot and fresh' : '', ratedAt } };
    if (rider) doc.dispatch = { deliveryPartnerId: rider, status: 'assigned' };
    const r = await fx.models.FoodOrder.collection.insertOne(doc);
    return { id: String(r.insertedId), ref };
}

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    sup = fx.claim('KITCHEN_SUPERVISOR', { franchiseId: A.franchiseId, storeId: A.storeId });
    staff = fx.claim('KITCHEN_STAFF', { franchiseId: A.franchiseId, storeId: A.storeId });
    const st = await fx.call('POST', '/v1/stores', A.adminToken, {
        storeName: 'TEST STORE A2', storeCode: `TSA2${fx.ts}`, storeType: 'DELIVERY_CARRYOUT', phone: '9999999943', email: `store-a2${fx.ts}@example.invalid`,
        address: { line1: 'a', city: 'c', state: 's', pincode: '110001', coordinates: [77.2, 28.6] }, status: 'Active',
    });
    assert.equal(st.status, 201, JSON.stringify(st.body));
    assert.equal((await fx.call('PATCH', `/v1/store-approvals/${st.body.data._id}/approve`, fx.SA, {})).status, 200);
    A2 = { ...A, storeId: st.body.data._id };

    const { Product } = await import('../src/modules/food/admin/models/product.model.js');
    const { CategoryProduct } = await import('../src/modules/food/admin/models/categoryProduct.model.js');
    await CategoryProduct.collection.insertOne({ _id: CATEGORY, label: 'Veg Pizzas' });
    farmhouse = await Product.create({ name: 'Farmhouse', categoryId: CATEGORY, status: 'Active', price: 200 });

    await fx.models.FoodOrder.deleteMany({}); // the seeded set only
    O.o1 = await seed(A, {
        status: 'delivered', total: 500, rating: 4, rider: RIDER,
        items: [{ itemId: 'm', name: 'Margherita', quantity: 2, price: 200 }, { itemId: 'g', name: 'Garlic Bread', quantity: 1, price: 100 }],
        kitchen: { stage: 'ready', acceptedAt: minsAgo(55), readyAt: minsAgo(35), expectedReadyAt: minsAgo(30), staff: { pizza_chef: { userId: new mongoose.Types.ObjectId(), name: 'Chef Ravi' } } },
        history: [{ at: minsAgo(40), byRole: 'DELIVERY_PARTNER', from: 'ready_for_pickup', to: 'picked_up' }, { at: minsAgo(10), byRole: 'DELIVERY_PARTNER', from: 'picked_up', to: 'delivered' }],
    });
    O.o2 = await seed(A, { status: 'cancelled_by_store', total: 300 });
    O.o3 = await seed(A, {
        status: 'delivered', total: 200, items: [{ itemId: String(farmhouse._id), name: 'Farmhouse', quantity: 1, price: 200 }],
        kitchen: { stage: 'ready', acceptedAt: minsAgo(30), readyAt: minsAgo(20), expectedReadyAt: minsAgo(25) },
    });
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1); yesterday.setHours(12, 0, 0, 0);
    O.y1 = await seed(A, { status: 'delivered', total: 1000, rating: 5, at: yesterday, ratedAt: yesterday });
    O.a2 = await seed(A2, { status: 'delivered', total: 800 });
    O.b1 = await seed(B, { status: 'delivered', total: 9999 });

    await mongoose.connection.collection('food_delivery_partners').insertOne({ _id: RIDER, name: 'Rider One', phone: '9111111111', status: 'approved' });
    const ing = await mongoose.connection.collection('food_store_ingredients').insertOne({
        storeId: oid(A.storeId), ingredientName: 'Mozzarella', nameKey: 'mozzarella', category: 'Cheese', unit: 'KG',
        currentStock: 0, minimumStock: 5, reorderLevel: 10, costPerUnit: 400, tracked: true, createdAt: new Date(), updatedAt: new Date(),
    });
    await mongoose.connection.collection('food_stock_transactions').insertMany([
        { storeId: oid(A.storeId), ingredientId: ing.insertedId, type: 'stock_out', quantity: 4, previousStock: 5, newStock: 1, source: 'manual', createdAt: minsAgo(1) },
        { storeId: oid(A.storeId), ingredientId: ing.insertedId, type: 'stock_out', quantity: 1, previousStock: 1, newStock: 0, source: 'waste', createdAt: minsAgo(1) },
    ]);
    await mongoose.connection.collection('food_inventory_alerts').insertOne({
        storeId: oid(A.storeId), ingredientId: ing.insertedId, ingredientName: 'Mozzarella', alertType: 'out_of_stock', severity: 'critical', status: 'active', createdAt: new Date(),
    });
});
after(async () => { await fx?.teardown(); });

const SP = '/v1/store-performance';
const ok = (res, status = 200) => { assert.equal(res.status, status, JSON.stringify(res.body)); return res.body.data; };
const get = (path, token) => fx.call('GET', path, token);
const NETWORK = ['/dashboard', '/revenue', '/orders', '/ratings', '/comparison', '/busy-hours', ''];
const PER_STORE = ['revenue', 'orders', 'ratings', 'inventory', 'products', 'staff'];

describe('who sees what', () => {
    test('admins only: store manager, kitchen roles and customers 403, anonymous 401', async () => {
        const paths = [...NETWORK.map((p) => `${SP}${p}`), `${SP}/compare?storeIds=${A.storeId}`, `${SP}/export`, ...PER_STORE.map((p) => `${SP}/${A.storeId}/${p}`), `/v1/stores/${A.storeId}/performance`];
        for (const p of paths) {
            assert.equal((await get(p)).status, 401, p);
            for (const token of [A.managerToken, sup, staff, A.customerToken]) assert.equal((await get(p, token)).status, 403, p);
            for (const token of [A.adminToken, fx.SA]) assert.equal((await get(p, token)).status, 200, p);
        }
    });
    test('another franchise\'s store is 404', async () => {
        for (const p of PER_STORE) {
            assert.equal((await get(`${SP}/${A.storeId}/${p}`, B.adminToken)).status, 404, p);
            assert.equal((await get(`${SP}/not-a-store/${p}`, A.adminToken)).status, 404, p);
        }
        assert.equal((await get(`/v1/stores/${A.storeId}/performance`, B.adminToken)).status, 404);
        assert.equal((await get(`${SP}/compare?storeIds=${A.storeId},${B.storeId}`, A.adminToken)).status, 404);
        assert.equal((await get(`${SP}/export?storeIds=${B.storeId}`, A.adminToken)).status, 404);
    });
    test('each franchise sees only its own stores in the list', async () => {
        assert.deepEqual(ok(await get(SP, A.adminToken)).list.map((r) => r.storeId).sort(), [A.storeId, A2.storeId].sort());
        assert.deepEqual(ok(await get(SP, B.adminToken)).list.map((r) => r.storeId), [B.storeId]);
        assert.equal(ok(await get(SP, fx.SA)).totalCount, 3);
        assert.equal(ok(await get(`${SP}?franchiseId=${B.franchiseId}`, fx.SA)).totalCount, 1);
    });
});

describe('numbers', () => {
    test('KPI cards (today, franchise A)', async () => {
        assert.deepEqual(ok(await get(`${SP}/dashboard`, A.adminToken)), {
            revenueToday: 1500, ordersToday: 4, avgPreparationTime: 15, avgDeliveryTime: 30,
            customerRating: 4.5, cancellationRate: 25, inventoryWaste: 20, bestStore: 'TEST STORE A2',
        });
        assert.equal(ok(await get(`${SP}/dashboard`, B.adminToken)).revenueToday, 9999);
        assert.equal(ok(await get(`${SP}/dashboard`, fx.SA)).revenueToday, 11499);
    });
    test('store list rows (last 7 days by default; ?dateRange=today)', async () => {
        const { list } = ok(await get(SP, A.adminToken));
        assert.deepEqual(list.map((r) => r.storeName), ['TEST STORE A', 'TEST STORE A2'], 'best score first');
        const a = list[0];
        assert.equal(a._id, A.storeId);
        assert.deepEqual(
            [a.totalOrders, a.completedOrders, a.cancelledOrders, a.revenue, a.avgOrderValue, a.avgPreparationTime, a.avgDeliveryTime, a.customerRating, a.inventoryWaste, a.performanceScore, a.status],
            [4, 3, 1, 1700, 567, 15, 30, 4.5, 20, 72, 'Active'],
        );
        const today = ok(await get(`${SP}?dateRange=today&storeId=${A.storeId}`, A.adminToken)).list[0];
        assert.deepEqual([today.totalOrders, today.revenue, today.performanceScore], [3, 700, 67]);
        assert.equal(ok(await get(`${SP}?search=a2`, A.adminToken)).totalCount, 1);
        assert.deepEqual(ok(await get(`${SP}?sort=revenue&order=asc`, A.adminToken)).list.map((r) => r.revenue), [800, 1700]);
        assert.deepEqual(ok(await get(`/v1/stores/${A.storeId}/performance`, A.adminToken)), a);
    });
    test('trend charts', async () => {
        const rev = ok(await get(`${SP}/revenue`, A.adminToken));
        assert.equal(rev.daily.length, 7);
        assert.equal(rev.daily.at(-1).revenue, 1500);
        assert.equal(rev.daily.at(-2).revenue, 1000);
        assert.deepEqual(rev.weekly.map((w) => w.time), ['Week 1', 'Week 2', 'Week 3', 'Week 4']);
        assert.equal(rev.weekly.at(-1).revenue, 2500);
        assert.equal(rev.monthly.length, 6);
        assert.equal(rev.monthly.reduce((n, m) => n + m.revenue, 0), 2500);
        const orders = ok(await get(`${SP}/orders`, A.adminToken));
        assert.deepEqual(orders.at(-1), { time: orders.at(-1).time, completed: 3, cancelled: 1 });
        assert.equal(orders.at(-2).completed, 1);
        const ratings = ok(await get(`${SP}/ratings`, A.adminToken));
        assert.equal(ratings.at(-1).rating, 4);
        assert.equal(ratings.at(-2).rating, 5);
        assert.deepEqual(ok(await get(`${SP}/comparison`, A.adminToken)), [
            { name: 'TEST STORE A', revenue: 1700, orders: 4, rating: 4.5, cancellation: 25 },
            { name: 'TEST STORE A2', revenue: 800, orders: 1, rating: 0, cancellation: 0 },
        ]);
        const busy = ok(await get(`${SP}/busy-hours`, A.adminToken));
        assert.ok(busy.every((h) => /^\d{1,2} (AM|PM)$/.test(h.hour)));
        assert.equal(Math.max(...busy.map((h) => h.density)), 100);
    });
    test('compare and export', async () => {
        const rows = ok(await get(`${SP}/compare?storeIds=${A.storeId},${A2.storeId}`, A.adminToken));
        assert.deepEqual(rows.map((r) => r.revenue).sort(), [1700, 800].sort());
        const res = await get(`${SP}/export?storeIds=all&format=csv&dateRange=last7`, A.adminToken);
        assert.equal(ok(res).rows.length, 2);
        assert.match(res.body.message, /export/i);
    });
    test('one store: revenue', async () => {
        const { trend, ...rest } = ok(await get(`${SP}/${A.storeId}/revenue`, A.adminToken));
        assert.deepEqual(rest, {
            todayRevenue: 700, weeklyRevenue: 1700, monthlyRevenue: 1700, avgOrderValue: 567,
            paymentMethods: [{ name: 'Cash on Delivery', value: 100 }],
            distribution: [{ category: 'Other', value: 88.2 }, { category: 'Veg Pizzas', value: 11.8 }],
        });
        assert.equal(trend.length, 7);
        assert.equal(trend.at(-1).revenue, 700);
    });
    test('one store: orders and ratings', async () => {
        const o = ok(await get(`${SP}/${A.storeId}/orders`, A.adminToken));
        assert.deepEqual([o.totalOrders, o.completedOrders, o.cancelledOrders, o.completionRate], [4, 3, 1, 75]);
        assert.deepEqual(o.statusDistribution, [{ name: 'Delivered', value: 75 }, { name: 'Cancelled', value: 25 }, { name: 'In Progress', value: 0 }]);
        assert.equal(o.dailyOrders.length, 7);
        assert.deepEqual(o.dailyOrders.at(-1), { time: o.dailyOrders.at(-1).time, completed: 2, cancelled: 1 });
        assert.equal(o.peakHours.reduce((n, p) => n + p.count, 0), 4);
        const r = ok(await get(`${SP}/${A.storeId}/ratings`, A.adminToken));
        assert.deepEqual([r.avgRating, r.totalReviews, r.positiveReviews, r.negativeReviews], [4.5, 2, 2, 0]);
        assert.deepEqual(r.distribution.map((d) => d.count), [1, 1, 0, 0, 0]);
        assert.deepEqual(r.recentReviews[0], { customer: 'Seeded Customer', rating: 4, comment: 'Hot and fresh', date: r.recentReviews[0].date });
        assert.equal(r.trend.length, 6);
    });
    test('one store: inventory, products, staff', async () => {
        const inv = ok(await get(`${SP}/${A.storeId}/inventory`, A.adminToken));
        assert.deepEqual([inv.wastePercent, inv.outOfStockItems, inv.lowStockAlerts, inv.stockTurnover], [20, 1, 1, 0]);
        assert.deepEqual(inv.consumption, [{ ingredient: 'Mozzarella', consumed: 100, reorder: true }]);
        assert.equal(inv.wasteTrend.at(-1).waste, 20);
        const p = ok(await get(`${SP}/${A.storeId}/products`, A.adminToken));
        assert.deepEqual(p.list, [
            { product: 'Margherita', sold: 3, revenue: 1400, rating: 4.5, popularity: 100 },
            { product: 'Farmhouse', sold: 1, revenue: 200, rating: 0, popularity: 33 },
            { product: 'Garlic Bread', sold: 1, revenue: 100, rating: 4, popularity: 33 },
        ]);
        assert.deepEqual(p.chart[0], { name: 'Margherita', sold: 3 });
        const s = ok(await get(`${SP}/${A.storeId}/staff`, A.adminToken));
        assert.deepEqual([s.ordersProcessed, s.avgPrepTime, s.efficiencyScore], [2, 15, 50]);
        assert.deepEqual(s.performance.find((x) => x.name === 'Chef Ravi (Kitchen)'), { name: 'Chef Ravi (Kitchen)', orders: 1, rating: 4 });
        assert.deepEqual(s.performance.find((x) => x.name === 'Rider One (Delivery)'), { name: 'Rider One (Delivery)', orders: 1, rating: 0 });
        assert.equal(s.productivity.length, 3);
        assert.equal(ok(await get(`${SP}/${B.storeId}/inventory`, B.adminToken)).wastePercent, 0);
    });
});

describe('store details drawer: /orders, /inventory, /reviews, /users ?storeId=', () => {
    const paths = (store) => ['/v1/orders', '/v1/inventory', '/v1/reviews', '/v1/users'].map((p) => `${p}?storeId=${store.storeId}`);
    test('franchise admin: own stores only; super admin: any; others 403; storeId required', async () => {
        for (const p of paths(A)) {
            ok(await get(p, A.adminToken));
            ok(await get(p, fx.SA));
            assert.equal((await get(p, B.adminToken)).status, 404, p);
            for (const token of [A.managerToken, sup, staff, A.customerToken]) assert.equal((await get(p, token)).status, 403, p);
            assert.equal((await get(p)).status, 401, p);
        }
        for (const p of ['/v1/orders', '/v1/inventory', '/v1/reviews', '/v1/users']) assert.equal((await get(p, A.adminToken)).status, 400, p);
    });
    test('they list that store\'s records only', async () => {
        const orders = ok(await get(`/v1/orders?storeId=${A.storeId}`, A.adminToken));
        assert.equal(orders.length, 4);
        assert.ok(JSON.stringify(orders).includes(O.o1.ref));
        assert.ok(!JSON.stringify(orders).includes(O.a2.ref));
        const inv = ok(await get(`/v1/inventory?storeId=${A.storeId}`, A.adminToken));
        assert.deepEqual(inv.data.map((i) => i.ingredientName), ['Mozzarella']);
        assert.equal(ok(await get(`/v1/reviews?storeId=${A.storeId}`, A.adminToken)).reviews.length, 2);
        const users = ok(await get(`/v1/users?storeId=${A.storeId}`, A.adminToken));
        assert.deepEqual(users.map((u) => u.email), [A.managerEmail]);
        assert.equal(ok(await get(`/v1/users?storeId=${A2.storeId}`, A.adminToken)).length, 0);
    });
});
