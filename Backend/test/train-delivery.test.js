// Train delivery: the super admin maps stations to stores. A train order goes to the station's store, else the default
// train store, else it is refused. Never an arbitrary store, and the client's storeId does not count. PNR, coach and seat
// reach the rider as delivery notes, not as a street.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

const NOT_AVAILABLE = 'Train delivery is not available yet';
const ADMIN = '/v1/food/admin/business-settings';
let fx; let A; let B; let pizza; let StoreHours;

const save = (trainDelivery, token = fx.SA) => fx.call('PATCH', ADMIN, token, { trainDelivery });
const JOURNEY = { pnr: '1234567890', coach: 'B2', seat: '14', trainNo: '12301' };
const place = (train, storeId = B.storeId) => fx.call('POST', '/v1/food/orders', A.customerToken, {
    items: [{ itemId: String(pizza._id), name: 'Margherita', price: 200, quantity: 1, size: 'Regular', kind: 'product' }],
    // what the checkout sends: the server replaces the store and the address
    storeId, address: { label: 'Home', name: 'Asha Rao', phone: '9812345678', street: `Delivery on Train (PNR: ${JOURNEY.pnr})`, city: 'x', state: 'y' },
    customerName: 'Asha Rao', customerPhone: '9812345678', paymentMethod: 'cash', train,
});
const storeOf = async (res) => {
    assert.equal(res.status, 201, JSON.stringify(res.body));
    return String(res.body.data.order.storeId?._id || res.body.data.order.storeId);
};
const refused = (res, message = NOT_AVAILABLE) => {
    assert.equal(res.status, 400, JSON.stringify(res.body));
    assert.equal(res.body.error || res.body.message, message);
};
const closeStore = (storeId) => {
    const week = Object.fromEntries(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((d) => [d, { open: '10:00', close: '22:00', isClosed: true }]));
    return StoreHours.findOneAndUpdate({ storeId }, { $set: { week, holidays: [] } }, { upsert: true });
};

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    const { Product } = await import('../src/modules/food/admin/models/product.model.js');
    ({ StoreHours } = await import('../src/modules/food/franchise/models/storeHours.model.js'));
    pizza = await Product.create({ name: 'Margherita', categoryId: new mongoose.Types.ObjectId(), status: 'Active', sizes: [{ size: 'Regular', price: 200 }], basePrice: 200, price: 200 });
});
after(async () => { await fx?.teardown(); });

describe('with no train settings', () => {
    test('the order is refused, whichever store the client sends', async () => refused(await place({ ...JOURNEY, stationCode: 'BPL' })));
    test('the store lookups refuse too, so the cart says so', async () => {
        for (const path of ['/v1/food/stores/resolve?train=1&stationCode=BPL', '/v1/food/stores/slots?train=1&stationCode=BPL', '/v1/food/stores/resolve?train=1']) {
            refused(await fx.call('GET', path));
        }
    });
    test('an order that is not for a train is not affected', async () => {
        assert.equal(await storeOf(await place(undefined, A.storeId)), A.storeId);
    });
});

