// Store inventory (/v1/food/store/inventory): stock levels, alerts, stock requests, waste, shortages, recipes, transfers.
//
//   store manager  -> whole store          kitchen supervisor / staff -> read stock + shortages, file waste / shortage
//   franchise admin-> read only, own store  reports and stock requests (staff see only their own waste + requests)
//   another store / franchise              -> 404 for records, 403 for actions they have no role for
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose, PASSWORD } from './helpers/fixture.js';

let fx; let A; let B;
let sup; let chef; let chef2; let bSup; let bStaff; let a2Manager;   // { id, token }
let a2StoreId;
let phoneSeq = 0;
const uploaded = [];
let restoreCloudinary;

const INV = '/v1/food/store/inventory';
const KITCHEN = '/v1/food/store/kitchen';
const login = async (email) => (await fx.call('POST', '/v1/auth/store/login', null, { email, password: PASSWORD })).body.data.accessToken;
const makeStaff = async (managerToken, role, tag) => {
    const email = `${tag}${fx.ts}@example.invalid`;
    const res = await fx.call('POST', '/v1/food/store/staff', managerToken, { fullName: `Name ${tag}`, email, phone: `7${String(++phoneSeq).padStart(2, '0')}${String(fx.ts).slice(-7)}`, password: PASSWORD, role });
    assert.equal(res.status, 201, `create ${tag}: ${JSON.stringify(res.body)}`);
    return { id: res.body.data.userId, name: `Name ${tag}`, token: await login(email) };
};
const asManager = (f) => ({ token: f.managerToken, id: f.managerUserId });
const call = (who, method, path, body) => fx.call(method, `${INV}${path}`, who.token, body);
const get = (who, path) => call(who, 'GET', path);
const MGR_A = () => asManager(A);
const MGR_B = () => asManager(B);
const FA_A = () => ({ token: A.adminToken });
const FA_B = () => ({ token: B.adminToken });

/** A second approved store (and its manager) in franchise A, for transfer tests. */
async function makeSisterStore() {
    const st = await fx.call('POST', '/v1/stores', A.adminToken, {
        storeName: 'TEST STORE A2', storeCode: `A2${fx.ts}`, storeType: 'DELIVERY_CARRYOUT', phone: '9999999941', email: `a2store${fx.ts}@example.invalid`,
        address: { line1: 'a', city: 'c', state: 's', pincode: '110001', coordinates: [77.3, 28.7] }, status: 'Active',
    });
    assert.equal(st.status, 201, JSON.stringify(st.body));
    const storeId = st.body.data._id;
    assert.equal((await fx.call('PATCH', `/v1/store-approvals/${storeId}/approve`, fx.SA, {})).status, 200);
    const email = `a2mgr${fx.ts}@example.invalid`;
    const mc = await fx.api.post('/api/v1/store-managers').set(fx.bearer(A.adminToken))
        .field('name', 'Manager A2').field('email', email).field('phone', `55${String(fx.ts).slice(-8)}`)
        .field('employeeCode', `EMA2${fx.ts}`).field('storeId', storeId).field('password', PASSWORD).field('status', 'Active').field('salary', '1000');
    assert.equal(mc.status, 201, JSON.stringify(mc.body));
    return { storeId, manager: { id: mc.body.data.userId, token: await login(email) } };
}

const ingredients = async (who) => (await get(who, '?limit=100')).body.data;
const byName = async (who, name) => (await ingredients(who)).find((i) => i.ingredientName === name);
const stockIn = (who, ing, quantity, extra = {}) => call(who, 'POST', '/update-stock', { ingredientId: ing._id, type: 'stock_in', quantity, reason: 'Delivery', ...extra });
const fresh = async (who, name) => byName(who, name);

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    sup = await makeStaff(A.managerToken, 'Kitchen Supervisor', 'isup');
    chef = await makeStaff(A.managerToken, 'Pizza Maker', 'ichef');
    chef2 = await makeStaff(A.managerToken, 'Pizza Maker', 'ichef2');
    bSup = await makeStaff(B.managerToken, 'Kitchen Supervisor', 'ibsup');
    bStaff = await makeStaff(B.managerToken, 'Pizza Maker', 'ibstaff');
    ({ storeId: a2StoreId, manager: a2Manager } = await makeSisterStore());

    // Waste photos would go to Cloudinary: record the folder instead of uploading
    const { v2: cloudinary } = await import('cloudinary');
    const original = cloudinary.uploader.upload_stream;
    cloudinary.uploader.upload_stream = (options, cb) => {
        uploaded.push(options.folder);
        return { end: () => cb(null, { secure_url: `https://res.cloudinary.test/${options.folder}/photo.png` }) };
    };
    restoreCloudinary = () => { cloudinary.uploader.upload_stream = original; };
});
after(async () => { restoreCloudinary?.(); await fx?.teardown(); });

const READS = ['', '/dashboard', '/ingredients', '/alerts', '/alerts/dashboard', '/stock-requests', '/stock-requests/dashboard', '/waste', '/waste/dashboard', '/ingredient-shortages', '/ingredient-shortages/dashboard', '/recipes'];

describe('authentication and roles', () => {
    for (const path of READS) {
        test(`GET ${INV}${path}: anonymous 401; customer and super admin 403`, async () => {
            assert.equal((await fx.call('GET', `${INV}${path}`)).status, 401);
            for (const token of [A.customerToken, fx.SA]) assert.equal((await fx.call('GET', `${INV}${path}`, token)).status, 403, path);
        });
    }
    test('every store role can read every list', async () => {
        for (const who of [MGR_A(), sup, chef]) {
            for (const path of READS) assert.equal((await get(who, path)).status, 200, `${path}`);
        }
    });
    test('a franchise admin must name a store of its own franchise; other franchises\' stores are 404', async () => {
        assert.equal((await fx.call('GET', INV, A.adminToken)).status, 400, 'no storeId');
        assert.equal((await fx.call('GET', `${INV}?storeId=${A.storeId}`, A.adminToken)).status, 200);
        assert.equal((await fx.call('GET', `${INV}?storeId=${a2StoreId}`, A.adminToken)).status, 200, 'its other store');
        assert.equal((await fx.call('GET', `${INV}?storeId=${B.storeId}`, A.adminToken)).status, 404);
        assert.equal((await fx.call('GET', `${INV}?storeId=${A.storeId}`, B.adminToken)).status, 404);
        assert.equal((await fx.call('GET', `${INV}?storeId=nonsense`, A.adminToken)).status, 400);
    });
    test('a franchise admin cannot change anything, even in its own store (403)', async () => {
        const ing = await byName(MGR_A(), 'Onion');
        const q = `?storeId=${A.storeId}`;
        const attempts = [
            ['POST', `/update-stock${q}`, { ingredientId: ing._id, type: 'stock_in', quantity: 5, reason: 'x' }],
            ['POST', `/${q}`, { ingredientName: 'Pineapple' }],
            ['PATCH', `/${ing._id}${q}`, { minimumStock: 1 }],
            ['POST', `/stock-requests${q}`, { ingredientId: ing._id, requestedQty: 1, reason: 'x' }],
            ['PATCH', `/stock-requests/approve${q}`, { requestId: '64b000000000000000000001', approvedQty: 1 }],
            ['POST', `/ingredient-shortages${q}`, { ingredientId: ing._id, missingQuantity: 1 }],
            ['POST', `/recipes${q}`, { name: 'X' }],
            ['POST', `/transfer${q}`, { ingredientId: ing._id }],
            ['PATCH', `/alerts/resolve${q}`, { alertId: '64b000000000000000000001', resolutionNote: 'x' }],
            ['DELETE', `/waste/64b000000000000000000001${q}`],
        ];
        for (const [method, path, body] of attempts) assert.equal((await call(FA_A(), method, path, body)).status, 403, `${method} ${path}`);
        const report = await fx.api.post(`/api${INV}/waste/report${q}`).set(fx.bearer(A.adminToken)).field('ingredientId', ing._id).field('quantity', '1').field('wasteType', 'expired').field('reason', 'x');
        assert.equal(report.status, 403);
    });
});

