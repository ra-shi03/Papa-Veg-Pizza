// Checkout: an order carries the signed-in customer's own contact and the address they selected, with no default values
// behind them. The logic is Frontend/.../cart/checkoutDetails.js (plain JavaScript, tested here because the frontend has
// no test runner); the last tests read CheckoutModal.jsx itself so the hardcoded values cannot come back.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  addressProblem, assertOwnOrderDetails, buildOrderDetails, contactFromAccount, contactProblem, parseAddressText,
  readPickedLocation, selectDeliveryAddress, toTenDigitPhone,
} from '../../Frontend/src/modules/Food/pages/user/cart/checkoutDetails.js';

const CART = new URL('../../Frontend/src/modules/Food/pages/user/cart/', import.meta.url);
const source = (file) => readFileSync(new URL(file, CART), 'utf8');

const ME = { name: 'Asha Rao', phone: '9812345678', email: 'asha@example.invalid' };
const HOME = { _id: 'home1', label: 'Home', street: '12 MG Road', additionalDetails: 'Near the park', city: 'Pune', state: 'MH', zipCode: '411001', isDefault: false, location: { type: 'Point', coordinates: [73.85, 18.52] } };
const OFFICE = { _id: 'office1', label: 'Office', street: '5 Tech Park', city: 'Pune', state: 'MH', zipCode: '411014', isDefault: true, location: { type: 'Point', coordinates: [73.93, 18.55] } };
const NO_POINT = { _id: 'old1', label: 'Other', street: '9 Old Street', city: 'Pune', state: 'MH', isDefault: false };

const storage = (values = {}) => ({ getItem: (key) => (key in values ? (typeof values[key] === 'string' ? values[key] : JSON.stringify(values[key])) : null) });

describe('contact', () => {
    test('comes from the profile; a missing field stays empty', () => {
        assert.deepEqual(contactFromAccount({ name: ' Asha Rao ', phone: '9812345678', email: 'asha@example.invalid' }), ME);
        assert.deepEqual(contactFromAccount({ name: '', phone: null, email: null }), { name: '', phone: '', email: '' });
        assert.deepEqual(contactFromAccount(undefined), { name: '', phone: '', email: '' });
    });
    test('the phone is the 10 digits, however it was saved', () => {
        for (const v of ['9812345678', '+91 98123 45678', '919812345678', '09812345678']) assert.equal(toTenDigitPhone(v), '9812345678', v);
    });
    test('name and phone are required before the order is placed; the email is optional', () => {
        assert.equal(contactProblem(ME), null);
        assert.match(contactProblem({ ...ME, name: ' ' }), /name/);
        assert.match(contactProblem({ ...ME, phone: '' }), /mobile/);
        assert.match(contactProblem({ ...ME, phone: '12345' }), /mobile/);
        assert.equal(contactProblem({ ...ME, email: '' }), null);
        assert.equal(contactProblem({ name: ME.name, phone: ME.phone }), null);
    });
});

