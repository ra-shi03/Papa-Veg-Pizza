// Pet Pooja Online Ordering APIs v2.1.0 (petpooja-api-docs.pdf in the project root): what the docs ask of us.
//   - Save Order carries the required fields (preorder date / time, service charge and charge taxes, item_tax,
//     item_discount) and Pet Pooja's own item / variation / add-on / tax ids from the store's mapping
//   - Update Order Status (cancel) sends Pet Pooja's orderID blank
//   - the order callback names the order by OUR id (orderID)
//   - Fetch Menu authenticates with headers; the menu is kept and exact names are mapped on their own
//   - Push Menu, item stock on / off, get / update store status: the store's own links (its key, saved in the database)
//   - everything is saved from the store manager's page: no server environment is needed
// A local HTTP double stands in for Pet Pooja.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createFixture, mongoose } from './helpers/fixture.js';

let SECRET = '';

let fx; let A; let B;
let outbox; let hooks; let Integration; let SyncLog; let PosMenu; let StoreProductPrice; let StoreHours;
let pp; let ppUrl; const received = [];
let seq = 0;
const P = '/v1/food/store/pos/petpooja';
const REST = 'rest_docs_A';
const KEYS = { restaurantId: REST, appKey: 'k'.repeat(32), appSecret: 's'.repeat(40), accessToken: 't'.repeat(40) };
const ids = {};

// What Fetch Menu / Push Menu return for the outlet (the docs' shape, trimmed)
const menuBody = () => ({
    success: '1',
    restaurants: [{ restaurantid: '9999', active: '1', details: { menusharingcode: REST, restaurantname: 'Docs Outlet' } }],
    categories: [{ categoryid: 'c1', categoryname: 'Pizzas', active: '1' }],
    items: [
        { itemid: 'PP-FARM', itemname: 'Docs Farmhouse', item_categoryid: 'c1', price: '0', active: '1', in_stock: '2', itemallowvariation: '1',
            variation: [{ id: 'V-REG', variationid: '11', name: 'Regular', groupname: 'Size', price: '199', active: '1' },
                { id: 'V-MED', variationid: '12', name: 'Medium', groupname: 'Size', price: '349', active: '1' }],
            addon: [{ addon_group_id: 'AG1' }] },
        { itemid: 'PP-COKE', itemname: 'Docs Coke', item_categoryid: 'c1', price: '60', active: '1', variation: [] },
    ],
    addongroups: [{ addongroupid: 'AG1', addongroup_name: 'Toppings', active: '1', addongroupitems: [{ addonitemid: 'AD-OLV', addonitem_name: 'Docs Olives', addonitem_price: '40', active: '1' }] }],
    taxes: [{ taxid: 'TX-C', taxname: 'CGST', tax: '2.5', active: '1' }, { taxid: 'TX-S', taxname: 'SGST', tax: '2.5', active: '1' }],
});

const hook = (name, body, secret = SECRET) => fx.call('POST', `/v1/pos/petpooja/hooks/${secret}/${name}`, null, body);
const order = async (f, extra = {}) => {
    const ref = `PD${fx.ts}${seq++}`;
    const r = await fx.models.FoodOrder.collection.insertOne({
        order_id: ref, orderId: ref, userId: new mongoose.Types.ObjectId(f.customerId), storeId: new mongoose.Types.ObjectId(f.storeId),
        franchiseId: new mongoose.Types.ObjectId(f.franchiseId), orderStatus: 'created', payment: { method: 'razorpay', status: 'paid' },
        pricing: { subtotal: 478, tax: 24, gstRate: 5, deliveryFee: 30, packagingFee: 10, discount: 0, total: 542 },
        deliveryAddress: { street: '1 Test Rd', city: 'Pune', state: 'MH' }, customerName: 'Docs Customer', customerPhone: '+91 98765 43210',
        items: [
            { itemId: ids.farm, name: 'Docs Farmhouse', size: 'Medium', quantity: 1, price: 389, selectedAddons: [{ id: ids.olives, name: 'Docs Olives', price: 40 }] },
            { itemId: ids.coke, name: 'Docs Coke', quantity: 1, price: 89 },
        ],
        statusHistory: [], createdAt: new Date(), updatedAt: new Date(), ...extra,
    });
    return { id: String(r.insertedId), ref };
};
const dbOrder = (o) => fx.models.FoodOrder.findById(o.id).lean();
const settled = async (o, action) => {
    for (let i = 0; i < 30; i += 1) {
        const row = await SyncLog.findOne({ orderId: new mongoose.Types.ObjectId(o.id), action }).sort({ createdAt: -1 }).lean();
        if (row && row.status !== 'pending') return row;
        await outbox.sweep();
        await new Promise((r) => setTimeout(r, 100));
    }
    return null;
};

