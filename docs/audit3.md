# Audit 3: final security review of Features 1-6

Branch `p1-features`. Scope: every route added in Features 1-6 (staff and kitchen, inventory, customers and
complaints, dashboards, store performance / hours / pricing, store delivery, sockets), plus the auth change for
delivery partners, the order-event watcher, uploads, and the customer-app endpoints added for the legacy calls.

How it was checked:

- **Route sweep.** `test/helpers/routes.js` walks the Express router stack (740 routes) and reads the guards in
  front of each one (`authMiddleware`, `requireRoles(...)`, `requireSuperAdmin`, `attachFranchiseScope`).
  `test/audit3.test.js` fails when a route has no `authMiddleware` or no role guard unless it is in
  `test/fixtures/reviewed-routes.json` (128 public routes and 17 sign-in-only routes, each reviewed below).
  All 187 routes of Features 1-6 are behind both.
- **Scope and IDOR.** Every handler of Features 1-6 takes the store or franchise from the token and looks records up
  with it (`storeId` / `franchiseId` in the query, or a scoped-store lookup first); other stores and franchises
  answer 404. Each feature has tests for this (other store, other franchise, wrong role).
- **Mass assignment.** Requests of Features 4-6 are parsed with zod (unknown keys are dropped) or read field by field.
  Nothing passes `req.body` into a model. Searched for `...req.body`, `new Model(req.body)`, `Object.assign(x, req.body)`,
  `findByIdAndUpdate(.., req.body)` in the feature modules: none.
- **Sockets.** `order_event` is emitted only to `store:<order.storeId>` and `franchise:<order.franchiseId>`, taken from the
  saved order. Sockets join those rooms from their own signed token; client "join" attempts do nothing. The payload has ids
  and states only (tested: no customer name, phone, address or OTP). H2/H3 rules are unchanged.
- **Uploads.** Reviewed every `upload.*` and `safeUpload` use.

## Fixed (critical / high)

| # | Sev | Finding | Fix | Tests |
|---|-----|---------|-----|-------|
| A1 | High | **Staff endpoints could change the manager's own account.** Staff records are looked up by `storeId` only, and the manager's own record is in the same store. A store manager could hard-delete themselves (user, profile, role link), suspend or demote themselves, or do the same to any other account in the store that is not kitchen staff. | `manageableStaff()` in `kitchenStaff.controller.js`: only users linked to the store with role KITCHEN_SUPERVISOR / KITCHEN_STAFF, never the caller. Used by list, get, edit, status, shift, leave and delete. | `audit3.test.js` (manager own record: 404 on all six calls, account untouched; list shows kitchen staff only; kitchen staff still manageable; other store 404) |
| A2 | High | **Bare `upload` middleware had no limits.** Store-approval documents, store-manager create/edit, and the admin and customer forms used `multer({ storage })` with memory storage: one request from any signed-in user could use unbounded memory. | `middleware/upload.js`: 50 MB per file, 20 files, 100 fields, 1 MB per text field. `errorHandler.js`: multer limit errors are 413 / 400 instead of 500. | `audit3.test.js` (21 files: 400; 51 MB file: 413 on store documents and on store-manager create) |
| A3 | High (introduced in Feature 6, fixed) | **Delivery-partner token check was too weak.** The first fix let a `pending` partner pass and fell back to the `User` collection when no partner record existed, so a partner-role token carrying a user id could authenticate. | `auth.middleware.js`: a partner token needs an **approved** partner record; suspended, rejected, pending and missing are 401 on the next request; never checked against `User`. | `delivery-auth.test.js` (42 tests: each status, live status flip, deleted partner, customer/admin/manager ids in a partner token, customer token with a partner id, 33 admin/store/customer-only routes -> 403) |

Confirmed already closed (no change): `POST /auth/user/verify-truecaller` returns 501 and creates nothing (test added).
The service function behind it trusts the payload; see L1.

## Medium (not fixed)

