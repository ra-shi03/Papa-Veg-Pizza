// Kitchen operations (queue, preparation board, pizza / baking / packaging stations, ovens, issues, delayed orders)
// and the My Tasks ingredient request + quality check, driven through the real order flow.
//
// Who may do what, always decided from the token:
//   store manager  -> everything in their store          kitchen supervisor -> only the orders assigned to them
//   kitchen staff  -> only their own station / pizzas    other store, other franchise, customers -> nothing
// Anything outside a caller's reach answers 404 (existence not revealed) or 403 (visible but not theirs).
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose, PASSWORD } from './helpers/fixture.js';

let fx; let A; let B;
let sup; let sup2; let chef; let chef2; let baker; let packer; let bSup; let bStaff;   // { id, token }
let orderNo = 0; let phoneSeq = 0;

const K = '/v1/food/store/kitchen';
const login = async (email) => (await fx.call('POST', '/v1/auth/store/login', null, { email, password: PASSWORD })).body.data.accessToken;
const makeStaff = async (managerToken, role, tag) => {
    const email = `${tag}${fx.ts}@example.invalid`;
    const res = await fx.call('POST', '/v1/food/store/staff', managerToken, { fullName: `Name ${tag}`, email, phone: `7${String(++phoneSeq).padStart(2, '0')}${String(fx.ts).slice(-7)}`, password: PASSWORD, role });
    assert.equal(res.status, 201, `create ${tag}: ${JSON.stringify(res.body)}`);
    return { id: res.body.data.userId, name: `Name ${tag}`, token: await login(email) };
};
const newOrder = async (f, items) => {
    const ref = `KO${fx.ts}${orderNo++}`;
    const r = await fx.models.FoodOrder.collection.insertOne({
        order_id: ref, orderId: ref, userId: new mongoose.Types.ObjectId(f.customerId), storeId: new mongoose.Types.ObjectId(f.storeId), franchiseId: new mongoose.Types.ObjectId(f.franchiseId),
        orderStatus: 'created', payment: { method: 'cash', status: 'cod_pending' }, pricing: { subtotal: 400, total: 400 },
        deliveryAddress: { street: '1 Test Rd', city: 'Pune', state: 'MH' }, customerPhone: f.phone, customerName: 'Test Customer',
        items: items || [{ itemId: 'item-1', name: 'Margherita', quantity: 2, size: 'Medium', price: 200, crust: 'Thin' }],
        note: 'extra cheese', createdAt: new Date(), updatedAt: new Date(),
    });
    return { id: String(r.insertedId), ref };
};
const accept = (f, order, supervisor) => fx.call('PATCH', `/v1/food/store/orders/${order.id}/accept`, f.managerToken, { kitchenSupervisorId: supervisor.id, estimatedPreparationTime: 15, priority: 'urgent' });
const assign = (token, order, staff, slot) => fx.call('PATCH', `/v1/food/store/orders/${order.id}/assign-staff`, token, { staffId: staff.id, role: slot });
const dbOrder = (o) => fx.models.FoodOrder.findById(o.id).lean();

/** An order accepted by A's manager for `sup`, with chef / baker / packer assigned. */
const kitchenOrder = async (items) => {
    const o = await newOrder(A, items);
    assert.equal((await accept(A, o, sup)).status, 200);
    for (const [who, slot] of [[chef, 'pizza_chef'], [baker, 'baking_chef'], [packer, 'packaging_staff']]) assert.equal((await assign(sup.token, o, who, slot)).status, 200);
    return o;
};
const board = async (who) => (await fx.call('GET', `${K}/preparation-board`, who.token)).body.data;
const itemsOf = async (o, who = { token: A.managerToken }) => (await board(who)).filter((i) => i.orderNumber === o.ref);
const put = (who, path, body) => fx.call('PUT', `${K}${path}`, who.token, body);
const post = (who, path, body) => fx.call('POST', `${K}${path}`, who.token, body);
const get = (who, path) => fx.call('GET', `${K}${path}`, who.token);
const mgr = { token: null };

/** Takes a fresh order's pizza to "ready for baking" and returns it. */
const readyForBaking = async () => {
    const o = await kitchenOrder();
    const [it] = await itemsOf(o);
    assert.equal((await put(chef, '/pizza-station/start', { orderItemId: it._id })).status, 200);
    assert.equal((await put(chef, '/pizza-station/complete', { orderItemId: it._id })).status, 200);
    return { o, id: it._id };
};
const ovenId = async (n = 0) => (await get({ token: A.managerToken }, '/ovens')).body.data[n]._id;

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B; mgr.token = A.managerToken;
    sup = await makeStaff(A.managerToken, 'Kitchen Supervisor', 'sup1');
    sup2 = await makeStaff(A.managerToken, 'Kitchen Supervisor', 'sup2');
    chef = await makeStaff(A.managerToken, 'Pizza Maker', 'chef');
    chef2 = await makeStaff(A.managerToken, 'Pizza Maker', 'chef2');
    baker = await makeStaff(A.managerToken, 'Baker', 'baker');
    packer = await makeStaff(A.managerToken, 'Packaging Staff', 'packer');
    bSup = await makeStaff(B.managerToken, 'Kitchen Supervisor', 'bsup');
    bStaff = await makeStaff(B.managerToken, 'Pizza Maker', 'bstaff');
});
after(async () => { await fx?.teardown(); });

const READS = ['/queue', '/preparation-board', '/pizza-station', '/baking-station', '/ovens', '/kitchen-issues', '/packaging', '/delayed-orders', '/inventory-requests', '/quality-checks'];