before(async () => {
    pp = http.createServer((req, res) => {
        let raw = '';
        req.on('data', (c) => { raw += c; });
        req.on('end', () => {
            const body = JSON.parse(raw || '{}');
            received.push({ path: req.url, headers: req.headers, body });
            const answer = req.url === '/mapped_restaurant_menus'
                ? (req.headers['app-key'] === KEYS.appKey && req.headers['access-token'] === KEYS.accessToken ? menuBody() : { success: '0', message: 'Invalid credentials' })
                : { success: '1', message: 'Your order is saved.', restID: REST, clientOrderID: body?.orderinfo?.OrderInfo?.Order?.details?.orderID, orderID: '26' };
            res.writeHead(answer.success === '1' ? 200 : 400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(answer));
        });
    });
    await new Promise((r) => pp.listen(0, '127.0.0.1', r));
    ppUrl = `http://127.0.0.1:${pp.address().port}`;
    delete process.env.PETPOOJA_API_BASE_URL;
    delete process.env.PETPOOJA_ENV;

    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    outbox = await import('../src/modules/food/pos/services/posOutbox.service.js');
    hooks = await import('../src/modules/food/pos/services/posPartnerHooks.service.js');
    ({ StorePosIntegration: Integration } = await import('../src/modules/food/pos/models/storePosIntegration.model.js'));
    ({ PosSyncLog: SyncLog } = await import('../src/modules/food/pos/models/posSyncLog.model.js'));
    ({ PosMenu } = await import('../src/modules/food/pos/models/posMenu.model.js'));
    ({ StoreProductPrice } = await import('../src/modules/food/franchise/models/storeProductPrice.model.js'));
    ({ StoreHours } = await import('../src/modules/food/franchise/models/storeHours.model.js'));

    const cat = new mongoose.Types.ObjectId();
    const products = mongoose.connection.collection('products');
    ids.farm = String((await products.insertOne({ name: 'Docs Farmhouse', categoryId: cat, status: 'Active', price: 199,
        sizes: [{ _id: new mongoose.Types.ObjectId(), size: 'Regular', price: 199 }, { _id: new mongoose.Types.ObjectId(), size: 'Medium', price: 349 }] })).insertedId);
    ids.coke = String((await products.insertOne({ name: 'Docs Coke', categoryId: cat, status: 'Active', price: 60, sizes: [] })).insertedId);
    ids.olives = String((await mongoose.connection.collection('addons').insertOne({ name: 'Docs Olives', type: 'topping', status: 'Active', prices: [{ size: 'Default', price: 40 }] })).insertedId);

    // the server is chosen on the page (a local double stands in for Pet Pooja's production address)
    const r = await fx.call('PUT', P, A.managerToken, { ...KEYS, enabled: true, apiEnv: 'production', apiBaseUrl: ppUrl, publicUrl: 'https://api.example.test' });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal(r.body.data.serverReady, true);
    assert.match(r.body.data.callbackUrl, /^https:\/\/api\.example\.test\/api\/v1\/pos\/petpooja\/callback\/[a-f0-9]{64}$/);
    SECRET = r.body.data.hookUrls.pushmenu.split('/hooks/')[1].split('/')[0];
    assert.equal(r.body.data.hookUrls.item_stock, `https://api.example.test/api/v1/pos/petpooja/hooks/${SECRET}/item_stock`);
});
after(async () => {
    delete process.env.PETPOOJA_API_BASE_URL;
    await fx?.teardown();
    await new Promise((r) => pp?.close(r));
});