| # | Finding | Where | Suggestion |
|---|---------|-------|-----------|
| M1 | Unauthenticated catalogue admin lists. `GET /v1/food/admin/products` returns Draft and Archived products; `/admin/addons/stats` and `/admin/category-products*` are open too. `status`, `search` and `category` go into the Mongo filter as given (`?status[$ne]=x` is an operator injection; user text is used as a regex). | `routes/index.js`, `product.controller.js getProducts` | Active-only for anonymous callers, coerce query values to strings, escape regex input. |
| M2 | Public order lookup (`/orders/track`, `/orders/history`) is protected by order id + last 10 digits of the phone and only the global rate limit. | `order.service.js trackOrderPublic` | Stricter limiter per IP and per order id, small delay on a miss. |
| M3 | Uploads on `upload.*` routes have limits now but no MIME or file-signature check (store documents accept anything; `.pdf` by file name is stored as a PDF). `safeUpload` already does this. | store approvals, store managers, admin, user routes | Move those routes to `safeUpload`. |
| M4 | With the Redis adapter and several server instances, every instance runs the order change stream and emits, so a screen gets each `order_event` once per instance. | `order-events.service.js` | Run the watcher on one instance (env flag) or dedupe with an event id. |
| M5 | Socket rooms are fixed at connect from the token. A manager who is removed or moved keeps receiving their old store's events until the socket reconnects or the access token expires. | `socket.js` | Disconnect a user's sockets when the account is deactivated or re-scoped. |
| M6 | Staff list: `search` is used as an unescaped regex and `status` is passed to the query unchecked (operator injection, limited to the caller's own store). `PATCH .../status` accepts `Inactive` but the model rejects it (500). Non-string `email` / `role` bodies give 500. | `kitchenStaff.controller.js` | zod validator for the staff module, escape regex input. |
| M7 | `DELETE /food/store/staff/:id` is a hard delete (user, profile, role link, staff record) although documented as a soft delete; orders keep the staff name only as text. | `kitchenStaff.controller.js` | Soft delete (`status: DELETED`, `isActive: false`). |
| M8 | The assigned rider receives the customer's email with the order (`getOrderById` populates `email`). Riders do not need it. | `order.service.js getOrderById` | Remove `email` from the rider view. |
| M9 | Public `GET /v1/food/offers/public` lists coupon codes to anyone, including first-time-only codes. By design for the coupons page, but it exposes codes to non-customers. | `storePublic.controller.js` | Require sign-in, or hide `customerScope: first-time` codes from signed-out callers. |

## Low (not fixed)

- L1. `verifyTruecallerAndLogin` (auth.service.js) trusts the payload and is dead code behind the 501. Delete it, or implement real signature verification before enabling.
- L2. The staff module has no schema validation (types, lengths, `profileImage` URL, `skills`).
- L3. `StoreManager.role` text is free-form on edit. It does not change the login role (that comes from the role link), but inventory "available stores" matches managers by `role: /manager/i`, so a staff member renamed "Manager" is shown as the store's manager name.
- L4. `/v1/fcm-tokens/check` is unauthenticated and lists the endpoint names; FCM routes log a token prefix with `console.log`.
- L5. `POST /v1/settings/cart-config/offer/claim` is open to any signed-in role, not only customers.
- L6. Menu requests with `?storeId=` do not check that the store is approved and active (only reveals that store's prices).
- L7. `authMiddleware` reads the database on every request (one extra query). Fine now; cache if load grows.
- L8. The dashboard and performance aggregations only have the global rate limit. Heavy for a franchise with many stores and long date ranges.
- L9. Super admin is read-only on the store delivery screens (by design, noted so it is not mistaken for a gap).
- L10. `kitchenStaff` markLeave sets the status but does not store the leave dates.

## Checked, no issue found

- Staff creation: store and franchise come from the token; the role goes through a whitelist.
- Kitchen tasks and notifications: scoped by store and user (read, mark read, reassign).
- Inventory transfer: the source store must be in the caller's own franchise; destination is always the caller's store.
- Store pricing, hours, performance, dashboards, delivery, refund-request, issues: zod-validated bodies, scope from the token, other store or franchise 404, writes limited to the allowed roles (tests per feature).
- Refund request from the store: a pending record only; nothing is paid; duplicate and over-total requests are refused.
- FCM token removal is scoped to the caller's own record. Profile update (`PUT /auth/profile/personal`) writes named fields only, and a partner token cannot use it.
- Public store and menu endpoints expose only fields a customer already sees (tested field list; unapproved, inactive and unknown stores are 404).