describe('ingredient list and details', () => {
    test('a store starts with the default ingredient list at zero stock, in the shape the screen renders', async () => {
        const res = await get(MGR_A(), '?limit=100');
        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.equal(res.body.data.length, 17);
        assert.deepEqual(Object.keys(res.body.pagination).sort(), ['limit', 'page', 'total', 'totalPages']);
        const cheese = res.body.data.find((i) => i.ingredientName === 'Premium Mozzarella Cheese');
        assert.equal(cheese.currentStock, 0);
        assert.equal(cheese.status, 'out_of_stock');
        assert.equal(cheese.unit, 'KG');
        assert.equal(cheese.minimumStock, 15);
        assert.equal(cheese.storeId, A.storeId);
        for (const k of ['_id', 'category', 'reorderLevel', 'costPerUnit', 'supplierName', 'lastUpdatedBy', 'updatedAt']) assert.ok(k in cheese, k);
    });
    test('pagination and filters', async () => {
        const page = await get(MGR_A(), '?limit=5&page=2');
        assert.equal(page.body.data.length, 5);
        assert.equal(page.body.pagination.total, 17);
        assert.equal(page.body.pagination.totalPages, 4);
        assert.equal((await get(MGR_A(), '?category=Cheese')).body.data.length, 2);
        assert.equal((await get(MGR_A(), '?search=mozz')).body.data.length, 1);
        assert.equal((await get(MGR_A(), '?unit=Litre')).body.data.length, 2);
        assert.equal((await get(MGR_A(), '?status=out_of_stock&limit=100')).body.data.length, 17);
        assert.equal((await get(MGR_A(), '?status=available')).body.data.length, 0);
        assert.equal((await get(MGR_A(), '?category=All&status=All&supplier=All&unit=All')).body.pagination.total, 17);
    });
    test('the dashboard counts', async () => {
        const d = (await get(MGR_A(), '/dashboard')).body;
        assert.deepEqual({ t: d.totalIngredients, a: d.availableIngredients, l: d.lowStockCount, o: d.outOfStockCount, v: d.inventoryValue }, { t: 17, a: 0, l: 0, o: 17, v: 0 });
    });
    test('the kitchen picker lists id, name, stock, unit and availability', async () => {
        const res = await get(chef, '/ingredients');
        assert.equal(res.body.data.length, 17);
        assert.deepEqual(Object.keys(res.body.data[0]).sort(), ['_id', 'availability', 'currentStock', 'name', 'unit']);
        assert.equal(res.body.data[0].availability, 'Out of Stock');
    });
    test('another store has its own separate list', async () => {
        const mine = await ingredients(MGR_A());
        const theirs = await ingredients(MGR_B());
        assert.equal(theirs.length, 17);
        assert.equal(theirs.some((t) => mine.some((m) => m._id === t._id)), false);
    });
    test('details: shape; another store, a franchise admin of another franchise, unknown and malformed ids are 404', async () => {
        const ing = await byName(MGR_A(), 'Capsicum');
        const d = await get(chef, `/${ing._id}`);
        assert.equal(d.status, 200);
        assert.equal(d.body.ingredient.ingredientName, 'Capsicum');
        assert.deepEqual(Object.keys(d.body.consumption).sort(), ['averageDaily', 'month', 'today', 'week']);
        assert.deepEqual(d.body.recentTransactions, []);
        for (const who of [MGR_B(), bSup, bStaff]) assert.equal((await get(who, `/${ing._id}`)).status, 404);
        assert.equal((await fx.call('GET', `${INV}/${ing._id}?storeId=${A.storeId}`, B.adminToken)).status, 404);
        assert.equal((await get(MGR_A(), '/64b000000000000000000001')).status, 404);
        assert.equal((await get(MGR_A(), '/not-an-id')).status, 404);
        assert.equal((await fx.call('GET', `${INV}/${ing._id}?storeId=${A.storeId}`, A.adminToken)).status, 200, 'own franchise admin may read');
    });
});

describe('changing stock', () => {
    let cheese;
    before(async () => { cheese = await byName(MGR_A(), 'Premium Mozzarella Cheese'); });
    const body = (extra = {}) => ({ ingredientId: cheese._id, type: 'stock_in', quantity: 50, reason: 'Fresh delivery', ...extra });

    test('only the store manager: supervisor and staff 403, another store 404', async () => {
        for (const who of [sup, chef]) assert.equal((await call(who, 'POST', '/update-stock', body())).status, 403);
        for (const who of [MGR_B(), bSup]) assert.equal((await call(who, 'POST', '/update-stock', body())).status, who === bSup ? 403 : 404);
        assert.equal((await fresh(MGR_A(), 'Premium Mozzarella Cheese')).currentStock, 0, 'nothing changed');
    });
    test('validation: reason, type, quantity, unknown ingredient', async () => {
        for (const bad of [{ reason: '' }, { type: 'steal' }, { quantity: 0 }, { quantity: -3 }, { quantity: 'lots' }, { ingredientId: 'junk' }]) {
            const res = await call(MGR_A(), 'POST', '/update-stock', body(bad));
            assert.ok([400, 404].includes(res.status), JSON.stringify(bad));
        }
        assert.equal((await call(MGR_A(), 'POST', '/update-stock', body({ ingredientId: '64b000000000000000000001' }))).status, 404);
    });
    test('stock in, stock out and adjustment move the number and are recorded', async () => {
        assert.equal((await call(MGR_A(), 'POST', '/update-stock', body())).body.success, true);
        assert.equal((await fresh(MGR_A(), cheese.ingredientName)).currentStock, 50);
        assert.equal((await fresh(MGR_A(), cheese.ingredientName)).status, 'available');
        await call(MGR_A(), 'POST', '/update-stock', body({ type: 'stock_out', quantity: 5.5, reason: 'Kitchen prep' }));
        assert.equal((await fresh(MGR_A(), cheese.ingredientName)).currentStock, 44.5);
        await call(MGR_A(), 'POST', '/update-stock', body({ type: 'adjustment', quantity: 40, reason: 'Audit', notes: 'recount' }));
        assert.equal((await fresh(MGR_A(), cheese.ingredientName)).currentStock, 40);

        const h = await get(chef, `/${cheese._id}/history?limit=10`);
        assert.equal(h.status, 200);
        assert.equal(h.body.data.length, 3);
        assert.deepEqual(h.body.data.map((t) => [t.type, t.previousStock, t.newStock]), [['adjustment', 44.5, 40], ['stock_out', 50, 44.5], ['stock_in', 0, 50]]);
        assert.match(h.body.data[0].reason, /Audit \(Notes: recount\)/);
        assert.ok(h.body.data[0].createdBy);
        assert.equal((await get(chef, `/${cheese._id}/history?type=stock_in`)).body.data.length, 1);
        assert.equal((await get(chef, `/${cheese._id}/history?search=prep`)).body.data.length, 1);
        assert.equal((await get(MGR_B(), `/${cheese._id}/history`)).status, 404);
        const d = await get(MGR_A(), `/${cheese._id}`);
        assert.equal(d.body.consumption.today, 5.5);
        assert.equal(d.body.recentTransactions.length, 3);
    });
    test('stock can never go below zero', async () => {
        const res = await call(MGR_A(), 'POST', '/update-stock', body({ type: 'stock_out', quantity: 999 }));
        assert.equal(res.status, 400);
        assert.match(res.body.error, /Insufficient stock/);
        assert.equal((await fresh(MGR_A(), cheese.ingredientName)).currentStock, 40);
        assert.equal((await call(MGR_A(), 'POST', '/update-stock', body({ type: 'adjustment', quantity: -1 }))).status, 400);
    });
    test('two stock-outs at the same moment cannot take more than is there', async () => {
        const paneer = await byName(MGR_A(), 'Fresh Paneer Cubes');
        await stockIn(MGR_A(), paneer, 10);
        const results = await Promise.all(Array.from({ length: 4 }, () => call(MGR_A(), 'POST', '/update-stock', { ingredientId: paneer._id, type: 'stock_out', quantity: 4, reason: 'race' })));
        assert.equal(results.filter((r) => r.status === 200).length, 2, 'only two of four 4 kg removals fit in 10 kg');
        assert.equal((await fresh(MGR_A(), 'Fresh Paneer Cubes')).currentStock, 2);
    });
    test('the manager can add an ingredient and change its settings; others cannot', async () => {
        assert.equal((await call(sup, 'POST', '/', { ingredientName: 'Pineapple' })).status, 403);
        const res = await call(MGR_A(), 'POST', '/', { ingredientName: 'Pineapple', category: 'Veggie & Toppings', unit: 'KG', minimumStock: 2, reorderLevel: 4, costPerUnit: 90, supplierName: 'Local Mandi' });
        assert.equal(res.status, 201, JSON.stringify(res.body));
        assert.equal((await call(MGR_A(), 'POST', '/', { ingredientName: ' pineapple ' })).status, 400, 'duplicate (any case)');
        assert.equal((await call(MGR_A(), 'POST', '/', { ingredientName: 'Bad', minimumStock: -1 })).status, 400);
        const id = res.body.data._id;
        assert.equal((await call(chef, 'PATCH', `/${id}`, { costPerUnit: 1 })).status, 403);
        assert.equal((await call(MGR_B(), 'PATCH', `/${id}`, { costPerUnit: 1 })).status, 404);
        const up = await call(MGR_A(), 'PATCH', `/${id}`, { costPerUnit: 95, minimumStock: 3 });
        assert.equal(up.body.data.costPerUnit, 95);
        assert.equal(up.body.data.minimumStock, 3);
    });
});

