// PATCH /food/orders/:orderId/ratings: the customer rates the store and the delivery partner once, after delivery.
// The customer app sends restaurantRating / restaurantComment (and deliveryPartnerRating); storeRating and riderRating
// are accepted too. Every shape ends up as ratings.store and ratings.deliveryPartner on the order.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx;
let rider;
const ids = {};

async function insertDelivered(key, { withRider = true } = {}) {
    const A = fx.F.A;
    const _id = new mongoose.Types.ObjectId();
    await fx.models.FoodOrder.collection.insertOne({
        _id, order_id: `RATE${key}${fx.ts}`, orderId: `RATE${key}${fx.ts}`,
        userId: new mongoose.Types.ObjectId(A.customerId), storeId: new mongoose.Types.ObjectId(A.storeId), franchiseId: new mongoose.Types.ObjectId(A.franchiseId),
        orderStatus: 'delivered', items: [{ itemId: 'p1', name: 'Margherita', price: 250, quantity: 1 }],
        deliveryAddress: { street: '1 Test Street', city: 'Indore', state: 'MP' },
        pricing: { subtotal: 250, total: 250 }, payment: { method: 'cash', status: 'paid' },
        dispatch: withRider ? { status: 'accepted', deliveryPartnerId: new mongoose.Types.ObjectId(rider.id) } : { status: 'unassigned', deliveryPartnerId: null },
        createdAt: new Date(), updatedAt: new Date(),
    });
    ids[key] = String(_id);
}

const rate = (key, body, token = fx.F.A.customerToken) => fx.call('PATCH', `/v1/food/orders/${ids[key]}/ratings`, token, body);
const load = (key) => fx.models.FoodOrder.findById(ids[key]).lean();

before(async () => {
    fx = await createFixture();
    rider = await fx.partner('approved');
    for (const k of ['api', 'app', 'twice', 'norider', 'missing']) await insertDelivered(k, { withRider: k !== 'norider' });
});
after(async () => { await fx?.teardown(); });

describe('order ratings', () => {
    test('storeRating and riderRating (with comments) are saved', async () => {
        const res = await rate('api', { storeRating: 5, riderRating: 4, storeComment: 'Hot and fresh', riderComment: 'Polite' });
        assert.equal(res.status, 200, JSON.stringify(res.body));
        const o = await load('api');
        assert.equal(o.ratings.store.rating, 5);
        assert.equal(o.ratings.store.comment, 'Hot and fresh');
        assert.equal(o.ratings.deliveryPartner.rating, 4);
        assert.equal(o.ratings.deliveryPartner.comment, 'Polite');
    });

    test("the customer app's shape (restaurantRating, deliveryPartnerRating) is saved as the store's rating", async () => {
        const res = await rate('app', { restaurantRating: 3, deliveryPartnerRating: 5, restaurantComment: 'ok' });
        assert.equal(res.status, 200, JSON.stringify(res.body));
        const o = await load('app');
        assert.equal(o.ratings.store.rating, 3);
        assert.equal(o.ratings.store.comment, 'ok');
        assert.equal(o.ratings.deliveryPartner.rating, 5);
    });

    test('an order is rated once', async () => {
        assert.equal((await rate('twice', { storeRating: 4, riderRating: 4 })).status, 200);
        const again = await rate('twice', { storeRating: 1, riderRating: 1 });
        assert.equal(again.status, 400, JSON.stringify(again.body));
        assert.equal((await load('twice')).ratings.store.rating, 4);
    });

    test('the rider rating is required when a rider delivered, and not otherwise', async () => {
        assert.equal((await rate('missing', { storeRating: 5 })).status, 400);
        assert.equal((await rate('norider', { storeRating: 5 })).status, 200);
    });

    test('a rating outside 1-5, or another customer, is refused', async () => {
        assert.equal((await rate('missing', { storeRating: 6, riderRating: 4 })).status, 400);
        assert.equal((await rate('missing', { storeRating: 5, riderRating: 4 }, fx.F.B.customerToken)).status, 404);
        assert.equal((await load('missing')).ratings?.store?.rating, undefined);
    });
});