describe('menu and item mapping', () => {
    test('Fetch Menu sends the keys as headers, keeps the menu and maps exact names', async () => {
        received.length = 0;
        const r = await fx.call('POST', `${P}/menu/fetch`, A.managerToken);
        assert.equal(r.status, 200, JSON.stringify(r.body));
        const call = received.find((x) => x.path === '/mapped_restaurant_menus');
        assert.equal(call.headers['app-secret'], KEYS.appSecret);
        assert.deepEqual(call.body, { restID: REST });
        assert.equal(r.body.data.items, 2);
        const row = (key) => r.body.data.rows.find((x) => x.key === key);
        assert.equal(row(`${ids.farm}|medium`).value, 'PP-FARM|V-MED');
        assert.equal(row(`${ids.farm}|regular`).value, 'PP-FARM|V-REG');
        assert.equal(row(ids.coke).value, 'PP-COKE');
        assert.equal(row(`addon:${ids.olives}`).value, 'AD-OLV|AG1');
        assert.ok(await PosMenu.exists({ storeId: A.storeId }));
    });

    test('mapping: only values from the store\'s menu; an add-on only to an add-on; another store cannot see it', async () => {
        assert.equal((await fx.call('PUT', `${P}/mapping`, A.managerToken, { entries: [{ key: ids.coke, value: 'NOPE' }] })).status, 400);
        assert.equal((await fx.call('PUT', `${P}/mapping`, A.managerToken, { entries: [{ key: `addon:${ids.olives}`, value: 'PP-FARM|V-MED' }] })).status, 400);
        const clear = await fx.call('PUT', `${P}/mapping`, A.managerToken, { entries: [{ key: ids.coke, value: '' }] });
        assert.equal(clear.body.data.rows.find((x) => x.key === ids.coke).status, 'unmapped');
        const set = await fx.call('PUT', `${P}/mapping`, A.managerToken, { entries: [{ key: ids.coke, value: 'PP-COKE' }] });
        assert.equal(set.status, 200, JSON.stringify(set.body));
        const other = await fx.call('GET', `${P}/menu`, B.managerToken);
        assert.equal(other.body.data.menu, null);
        assert.ok(other.body.data.rows.every((x) => !x.value));
    });

    test('two stores cannot share one Pet Pooja restaurant ID', async () => {
        const r = await fx.call('PUT', P, B.managerToken, { restaurantId: REST });
        assert.equal(r.status, 400);
    });
});