describe('authentication and roles', () => {
    for (const path of READS) {
        test(`GET ${path}: anonymous 401; customer, franchise admin, super admin 403`, async () => {
            assert.equal((await fx.call('GET', `${K}${path}`)).status, 401);
            for (const token of [A.customerToken, A.adminToken, fx.SA]) assert.equal((await fx.call('GET', `${K}${path}`, token)).status, 403, path);
        });
    }
    test('every station read works for the manager, a supervisor and staff (staff get lists, never a 500)', async () => {
        for (const who of [{ token: A.managerToken }, sup, chef]) {
            for (const path of ['/queue', '/preparation-board', '/pizza-station', '/baking-station', '/ovens', '/kitchen-issues', '/packaging']) {
                assert.equal((await get(who, path)).status, 200, path);
            }
        }
    });
    test('delayed orders are for the manager and supervisors only: staff get 403', async () => {
        assert.equal((await get(chef, '/delayed-orders')).status, 403);
        assert.equal((await get(sup, '/delayed-orders')).status, 200);
    });
    test('quality checks list is for leads only', async () => {
        assert.equal((await get(chef, '/quality-checks')).status, 403);
        assert.equal((await get(sup, '/quality-checks')).status, 200);
    });
});

describe('kitchen queue', () => {
    let o;
    before(async () => { o = await newOrder(A); await accept(A, o, sup); });
    const queueOf = async (who) => (await get(who, '/queue')).body.data.orders.find((x) => x.orderNumber === o.ref);

    test('the manager and the order\'s supervisor see it; another supervisor, the other store and unrelated staff do not', async () => {
        assert.ok(await queueOf({ token: A.managerToken }));
        assert.ok(await queueOf(sup));
        for (const who of [sup2, chef, bSup, bStaff, { token: B.managerToken }]) assert.equal(await queueOf(who), undefined, who.id || 'B manager');
    });
    test('the order has the shape the queue screen renders', async () => {
        const q = await queueOf(sup);
        assert.equal(q.status, 'confirmed');
        assert.equal(q.priority, 'EXPRESS');
        assert.equal(q.paymentMethod, 'COD');
        assert.equal(q.customer.name, 'Test Customer');
        assert.ok(q.customer.deliveryAddress);
        assert.equal(q.items[0].name, 'Margherita');
        assert.match(q.items[0].orderItemId, /^[a-f0-9]{24}$/);
        assert.equal(q.assigned_chef, null);
        const page = (await get(sup, '/queue?limit=1')).body.data.pagination;
        assert.deepEqual(Object.keys(page).sort(), ['limit', 'page', 'total', 'totalPages']);
    });
    test('filters: unassigned, priority, search', async () => {
        assert.ok((await get(sup, '/queue?unassigned=true')).body.data.orders.some((x) => x.orderNumber === o.ref));
        assert.ok((await get(sup, '/queue?priority=EXPRESS')).body.data.orders.some((x) => x.orderNumber === o.ref));
        assert.equal((await get(sup, '/queue?priority=NORMAL')).body.data.orders.some((x) => x.orderNumber === o.ref), false);
        assert.equal((await get(sup, `/queue?search=${o.ref}`)).body.data.orders.length, 1);
    });
    test('accept into the queue: staff 403, another supervisor 404, other store 404, the supervisor 200, twice 400', async () => {
        assert.equal((await put(sup2, `/orders/${o.id}/accept`, {})).status, 404);
        assert.equal((await put(bSup, `/orders/${o.id}/accept`, {})).status, 404);
        assert.equal((await put({ token: B.managerToken }, `/orders/${o.id}/accept`, {})).status, 404);
        const res = await put(sup, `/orders/${o.id}/accept`, { status: 'queued' });
        assert.equal(res.status, 200, JSON.stringify(res.body));
        assert.equal(res.body.data.status, 'queued');
        assert.equal((await put(sup, `/orders/${o.id}/accept`, {})).status, 400);
    });
    test('assign chef: another supervisor 404, staff 403, the supervisor 200; someone from another store 400', async () => {
        assert.equal((await put(sup2, `/orders/${o.id}/assign-chef`, { chefId: chef.id })).status, 404);
        assert.equal((await put(sup, `/orders/${o.id}/assign-chef`, { chefId: bStaff.id })).status, 400);
        const res = await put(sup, `/orders/${o.id}/assign-chef`, { chefId: chef.id });
        assert.equal(res.status, 200, JSON.stringify(res.body));
        assert.equal(res.body.data.assigned_chef, chef.id);
        assert.equal((await put(chef, `/orders/${o.id}/assign-chef`, { chefId: chef2.id })).status, 403);
    });
    test('the order moves to "preparing" through the existing stage flow and the queue follows', async () => {
        const res = await fx.call('PATCH', `/v1/food/store/orders/${o.id}/stage`, sup.token, { stage: 'preparing' });
        assert.equal(res.status, 200, JSON.stringify(res.body));
        assert.equal((await queueOf(sup)).status, 'preparing');
    });
});