describe('who may write the settings', () => {
    test('only the super admin', async () => {
        const body = { stations: [{ name: 'Bhopal Jn', code: 'BPL', storeId: A.storeId }] };
        assert.equal((await save(body, null)).status, 401);
        const rider = await fx.partner();
        for (const token of [A.adminToken, A.managerToken, A.customerToken, rider.token]) assert.equal((await save(body, token)).status, 403);
        refused(await place({ ...JOURNEY, stationCode: 'BPL' }));
    });
    for (const [name, value, message] of [
        ['a store that does not exist', { stations: [{ name: 'Bhopal Jn', code: 'BPL', storeId: '64b000000000000000000001' }] }, /store/i],
        ['a default store that does not exist', { defaultStoreId: '64b000000000000000000001' }, /store/i],
        ['not a store id', { stations: [{ name: 'Bhopal Jn', code: 'BPL', storeId: 'nope' }] }, /store/i],
        ['a bad code', { stations: [{ name: 'Bhopal Jn', code: 'B P L!', storeId: 'x'.repeat(24) }] }, /./],
        ['HTML in a name', { stations: [{ name: '<b>x</b>', code: 'BPL', storeId: 'a'.repeat(24) }] }, /HTML/],
        ['the same code twice', { stations: [{ name: 'One', code: 'BPL', storeId: 'a'.repeat(24) }, { name: 'Two', code: 'bpl', storeId: 'a'.repeat(24) }] }, /once/],
    ]) {
        test(`refused: ${name}`, async () => {
            const res = await save(value);
            assert.equal(res.status, 400, JSON.stringify(res.body));
            assert.match(res.body.error || res.body.message, message);
        });
    }
    test('the public endpoint never shows the mapping', async () => {
        assert.equal((await save({ defaultStoreId: B.storeId, stations: [{ name: 'Bhopal Jn', code: 'BPL', storeId: A.storeId }] })).status, 200);
        const res = await fx.call('GET', `${ADMIN}/public`);
        const text = JSON.stringify(res.body);
        assert.ok(!text.includes('trainDelivery') && !text.includes('BPL') && !text.includes(A.storeId));
    });
});

describe('routing', () => {
    before(async () => {
        assert.equal((await save({ defaultStoreId: B.storeId, stations: [{ name: 'Bhopal Jn', code: 'bpl', storeId: A.storeId }] })).status, 200);
    });

    test('a mapped station goes to its store, not the one the client sent', async () => {
        assert.equal(await storeOf(await place({ ...JOURNEY, stationCode: 'BPL' }, B.storeId)), A.storeId);
        assert.equal(await storeOf(await place({ ...JOURNEY, stationCode: 'bpl' }, B.storeId)), A.storeId, 'any case');
    });
    test('an unmapped station goes to the default store', async () => {
        assert.equal(await storeOf(await place({ ...JOURNEY, stationCode: 'NZM' }, A.storeId)), B.storeId);
    });
    test('a station typed by name (not in the list) goes to the default store', async () => {
        assert.equal(await storeOf(await place({ ...JOURNEY, stationName: 'Some Halt' }, A.storeId)), B.storeId);
    });
    test('no station at all is refused: nothing is guessed', async () => {
        const res = await place({ ...JOURNEY });
        assert.equal(res.status, 400);
        assert.match(res.body.error || res.body.message, /station/i);
    });
    test('the store lookups give the same store, for the quote', async () => {
        const store = async (path) => (await fx.call('GET', path)).body.data.storeId;
        assert.equal(await store('/v1/food/stores/resolve?train=1&stationCode=BPL'), A.storeId);
        assert.equal(await store('/v1/food/stores/slots?train=1&stationCode=BPL'), A.storeId);
        assert.equal(await store('/v1/food/stores/resolve?train=1&stationCode=NZM'), B.storeId);
    });
    test('no default store: an unmapped station is refused, a mapped one still works', async () => {
        await save({ defaultStoreId: '', stations: [{ name: 'Bhopal Jn', code: 'BPL', storeId: A.storeId }] });
        refused(await place({ ...JOURNEY, stationCode: 'NZM' }));
        assert.equal(await storeOf(await place({ ...JOURNEY, stationCode: 'BPL' })), A.storeId);
        await save({ defaultStoreId: B.storeId, stations: [{ name: 'Bhopal Jn', code: 'BPL', storeId: A.storeId }] });
    });
    for (const [name, change, message] of [
        ['a PNR of the wrong length', { pnr: '123' }, /PNR/],
        ['letters in the PNR', { pnr: '12345abcde' }, /PNR/],
        ['no train number', { trainNo: '' }, /Train number/],
        ['a train number with symbols', { trainNo: '12<3>' }, /Train number/],
        ['no coach', { coach: '' }, /Coach/],
        ['a coach that is too long', { coach: 'ABCDEFG' }, /Coach/],
        ['no seat', { seat: '' }, /Seat/],
        ['HTML in the seat', { seat: '<b>1</b>' }, /Seat/],
        ['HTML in the station name', { stationCode: '', stationName: '<script>x</script>' }, /Station name/],
        ['a station name that is too long', { stationCode: '', stationName: 'x'.repeat(81) }, /too long/],
        ['a station code with symbols', { stationCode: 'B!L' }, /station/i],
    ]) {
        test(`refused: ${name}`, async () => {
            const res = await place({ ...JOURNEY, stationCode: 'BPL', ...change });
            assert.equal(res.status, 400, JSON.stringify(res.body));
            assert.match(res.body.error || res.body.message, message);
        });
    }
    test('the PNR is optional, and fields are trimmed', async () => {
        const { pnr, ...noPnr } = JOURNEY;
        const res = await place({ ...noPnr, stationCode: 'BPL', coach: ' b2 ', seat: ' 14 ' });
        assert.equal(res.status, 201, JSON.stringify(res.body));
        const db = await fx.models.FoodOrder.findById(res.body.data.order._id).lean();
        assert.deepEqual([db.train.coach, db.train.seat], ['b2', '14']);
        assert.ok(!db.note.includes('PNR'));
    });
});