describe('low-stock alerts and automatic shortages', () => {
    let onion;
    const alertsFor = async (who, q = '') => (await get(who, `/alerts?limit=50${q}`)).body.data.filter((a) => a.ingredientName === 'Onion');
    const shortagesFor = async (who) => (await get(who, '/ingredient-shortages?limit=50')).body.data.filter((s) => s.ingredientName === 'Onion');
    before(async () => { onion = await byName(MGR_A(), 'Onion'); });   // minimum 8, reorder 15

    test('nothing is raised for an ingredient nobody has counted yet', async () => {
        assert.equal((await alertsFor(MGR_A())).length, 0);
        assert.equal((await shortagesFor(MGR_A())).length, 0);
    });
    test('falling to the minimum raises one alert whose severity follows the level', async () => {
        await stockIn(MGR_A(), onion, 20);
        assert.equal((await alertsFor(MGR_A())).length, 0, 'well stocked');
        await call(MGR_A(), 'POST', '/update-stock', { ingredientId: onion._id, type: 'stock_out', quantity: 12, reason: 'prep' });   // 8
        let [a] = await alertsFor(MGR_A());
        assert.equal(a.status, 'active');
        assert.equal(a.severity, 'medium');
        assert.equal(a.currentStock, 8);
        await call(MGR_A(), 'POST', '/update-stock', { ingredientId: onion._id, type: 'stock_out', quantity: 4, reason: 'prep' });    // 4 = half the minimum
        const list = await alertsFor(MGR_A());
        assert.equal(list.length, 1, 'still one alert, updated');
        assert.equal(list[0].severity, 'high');
        assert.equal((await shortagesFor(MGR_A())).length, 0);
        await call(MGR_A(), 'POST', '/update-stock', { ingredientId: onion._id, type: 'stock_out', quantity: 4, reason: 'prep' });    // 0
        [a] = await alertsFor(MGR_A());
        assert.equal(a.severity, 'critical');
        const [s] = await shortagesFor(MGR_A());
        assert.equal(s.createdBy, 'System Auto-Detection');
        assert.equal(s.severity, 'critical');
        assert.equal(s.status, 'active');
    });
    test('alerts are readable by every store role, and only by their own store', async () => {
        for (const who of [sup, chef, MGR_A()]) assert.equal((await alertsFor(who)).length, 1);
        for (const who of [MGR_B(), bSup, bStaff]) assert.equal((await alertsFor(who)).length, 0);
        const d = (await get(sup, '/alerts/dashboard')).body;
        assert.deepEqual(Object.keys(d).filter((k) => k !== 'success').sort(), ['activeAlerts', 'criticalAlerts', 'ingredientsAffected', 'resolvedAlerts']);
        assert.ok(d.activeAlerts >= 1 && d.criticalAlerts >= 1);
        assert.equal((await get(MGR_B(), '/alerts/dashboard')).body.activeAlerts, 0);
    });
    test('alert details: shape, depletion text, other store 404', async () => {
        const [a] = await alertsFor(MGR_A());
        const d = await get(chef, `/alerts/${a._id}`);
        assert.equal(d.status, 200);
        assert.equal(d.body.ingredientName, 'Onion');
        assert.equal(d.body.unit, 'KG');
        assert.equal(d.body.depletionEstimation, 'Out of Stock / Depleted');
        assert.ok(d.body.consumption.month >= 20);
        for (const who of [MGR_B(), bStaff]) assert.equal((await get(who, `/alerts/${a._id}`)).status, 404);
        assert.equal((await get(MGR_A(), '/alerts/junk')).status, 404);
    });
    test('filters', async () => {
        assert.equal((await alertsFor(MGR_A(), '&severity=critical')).length, 1);
        assert.equal((await alertsFor(MGR_A(), '&severity=low')).length, 0);
        assert.equal((await alertsFor(MGR_A(), '&status=resolved')).length, 0);
        assert.equal((await get(MGR_A(), '/alerts?search=onio')).body.data.length, 1);
    });
    test('restocking clears the alert and the automatic shortage by itself', async () => {
        await stockIn(MGR_A(), onion, 30);
        const [a] = await alertsFor(MGR_A());
        assert.equal(a.status, 'resolved');
        assert.equal(a.resolvedBy, 'System');
        const [s] = await shortagesFor(MGR_A());
        assert.equal(s.status, 'resolved');
    });
    test('manual resolve: manager only, needs a note, once', async () => {
        const garlic = await byName(MGR_A(), 'Garlic Mayo Dip');
        await stockIn(MGR_A(), garlic, 3);   // below its minimum 5
        const [a] = (await get(MGR_A(), '/alerts?limit=50')).body.data.filter((x) => x.ingredientName === 'Garlic Mayo Dip');
        for (const who of [sup, chef]) assert.equal((await call(who, 'PATCH', '/alerts/resolve', { alertId: a._id, resolutionNote: 'ok' })).status, 403);
        assert.equal((await call(MGR_B(), 'PATCH', '/alerts/resolve', { alertId: a._id, resolutionNote: 'ok' })).status, 404);
        assert.equal((await call(MGR_A(), 'PATCH', '/alerts/resolve', { alertId: a._id, resolutionNote: '' })).status, 400);
        assert.equal((await call(MGR_A(), 'PATCH', '/alerts/resolve', { alertId: a._id, resolutionNote: 'Ordered more' })).status, 200);
        const after = (await get(MGR_A(), '/alerts?limit=50')).body.data.find((x) => x._id === a._id);
        assert.equal(after.status, 'resolved');
        assert.equal(after.resolutionNote, 'Ordered more');
        assert.equal((await call(MGR_A(), 'PATCH', '/alerts/resolve', { alertId: a._id, resolutionNote: 'again' })).status, 400);
    });
});