describe('which address', () => {
    const point = (address) => ({ lat: address.location.coordinates[1], lng: address.location.coordinates[0] });
    const pick = (address, text = 'somewhere') => ({ address: text, point: point(address), nearestKnown: point(address) });

    test('nothing selected and nothing saved: no address, and the order is blocked with a clear message', () => {
        assert.equal(selectDeliveryAddress({ saved: [], picked: null }), null);
        assert.match(addressProblem(null), /choose a delivery address/i);
    });
    test('a location that matches a saved address uses that address and its own coordinates', () => {
        const selected = selectDeliveryAddress({ saved: [OFFICE, HOME], picked: { address: 'x', point: { lat: 18.5201, lng: 73.8501 } } });
        assert.deepEqual([selected.kind, selected.id, selected.street, selected.point], ['saved', 'home1', '12 MG Road', { lat: 18.52, lng: 73.85 }]);
        assert.equal(addressProblem(selected), null);
    });
    test('no location picked: the default saved address', () => {
        assert.equal(selectDeliveryAddress({ saved: [HOME, OFFICE], picked: null }).id, 'office1');
    });
    test('a new location: its own text and coordinates, never a saved address far away', () => {
        const selected = selectDeliveryAddress({ saved: [HOME], picked: { address: 'Vijay Nagar, Indore, Madhya Pradesh 452010, India', point: { lat: 22.75, lng: 75.89 } } });
        assert.deepEqual([selected.kind, selected.city, selected.state, selected.zipCode, selected.point], ['picked', 'Indore', 'Madhya Pradesh', '452010', { lat: 22.75, lng: 75.89 }]);
    });
    test('a saved address with no map point is blocked; coordinates are never borrowed from somewhere else', () => {
        const selected = selectDeliveryAddress({ saved: [NO_POINT], picked: { address: '9 Old Street, Pune', point: null, nearestKnown: point(HOME) } });
        assert.deepEqual([selected.id, selected.point], ['old1', null]);
        assert.match(addressProblem(selected), /map/);
    });
    test('an address with no city or state is blocked with a clear message, not refused by the database', () => {
        const short = selectDeliveryAddress({ picked: { address: 'Near the park', point: { lat: 18.5, lng: 73.8 } } });
        assert.match(addressProblem(short), /city and state/);
        const partial = selectDeliveryAddress({ saved: [{ ...HOME, state: '' }], picked: null });
        assert.match(addressProblem(partial), /city and state/);
    });
    test('train, takeaway and in-car orders keep their text and are not blocked for a map point', () => {
        const selected = selectDeliveryAddress({ saved: [HOME], picked: { address: 'Delivery on Train (PNR: 123)', point: null, nearestKnown: null }, service: 'train' });
        assert.equal(selected.kind, 'service');
        assert.equal(addressProblem(selected), null);
        assert.equal(selectDeliveryAddress({ saved: [HOME], picked: null, service: 'train' }), null);
    });
    test('reading the picked location, in the same order the cart uses', () => {
        assert.equal(readPickedLocation(storage()), null);
        assert.deepEqual(readPickedLocation(storage({ deliveryLocation: { selectedAddress: { address: 'A', lat: 1, lng: 2 } }, user_location: { address: 'B', lat: 3, lng: 4 } })).point, { lat: 1, lng: 2 });
        assert.equal(readPickedLocation(storage({ user_location: { address: 'B', lat: 3, lng: 4 } })).address, 'B');
        const current = readPickedLocation(storage({ userLocation: { formattedAddress: 'C', latitude: 5, longitude: 6, city: 'Pune', state: 'MH' } }));
        assert.deepEqual([current.address, current.point, current.city], ['C', { lat: 5, lng: 6 }, 'Pune']);
        assert.equal(readPickedLocation(storage({ deliveryAddress: 'text only' })).point, null);
        assert.equal(readPickedLocation(storage({ deliveryLocation: 'not json{' })), null);
    });
    test('address text is read from the end, so the area does not become the city', () => {
        assert.deepEqual(parseAddressText('Flat 5, Vijay Nagar, Indore, Madhya Pradesh 452010, India'), { area: 'Flat 5, Vijay Nagar', city: 'Indore', state: 'Madhya Pradesh', zipCode: '452010' });
        assert.deepEqual(parseAddressText('Pune, MH, 411001'), { area: '', city: 'Pune', state: 'MH', zipCode: '411001' });
        assert.deepEqual(parseAddressText(''), { area: '', city: '', state: '', zipCode: '' });
    });
});