describe('rejecting items from the queue', () => {
    let o; let ids;
    before(async () => {
        o = await newOrder(A, [{ itemId: 'a', name: 'Margherita', quantity: 1, size: 'Medium', price: 200 }, { itemId: 'b', name: 'Garlic Bread', quantity: 1, price: 100 }]);
        await accept(A, o, sup);
        ids = (await get(sup, '/queue')).body.data.orders.find((x) => x.orderNumber === o.ref).items.map((i) => i.orderItemId);
    });
    const reject = (who, body) => post(who, '/orders/item-reject', { orderId: o.id, reason: 'Out of dough', ...body });

    test('staff 403, another supervisor 404, other store 404', async () => {
        assert.equal((await reject(chef, { itemIds: [ids[0]] })).status, 404, 'staff without a station on this order');
        assert.equal((await reject(sup2, { itemIds: [ids[0]] })).status, 404);
        assert.equal((await reject(bSup, { itemIds: [ids[0]] })).status, 404);
    });
    test('needs ids and a reason; cannot reject every item; ids of other orders are refused', async () => {
        assert.equal((await reject(sup, { itemIds: [] })).status, 400);
        assert.equal((await reject(sup, { itemIds: [ids[0]], reason: '' })).status, 400);
        assert.equal((await reject(sup, { itemIds: ids })).status, 400, 'all items');
        const other = await kitchenOrder();
        const foreign = (await itemsOf(other))[0]._id;
        assert.equal((await reject(sup, { itemIds: [foreign] })).status, 400);
    });
    test('the supervisor rejects one item; it is flagged and drops off the stations', async () => {
        const res = await reject(sup, { itemIds: [ids[1]], notifyCustomer: true });
        assert.equal(res.status, 200, JSON.stringify(res.body));
        const q = (await get(sup, '/queue')).body.data.orders.find((x) => x.orderNumber === o.ref);
        assert.equal(q.items.find((i) => i.orderItemId === ids[1]).rejected, true);
        assert.equal((await itemsOf(o, { token: A.managerToken })).some((i) => i._id === ids[1]), false);
    });
});

describe('preparation board and pizza station', () => {
    let o; let id;
    before(async () => { o = await kitchenOrder(); id = (await itemsOf(o))[0]._id; });

    test('each pizza is visible to the manager, its supervisor and its chef only', async () => {
        const seen = async (who) => (await itemsOf(o, who)).length;
        assert.equal(await seen({ token: A.managerToken }), 1);
        assert.equal(await seen(sup), 1);
        assert.equal(await seen(chef), 1);
        for (const who of [chef2, baker, packer, sup2, bSup, bStaff, { token: B.managerToken }]) assert.equal(await seen(who), 0, who.id || 'B manager');
    });
    test('the row has the shape the board renders', async () => {
        const [it] = await itemsOf(o);
        assert.equal(it.current_stage, 'assigned');
        assert.equal(it.assigned_chef, chef.id);
        assert.equal(it.priority, 'EXPRESS');
        assert.equal(it.paused, false);
        assert.equal(it.size, 'Medium');
    });
    test('moving a stage: someone else\'s station 403, other supervisor / other store 404, unknown id 404', async () => {
        assert.equal((await put(chef2, `/order-item/${id}/stage`, { stage: 'dough_prep' })).status, 404, 'staff with no link to the order');
        assert.equal((await put(baker, `/order-item/${id}/stage`, { stage: 'dough_prep' })).status, 403, 'baker is on the order but not this station');
        assert.equal((await put(sup2, `/order-item/${id}/stage`, { stage: 'dough_prep' })).status, 404);
        assert.equal((await put(bStaff, `/order-item/${id}/stage`, { stage: 'dough_prep' })).status, 404);
        assert.equal((await put({ token: B.managerToken }, `/order-item/${id}/stage`, { stage: 'dough_prep' })).status, 404);
        assert.equal((await put(chef, `/order-item/000000000000000000000001/stage`, { stage: 'dough_prep' })).status, 404);
        assert.equal((await put(chef, `/order-item/not-an-id/stage`, { stage: 'dough_prep' })).status, 404);
    });
    test('the chef moves it forward; backwards, invalid and baking stages are refused', async () => {
        assert.equal((await put(chef, `/order-item/${id}/stage`, { stage: 'sauce' })).status, 200);
        assert.equal((await put(chef, `/order-item/${id}/stage`, { stage: 'dough_prep' })).status, 400, 'backwards');
        assert.equal((await put(chef, `/order-item/${id}/stage`, { stage: 'baking' })).status, 400, 'baking is not a prep stage');
        assert.equal((await put(chef, `/order-item/${id}/stage`, { stage: 'nonsense' })).status, 400);
        assert.equal((await itemsOf(o))[0].current_stage, 'sauce');
    });
    test('the order itself moves to "preparing" when its first pizza starts', async () => {
        const doc = await dbOrder(o);
        assert.equal(doc.orderStatus, 'preparing');
        assert.equal(doc.kitchen.stage, 'preparing');
    });
    test('pause needs a reason; pressing pause again resumes; a paused pizza cannot move', async () => {
        assert.equal((await put(chef, `/order-item/${id}/pause`, {})).status, 400);
        const p = await put(chef, `/order-item/${id}/pause`, { reason: 'Waiting for sauce', notes: '5 min' });
        assert.equal(p.status, 200);
        assert.equal(p.body.data.paused, true);
        assert.equal((await put(chef, `/order-item/${id}/stage`, { stage: 'toppings' })).status, 400);
        const r = await put(chef, `/order-item/${id}/pause`, {});
        assert.equal(r.body.data.paused, false);
    });
    test('reassign: only the manager or the order\'s supervisor; the new chef must be in this store', async () => {
        assert.equal((await put(chef, `/order-item/${id}/reassign`, { chefId: chef2.id })).status, 403);
        assert.equal((await put(sup2, `/order-item/${id}/reassign`, { chefId: chef2.id })).status, 404);
        assert.equal((await put(sup, `/order-item/${id}/reassign`, { chefId: bStaff.id })).status, 400);
        assert.equal((await put(sup, `/order-item/${id}/reassign`, { chefId: 'junk' })).status, 400);
        const res = await put(sup, `/order-item/${id}/reassign`, { chefId: chef2.id });
        assert.equal(res.status, 200, JSON.stringify(res.body));
        assert.equal((await itemsOf(o, chef2)).length, 1, 'the new chef now sees it');
        assert.equal((await put(chef, `/order-item/${id}/stage`, { stage: 'toppings' })).status, 403, 'the old chef lost it');
    });

    describe('pizza station', () => {
        let o2; let id2;
        before(async () => { o2 = await kitchenOrder(); id2 = (await itemsOf(o2))[0]._id; });
        const station = async (who) => (await get(who, '/pizza-station')).body.data.find((i) => i._id === id2);

        test('shape and visibility', async () => {
            const row = await station(chef);
            assert.equal(row.assembly_status, 'assigned');
            assert.ok(row.pizzaId.startsWith('PIZ-'));
            assert.equal(await station(chef2), undefined);
            assert.equal(await station(bStaff), undefined);
        });
        test('complete before start is refused; start, pause (reason required), resume, complete', async () => {
            assert.equal((await put(chef, '/pizza-station/complete', { orderItemId: id2 })).status, 400);
            assert.equal((await put(chef2, '/pizza-station/start', { orderItemId: id2 })).status, 404);
            assert.equal((await put(baker, '/pizza-station/start', { orderItemId: id2 })).status, 403);
            const s = await put(chef, '/pizza-station/start', { orderItemId: id2 });
            assert.equal(s.body.data.assembly_status, 'assembly_started');
            assert.equal((await put(chef, '/pizza-station/start', { orderItemId: id2 })).status, 400, 'already started');
            assert.equal((await put(chef, '/pizza-station/pause', { orderItemId: id2 })).status, 400, 'reason needed');
            assert.equal((await put(chef, '/pizza-station/pause', { orderItemId: id2, reason: 'Phone call' })).body.data.assembly_status, 'assembly_paused');
            assert.equal((await put(chef, '/pizza-station/complete', { orderItemId: id2 })).status, 400, 'paused');
            assert.equal((await put(chef, '/pizza-station/start', { orderItemId: id2 })).body.data.assembly_status, 'assembly_started', 'start resumes');
            const c = await put(chef, '/pizza-station/complete', { orderItemId: id2, notes: 'ok' });
            assert.equal(c.body.data.assembly_status, 'assembly_completed');
            assert.equal((await put(chef, '/pizza-station/complete', { orderItemId: id2 })).status, 400, 'twice');
        });
    });
});

