// Customer app on real data (docs/audit7.md 2.3, 2.10):
// - GET /food/products/public/:id: the product page (home banners link here), display fields only, store-priced.
// - POST /food/orders/calculate returns one priced line per cart line, so cart rows show the server's prices.
// - POST /food/admin/offers is retired (only Marketing coupons apply).
// - Pushes carry the business logo, never a hardcoded third-party image.
// - The customer screens no longer read sample data or call paths the server does not have (source checks).
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A; let pizza; let draft;
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const ok = (res, status = 200) => { assert.equal(res.status, status, JSON.stringify(res.body)); return res.body.data; };

before(async () => {
    fx = await createFixture(); A = fx.F.A;
    const { Product } = await import('../src/modules/food/admin/models/product.model.js');
    const { CategoryProduct } = await import('../src/modules/food/admin/models/categoryProduct.model.js');
    const { StoreProductPrice } = await import('../src/modules/food/franchise/models/storeProductPrice.model.js');
    const { StoreHours } = await import('../src/modules/food/franchise/models/storeHours.model.js');
    const { FoodFeeSettings } = await import('../src/modules/food/admin/models/feeSettings.model.js');
    const cat = await CategoryProduct.create({ label: 'Veg Pizzas' });
    pizza = await Product.create({
        name: 'Farmhouse', categoryId: cat._id, status: 'Active', price: 300, description: 'Onion, capsicum, tomato',
        sizes: [{ size: 'Medium', price: 300 }, { size: 'Large', price: 450 }],
        franchiseIds: [new mongoose.Types.ObjectId(A.franchiseId)], storeIds: [new mongoose.Types.ObjectId(A.storeId)],
    });
    draft = await Product.create({ name: 'Secret recipe', categoryId: cat._id, status: 'Draft', price: 999 });
    await StoreProductPrice.create({
        storeId: A.storeId, franchiseId: A.franchiseId, productId: pizza._id, mediumPrice: 350, largePrice: 450, status: 'ACTIVE', availability: 'AVAILABLE',
    });
    await FoodFeeSettings.create({ platformFee: 5, packagingFee: 10, handlingFee: 7, deliveryFee: 30, gstRate: 5, isActive: true });
    const week = Object.fromEntries(DAYS.map((d) => [d, { open: '00:00', close: '23:59', isClosed: false }]));
    await StoreHours.findOneAndUpdate({ storeId: A.storeId }, { $set: { week, holidays: [] } }, { upsert: true });
});
after(async () => { await fx?.teardown(); });

describe('GET /food/products/public/:id', () => {
    const DISPLAY_KEYS = ['_id', 'id', 'name', 'shortDescription', 'description', 'image', 'badge', 'price', 'originalPrice', 'discount',
        'discountType', 'saveAmount', 'vegType', 'availability', 'inStock', 'category', 'sizes', 'defaultCrust', 'showCrust', 'toppings', 'crusts'];

    test('an active product, without sign-in, display fields only', async () => {
        const p = ok(await fx.call('GET', `/v1/food/products/public/${pizza._id}`, null));
        assert.deepEqual(Object.keys(p).sort(), [...DISPLAY_KEYS].sort());
        assert.equal(p.name, 'Farmhouse');
        assert.equal(p.category.label, 'Veg Pizzas');
        assert.deepEqual(p.sizes.map((s) => s.size), ['Medium', 'Large']);
        assert.ok(!('storeIds' in p) && !('franchiseIds' in p) && !('createdAt' in p));
    });

    test("priced for the customer's store, like the menu", async () => {
        const p = ok(await fx.call('GET', `/v1/food/products/public/${pizza._id}?storeId=${A.storeId}`, null));
        assert.equal(p.sizes.find((s) => s.size === 'Medium').price, 350);
        const menu = ok(await fx.call('GET', `/v1/food/products/public?storeId=${A.storeId}`, null));
        const fromMenu = menu.find((m) => String(m._id) === String(pizza._id));
        assert.equal(fromMenu.sizes.find((s) => s.size === 'Medium').price, 350, 'product page and menu agree');
    });

    test('draft, unknown and malformed ids are 404', async () => {
        assert.equal((await fx.call('GET', `/v1/food/products/public/${draft._id}`, null)).status, 404);
        assert.equal((await fx.call('GET', `/v1/food/products/public/${new mongoose.Types.ObjectId()}`, null)).status, 404);
        assert.equal((await fx.call('GET', '/v1/food/products/public/not-an-id', null)).status, 404);
    });
});

describe('POST /food/orders/calculate returns priced lines', () => {
    test('one line per cart line, in order, at the store price', async () => {
        const items = [
            { itemId: String(pizza._id), name: 'Farmhouse', size: 'Large', price: 1, quantity: 1, kind: 'product' },
            { itemId: String(pizza._id), name: 'Farmhouse', size: 'Medium', price: 1, quantity: 2, kind: 'product' },
        ];
        const data = ok(await fx.call('POST', '/v1/food/orders/calculate', A.customerToken, { storeId: A.storeId, items }));
        assert.equal(data.lines.length, 2);
        assert.deepEqual(data.lines.map((l) => [l.size, l.quantity, l.price]), [['Large', 1, 450], ['Medium', 2, 350]]);
        assert.equal(data.lines[1].lineTotal, 700);
        assert.equal(data.pricing.subtotal, 450 + 700);
    });
});