describe('a store that cannot take the order', () => {
    test('a closed store is refused; the order never moves to the default store', async () => {
        await closeStore(A.storeId);
        refused(await place({ ...JOURNEY, stationCode: 'BPL' }), 'The store is closed right now. Please order during its opening hours.');
        // slots still answer, so a closed store can offer later times
        assert.equal((await fx.call('GET', '/v1/food/stores/slots?train=1&stationCode=BPL')).status, 200);
        await StoreHours.deleteOne({ storeId: A.storeId });
    });
    for (const [name, change] of [['unapproved', { approvalStatus: 'Pending' }], ['inactive', { isActive: false }]]) {
        test(`an ${name} store is refused`, async () => {
            await fx.models.FoodStore.updateOne({ _id: A.storeId }, { $set: change });
            refused(await place({ ...JOURNEY, stationCode: 'BPL' }));
            await fx.models.FoodStore.updateOne({ _id: A.storeId }, { $set: { approvalStatus: 'Approved', isActive: true } });
        });
    }
    test('an unapproved default store is refused', async () => {
        await fx.models.FoodStore.updateOne({ _id: B.storeId }, { $set: { approvalStatus: 'Pending' } });
        refused(await place({ ...JOURNEY, stationCode: 'NZM' }));
        await fx.models.FoodStore.updateOne({ _id: B.storeId }, { $set: { approvalStatus: 'Approved' } });
    });
});