describe('baking station and ovens', () => {
    test('ovens are created for the store on first use and are the store\'s own', async () => {
        const mine = (await get({ token: A.managerToken }, '/ovens')).body.data;
        assert.equal(mine.length, 5);
        assert.deepEqual(mine.map((x) => x.status), Array(5).fill('available'));
        const theirs = (await get({ token: B.managerToken }, '/ovens')).body.data;
        assert.equal(theirs.length, 5);
        assert.equal(mine.some((m) => theirs.some((t) => t._id === m._id)), false);
    });

    test('a pizza appears in baking only once assembly is complete, and only for its baker', async () => {
        const o = await kitchenOrder();
        const [it] = await itemsOf(o);
        const inBaking = async (who) => (await get(who, '/baking-station')).body.data.some((x) => x._id === it._id);
        assert.equal(await inBaking({ token: A.managerToken }), false);
        await put(chef, '/pizza-station/start', { orderItemId: it._id });
        await put(chef, '/pizza-station/complete', { orderItemId: it._id });
        assert.equal(await inBaking({ token: A.managerToken }), true);
        assert.equal(await inBaking(sup), true);
        assert.equal(await inBaking(baker), true);
        for (const who of [chef, chef2, packer, sup2, bStaff, { token: B.managerToken }]) assert.equal(await inBaking(who), false, who.id || 'B manager');
    });

    test('start baking: needs an oven in this store, a free oven, and the right person', async () => {
        const { id } = await readyForBaking();
        const oven = await ovenId(0);
        const bOven = (await get({ token: B.managerToken }, '/ovens')).body.data[0]._id;
        assert.equal((await put(chef, '/baking/start', { orderItemId: id, ovenId: oven })).status, 403, 'the chef is not the baker');
        assert.equal((await put(chef2, '/baking/start', { orderItemId: id, ovenId: oven })).status, 404);
        assert.equal((await put(sup2, '/baking/start', { orderItemId: id, ovenId: oven })).status, 404);
        assert.equal((await put(bStaff, '/baking/start', { orderItemId: id, ovenId: oven })).status, 404);
        assert.equal((await put(baker, '/baking/start', { orderItemId: id, ovenId: bOven })).status, 400, 'oven of another store');
        assert.equal((await put(baker, '/baking/start', { orderItemId: id })).status, 400, 'no oven');
        const res = await put(baker, '/baking/start', { orderItemId: id, ovenId: oven, temperature: 260, expectedDuration: 9, remarks: 'crisp' });
        assert.equal(res.status, 200, JSON.stringify(res.body));
        assert.equal(res.body.data.baking_status, 'baking_started');
        assert.equal(res.body.data.assigned_oven, oven);
        assert.equal(res.body.data.temperature, 260);
        const busy = (await get({ token: A.managerToken }, '/ovens')).body.data.find((x) => x._id === oven);
        assert.equal(busy.status, 'busy');
        assert.ok(busy.current_pizza);
        assert.equal((await put(baker, '/baking/start', { orderItemId: id, ovenId: oven })).status, 400, 'already baking');
        assert.equal((await put(baker, '/baking/complete', { orderItemId: id })).status, 200, 'free the oven for the next test');
    });

    test('an oven in use cannot take a second pizza; move-oven, pause / resume and complete', async () => {
        const a = await readyForBaking();
        const b = await readyForBaking();
        const [o0, o1] = [await ovenId(1), await ovenId(2)];
        assert.equal((await put(baker, '/baking/start', { orderItemId: a.id, ovenId: o0 })).status, 200);
        assert.equal((await put(baker, '/baking/start', { orderItemId: b.id, ovenId: o0 })).status, 400, 'oven busy');
        assert.equal((await put(baker, '/baking/move-oven', { orderItemId: a.id, newOvenId: o0 })).status, 400, 'same busy oven');
        assert.equal((await put(chef, '/baking/move-oven', { orderItemId: a.id, newOvenId: o1 })).status, 403);
        const moved = await put(baker, '/baking/move-oven', { orderItemId: a.id, newOvenId: o1, remarks: 'hot spot' });
        assert.equal(moved.body.data.assigned_oven, o1);
        assert.equal((await put(baker, '/baking/pause', { orderItemId: a.id })).status, 400, 'reason needed');
        assert.equal((await put(baker, '/baking/pause', { orderItemId: a.id, reason: 'Power cut' })).body.data.baking_status, 'baking_paused');
        assert.equal((await put(baker, '/baking/complete', { orderItemId: a.id })).status, 400, 'paused');
        assert.equal((await put(baker, '/baking/start', { orderItemId: a.id })).body.data.baking_status, 'baking_started', 'start resumes');
        const done = await put(baker, '/baking/complete', { orderItemId: a.id, remarks: 'perfect' });
        assert.equal(done.body.data.baking_status, 'baking_completed');
        assert.equal((await get({ token: A.managerToken }, '/ovens')).body.data.find((x) => x._id === o1).status, 'available', 'oven is free again');
        assert.equal((await put(baker, '/baking/complete', { orderItemId: a.id })).status, 400, 'twice');
    });

    test('when every pizza of an order is baked, the order moves to packaging', async () => {
        const { o, id } = await readyForBaking();
        assert.equal((await dbOrder(o)).kitchen.stage, 'baking');
        await put(baker, '/baking/start', { orderItemId: id, ovenId: await ovenId(3) });
        await put(baker, '/baking/complete', { orderItemId: id });
        const doc = await dbOrder(o);
        assert.equal(doc.kitchen.stage, 'packaging');
        assert.equal(doc.kitchen.packaging.status, 'ready_for_packaging');
        assert.ok((await get(packer, '/packaging')).body.data.some((x) => x.orderNumber === o.ref));
    });

    test('a two-pizza order only reaches packaging when both are baked', async () => {
        const o = await kitchenOrder([{ itemId: 'a', name: 'Margherita', quantity: 1, price: 200 }, { itemId: 'b', name: 'Farmhouse', quantity: 1, price: 250 }]);
        const [p1, p2] = await itemsOf(o);
        for (const [n, p] of [[0, p1], [1, p2]]) {
            await put(chef, '/pizza-station/start', { orderItemId: p._id });
            await put(chef, '/pizza-station/complete', { orderItemId: p._id });
            await put(baker, '/baking/start', { orderItemId: p._id, ovenId: await ovenId(n) });
        }
        await put(baker, '/baking/complete', { orderItemId: p1._id });
        assert.equal((await dbOrder(o)).kitchen.stage, 'baking');
        await put(baker, '/baking/complete', { orderItemId: p2._id });
        assert.equal((await dbOrder(o)).kitchen.stage, 'packaging');
    });
});