describe('stock requests', () => {
    let sauce; let r1; let r2;
    before(async () => { sauce = await byName(MGR_A(), 'Classic Tomato Pizza Sauce'); await stockIn(MGR_A(), sauce, 30); });
    const create = (who, extra = {}) => call(who, 'POST', '/stock-requests', { ingredientId: sauce._id, requestedQty: 12, urgency: 'high', reason: 'Saturday rush', ...extra });
    const list = async (who, q = '') => (await get(who, `/stock-requests?limit=50${q}`)).body.data;

    test('anyone in the store can ask; the number, owner and status are set by the server', async () => {
        const res = await create(chef, { requestedBy: 'Someone Else', status: 'approved', approvedQty: 99 });
        assert.equal(res.status, 201, JSON.stringify(res.body));
        r1 = res.body.data;
        assert.match(r1.requestNo, new RegExp(`^SR-${new Date().getFullYear()}-\\d{3}$`));
        assert.equal(r1.status, 'pending');
        assert.equal(r1.approvedQty, 0);
        assert.equal(r1.requestedBy, 'Name ichef');
        r2 = (await create(sup, { requestedQty: 40, urgency: 'low' })).body.data;
        assert.notEqual(r1.requestNo, r2.requestNo);
        assert.equal((await create(MGR_A())).status, 201);
    });
    test('validation', async () => {
        for (const bad of [{ requestedQty: 0 }, { requestedQty: -1 }, { requestedQty: 'x' }, { reason: '' }, { ingredientId: 'junk' }]) assert.equal((await create(chef, bad)).status, 400, JSON.stringify(bad));
        assert.equal((await create(chef, { ingredientId: (await byName(MGR_B(), 'Onion'))._id })).status, 400, 'an ingredient of another store');
    });
    test('visibility: staff see only their own; supervisor and manager see the store\'s; other store and others none', async () => {
        assert.deepEqual((await list(chef)).map((r) => r._id), [r1._id]);
        assert.equal((await list(chef2)).length, 0);
        assert.equal((await list(sup)).length, 3);
        assert.equal((await list(MGR_A())).length, 3);
        for (const who of [MGR_B(), bSup, bStaff]) assert.equal((await list(who)).length, 0);
        assert.equal((await list(MGR_A(), '&status=pending')).length, 3);
        assert.equal((await list(MGR_A(), '&urgency=low')).length, 1);
        assert.equal((await list(MGR_A(), `&search=${r1.requestNo}`)).length, 1);
        const d = (await get(MGR_A(), '/stock-requests/dashboard')).body;
        assert.deepEqual({ p: d.pendingRequests, a: d.approvedRequests, r: d.rejectedRequests, u: d.urgentRequests }, { p: 3, a: 0, r: 0, u: 2 });
        assert.equal((await get(chef, '/stock-requests/dashboard')).body.pendingRequests, 1);
    });
    test('details: your own, or any as a lead; another person\'s request is 404 for staff, and any request of another store', async () => {
        const d = await get(chef, `/stock-requests/${r1._id}`);
        assert.equal(d.status, 200);
        assert.equal(d.body.request.requestNo, r1.requestNo);
        assert.equal(d.body.ingredient.ingredientName, 'Classic Tomato Pizza Sauce');
        assert.equal(d.body.requestedBy.name, 'Name ichef');
        assert.equal(d.body.approvedBy, null);
        assert.equal(d.body.timeline[0].title, 'Requested');
        assert.equal((await get(chef2, `/stock-requests/${r1._id}`)).status, 404);
        assert.equal((await get(chef, `/stock-requests/${r2._id}`)).status, 404, 'staff cannot open a supervisor\'s request');
        assert.equal((await get(sup, `/stock-requests/${r1._id}`)).status, 200);
        for (const who of [MGR_B(), bSup]) assert.equal((await get(who, `/stock-requests/${r1._id}`)).status, 404);
    });
    test('approve / reject / fulfil: manager only', async () => {
        for (const who of [sup, chef]) {
            for (const [verb, extra] of [['approve', { approvedQty: 5 }], ['reject', { remarks: 'no' }], ['fulfill', { deliveredQty: 5 }]]) {
                assert.equal((await call(who, 'PATCH', `/stock-requests/${verb}`, { requestId: r1._id, ...extra })).status, 403, `${who.id} ${verb}`);
            }
        }
        for (const verb of ['approve', 'reject', 'fulfill']) assert.equal((await call(MGR_B(), 'PATCH', `/stock-requests/${verb}`, { requestId: r1._id, approvedQty: 5, remarks: 'x', deliveredQty: 5 })).status, 404);
    });
    test('approve: quantity must be positive and not above the request; only pending ones', async () => {
        assert.equal((await call(MGR_A(), 'PATCH', '/stock-requests/approve', { requestId: r1._id, approvedQty: 0 })).status, 400);
        assert.equal((await call(MGR_A(), 'PATCH', '/stock-requests/approve', { requestId: r1._id, approvedQty: 13 })).status, 400);
        assert.equal((await call(MGR_A(), 'PATCH', '/stock-requests/fulfill', { requestId: r1._id, deliveredQty: 5 })).status, 400, 'not approved yet');
        const ok = await call(MGR_A(), 'PATCH', '/stock-requests/approve', { requestId: r1._id, approvedQty: 10, remarks: 'Partial' });
        assert.equal(ok.status, 200, JSON.stringify(ok.body));
        assert.match(ok.body.message, new RegExp(r1.requestNo));
        assert.equal((await call(MGR_A(), 'PATCH', '/stock-requests/approve', { requestId: r1._id, approvedQty: 10 })).status, 400, 'twice');
        assert.equal((await call(MGR_A(), 'PATCH', '/stock-requests/reject', { requestId: r1._id, remarks: 'late' })).status, 400, 'no longer pending');
        const d = (await get(chef, `/stock-requests/${r1._id}`)).body;
        assert.equal(d.request.status, 'approved');
        assert.equal(d.request.approvedQty, 10);
        assert.equal(d.request.approvedBy, d.approvedBy.name);
        assert.deepEqual(d.timeline.map((t) => t.title), ['Requested', 'Approved']);
        assert.ok((await fx.call('GET', '/v1/tasks/notifications', chef.token)).body.data.some((n) => /approved/.test(n.title)), 'the requester is told');
    });
    test('reject needs a reason', async () => {
        assert.equal((await call(MGR_A(), 'PATCH', '/stock-requests/reject', { requestId: r2._id, remarks: '' })).status, 400);
        assert.equal((await call(MGR_A(), 'PATCH', '/stock-requests/reject', { requestId: r2._id, remarks: 'Too much' })).status, 200);
        const d = (await get(sup, `/stock-requests/${r2._id}`)).body;
        assert.equal(d.request.status, 'rejected');
        assert.equal(d.timeline[1].status, 'failed');
    });
    test('fulfil takes the delivered quantity out of stock, once, and never more than approved', async () => {
        assert.equal((await call(MGR_A(), 'PATCH', '/stock-requests/fulfill', { requestId: r1._id, deliveredQty: 11 })).status, 400, 'more than approved');
        assert.equal((await call(MGR_A(), 'PATCH', '/stock-requests/fulfill', { requestId: r1._id, deliveredQty: 0 })).status, 400);
        const ok = await call(MGR_A(), 'PATCH', '/stock-requests/fulfill', { requestId: r1._id, deliveredQty: 10 });
        assert.equal(ok.status, 200, JSON.stringify(ok.body));
        assert.equal((await fresh(MGR_A(), 'Classic Tomato Pizza Sauce')).currentStock, 20);
        assert.equal((await call(MGR_A(), 'PATCH', '/stock-requests/fulfill', { requestId: r1._id, deliveredQty: 10 })).status, 400, 'twice');
        assert.equal((await fresh(MGR_A(), 'Classic Tomato Pizza Sauce')).currentStock, 20, 'stock was taken out only once');
        const h = (await get(MGR_A(), `/${sauce._id}/history?limit=10`)).body.data[0];
        assert.equal(h.type, 'stock_out');
        assert.match(h.reason, new RegExp(`Stock request ${r1.requestNo} fulfilled`));
        assert.equal((await get(chef, `/stock-requests/${r1._id}`)).body.request.status, 'fulfilled');
    });
    test('a fulfilment the stock cannot cover fails and leaves the request approved', async () => {
        const big = (await create(sup, { requestedQty: 50 })).body.data;
        await call(MGR_A(), 'PATCH', '/stock-requests/approve', { requestId: big._id, approvedQty: 50 });
        const res = await call(MGR_A(), 'PATCH', '/stock-requests/fulfill', { requestId: big._id, deliveredQty: 50 });
        assert.equal(res.status, 400);
        assert.match(res.body.error, /Insufficient stock/);
        assert.equal((await get(sup, `/stock-requests/${big._id}`)).body.request.status, 'approved');
        assert.equal((await fresh(MGR_A(), 'Classic Tomato Pizza Sauce')).currentStock, 20);
    });

    describe('My Tasks "request ingredient" is the same record', () => {
        test('it appears in the stock request list, linked to the stock item when the name matches', async () => {
            const before = (await list(MGR_A())).length;
            const res = await fx.call('POST', `${KITCHEN}/inventory-requests`, chef.token, { ingredientName: 'Classic Tomato Pizza Sauce', quantity: 3, unit: 'Litre', reason: 'Low on sauce' });
            assert.equal(res.status, 201, JSON.stringify(res.body));
            assert.equal(res.body.data.status, 'Pending');
            const all = await list(MGR_A());
            assert.equal(all.length, before + 1);
            const mine = all.find((r) => r._id === res.body.data._id);
            assert.equal(mine.source, 'my_tasks');
            assert.equal(mine.ingredientId, sauce._id);
            assert.equal(mine.requestedQty, 3);
            assert.equal(mine.requestedBy, 'Name ichef');
            assert.ok((await list(chef)).some((r) => r._id === mine._id));
            assert.equal((await list(chef2)).some((r) => r._id === mine._id), false);
        });
        test('the manager can approve and fulfil it from the inventory screen, which updates stock', async () => {
            const res = await fx.call('POST', `${KITCHEN}/inventory-requests`, chef.token, { ingredientName: 'classic tomato pizza sauce', quantity: 2, unit: 'Litre' });
            const id = res.body.data._id;
            assert.equal((await call(MGR_A(), 'PATCH', '/stock-requests/approve', { requestId: id, approvedQty: 2 })).status, 200);
            assert.equal((await call(MGR_A(), 'PATCH', '/stock-requests/fulfill', { requestId: id, deliveredQty: 2 })).status, 200);
            assert.equal((await fresh(MGR_A(), 'Classic Tomato Pizza Sauce')).currentStock, 18);
            const mine = (await fx.call('GET', `${KITCHEN}/inventory-requests`, chef.token)).body.data.find((r) => r._id === id);
            assert.equal(mine.status, 'Fulfilled');
        });
        test('an ingredient that is not in the stock list can be asked for but not fulfilled until it is added', async () => {
            const res = await fx.call('POST', `${KITCHEN}/inventory-requests`, chef.token, { ingredientName: 'Truffle Oil', quantity: 1, unit: 'Litre' });
            assert.equal(res.status, 201);
            const id = res.body.data._id;
            assert.equal((await call(MGR_A(), 'PATCH', '/stock-requests/approve', { requestId: id, approvedQty: 1 })).status, 200);
            const f = await call(MGR_A(), 'PATCH', '/stock-requests/fulfill', { requestId: id, deliveredQty: 1 });
            assert.equal(f.status, 400);
            assert.match(f.body.error, /not in your stock list/);
            await call(MGR_A(), 'POST', '/', { ingredientName: 'Truffle Oil', unit: 'Litre' });
            await stockIn(MGR_A(), await byName(MGR_A(), 'Truffle Oil'), 5);
            assert.equal((await call(MGR_A(), 'PATCH', '/stock-requests/fulfill', { requestId: id, deliveredQty: 1 })).status, 200, 'works once the ingredient exists');
        });
    });
});