describe('legacy offers', () => {
    test('POST /food/admin/offers is refused (410) and creates nothing', async () => {
        const { FoodOffer } = await import('../src/modules/food/admin/models/offer.model.js');
        const before = await FoodOffer.countDocuments();
        const res = await fx.call('POST', '/v1/food/admin/offers', fx.SA, { couponCode: 'NEWOFFER', discountType: 'percentage', discountValue: 10 });
        assert.equal(res.status, 410, JSON.stringify(res.body));
        assert.match(res.body.message, /Marketing > Coupons/);
        assert.equal(await FoodOffer.countDocuments(), before);
    });
});

describe('push notification image', () => {
    test('the business logo, and nothing when there is none', async () => {
        const fb = await import('../src/core/notifications/firebase.service.js');
        const { FoodBusinessSettings } = await import('../src/modules/food/admin/models/businessSettings.model.js');
        await FoodBusinessSettings.deleteMany({});
        fb.resetBrandLogoCache();
        assert.equal(await fb.brandLogoUrl(), '');
        await FoodBusinessSettings.create({ companyName: 'Papa Veg Pizza', logo: { url: 'https://cdn.example.com/logo.png' } });
        fb.resetBrandLogoCache();
        assert.equal(await fb.brandLogoUrl(), 'https://cdn.example.com/logo.png');
        await FoodBusinessSettings.updateMany({}, { $set: { 'logo.url': '/uploads/logo.png' } });
        fb.resetBrandLogoCache();
        assert.equal(await fb.brandLogoUrl(), '', 'a relative path is not a usable push image');
    });

    test('no backend file hardcodes the old Appzeto image', () => {
        const walk = (dir) => readdirSync(dir).flatMap((n) => {
            const p = join(dir, n);
            return statSync(p).isDirectory() ? walk(p) : n.endsWith('.js') ? [p] : [];
        });
        const hits = walk('src').filter((f) => readFileSync(f, 'utf8').includes('Appzeto-Brand-Image'));
        assert.deepEqual(hits, []);
    });
});

describe('customer screens read real data (source checks)', () => {
    const FE = '../Frontend/src';
    const read = (p) => readFileSync(join(FE, p), 'utf8');
    const cases = [
        ['modules/Food/pages/user/ProductDetail.jsx', ['productsData', 'restaurantsData', 'generateReviews', 'useOrders'], ['/food/products/public/']],
        ['modules/Food/pages/user/help/OrderHelp.jsx', ['useOrders', 'support@papavegpizza.com', '123-4567'], ['getOrderDetails', 'loadBusinessSettings']],
        ['modules/Food/pages/user/profile/FAQ.jsx', ['FAQ_DATA'], ['getPublicFaqs']],
        ['modules/Food/pages/user/cart/Cart.jsx', ['ALL_PRODUCTS', 'pvp_products_v2'], ['/food/products/public', 'quotedLines']],
        ['modules/Food/pages/user/search/UserSearchPage.jsx', ['pvp_products_v2'], []],
        ['modules/Food/components/user/MenuSearchOverlay.jsx', ['pvp_products_v2'], []],
        ['modules/Food/pages/user/profile/MyProfile.jsx', ['8770552411'], []],
        ['modules/Food/pages/user/Under250.jsx', ['/food/hero-banners/under-250/public'], ['/settings/hero-banners/under-250/public']],
        ['services/api/adminApiModule.js', ['/food/restaurant/categories/public'], ['"/food/categories/public"']],
        ['services/api/locationApiModule.js', ['/food/zones/detect', '/food/restaurant/dishes/public'], ['"/food/stores/resolve"', '"/food/products/public"']],
    ];
    for (const [file, mustNot, must] of cases) {
        test(file, () => {
            const src = read(file);
            for (const s of mustNot) assert.ok(!src.includes(s), `${file} still contains ${s}`);
            for (const s of must) assert.ok(src.includes(s), `${file} should contain ${s}`);
        });
    }

    test('the menu and the cart read the saved location through one reader', () => {
        assert.match(read('services/api/axios.js'), /readSavedCoords\(\)/);
        assert.match(read('modules/Food/pages/user/cart/cartHelpers.js'), /return readSavedCoords\(\)/);
    });
});

describe('removed customer screens stay removed', () => {
    test('their files are gone', async () => {
        const { existsSync } = await import('node:fs');
        for (const f of ['Gourmet', 'Collections', 'CollectionDetail', 'profile/Favorites', 'profile/Feedback', 'profile/AddPayment', 'profile/EditPayment']) {
            assert.ok(!existsSync(`../Frontend/src/modules/Food/pages/user/${f}.jsx`), `${f}.jsx is back`);
        }
        assert.ok(existsSync('../Frontend/src/modules/Food/pages/user/profile/Payments.jsx'), 'Payment Options is live and must stay');
    });
});