describe('kitchen issues', () => {
    let o; let it;
    before(async () => { o = await kitchenOrder(); it = (await itemsOf(o))[0]; });

    test('staff report on a pizza they can see; others cannot', async () => {
        assert.equal((await post(chef, '/kitchen-issues', {})).status, 400, 'type required');
        assert.equal((await post(chef2, '/kitchen-issues', { orderItemId: it._id, issueType: 'Overcooked' })).status, 404);
        assert.equal((await post(bStaff, '/kitchen-issues', { orderItemId: it._id, issueType: 'Overcooked' })).status, 404);
        assert.equal((await post(sup2, '/kitchen-issues', { orderItemId: it._id, issueType: 'Overcooked' })).status, 404);
        const res = await post(chef, '/kitchen-issues', { orderItemId: it._id, issueType: 'Wrong topping', severity: 'High', remarks: 'olives', image: 'https://evil.example/x.png', notifyManager: true });
        assert.equal(res.status, 201, JSON.stringify(res.body));
        assert.equal(res.body.data.severity, 'High');
        assert.equal(res.body.data.image, '', 'only our own Cloudinary images are kept');
        assert.equal(res.body.data.orderItemId, it._id);
    });
    test('the manager is notified when asked', async () => {
        const notes = (await fx.call('GET', '/v1/tasks/notifications', A.managerToken)).body.data;
        assert.ok(notes.some((n) => /Kitchen issue: Wrong topping/.test(n.title)));
    });
    test('visibility: manager sees the store\'s issues, the chef their own, a supervisor those on their orders, others none', async () => {
        const has = async (who) => (await get(who, '/kitchen-issues')).body.data.some((i) => i.issueType === 'Wrong topping');
        assert.equal(await has({ token: A.managerToken }), true);
        assert.equal(await has(chef), true);
        assert.equal(await has(sup), true);
        for (const who of [chef2, baker, sup2, bStaff, { token: B.managerToken }]) assert.equal(await has(who), false, who.id || 'B manager');
    });
});