describe('waste', () => {
    let paneer; const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    const report = (who, fields = {}, photos = 0) => {
        let r = fx.api.post(`/api${INV}/waste/report`).set(fx.bearer(who.token));
        const f = { ingredientId: paneer._id, quantity: '2', wasteType: 'burnt', reason: 'Burnt during oven calibration', remarks: 'minor', reportedBy: 'Somebody Else', ...fields };
        for (const [k, v] of Object.entries(f)) if (v !== undefined) r = r.field(k, String(v));
        for (let i = 0; i < photos; i += 1) r = r.attach('images[]', PNG, { filename: `p${i}.png`, contentType: 'image/png' });
        return r;
    };
    const logs = async (who, q = '') => (await get(who, `/waste?limit=50${q}`)).body.data;
    before(async () => {
        paneer = await byName(MGR_A(), 'Fresh Paneer Cubes');
        await call(MGR_A(), 'PATCH', `/${paneer._id}`, { costPerUnit: 100 });
        await call(MGR_A(), 'POST', '/update-stock', { ingredientId: paneer._id, type: 'adjustment', quantity: 20, reason: 'Opening count' });
    });

    test('anyone in the store can report; stock drops at once; photos go to a server-chosen folder; the reporter is the caller', async () => {
        uploaded.length = 0;
        const res = await report(chef, {}, 2);
        assert.equal(res.status, 201, JSON.stringify(res.body));
        assert.equal(res.body.data.status, 'pending');
        assert.equal(res.body.data.reportedBy, 'Name ichef', 'a name sent in the form is ignored');
        assert.equal(res.body.data.estimatedLoss, 200);
        assert.equal(res.body.data.images.length, 2);
        assert.deepEqual(uploaded, [`stores/${A.storeId}/waste`, `stores/${A.storeId}/waste`]);
        assert.equal((await fresh(MGR_A(), 'Fresh Paneer Cubes')).currentStock, 18);
        const h = (await get(MGR_A(), `/${paneer._id}/history?limit=5`)).body.data[0];
        assert.equal(h.type, 'stock_out');
        assert.match(h.reason, /Ingredient Waste \(burnt\)/);
        assert.equal((await report(sup)).status, 201);
        assert.equal((await report(MGR_A())).status, 201);
    });
    test('validation: type, quantity, reason, more than is in stock, other store\'s ingredient, photos', async () => {
        for (const bad of [{ wasteType: 'stolen' }, { quantity: 0 }, { quantity: 'x' }, { reason: '' }, { ingredientId: 'junk' }]) assert.equal((await report(chef, bad)).status, 400, JSON.stringify(bad));
        const tooMuch = await report(chef, { quantity: 500 });
        assert.equal(tooMuch.status, 400);
        assert.match(tooMuch.body.error, /exceeds current stock/);
        assert.equal((await report(bStaff, { ingredientId: paneer._id })).status, 404, 'another store\'s ingredient');
        assert.equal((await report(chef, {}, 6)).status, 400, 'at most 5 photos');
        const notImage = await fx.api.post(`/api${INV}/waste/report`).set(fx.bearer(chef.token)).field('ingredientId', paneer._id).field('quantity', '1').field('wasteType', 'burnt').field('reason', 'x')
            .attach('images[]', Buffer.from('<?php echo 1;'), { filename: 'a.png', contentType: 'image/png' });
        assert.equal(notImage.status, 400);
        assert.equal((await fresh(MGR_A(), 'Fresh Paneer Cubes')).currentStock, 14, 'three accepted reports of 2 kg from 20 kg; the failed ones took nothing out');
    });
    test('visibility: staff see only their own; supervisor and manager the whole store; other stores none', async () => {
        assert.equal((await logs(chef)).length, 1);
        assert.equal((await logs(chef2)).length, 0);
        assert.equal((await logs(sup)).length, 3);
        assert.equal((await logs(MGR_A())).length, 3);
        for (const who of [MGR_B(), bSup, bStaff]) assert.equal((await logs(who)).length, 0);
        assert.equal((await logs(MGR_A(), '&wasteType=burnt')).length, 3);
        assert.equal((await logs(MGR_A(), '&wasteType=expired')).length, 0);
        assert.equal((await logs(MGR_A(), '&reportedBy=Name%20isup')).length, 1);
        assert.equal((await logs(MGR_A(), '&search=calibration')).length, 3);
        assert.equal((await get(MGR_A(), '/waste?limit=2')).body.pagination.totalPages, 2);
    });
    test('the dashboard counts what the caller can see', async () => {
        const m = (await get(MGR_A(), '/waste/dashboard')).body;
        assert.deepEqual({ t: m.totalWasteToday, w: m.weeklyWaste, l: m.lossAmount, top: m.topWastedIngredient }, { t: 6, w: 6, l: 600, top: 'Fresh Paneer Cubes' });
        assert.equal((await get(chef, '/waste/dashboard')).body.totalWasteToday, 2);
        assert.equal((await get(MGR_B(), '/waste/dashboard')).body.topWastedIngredient, 'None');
    });
    test('details: shape; staff cannot open a colleague\'s report; other stores 404', async () => {
        const [mine] = await logs(chef);
        const d = await get(chef, `/waste/${mine._id}`);
        assert.equal(d.status, 200);
        assert.equal(d.body.wasteLog.wasteType, 'burnt');
        assert.equal(d.body.ingredient.ingredientName, 'Fresh Paneer Cubes');
        assert.equal(d.body.reportedBy.name, 'Name ichef');
        assert.equal(d.body.approvedBy, null);
        assert.equal(d.body.images.length, 2);
        assert.equal(d.body.timeline[0].action, 'reported');
        const supLog = (await logs(sup)).find((l) => l.reportedBy === 'Name isup');
        assert.equal((await get(chef, `/waste/${supLog._id}`)).status, 404);
        assert.equal((await get(sup, `/waste/${supLog._id}`)).status, 200);
        for (const who of [MGR_B(), bSup]) assert.equal((await get(who, `/waste/${mine._id}`)).status, 404);
    });
    test('approve: manager only, once', async () => {
        const [mine] = await logs(chef);
        for (const who of [sup, chef]) assert.equal((await call(who, 'PATCH', `/waste/${mine._id}/approve`, { remarks: 'ok' })).status, 403);
        assert.equal((await call(MGR_B(), 'PATCH', `/waste/${mine._id}/approve`, {})).status, 404);
        assert.equal((await call(MGR_A(), 'PATCH', `/waste/${mine._id}/approve`, { remarks: 'Approved, retrain team' })).status, 200);
        assert.equal((await call(MGR_A(), 'PATCH', `/waste/${mine._id}/approve`, {})).status, 400);
        const d = (await get(sup, `/waste/${mine._id}`)).body;
        assert.equal(d.wasteLog.status, 'approved');
        assert.equal(d.approvedBy.name, d.wasteLog.approvedBy);
        assert.deepEqual(d.timeline.map((t) => t.action), ['reported', 'approved']);
    });
    test('delete: manager only; a withdrawn (unapproved) report puts the stock back, an approved one does not', async () => {
        const all = await logs(MGR_A());
        const pending = all.find((l) => l.status === 'pending');
        const approved = all.find((l) => l.status === 'approved');
        for (const who of [sup, chef]) assert.equal((await call(who, 'DELETE', `/waste/${pending._id}`)).status, 403);
        assert.equal((await call(MGR_B(), 'DELETE', `/waste/${pending._id}`)).status, 404);
        const before = (await fresh(MGR_A(), 'Fresh Paneer Cubes')).currentStock;
        assert.equal((await call(MGR_A(), 'DELETE', `/waste/${pending._id}`)).status, 200);
        assert.equal((await fresh(MGR_A(), 'Fresh Paneer Cubes')).currentStock, before + pending.quantity);
        assert.equal((await call(MGR_A(), 'DELETE', `/waste/${approved._id}`)).status, 200);
        assert.equal((await fresh(MGR_A(), 'Fresh Paneer Cubes')).currentStock, before + pending.quantity, 'approved write-off stays');
        assert.equal((await call(MGR_A(), 'DELETE', `/waste/${approved._id}`)).status, 404, 'already gone');
        assert.equal((await logs(MGR_A())).length, 1);
    });
});