describe('what is saved and what the rider sees', () => {
    let order; let rider;
    before(async () => {
        const res = await place({ ...JOURNEY, stationCode: 'BPL', stationName: 'Client Text' });
        assert.equal(res.status, 201, JSON.stringify(res.body));
        order = res.body.data.order;
        rider = await fx.partner();
    });

    test('the address names the station; the PNR is not a street', async () => {
        const db = await fx.models.FoodOrder.findById(order._id).lean();
        assert.deepEqual([db.deliveryAddress.street, db.deliveryAddress.city, db.deliveryAddress.state], ['Bhopal Jn station', 'Bhopal Jn', 'Train delivery']);
        assert.ok(!JSON.stringify(db.deliveryAddress).includes(JOURNEY.pnr));
        assert.ok(!db.deliveryAddress.location?.coordinates);
        assert.deepEqual([db.deliveryAddress.name, db.deliveryAddress.phone, db.customerName], ['Asha Rao', '9812345678', 'Asha Rao']);
    });
    test('station, train, coach and seat are the delivery notes; the PNR is only part of that note', async () => {
        const db = await fx.models.FoodOrder.findById(order._id).lean();
        assert.equal(db.note, 'Station: Bhopal Jn, Train: 12301, Coach: B2, Seat: 14, PNR: 1234567890');
        assert.deepEqual([db.train.trainNo, db.train.coach, db.train.seat, db.train.stationCode, db.train.stationName], ['12301', 'B2', '14', 'BPL', 'Bhopal Jn']);
    });
    test('the PNR is kept nowhere else: not in the train record, not as a field', async () => {
        const db = await fx.models.FoodOrder.findById(order._id).lean();
        assert.ok(!('pnr' in db.train));
        assert.ok(!JSON.stringify({ ...db, note: '' }).includes(JOURNEY.pnr));
    });
    test('before accepting, the rider sees no PNR, coach, seat or notes', async () => {
        await fx.models.FoodOrder.updateOne({ _id: order._id }, { $set: { orderStatus: 'confirmed', 'dispatch.offeredTo': [{ partnerId: new mongoose.Types.ObjectId(rider.id), at: new Date(), action: 'offered' }] } });
        const list = (await fx.call('GET', '/v1/food/delivery/orders/available', rider.token)).body.data.data;
        const offer = list.find((o) => o._id === String(order._id));
        assert.ok(offer);
        assert.equal(offer.area, 'Bhopal Jn');
        for (const secret of [JOURNEY.pnr, 'Coach', 'Seat', 'Train: ']) assert.ok(!JSON.stringify(offer).includes(secret), secret);
    });
    test('after accepting, the rider reads them where the app shows delivery instructions', async () => {
        const res = await fx.call('PATCH', `/v1/food/delivery/orders/${order._id}/accept`, rider.token, {});
        assert.equal(res.status, 200, JSON.stringify(res.body));
        assert.ok(['Station: Bhopal Jn', 'Train: 12301', 'Coach: B2', 'Seat: 14'].every((part) => res.body.data.order.note.includes(part)));
        assert.equal(res.body.data.order.deliveryAddress.street, 'Bhopal Jn station');
    });
});

describe('the station list for the picker', () => {
    const list = async () => (await fx.call('GET', '/v1/food/train/stations')).body.data;
    const set = (v) => save(v);
    before(async () => {
        await set({ defaultStoreId: '', stations: [] });
        await fx.models.FoodStore.updateMany({}, { $set: { approvalStatus: 'Approved', isActive: true } });
        const { clearBusinessInfoCache } = await import('../src/modules/food/admin/services/businessSettings.service.js');
        clearBusinessInfoCache();
    });
    const clear = async () => (await import('../src/modules/food/admin/services/businessSettings.service.js')).clearBusinessInfoCache();

    test('nothing mapped and no default: unavailable, and no stations', async () => {
        assert.deepEqual(await list(), { available: false, defaultAvailable: false, stations: [] });
    });
    test('only name and code leave the server: no store ids, no audit fields', async () => {
        assert.equal((await set({ stations: [{ name: 'Bhopal Jn', code: 'BPL', storeId: A.storeId }] })).status, 200);
        const res = await fx.call('GET', '/v1/food/train/stations');
        assert.match(res.headers['cache-control'], /max-age=60/);
        assert.deepEqual(res.body.data, { available: true, defaultAvailable: false, stations: [{ name: 'Bhopal Jn', code: 'BPL' }] });
        const text = JSON.stringify(res.body);
        for (const secret of [A.storeId, B.storeId, '_id', 'storeId', 'createdAt', 'updatedAt']) assert.ok(!text.includes(secret), secret);
    });
    test('works without signing in, and a station whose store is unapproved or inactive is not listed', async () => {
        await set({ stations: [{ name: 'Bhopal Jn', code: 'BPL', storeId: A.storeId }, { name: 'Itarsi', code: 'ET', storeId: B.storeId }] });
        for (const change of [{ approvalStatus: 'Pending' }, { isActive: false }]) {
            await fx.models.FoodStore.updateOne({ _id: B.storeId }, { $set: change });
            await clear();
            assert.deepEqual((await list()).stations.map((s) => s.code), ['BPL']);
            await fx.models.FoodStore.updateOne({ _id: B.storeId }, { $set: { approvalStatus: 'Approved', isActive: true } });
            await clear();
        }
        assert.deepEqual((await list()).stations.map((s) => s.code), ['BPL', 'ET']);
    });
    test('an unmapped station cannot be ordered when there is no default store', async () => {
        await set({ defaultStoreId: '', stations: [{ name: 'Bhopal Jn', code: 'BPL', storeId: A.storeId }] });
        refused(await place({ ...JOURNEY, stationCode: 'NZM' }));
        refused(await place({ ...JOURNEY, stationCode: '', stationName: 'Anywhere' }));
        assert.equal(await storeOf(await place({ ...JOURNEY, stationCode: 'BPL' })), A.storeId);
    });
    test('only a default store: available, with no stations to pick', async () => {
        await set({ defaultStoreId: B.storeId, stations: [] });
        assert.deepEqual(await list(), { available: true, defaultAvailable: true, stations: [] });
    });
    test('an unapproved default store alone is unavailable', async () => {
        await fx.models.FoodStore.updateOne({ _id: B.storeId }, { $set: { approvalStatus: 'Pending' } });
        await clear();
        assert.equal((await list()).available, false);
        await fx.models.FoodStore.updateOne({ _id: B.storeId }, { $set: { approvalStatus: 'Approved' } });
        await clear();
    });
});