describe('packaging station', () => {
    let o;
    before(async () => {
        const r = await readyForBaking();
        o = r.o;
        await put(baker, '/baking/start', { orderItemId: r.id, ovenId: await ovenId(4) });
        await put(baker, '/baking/complete', { orderItemId: r.id });
    });
    const row = async (who) => (await get(who, '/packaging')).body.data.find((x) => x.orderNumber === o.ref);
    const allChecked = { pizzaCountVerified: true, saucesIncluded: true, cutleryIncluded: true, billAttached: true, qualityVerified: true, packagingSealed: true, notes: 'double sauce' };

    test('only the manager, the supervisor and the packer see it', async () => {
        assert.ok(await row({ token: A.managerToken }));
        assert.ok(await row(sup));
        const r = await row(packer);
        assert.equal(r.packaging_status, 'ready_for_packaging');
        assert.equal(r.deliveryType, 'Delivery');
        assert.ok(r.customer.deliveryAddress);
        for (const who of [chef, baker, sup2, bStaff, { token: B.managerToken }]) assert.equal(await row(who), undefined, who.id || 'B manager');
    });
    test('steps in the wrong order are refused', async () => {
        assert.equal((await post(packer, '/packaging/checklist', { orderId: o.id, ...allChecked })).status, 400, 'checklist before start');
        assert.equal((await put(packer, '/packaging/seal', { orderId: o.id })).status, 400, 'seal before checklist');
        assert.equal((await put(packer, `/orders/${o.id}/ready`, {})).status, 400, 'ready before seal');
    });
    test('only the packer / supervisor / manager may start: other staff 403, others 404', async () => {
        assert.equal((await put(chef, '/packaging/start', { orderId: o.id })).status, 403, 'on the order but not at packaging');
        assert.equal((await put(sup2, '/packaging/start', { orderId: o.id })).status, 404);
        assert.equal((await put(bStaff, '/packaging/start', { orderId: o.id })).status, 404);
        assert.equal((await put({ token: B.managerToken }, '/packaging/start', { orderId: o.id })).status, 404);
        const res = await put(packer, '/packaging/start', { orderId: o.id });
        assert.equal(res.status, 200, JSON.stringify(res.body));
        assert.equal(res.body.data.packaging_status, 'packaging_started');
        assert.equal(res.body.data.assigned_staff, packer.id);
        assert.equal((await put(packer, '/packaging/start', { orderId: o.id })).status, 400, 'twice');
    });
    test('every checklist item must be ticked', async () => {
        for (const missing of Object.keys(allChecked).filter((k) => k !== 'notes')) {
            assert.equal((await post(packer, '/packaging/checklist', { orderId: o.id, ...allChecked, [missing]: false })).status, 400, missing);
        }
        const res = await post(packer, '/packaging/checklist', { orderId: o.id, ...allChecked });
        assert.equal(res.body.data.packaging_status, 'quality_checked');
    });
    test('seal, then ready: the order becomes ready for pickup', async () => {
        assert.equal((await put(chef, '/packaging/seal', { orderId: o.id })).status, 403);
        assert.equal((await put(packer, '/packaging/seal', { orderId: o.id, remarks: 'taped' })).body.data.packaging_status, 'sealed');
        assert.equal((await put(chef, `/orders/${o.id}/ready`, {})).status, 403);
        const res = await put(packer, `/orders/${o.id}/ready`, {});
        assert.equal(res.status, 200, JSON.stringify(res.body));
        assert.equal(res.body.data.packaging_status, 'ready_for_pickup');
        const doc = await dbOrder(o);
        assert.equal(doc.orderStatus, 'ready_for_pickup');
        assert.equal(doc.kitchen.stage, 'ready');
    });
    test('a ready order stays visible for hand-over filters', async () => {
        const ready = (await get({ token: A.managerToken }, '/packaging?readyForPickup=true')).body.data;
        assert.ok(ready.some((x) => x.orderNumber === o.ref));
        const pending = (await get({ token: A.managerToken }, '/packaging?pendingPackaging=true')).body.data;
        assert.equal(pending.some((x) => x.orderNumber === o.ref), false);
    });
});