describe('recipes and shortages', () => {
    let mozzarella; let recipe;
    before(async () => { mozzarella = await byName(MGR_A(), 'Premium Mozzarella Cheese'); });
    const recipeBody = (extra = {}) => ({
        name: 'Margherita', recipeCode: 'REC-MARG', prepTime: 12, difficulty: 'Easy',
        ingredients: [{ ingredientId: mozzarella._id, quantity: 180, unit: 'g' }, { name: 'Basil', quantity: 5, unit: 'g' }],
        instructions: ['Stretch the dough', 'Add sauce', 'Add cheese'], ...extra,
    });

    test('recipes: everyone reads; only the manager writes; own store only', async () => {
        for (const who of [sup, chef]) assert.equal((await call(who, 'POST', '/recipes', recipeBody())).status, 403);
        const res = await call(MGR_A(), 'POST', '/recipes', recipeBody());
        assert.equal(res.status, 201, JSON.stringify(res.body));
        recipe = res.body.data;
        assert.equal(recipe.ingredients[0].name, 'Premium Mozzarella Cheese', 'name filled from the stock item');
        assert.equal((await call(MGR_A(), 'POST', '/recipes', recipeBody({ name: 'margherita' }))).status, 400, 'duplicate name');
        assert.equal((await call(MGR_A(), 'POST', '/recipes', recipeBody({ name: '' }))).status, 400);
        assert.equal((await call(MGR_A(), 'POST', '/recipes', recipeBody({ name: 'Other', ingredients: [{ ingredientId: (await byName(MGR_B(), 'Onion'))._id, quantity: 1 }] }))).status, 400, 'ingredient of another store');
        const list = (await get(chef, '/recipes')).body.data;
        assert.equal(list.length, 1);
        assert.deepEqual(Object.keys(list[0]).sort(), ['difficulty', 'image', 'ingredients', 'instructions', '_id', 'name', 'prepTime', 'recipeCode'].sort());
        assert.equal((await get(MGR_B(), '/recipes')).body.data.length, 0);
        assert.equal((await call(chef, 'PUT', `/recipes/${recipe._id}`, recipeBody())).status, 403);
        assert.equal((await call(MGR_B(), 'PUT', `/recipes/${recipe._id}`, recipeBody())).status, 404);
        assert.equal((await call(MGR_A(), 'PUT', `/recipes/${recipe._id}`, recipeBody({ prepTime: 15 }))).body.data.prepTime, 15);
    });

    describe('shortages', () => {
        let shortage; let liveOrder;
        before(async () => {
            await stockIn(MGR_A(), mozzarella, 5);
            const ref = `INV${fx.ts}`;
            const r = await fx.models.FoodOrder.collection.insertOne({
                order_id: ref, orderId: ref, userId: new mongoose.Types.ObjectId(A.customerId), storeId: new mongoose.Types.ObjectId(A.storeId), franchiseId: new mongoose.Types.ObjectId(A.franchiseId),
                orderStatus: 'confirmed', payment: { method: 'cash', status: 'cod_pending' }, pricing: { subtotal: 400, total: 400 }, customerName: 'Asha Rao',
                deliveryAddress: { street: '1 Test Rd', city: 'Pune', state: 'MH' }, kitchen: { stage: 'pending', expectedReadyAt: new Date(Date.now() + 20 * 60000) },
                items: [{ itemId: 'x', name: 'Margherita (Medium)', quantity: 2, price: 200 }], createdAt: new Date(), updatedAt: new Date(),
            });
            liveOrder = { id: String(r.insertedId), ref };
        });
        const report = (who, extra = {}) => call(who, 'POST', '/ingredient-shortages', { ingredientId: mozzarella._id, missingQuantity: 4, urgency: 'high', remarks: 'Bag ripped', notifyManager: true, ...extra });

        test('staff and supervisors report; validation; only own-store ingredients and pizzas', async () => {
            const res = await report(chef);
            assert.equal(res.status, 201, JSON.stringify(res.body));
            shortage = res.body.data;
            for (const bad of [{ missingQuantity: 0 }, { missingQuantity: 'x' }, { ingredientId: 'junk' }]) assert.equal((await report(chef, bad)).status, 400, JSON.stringify(bad));
            assert.equal((await report(bStaff)).status, 404, 'ingredient of another store');
            assert.equal((await report(chef, { orderItemId: '64b000000000000000000001' })).status, 404);
            assert.equal((await report(chef, { orderItemId: 'junk' })).status, 404);
            assert.ok((await fx.call('GET', '/v1/tasks/notifications', A.managerToken)).body.data.some((n) => /Shortage: Premium Mozzarella/.test(n.title)));
        });
        test('a second report for the same ingredient joins the open shortage and can only raise it', async () => {
            const res = await report(sup, { missingQuantity: 9, urgency: 'critical' });
            assert.equal(res.status, 201);
            assert.equal(res.body.data._id, shortage._id);
            const rows = (await get(MGR_A(), '/ingredient-shortages?limit=50&search=Mozzarella')).body.data;
            assert.equal(rows.length, 1);
            assert.equal(rows[0].shortageQty, 9);
            assert.equal(rows[0].severity, 'critical');
            await report(sup, { missingQuantity: 1, urgency: 'low' });
            assert.equal((await get(MGR_A(), '/ingredient-shortages?search=Mozzarella')).body.data[0].severity, 'critical', 'severity never goes down');
        });
        test('the list, dashboard and details show the orders it holds up (through recipes), only for this store', async () => {
            const row = (await get(sup, '/ingredient-shortages?search=Mozzarella')).body.data[0];
            assert.equal(row.affectedOrders, 1);
            assert.equal(row.createdBy, 'Name ichef');
            const dash = (await get(chef, '/ingredient-shortages/dashboard')).body;
            assert.ok(dash.activeShortages >= 1 && dash.criticalShortages >= 1);
            assert.equal(dash.affectedOrders, 1);
            assert.equal(dash.estimatedRevenueLoss, 400);
            const d = (await get(sup, `/ingredient-shortages/${shortage._id}`)).body;
            assert.equal(d.shortage.status, 'active');
            assert.equal(d.affectedOrders[0]._id, liveOrder.ref);
            assert.equal(d.affectedOrders[0].customer, 'Asha Rao');
            assert.equal(d.analytics.revenueLoss, 400);
            assert.ok(Array.isArray(d.analytics.alternatives) && Array.isArray(d.analytics.stores));
            assert.equal(d.ingredient.ingredientName, 'Premium Mozzarella Cheese');
            assert.equal(d.timeline[0].action, 'reported');
            for (const who of [MGR_B(), bSup, bStaff]) {
                assert.equal((await get(who, `/ingredient-shortages/${shortage._id}`)).status, 404);
                assert.equal((await get(who, '/ingredient-shortages?search=Mozzarella')).body.data.length, 0);
            }
            assert.equal((await get(MGR_B(), '/ingredient-shortages/dashboard')).body.affectedOrders, 0);
        });
        test('the recipe link is what makes it affect an order: a deleted recipe means none', async () => {
            assert.equal((await call(chef, 'DELETE', `/recipes/${recipe._id}`)).status, 403);
            assert.equal((await call(MGR_B(), 'DELETE', `/recipes/${recipe._id}`)).status, 404);
            assert.equal((await call(MGR_A(), 'DELETE', `/recipes/${recipe._id}`)).status, 200);
            assert.equal((await get(MGR_A(), '/ingredient-shortages/dashboard')).body.affectedOrders, 0);
            assert.equal((await call(MGR_A(), 'POST', '/recipes', recipeBody())).status, 201, 'put it back for the next tests');
        });
        test('resolve: manager only, needs the action taken, once', async () => {
            for (const who of [sup, chef]) assert.equal((await call(who, 'PATCH', `/ingredient-shortages/${shortage._id}/resolve`, { actionTaken: 'Ordered' })).status, 403);
            assert.equal((await call(MGR_B(), 'PATCH', `/ingredient-shortages/${shortage._id}/resolve`, { actionTaken: 'Ordered' })).status, 404);
            assert.equal((await call(MGR_A(), 'PATCH', `/ingredient-shortages/${shortage._id}/resolve`, { actionTaken: '' })).status, 400);
            assert.equal((await call(MGR_A(), 'PATCH', `/ingredient-shortages/${shortage._id}/resolve`, { actionTaken: 'Emergency purchase', notes: 'From the market' })).status, 200);
            assert.equal((await call(MGR_A(), 'PATCH', `/ingredient-shortages/${shortage._id}/resolve`, { actionTaken: 'again' })).status, 400);
            const d = (await get(sup, `/ingredient-shortages/${shortage._id}`)).body;
            assert.equal(d.shortage.status, 'resolved');
            assert.equal(d.shortage.actionTaken, 'Emergency purchase');
            assert.equal(d.timeline.at(-1).action, 'resolved');
            const next = (await report(chef)).body.data;
            assert.notEqual(next._id, shortage._id, 'once resolved, a new report opens a new shortage');
            shortage = next;
        });
        test('notify admin: manager only, records on the shortage', async () => {
            const b = { shortageId: shortage._id, type: 'urgent', message: 'Need cheese urgently', priority: 'high' };
            for (const who of [sup, chef]) assert.equal((await call(who, 'POST', '/notifications/admin', b)).status, 403);
            assert.equal((await call(MGR_B(), 'POST', '/notifications/admin', b)).status, 404);
            assert.equal((await call(MGR_A(), 'POST', '/notifications/admin', { ...b, message: '' })).status, 400);
            assert.equal((await call(MGR_A(), 'POST', '/notifications/admin', b)).status, 200);
            assert.equal((await get(MGR_A(), `/ingredient-shortages/${shortage._id}`)).body.timeline.at(-1).action, 'admin_notified');
        });
        test('the kitchen screens link a pizza to its recipe by name', async () => {
            const prep = await fx.call('GET', `${KITCHEN}/preparation-board`, A.managerToken);
            assert.equal(prep.status, 200);
            const rows = await get(MGR_A(), '/recipes');
            assert.equal(rows.body.data.length, 1);
        });
    });
});