describe('the order payload', () => {
    const selected = selectDeliveryAddress({ saved: [HOME], picked: null });
    const details = () => buildOrderDetails({ contact: ME, selected, houseNumber: '12 MG Road', landmark: 'Near the park' });
    const check = (payload) => assertOwnOrderDetails(payload, { contact: ME, selected });

    test('a saved address goes as it is, with its real coordinates and the customer\'s contact', () => {
        const d = details();
        assert.deepEqual([d.customerName, d.customerPhone, d.address.name, d.address.phone], [ME.name, ME.phone, ME.name, ME.phone]);
        assert.deepEqual([d.address.label, d.address.street, d.address.city, d.address.zipCode], ['Home', '12 MG Road', 'Pune', '411001']);
        assert.deepEqual(d.address.location.coordinates, [73.85, 18.52]);
        assert.ok(!JSON.stringify(d).includes(ME.email), 'the email is not part of an order');
        assert.deepEqual(check(d), d);
    });
    test('a new location keeps the house number and the area for the rider', () => {
        const picked = selectDeliveryAddress({ picked: { address: 'Vijay Nagar, Indore, Madhya Pradesh 452010', point: { lat: 22.75, lng: 75.89 } } });
        assert.equal(buildOrderDetails({ contact: ME, selected: picked, houseNumber: 'Flat 5', landmark: '' }).address.street, 'Flat 5, Vijay Nagar');
    });
    for (const [name, change] of [
        ['someone else\'s name', (p) => { p.customerName = 'Someone Else'; }],
        ['someone else\'s phone', (p) => { p.customerPhone = '9000000000'; }],
        ['another name on the address', (p) => { p.address.name = 'Someone Else'; }],
        ['another phone on the address', (p) => { p.address.phone = '9000000000'; }],
        ['an email', (p) => { p.email = 'x@example.invalid'; }],
        ['an email on the address', (p) => { p.address.email = 'x@example.invalid'; }],
        ['no street', (p) => { p.address.street = ' '; }],
        ['other coordinates', (p) => { p.address.location.coordinates = [75.86, 22.72]; }],
        ['no coordinates', (p) => { delete p.address.location; }],
    ]) {
        test(`refused: ${name}`, () => {
            const payload = details();
            change(payload);
            assert.throws(() => check(payload), /check your contact details/);
        });
    }
    test('refused when the contact is empty, even if the payload matches it', () => {
        const empty = { name: '', phone: '', email: '' };
        assert.throws(() => assertOwnOrderDetails(buildOrderDetails({ contact: empty, selected, houseNumber: 'x', landmark: '' }), { contact: empty, selected }));
    });
});

describe('after the order', () => {
    test('the cart does not redirect to the menu when the order was just placed, and the customer lands on its tracking', () => {
        const cart = source('Cart.jsx');
        assert.match(cart, /cartItems\.length === 0 && !orderJustPlaced\.current/);
        assert.match(cart, /onOrderPlaced=\{\(\) => \{ orderJustPlaced\.current = true \}\}/);
        const modal = source('CheckoutModal.jsx');
        assert.ok(modal.indexOf('onOrderPlaced?.()') < modal.indexOf('replaceCart([])'), 'told before the cart is emptied');
        assert.match(modal, /navigate\(`\/user\/orders\/\$\{orderId\}\?confirmed=true`\)/);
    });
});

describe('nothing hardcoded in the checkout', () => {
    const files = ['CheckoutModal.jsx', 'checkoutDetails.js', 'cartHelpers.js'];
    test('no phone number or email address in the source', () => {
        for (const file of files) {
            const text = source(file);
            assert.deepEqual(text.match(/\b[6-9]\d{9}\b/g) || [], [], `${file}: phone`);
            assert.deepEqual((text.match(/[\w.+-]+@[\w-]+\.[\w.]+/g) || []).filter((m) => !m.startsWith('@food')), [], `${file}: email`);
        }
    });
    test('contact starts empty; no invented address, street or city', () => {
        const modal = source('CheckoutModal.jsx');
        for (const field of ['contactName', 'contactPhone', 'contactEmail']) {
            assert.match(modal, new RegExp(`\\[${field}, set\\w+\\] = useState\\(""\\)`), field);
        }
        assert.ok(!/\|\|\s*"abc"/.test(modal), 'no "abc" street');
        for (const file of files) assert.ok(!/Indore|Tukoganj/i.test(source(file).replace(/\/\/.*$|\/\*\*.*\*\//gm, '')), `${file}: Indore`);
    });
    test('the order goes through the check before it is sent', () => {
        assert.match(source('CheckoutModal.jsx'), /orderAPI\.createOrder\(assertOwnOrderDetails\(/);
    });
});