describe('delayed orders', () => {
    let o;
    before(async () => {
        o = await kitchenOrder();
        await fx.models.FoodOrder.updateOne({ _id: o.id }, { $set: { 'kitchen.expectedReadyAt': new Date(Date.now() - 30 * 60000) } });
    });
    const find = async (who, qs = '') => (await get(who, `/delayed-orders${qs}`)).body.data.find((x) => x.orderNumber === o.ref);

    test('the manager and the order\'s supervisor see it, with how late it is; others do not', async () => {
        const d = await find({ token: A.managerToken });
        assert.equal(d.isDelayed, true);
        assert.ok(d.delay_duration >= 29);
        assert.equal(d.customer.name, 'Test Customer');
        assert.equal(d.items[0].name, 'Margherita');
        assert.ok(await find(sup));
        for (const who of [sup2, bSup, { token: B.managerToken }]) assert.equal(await find(who), undefined, who.id || 'B manager');
    });
    test('filters: critical only, stage, priority, staff', async () => {
        assert.ok(await find(sup, '?criticalOnly=true'));
        assert.ok(await find(sup, '?stage=preparing') || await find(sup, '?stage=queued'));
        assert.equal(await find(sup, '?priority=NORMAL'), undefined);
        assert.ok(await find(sup, '?priority=EXPRESS'));
    });
    test('escalate: staff 403, another supervisor 404; the target must be in this store', async () => {
        assert.equal((await post(chef, `/orders/${o.id}/escalate`, { reason: 'Oven fault', assignedTo: sup.id })).status, 403);
        assert.equal((await post(sup2, `/orders/${o.id}/escalate`, { reason: 'Oven fault', assignedTo: sup.id })).status, 404);
        assert.equal((await post(sup, `/orders/${o.id}/escalate`, { reason: '', assignedTo: sup.id })).status, 400);
        assert.equal((await post(sup, `/orders/${o.id}/escalate`, { reason: 'Oven fault', assignedTo: bSup.id })).status, 400);
        const res = await post(sup, `/orders/${o.id}/escalate`, { severity: 'High', reason: 'Oven fault', assignedTo: A.managerUserId, notes: 'please check' });
        assert.equal(res.status, 201, JSON.stringify(res.body));
        assert.equal(res.body.data.severity, 'High');
        assert.ok((await fx.call('GET', '/v1/tasks/notifications', A.managerToken)).body.data.some((n) => /Escalation/.test(n.title)));
        assert.equal((await find(sup)).reason, 'Oven fault', 'the delay reason is recorded');
    });
    test('reassign: lead only; staff from another store refused', async () => {
        assert.equal((await put(chef, `/orders/${o.id}/reassign`, { staffId: chef2.id })).status, 403);
        assert.equal((await put(sup2, `/orders/${o.id}/reassign`, { staffId: chef2.id })).status, 404);
        assert.equal((await put(sup, `/orders/${o.id}/reassign`, { staffId: bStaff.id })).status, 400);
        assert.equal((await put(sup, `/orders/${o.id}/reassign`, { staffId: chef2.id })).status, 200);
        assert.equal((await dbOrder(o)).kitchen.staff.pizza_chef.userId.toString(), chef2.id);
    });
    test('notify customer: lead only; a message is required', async () => {
        assert.equal((await post(baker, `/orders/${o.id}/notify-customer`, { channels: ['sms'], message: 'Sorry' })).status, 403);
        assert.equal((await post(sup2, `/orders/${o.id}/notify-customer`, { channels: ['sms'], message: 'Sorry' })).status, 404);
        assert.equal((await post(sup, `/orders/${o.id}/notify-customer`, { channels: ['sms'], message: '' })).status, 400);
        const res = await post(sup, `/orders/${o.id}/notify-customer`, { channels: ['sms', 'push'], message: 'Running 10 minutes late, sorry!' });
        assert.equal(res.status, 200, JSON.stringify(res.body));
    });
    test('resolve: lead only; it leaves the active list and shows in the resolved one; twice is refused', async () => {
        assert.equal((await put(baker, `/orders/${o.id}/resolve-delay`, {})).status, 403);
        assert.equal((await put(sup2, `/orders/${o.id}/resolve-delay`, {})).status, 404);
        assert.equal((await put(sup, `/orders/${o.id}/resolve-delay`, { resolutionNotes: 'Oven repaired' })).status, 200);
        assert.equal(await find(sup), undefined);
        assert.ok(await find(sup, '?resolved=true'));
        assert.equal((await put(sup, `/orders/${o.id}/resolve-delay`, {})).status, 400);
    });
});

describe('My Tasks: ingredient request', () => {
    let task; let otherTask;
    before(async () => {
        const o = await kitchenOrder();
        task = (await fx.call('GET', '/v1/tasks', chef.token)).body.data.find((t) => t.orderId === o.ref);
        otherTask = (await fx.call('GET', '/v1/tasks', baker.token)).body.data.find((t) => t.orderId === o.ref);
        assert.ok(task && otherTask);
    });
    const body = (extra = {}) => ({ ingredientName: 'Processed Mozzarella Cheese', quantity: 2, unit: 'kg', reason: 'Running low', ...extra });

    test('any kitchen role can ask; anonymous, customer, franchise admin cannot', async () => {
        assert.equal((await fx.call('POST', `${K}/inventory-requests`, null, body())).status, 401);
        for (const token of [A.customerToken, A.adminToken, fx.SA]) assert.equal((await fx.call('POST', `${K}/inventory-requests`, token, body())).status, 403);
        for (const who of [chef, sup, { token: A.managerToken }]) {
            const res = await post(who, '/inventory-requests', body());
            assert.equal(res.status, 201, JSON.stringify(res.body));
            assert.equal(res.body.data.status, 'Pending');
        }
    });
    test('validation: name, quantity and unit', async () => {
        for (const bad of [{ ingredientName: '' }, { quantity: 0 }, { quantity: -1 }, { quantity: 'lots' }, { quantity: 1e9 }, { unit: '' }]) {
            assert.equal((await post(chef, '/inventory-requests', body(bad))).status, 400, JSON.stringify(bad));
        }
    });
    test('tied to a task: staff may only use their own task; other staff, supervisors without it and other stores get 404', async () => {
        assert.equal((await post(chef, '/inventory-requests', body({ taskId: task._id }))).status, 201);
        assert.equal((await post(chef, '/inventory-requests', body({ taskId: otherTask._id }))).status, 404, 'someone else\'s task');
        assert.equal((await post(bStaff, '/inventory-requests', body({ taskId: task._id }))).status, 404, 'other store');
        assert.equal((await post(sup2, '/inventory-requests', body({ taskId: task._id }))).status, 404, 'supervisor of another order');
        assert.equal((await post(chef, '/inventory-requests', body({ taskId: 'junk' }))).status, 404);
    });
    test('the manager is notified and sees every request of the store; staff only their own; other stores none', async () => {
        const mine = (await get(chef, '/inventory-requests')).body.data;
        assert.ok(mine.length >= 2);
        assert.ok(mine.every((r) => r.requestedBy === chef.id));
        const all = (await get({ token: A.managerToken }, '/inventory-requests')).body.data;
        assert.ok(all.some((r) => r.requestedBy === chef.id) && all.some((r) => r.requestedBy === sup.id));
        assert.equal((await get({ token: B.managerToken }, '/inventory-requests')).body.data.length, 0);
        assert.ok((await fx.call('GET', '/v1/tasks/notifications', A.managerToken)).body.data.some((n) => n.title === 'Ingredient request'));
    });
});