describe('transfers between stores of one franchise', () => {
    let mine; let theirs;
    before(async () => {
        mine = await byName(MGR_A(), 'Sweet Corn');
        theirs = await byName(a2Manager, 'Sweet Corn');
        await call(a2Manager, 'POST', '/update-stock', { ingredientId: theirs._id, type: 'stock_in', quantity: 30, reason: 'Delivery' });
        const bOwn = await byName(MGR_B(), 'Sweet Corn');
        await call(MGR_B(), 'POST', '/update-stock', { ingredientId: bOwn._id, type: 'stock_in', quantity: 99, reason: 'Delivery' });
    });
    test('available stores: sister stores of the same franchise that hold it, never another franchise', async () => {
        const res = await get(MGR_A(), `/available-stores?ingredientId=${mine._id}`);
        assert.equal(res.status, 200);
        assert.ok(Array.isArray(res.body), 'a bare array');
        assert.equal(res.body.length, 1);
        assert.deepEqual(Object.keys(res.body[0]).sort(), ['availableQty', 'distance', 'managerName', 'name', 'storeId']);
        assert.equal(res.body[0].storeId, a2StoreId);
        assert.equal(res.body[0].availableQty, 30);
        assert.equal(res.body[0].managerName, 'Manager A2');
        assert.equal((await get(sup, `/available-stores?ingredientId=${mine._id}`)).body.length, 1);
        assert.equal((await get(MGR_B(), `/available-stores?ingredientId=${(await byName(MGR_B(), 'Sweet Corn'))._id}`)).body.length, 0, 'B has no sister store');
        assert.equal((await get(MGR_B(), `/available-stores?ingredientId=${mine._id}`)).status, 404, 'A\'s ingredient id from store B');
    });
    test('request a transfer: manager only; the destination is always the caller\'s store', async () => {
        const b = { fromStoreId: a2StoreId, toStoreId: B.storeId, ingredientId: mine._id, quantity: 10, reason: 'Weekend rush', remarks: 'please' };
        for (const who of [sup, chef]) assert.equal((await call(who, 'POST', '/transfer', b)).status, 403);
        assert.equal((await call(MGR_B(), 'POST', '/transfer', b)).status, 404, 'not B\'s ingredient');
        const res = await call(MGR_A(), 'POST', '/transfer', b);
        assert.equal(res.status, 201, JSON.stringify(res.body));
        assert.equal(res.body.success, true);
        assert.match(res.body.message, /Awaiting administrator approval/);
        const doc = await mongoose.connection.collection('food_stock_transfers').findOne({ _id: new mongoose.Types.ObjectId(res.body.data._id) });
        assert.equal(String(doc.toStoreId), A.storeId, 'toStoreId from the form is ignored');
        assert.equal(String(doc.fromStoreId), a2StoreId);
        assert.equal(doc.status, 'pending');
        assert.equal((await fresh(a2Manager, 'Sweet Corn')).currentStock, 30, 'stock does not move until approved');
    });
    test('refused: another franchise\'s store, itself, too much, no reason, bad quantity', async () => {
        const ok = { fromStoreId: a2StoreId, ingredientId: mine._id, quantity: 5, reason: 'x' };
        assert.equal((await call(MGR_A(), 'POST', '/transfer', { ...ok, fromStoreId: B.storeId })).status, 404);
        assert.equal((await call(MGR_A(), 'POST', '/transfer', { ...ok, fromStoreId: A.storeId })).status, 400);
        assert.equal((await call(MGR_A(), 'POST', '/transfer', { ...ok, quantity: 500 })).status, 400);
        assert.equal((await call(MGR_A(), 'POST', '/transfer', { ...ok, reason: '' })).status, 400);
        for (const quantity of [0, -2, 'x']) assert.equal((await call(MGR_A(), 'POST', '/transfer', { ...ok, quantity })).status, 400);
        assert.equal((await call(MGR_A(), 'POST', '/transfer', { ...ok, fromStoreId: 'junk' })).status, 400);
    });
});