describe('saving the mapping: clear errors', () => {
    const msg = (res) => res.body.error || res.body.message;
    test('a station can be added, edited and removed', async () => {
        assert.equal((await save({ stations: [{ name: 'Bhopal Jn', code: 'BPL', storeId: A.storeId }, { name: 'Itarsi', code: 'ET', storeId: B.storeId }] })).status, 200);
        assert.equal((await save({ stations: [{ name: 'Bhopal Junction', code: 'BPL', storeId: B.storeId }] })).status, 200);
        const got = (await fx.call('GET', ADMIN, fx.SA)).body.data.trainDelivery;
        assert.deepEqual(got.stations.map((s) => [s.name, s.code, String(s.storeId)]), [['Bhopal Junction', 'BPL', B.storeId]]);
        assert.equal((await save({ stations: [] })).status, 200);
        assert.equal((await fx.call('GET', ADMIN, fx.SA)).body.data.trainDelivery.stations.length, 0);
    });
    test('an unapproved store is refused, naming the station and the store', async () => {
        await fx.models.FoodStore.updateOne({ _id: A.storeId }, { $set: { approvalStatus: 'Pending' } });
        const res = await save({ stations: [{ name: 'Bhopal Jn', code: 'BPL', storeId: A.storeId }] });
        assert.equal(res.status, 400);
        assert.match(msg(res), /Station Bhopal Jn: .* is not approved yet/);
        const def = await save({ defaultStoreId: A.storeId });
        assert.match(msg(def), /default train store: .* is not approved yet/);
        await fx.models.FoodStore.updateOne({ _id: A.storeId }, { $set: { approvalStatus: 'Approved' } });
    });
    test('a switched-off store is refused', async () => {
        await fx.models.FoodStore.updateOne({ _id: A.storeId }, { $set: { isActive: false } });
        assert.match(msg(await save({ stations: [{ name: 'Bhopal Jn', code: 'BPL', storeId: A.storeId }] })), /switched off/);
        await fx.models.FoodStore.updateOne({ _id: A.storeId }, { $set: { isActive: true } });
    });
    test('a store that is closed right now is saved, with a warning naming the station', async () => {
        await closeStore(A.storeId);
        const res = await save({ stations: [{ name: 'Bhopal Jn', code: 'BPL', storeId: A.storeId }] });
        assert.equal(res.status, 200, JSON.stringify(res.body));
        assert.equal(res.body.data.warnings.length, 1);
        assert.match(res.body.data.warnings[0], /Station Bhopal Jn: .* is closed right now/);
        await StoreHours.deleteOne({ storeId: A.storeId });
        assert.deepEqual((await save({ stations: [{ name: 'Bhopal Jn', code: 'BPL', storeId: A.storeId }] })).body.data.warnings, []);
    });
});