describe('My Tasks: quality check', () => {
    let o; let supTask;
    before(async () => {
        o = await kitchenOrder();
        supTask = (await fx.call('GET', '/v1/tasks', sup.token)).body.data.find((t) => t.orderId === o.ref);
        assert.ok(supTask);
    });
    const body = (extra = {}) => ({ taskId: supTask._id, orderId: o.ref, rating: 5, temperature: '72', toppingsCorrect: true, crustCorrect: true, remarks: 'Great', ...extra });

    test('staff, customers and admins cannot submit one', async () => {
        assert.equal((await fx.call('POST', `${K}/quality-checks`, null, body())).status, 401);
        for (const token of [A.customerToken, A.adminToken, fx.SA, chef.token, baker.token]) {
            assert.equal((await fx.call('POST', `${K}/quality-checks`, token, body())).status, 403);
        }
    });
    test('another supervisor, and anyone from another store, cannot check this order (404)', async () => {
        assert.equal((await post(sup2, '/quality-checks', body())).status, 404);
        assert.equal((await post(bSup, '/quality-checks', body())).status, 404);
        assert.equal((await post({ token: B.managerToken }, '/quality-checks', body())).status, 404);
        assert.equal((await post({ token: B.managerToken }, '/quality-checks', { orderId: o.ref, rating: 4 })).status, 404, 'by order number from another store');
    });
    test('rating must be a whole number from 1 to 5; temperature must be sane; a task can only vouch for its own order', async () => {
        for (const bad of [{ rating: 0 }, { rating: 6 }, { rating: 4.5 }, { rating: 'x' }, { temperature: 9999 }, { temperature: 'hot' }]) {
            assert.equal((await post(sup, '/quality-checks', body(bad))).status, 400, JSON.stringify(bad));
        }
        const other = await kitchenOrder();
        assert.equal((await post(sup, '/quality-checks', body({ orderId: other.ref }))).status, 400);
    });
    test('the supervisor of the order saves it; the manager may too; leads see them, staff do not', async () => {
        const res = await post(sup, '/quality-checks', body());
        assert.equal(res.status, 201, JSON.stringify(res.body));
        assert.equal(res.body.data.rating, 5);
        assert.equal((await post({ token: A.managerToken }, '/quality-checks', body({ rating: 3 }))).status, 201);
        assert.equal((await get(sup, '/quality-checks')).body.data.length, 1, 'a supervisor sees only their own checks');
        assert.equal((await get({ token: A.managerToken }, '/quality-checks')).body.data.length, 2);
        assert.equal((await get({ token: B.managerToken }, '/quality-checks')).body.data.length, 0);
        const doc = await dbOrder(o);
        assert.ok(doc.statusHistory.some((h) => /Quality check: 5\/5/.test(h.note)));
    });
});

describe('staff management scope', () => {
    const emailsOf = async (token) => (await fx.call('GET', '/v1/store-managers', token)).body.data.map((m) => m.email);

    test('/v1/store-managers: a franchise admin sees only managers of their own franchise', async () => {
        const a = await emailsOf(A.adminToken);
        const b = await emailsOf(B.adminToken);
        assert.ok(a.includes(A.managerEmail) && !a.includes(B.managerEmail));
        assert.ok(b.includes(B.managerEmail) && !b.includes(A.managerEmail));
        assert.ok(a.some((e) => e.startsWith('sup1')), 'including the supervisors created in A');
        assert.equal(a.some((e) => e.startsWith('bsup')), false);
    });
    test('/v1/store-managers: anonymous 401; customers, store staff and managers 403', async () => {
        assert.equal((await fx.call('GET', '/v1/store-managers')).status, 401);
        for (const token of [A.customerToken, A.managerToken, sup.token, chef.token]) assert.equal((await fx.call('GET', '/v1/store-managers', token)).status, 403);
    });
    test('the kitchen hooks\' team list (/food/store/orders/team) is the caller\'s own store only', async () => {
        for (const who of [{ token: A.managerToken }, sup, chef]) {
            const res = await fx.call('GET', '/v1/food/store/orders/team', who.token);
            assert.equal(res.status, 200);
            const ids = res.body.data.map((m) => m._id);
            assert.ok(ids.includes(chef.id) && ids.includes(baker.id) && ids.includes(packer.id));
            assert.equal(ids.includes(bStaff.id) || ids.includes(bSup.id), false);
        }
        const baking = (await fx.call('GET', '/v1/food/store/orders/team?role=baking_chef', A.managerToken)).body.data;
        assert.deepEqual(baking.map((m) => m._id), [baker.id]);
        assert.equal((await fx.call('GET', '/v1/food/store/orders/team', A.customerToken)).status, 403);
    });
    test('only the store manager creates supervisors / staff: supervisors, staff and the other store\'s manager cannot add to this store', async () => {
        const payload = (tag) => ({ fullName: `X ${tag}`, email: `x${tag}${fx.ts}@example.invalid`, phone: `6${String(++phoneSeq).padStart(2, '0')}${String(fx.ts).slice(-7)}`, password: PASSWORD, role: 'Pizza Maker' });
        for (const who of [sup, chef, { token: A.adminToken }, { token: A.customerToken }]) {
            assert.equal((await fx.call('POST', '/v1/food/store/staff', who.token, payload('no'))).status, 403, who.id);
        }
        const res = await fx.call('POST', '/v1/food/store/staff', B.managerToken, payload('b'));
        assert.equal(res.status, 201);
        const staff = (await fx.call('GET', '/v1/food/store/staff', A.managerToken)).body.data;
        assert.equal(JSON.stringify(staff).includes(`xb${fx.ts}`), false, 'B\'s new staff member is not in A\'s list');
    });
});