describe('franchise admin read access', () => {
    test('reads the numbers of its own stores, in the same shapes', async () => {
        const q = `?storeId=${A.storeId}`;
        const list = await fx.call('GET', `${INV}${q}&limit=100`, A.adminToken);
        assert.equal(list.status, 200);
        assert.ok(list.body.data.length >= 17, 'the default list plus anything the manager added');
        assert.ok((await fx.call('GET', `${INV}/alerts${q}`, A.adminToken)).body.data.length >= 1);
        assert.ok((await fx.call('GET', `${INV}/waste/dashboard${q}`, A.adminToken)).body.totalWasteToday >= 0);
        assert.ok((await fx.call('GET', `${INV}/ingredient-shortages${q}`, A.adminToken)).body.data.length >= 1);
        assert.ok((await fx.call('GET', `${INV}/stock-requests${q}`, A.adminToken)).body.data.length >= 4);
        assert.equal((await fx.call('GET', `${INV}/recipes${q}`, A.adminToken)).body.data.length, 1);
    });
    test('each store shows its own numbers: the sister store has its own Sweet Corn stock', async () => {
        const a2 = (await fx.call('GET', `${INV}?storeId=${a2StoreId}&limit=100`, A.adminToken)).body.data.find((i) => i.ingredientName === 'Sweet Corn');
        const a1 = (await fx.call('GET', `${INV}?storeId=${A.storeId}&limit=100`, A.adminToken)).body.data.find((i) => i.ingredientName === 'Sweet Corn');
        assert.equal(a2.currentStock, 30);
        assert.equal(a1.currentStock, 0);
    });
    test('another franchise\'s store is 404, for every kind of record', async () => {
        for (const path of ['', '/dashboard', '/alerts', '/waste', '/stock-requests', '/ingredient-shortages', '/recipes']) {
            assert.equal((await fx.call('GET', `${INV}${path}${path.includes('?') ? '&' : '?'}storeId=${B.storeId}`, A.adminToken)).status, 404, path);
        }
        const bCorn = await byName(MGR_B(), 'Sweet Corn');
        assert.equal((await fx.call('GET', `${INV}/${bCorn._id}?storeId=${A.storeId}`, A.adminToken)).status, 404, 'B\'s ingredient through A\'s store');
    });
});