describe('Save Order and cancel, as the docs ask', () => {
    test('required fields, mapped ids, CGST / SGST from the menu', async () => {
        received.length = 0;
        const o = await order(A);
        await outbox.queueOrderIfNeeded(await dbOrder(o));
        const row = await settled(o, 'save_order');
        assert.equal(row.status, 'sent', JSON.stringify(row));
        assert.equal(row.note.includes('not mapped'), false, row.note);
        const d = received.find((x) => x.path === '/save_order').body.orderinfo.OrderInfo;
        const od = d.Order.details;
        assert.equal(od.orderID, o.ref);
        assert.match(od.preorder_date, /^\d{4}-\d{2}-\d{2}$/);
        assert.match(od.preorder_time, /^\d{2}:\d{2}:\d{2}$/);
        assert.match(od.created_on, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
        for (const k of ['service_charge', 'sc_tax_amount', 'dc_tax_percentage', 'dc_tax_amount', 'pc_tax_amount', 'pc_tax_percentage']) assert.equal(typeof od[k], 'string', k);
        assert.equal(od.order_type, 'H');
        assert.equal(od.payment_type, 'ONLINE');
        assert.equal(d.Customer.details.phone, '9876543210');
        const [pizza, coke] = d.OrderItem.details;
        assert.equal(pizza.id, 'PP-FARM');
        assert.equal(pizza.variation_id, 'V-MED');
        assert.equal(pizza.variation_name, 'Medium');
        assert.equal(pizza.item_discount, '0.00');
        assert.deepEqual(pizza.AddonItem.details[0], { id: 'AD-OLV', name: 'Docs Olives', group_name: 'Toppings', group_id: 'AG1', price: '40.00', quantity: '1' });
        assert.deepEqual(pizza.item_tax.map((t) => t.id), ['TX-C', 'TX-S']);
        assert.equal(coke.id, 'PP-COKE');
        assert.deepEqual(d.Tax.details.map((t) => [t.id, t.price, t.tax]), [['TX-C', '2.5', '12.00'], ['TX-S', '2.5', '12.00']]);
        const itemTax = d.OrderItem.details.flatMap((i) => i.item_tax).reduce((s, t) => s + Number(t.amount), 0);
        assert.ok(Math.abs(itemTax - 24) < 0.05, `item taxes add up to the order tax (${itemTax})`);
        assert.equal((await dbOrder(o)).pos.posOrderId, '26');
    });

    test('cancel sends our id as clientorderID and Pet Pooja\'s orderID blank', async () => {
        const o = await order(A);
        await outbox.queueOrderIfNeeded(await dbOrder(o));
        await settled(o, 'save_order');
        await fx.models.FoodOrder.updateOne({ _id: o.id }, { $set: { orderStatus: 'cancelled_by_user' } });
        received.length = 0;
        await outbox.queueCancelIfNeeded(await dbOrder(o));
        assert.equal((await settled(o, 'cancel_order')).status, 'sent');
        const body = received.find((x) => x.path === '/update_order_status').body;
        assert.equal(body.orderID, '');
        assert.equal(body.clientorderID, o.ref);
        assert.equal(body.status, '-1');
    });

    test('the callback as the docs send it (orderID = our order id) moves the order', async () => {
        const key = (await Integration.findOne({ storeId: A.storeId }).lean()).callbackKey;
        const o = await order(A, { pos: { provider: 'petpooja', status: 'sent', posOrderId: '26' } });
        const r = await fx.call('POST', `/v1/pos/petpooja/callback/${key}`, null,
            { restID: REST, orderID: o.ref, status: '1', cancel_reason: '', minimum_prep_time: 20, minimum_delivery_time: '', rider_name: '', rider_phone_number: '', is_modified: 'No' });
        assert.equal(r.status, 200, JSON.stringify(r.body));
        assert.equal(r.body.data.status, 'applied');
        const saved = await dbOrder(o);
        assert.equal(saved.orderStatus, 'confirmed');
        assert.equal(saved.pos.posOrderId, '26', 'Pet Pooja\'s id is not overwritten with ours');
    });
});

describe('Pet Pooja\'s app-wide links: menu, stock, store status', () => {
    test('a wrong secret is 404; menu push is refused while "accept menu" is off', async () => {
        assert.equal((await hook('pushmenu', menuBody(), 'x'.repeat(SECRET.length))).status, 404);
        // another store's link cannot reach this outlet, even with its restaurant ID
        const bKey = (await Integration.findOne({ storeId: B.storeId }).lean()).callbackKey;
        assert.equal((await hook('get_store_status', { restID: REST }, bKey)).status, 400);
        const r = await hook('pushmenu', menuBody());
        assert.equal(r.status, 400);
        assert.equal(r.body.success, '0');
        assert.equal((await hook('pushmenu', { ...menuBody(), restaurants: [{ restaurantid: 'unknown' }] })).status, 400);
    });

    test('Push Menu is kept when the store accepts it', async () => {
        await fx.call('PUT', P, A.managerToken, { syncMenu: true, syncStock: true, syncStoreStatus: true });
        const body = menuBody();
        body.items.push({ itemid: 'PP-NEW', itemname: 'Brand New', price: '10', active: '1' });
        const r = await hook('pushmenu', body);
        assert.equal(r.status, 200, JSON.stringify(r.body));
        assert.deepEqual(r.body, { success: '1', message: 'Menu items are successfully listed.' });
        assert.equal((await PosMenu.findOne({ storeId: A.storeId }).lean()).items.length, 3);
    });

    test('item out of stock takes the product off this store\'s menu, back on at Pet Pooja\'s time', async () => {
        const off = await hook('item_stock_off', { restID: REST, type: 'item', inStock: false, itemID: ['PP-FARM'], autoTurnOnTime: 'custom', customTurnOnTime: '2020-02-24 18:00' });
        assert.equal(off.status, 200, JSON.stringify(off.body));
        assert.deepEqual(off.body, { code: 200, status: 'success', message: 'Stock status updated successfully' });
        let rule = await StoreProductPrice.findOne({ storeId: A.storeId, productId: ids.farm }).lean();
        assert.equal(rule.availability, 'UNAVAILABLE');
        assert.equal(rule.status, 'ACTIVE');
        assert.equal(rule.mediumPrice, 349, 'catalogue prices kept');
        assert.equal(await StoreProductPrice.countDocuments({ storeId: B.storeId }), 0, 'other stores untouched');
        await hooks.releaseHolds();   // the turn-on time (2020) has passed
        rule = await StoreProductPrice.findOne({ storeId: A.storeId, productId: ids.farm }).lean();
        assert.equal(rule.availability, 'AVAILABLE');
        assert.equal((await Integration.findOne({ storeId: A.storeId }).lean()).stockHolds.length, 0);

        await hook('item_stock', { restID: REST, type: 'item', inStock: false, itemID: ['PP-COKE'] });
        assert.equal((await StoreProductPrice.findOne({ storeId: A.storeId, productId: ids.coke }).lean()).availability, 'UNAVAILABLE');
        await hook('item_stock', { restID: REST, type: 'item', inStock: true, itemID: ['PP-COKE'] });
        assert.equal((await StoreProductPrice.findOne({ storeId: A.storeId, productId: ids.coke }).lean()).availability, 'AVAILABLE');
    });

    test('store off / on from Pet Pooja; get_store_status answers; a reopening time is honoured', async () => {
        const off = await hook('update_store_status', { restID: REST, store_status: 0, turn_on_time: '2020-02-17 00:00:00', reason: 'Rush' });
        assert.equal(off.status, 200, JSON.stringify(off.body));
        assert.equal(off.body.status, 'success');
        let hours = await StoreHours.findOne({ storeId: A.storeId }).lean();
        assert.equal(hours.manualClosure.active, true);
        assert.equal(hours.manualClosure.by, 'Pet Pooja');
        assert.equal((await hook('get_store_status', { restID: REST })).body.store_status, '0');
        await hooks.releaseHolds();
        hours = await StoreHours.findOne({ storeId: A.storeId }).lean();
        assert.equal(hours.manualClosure.active, false);

        await hook('update_store_status', { restID: REST, store_status: 0, turn_on_time: '', reason: '' });
        assert.equal((await StoreHours.findOne({ storeId: A.storeId }).lean()).manualClosure.active, true);
        await hook('update_store_status', { restID: REST, store_status: 1, turn_on_time: '' });
        assert.equal((await StoreHours.findOne({ storeId: A.storeId }).lean()).manualClosure.active, false);
    });

    test('with the switches off, stock and store calls are refused and change nothing', async () => {
        await fx.call('PUT', P, A.managerToken, { syncStock: false, syncStoreStatus: false });
        assert.equal((await hook('item_stock', { restID: REST, type: 'item', inStock: false, itemID: ['PP-COKE'] })).status, 400);
        assert.equal((await StoreProductPrice.findOne({ storeId: A.storeId, productId: ids.coke }).lean()).availability, 'AVAILABLE');
        assert.equal((await hook('update_store_status', { restID: REST, store_status: 0, turn_on_time: '' })).status, 400);
        assert.equal((await StoreHours.findOne({ storeId: A.storeId }).lean()).manualClosure.active, false);
    });
});
