# Audit 5: review of `073a4dc` (cart offers, coupons, checkout, scheduled orders, nutrition, delivery login)

`073a4dc` ("update delivery boy signup details page", merged into `batch-4-nearby-people` by `5df99ed`) reviewed as a
new feature: 43 files, backend `order-schedule.service.js` (new), `order-store.service.js`, `order-pricing.service.js`,
`order.service.js`, `order.validator.js`, nutrition and delivery-login settings, `GET /food/stores/slots`,
`GET /food/stores/resolve?at=`, and the customer cart / checkout / coupon / delivery-time screens.

## Checks

| Check | Result |
|---|---|
| C1 server-side pricing | **Holds.** `createOrder` stores only `buildOrderPricing` output; client `items[].price`, `pricing.*` (total, discount, tax, fees) are ignored. New test: the order charges exactly what `/food/orders/calculate` quoted, with a coupon, without, under the coupon minimum and for a scheduled slot, while the client sends price 0.01 and total 1 (`quote-equals-charge.test.js`). |
| Minimum cart value | Coupon: `minOrderValue` re-checked on the server subtotal. Limited-time offer: the claim checks `minCartValue` and order creation re-checks it on the server subtotal (`catalog-pricing.service.js`); tokens are user-bound and single-use. Not bypassable by the new cart. |
| Store hours | Placement: open now, or for `scheduledAt` the store must be open for the 30-minute prep window before the slot, 20 minutes to 7 days ahead (`assertSchedulable`), and the super admin switch is enforced. Covered by `scheduled-orders.test.js`. |
| Rider step order, drop OTP | Unchanged by `073a4dc`; scheduled orders use the same rider routes (`rider-flow.test.js`). |
| New routes | `GET /food/stores/slots` (public: store id and name, open now, the switch, slots), `GET /settings/nutrition/public` (public: page copy, active items, allergens), nutrition admin routes (super admin, zod validators), `GET /settings/delivery-login` (public), `PUT /settings/delivery-login` (super admin). Tested for 401/403 and response fields. |
| `GET /settings/delivery-login` public | **Acceptable.** Returns only display fields (titles, labels, button texts, two image paths, two colours, `isActive`); nothing about riders, users or keys. Added to the reviewed public routes. |
| Query sanitising, uploads | No new query-to-Mongo filters; `resolve?at=` is parsed with `new Date` and refused when invalid. No new upload routes (nutrition images are URL strings). |
| Response shapes | The cart reads `data.storeId / openNow / days` from slots and `data.pricing` from calculate; both unchanged. |

## Fixed in this commit

| Sev | Issue | Fix |
|---|---|---|
| High | The new `Cart.jsx` computed subtotal, fees, tax and total in the browser again (it only asked the server whether the coupon applied). With store prices, distance-based delivery fees and server rounding, the total shown could differ from the total charged. This undid batch 3. | The cart asks `POST /food/orders/calculate` for the exact cart, coupon, store and slot (logged in), and shows the server's subtotal, discount, delivery fee, platform and packaging, handling, CGST / SGST and total, in the cart and in the checkout popup. The browser estimate shows only until the quote arrives (or when signed out); a failed quote shows the server's error. |
| High | When the server had no coupons, the cart listed four invented coupons (WELCOME50, PVP100, FEAST20, SUPERVEG) and read `localStorage pvp_coupons`; it also tried the super-admin-only `GET /settings/coupons`. A customer could apply a coupon the server does not know and see a discount the order never gets. | Only `/food/offers/public` and `/settings/coupons/public`; the sample coupons and `pvp_coupons` only with `VITE_STANDALONE_MOCK=true`. |
| Low | Checkout error toast read only `message`; the error handler sends `error`, so customers saw a generic text. | Reads both. |

## Medium (not fixed)

1. **Scheduled orders run immediately.** An order for a later slot enters the store queue at once; when the store accepts it, auto-dispatch looks for a rider straight away (`order.service.js` accept path), and the kitchen screens show it with the other orders. Nothing holds it until about `prepMinutes` before `scheduledAt`. Predates `073a4dc`, but `073a4dc` lets customers schedule while the store is closed, so the store can now receive tomorrow's orders tonight. Suggest: hold dispatch until `scheduledAt - prep`, and badge scheduled orders in the store queue.
2. **`PUT /settings/delivery-login` has no validator.** `Object.assign(config, body)` (super admin only; the strict schema drops unknown keys). No length limits, colour or URL checks (CLAUDE.md: validators per module).
3. **`GET /settings/delivery-login` writes.** The first read creates the document; two first reads at once can create two documents (`findOne` then picks either). Use `findOneAndUpdate({}, {}, { upsert: true })` or seed it.
4. **Fake coupons elsewhere.** `Home.jsx` still has a built-in WELCOME50 promo and `profile/Coupons.jsx` reads `localStorage pvp_coupons` (both older than `073a4dc`).
5. **Checkout saves "abc" as the street** when the house-number field is empty (`CheckoutModal.jsx`, older than `073a4dc`): an invented address on the customer's profile and order.

## Low (not fixed)

1. `POST /food/orders/calculate` does not apply the super admin's "scheduled orders off" switch; placement does, so the quote succeeds and the order is then refused with a clear message.
2. Nutrition item `image` accepts any string up to 1000 characters (not checked to be an `https` URL).
3. The delivery signup city picker uses `VITE_GOOGLE_MAPS_API_KEY` in the browser: restrict the key to the site's referrers and the Places / Geocoding APIs in Google Cloud.
4. The checkout still sends a client `pricing` block (ignored by the server); harmless, could be dropped.
5. `/food/stores/slots` and `/food/stores/resolve` pick the store for "later" orders regardless of today's hours, while the quote uses the slots store; for an ASAP order while the store is closed the quote returns the server's "store is closed" error (shown to the customer), which is the intended behaviour.
