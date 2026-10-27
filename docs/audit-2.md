# Papa Veg Pizza: Audit 2 (re-check of the P0 fixes)

Date: 2026-10-26 · Branch `security-fixes` at `6899e0a` · Compared with [audit.md](audit.md)

## Summary

| P0 | Item | Status |
|---|---|---|
| 1 | Auth bypasses (mock tokens, `jwt.decode`, "missing user is fine") | **FIXED** |
| 2 | Open routes, uploads, fcm test routes, payments role gate | **FIXED** (two upload gaps listed under new findings) |
| 3 | Split `/v1/food/admin`, franchise scope from the token | **FIXED** |
| 4 | Field whitelists, `franchiseId` from the token | **FIXED** (one low-risk leftover on create) |
| 5 | Password hashing, forgot-password, `12345678`, staff accounts | **FIXED** |
| 6 | Atlas/history, CORS, 15-min tokens, rotation, OTP, order-history phone | **PARTIAL**: code fixed; server config and secrets not done |

**The biggest caveat:** none of this is live. `security-fixes` is 15 commits ahead of `origin/main` (`4e54da6`) and has never been pushed. Any server running `main`, including the CloudPanel server, still has every original P0 hole, for example `Bearer mock_token` acting as super admin.

**The biggest new finding:** customers decide their own order price (see C1). The first audit missed it. It has been in the code since the first commit.

Regression suite: `npm test` in `Backend/` runs 228 tests, all passing, last run 2026-10-26.

---

## 1. P0 status with evidence

### P0-1 Auth bypasses: FIXED
- [auth.middleware.js:43](../Backend/src/core/auth/auth.middleware.js#L43): the only path is `verifyAccessToken(token)`. There is no `mock_token`, `dummy_access_token`, `mockHeader` or `jwt.decode` branch any more.
- [auth.middleware.js:57-62](../Backend/src/core/auth/auth.middleware.js#L57-L62): the account must exist and be active, in every environment. The dev "missing user is fine" branch is gone.
- [socket.js:78](../Backend/src/config/socket.js#L78): the socket handshake also requires a signed token; `dummy_access_token` was removed.
- Tests: [auth-bypass.test.js](../Backend/test/auth-bypass.test.js) (12 tests).

### P0-2 Open routes: FIXED
- `/v1/stores`, `/v1/store-managers` and `/v1/store-approvals` require a login plus super admin or franchise admin: [store.routes.js:17](../Backend/src/modules/food/franchise/routes/store.routes.js#L17), [storeManager.routes.js:17](../Backend/src/modules/food/franchise/routes/storeManager.routes.js#L17), [storeApproval.routes.js:21](../Backend/src/modules/food/franchise/routes/storeApproval.routes.js#L21). Approve, reject, request-changes and verify are super admin only ([storeApproval.routes.js:30-33](../Backend/src/modules/food/franchise/routes/storeApproval.routes.js#L30-L33)).
- `/v1/uploads` requires a login and a known role ([upload.routes.js:11-13](../Backend/src/modules/uploads/routes/upload.routes.js#L11-L13)). It enforces per-type size limits and a MIME allow-list ([upload.routes.js:35-48](../Backend/src/modules/uploads/routes/upload.routes.js#L35-L48)) and checks magic bytes ([upload.routes.js:22-32](../Backend/src/modules/uploads/routes/upload.routes.js#L22-L32)). SVG is refused.
- The fcm `test-set-token` and `test-get-token` routes are deleted. [fcm.routes.js](../Backend/src/core/notifications/fcm.routes.js) now has only `/check`, plus `/save`, `/mobile/save`, `/remove` and `/test`, all behind a login.
- `/v1/food/payments` has a role per route group, and `/admin/*` is super admin only ([payment.routes.js:26-41](../Backend/src/core/payments/payment.routes.js#L26-L41)). Ownership checks were added afterwards; see §2.
- Two upload gaps that the original item didn't cover are listed as M4 and M5.
- Tests: [access-control.test.js](../Backend/test/access-control.test.js) (71 tests) and [uploads.test.js](../Backend/test/uploads.test.js) (10 tests).

### P0-3 Franchise isolation: FIXED
- Shared helper [franchiseScope.js:25-90](../Backend/src/modules/food/shared/franchiseScope.js#L25-L90): the scope comes only from the token. A super admin sees everything, a franchise admin only their own franchise, and any other role gets 403. Records outside the caller's scope return 404.
- [admin.routes.js:50-54](../Backend/src/modules/food/admin/routes/admin.routes.js#L50-L54) holds the franchise-scoped routes: own franchise, read-only geography, stores, orders, customers and staff. From [admin.routes.js:87](../Backend/src/modules/food/admin/routes/admin.routes.js#L87) on, everything is super admin only.
- [routes/index.js:168-190](../Backend/src/routes/index.js#L168-L190): bulk orders, queues and app config are super admin only.
- The scope is applied in [order.service.js:644](../Backend/src/modules/food/orders/services/order.service.js#L644) and [order.service.js:1549](../Backend/src/modules/food/orders/services/order.service.js#L1549), in the admin store and customer services, and in the store, store-manager and store-approval controllers.
- Tests: [franchise-isolation.test.js](../Backend/test/franchise-isolation.test.js) (35 tests). A franchise A admin cannot see or change franchise B's stores, orders, customers, managers or approvals.

### P0-4 Mass assignment: FIXED
- [store.controller.js:34-37](../Backend/src/modules/food/franchise/controllers/store.controller.js#L34-L37), [storeManager.controller.js:204-207](../Backend/src/modules/food/franchise/controllers/storeManager.controller.js#L204-L207) and [franchise.controller.js:352-355](../Backend/src/modules/food/admin/controllers/franchise.controller.js#L352-L355) whitelist the fields each form can update.
- `createStore` takes `franchiseId` from the token and refuses a caller with no franchise ([store.controller.js:46-50](../Backend/src/modules/food/franchise/controllers/store.controller.js#L46-L50)).
- Leftover (low): `createStoreManager` still spreads the request body into the new record ([storeManager.controller.js:22](../Backend/src/modules/food/franchise/controllers/storeManager.controller.js#L22) and [line 114](../Backend/src/modules/food/franchise/controllers/storeManager.controller.js#L114)). `userId` is overwritten and `storeId` is scope-checked, but `storeName`, the `role` label, `reportingManager` and `lastLoginAt` can still be set on create (L8).
- Tests: [field-whitelist.test.js](../Backend/test/field-whitelist.test.js) (8 tests).

### P0-5 Passwords: FIXED
- **Hashing:** [user.model.js:100-107](../Backend/src/core/users/models/user.model.js#L100-L107) hashes plaintext on save and never double-hashes. [user.model.js:17](../Backend/src/core/users/models/user.model.js#L17) restores `email`, which Mongoose had been silently dropping.
- **Password rules:** [utils/password.js](../Backend/src/utils/password.js) sets an 8-72 character rule and generates random temporary passwords. These are used in [franchise.controller.js:60](../Backend/src/modules/food/admin/controllers/franchise.controller.js#L60), the staff, kitchen-staff and store-manager creation paths, and the change-password and reset DTOs.
- **Default password:** `12345678` appears nowhere in `Backend/src`.
- **Forgot-password:** it now works on `User` admin accounts ([auth.service.js:922](../Backend/src/core/auth/auth.service.js#L922)). A reset revokes every session ([auth.service.js:1010](../Backend/src/core/auth/auth.service.js#L1010)).
- **Staff controller:** `staff.controller` now creates `User`, `Profile` and `UserRole` together ([staff.controller.js:151-170](../Backend/src/modules/food/admin/controllers/staff.controller.js#L151-L170)), so staff accounts can log in.
- **Tests:** [credentials-and-sessions.test.js](../Backend/test/credentials-and-sessions.test.js) (23 tests).

### P0-6 Config and secrets: PARTIAL

| Part | Status | Evidence |
|---|---|---|
| Atlas creds removed from git history | Done | 0 credential URIs in `git log --all -p`, 0 in the working tree |
| Atlas password rotated | Done, but see the open rows | Old password rejected (checked 2026-10-26) |
| CORS allow-list | Code done | [app.js:47-58](../Backend/src/app.js#L47-L58) uses `FRONTEND_URL`; dev also allows localhost and LAN |
| 15-minute access tokens | Code default done | [env.js:29](../Backend/src/config/env.js#L29) |
| Refresh rotation that re-reads role and scope | Done | [auth.service.js:1032-1112](../Backend/src/core/auth/auth.service.js#L1032-L1112), unique `jti` at [token.util.js:15](../Backend/src/core/auth/token.util.js#L15) |
| Default OTP off in production | Done | [env.js:41](../Backend/src/config/env.js#L41) |
| Phone required on order history | Done | [order.controller.js:414](../Backend/src/modules/food/orders/controllers/order.controller.js#L414) |
| **Server `.env`** | **Not done** | As pasted from the server: `JWT_ACCESS_EXPIRES=7d`, which overrides the new 15-minute default, and `FRONTEND_URL=http://localhost:5173`, which would make CORS block the real site |
| **Secret strength and exposure** | **Not done** | The new Atlas password follows a guessable pattern. Both JWT secrets are keyboard-mash (7 and 10 distinct characters, not random). All three were pasted into a chat transcript. Rotate them with random values. |
| Socket CORS fallback | Open (low) | [env.js:88](../Backend/src/config/env.js#L88) falls back to `'*'` when `FRONTEND_URL` is empty |
| **Deployment** | **Not done** | Nothing above is live (see the summary) |

---

## 2. Security problems found in this pass

Severity: **C** critical · **H** high · **M** medium · **L** low.

### Introduced by the recent commits

| # | Sev | Problem | Where |
|---|---|---|---|
| N1 | **H** | **Limited-time offer bypass.** The minimum cart value is checked against `cartTotal` sent by the client. The claim endpoint is public. The token isn't bound to a user or an order, so it can be reused on several order lines and several orders until it expires. | [cartConfig.controller.js:356-358](../Backend/src/modules/food/settings/controllers/cartConfig.controller.js#L356-L358), [order-offer.service.js:5-14](../Backend/src/modules/food/orders/services/order-offer.service.js#L5-L14), public route [settings.routes.js:111](../Backend/src/modules/food/settings/routes/settings.routes.js#L111) (commit `c250c9d`) |
| N2 | L | Offer tokens are signed with the JWT access-token secret, so one key does two jobs. The audience check prevents swapping today, but a separate secret is safer. | [cartConfig.controller.js:362-366](../Backend/src/modules/food/settings/controllers/cartConfig.controller.js#L362-L366), [line 384](../Backend/src/modules/food/settings/controllers/cartConfig.controller.js#L384) |
| N3 | L | A kitchen-task "proof image" accepts any https URL. It is shown to supervisors as an image, so it can act as a tracking pixel or reveal their IP. | [kitchenTasks.service.js:223](../Backend/src/modules/food/store/services/kitchenTasks.service.js#L223) |
| N4 | L | `isSuperAdmin` treats a literal role `ADMIN` as super admin, while `requireRoles('ADMIN')` means super admin or franchise admin. No login issues `ADMIN` today, but the two meanings could drift. | [franchiseScope.js:17](../Backend/src/modules/food/shared/franchiseScope.js#L17) |
| N5 | L | The previous refresh token stays valid for 30 seconds after rotation, and there is no reuse detection to revoke the session family. | [auth.service.js:1032](../Backend/src/core/auth/auth.service.js#L1032), [line 1107](../Backend/src/core/auth/auth.service.js#L1107) |
| N6 | Info | The test suite runs against the production Atlas cluster, in throwaway `pvp_test_*` databases, and deletes stale `pvp_test_*` databases it finds. Use a separate test cluster. | [test/helpers/fixture.js](../Backend/test/helpers/fixture.js) |

### Pre-existing, missed by audit 1

| # | Sev | Problem | Where |
|---|---|---|---|
| C1 | **C** | **Customers choose their own price.** The subtotal is built from `item.price` sent by the client, `pricing.total` is taken from the request body, and the Razorpay amount is computed from that total. Item prices are never re-read from the product catalogue. Since `935cca5`. | [order-pricing.service.js:16-19](../Backend/src/modules/food/orders/services/order-pricing.service.js#L16-L19), [order.service.js:183-196](../Backend/src/modules/food/orders/services/order.service.js#L183-L196), [order.service.js:302](../Backend/src/modules/food/orders/services/order.service.js#L302), validator accepts it at [order.validator.js:10](../Backend/src/modules/food/orders/validators/order.validator.js#L10) and [line 45](../Backend/src/modules/food/orders/validators/order.validator.js#L45) |
| H2 | H | Live rider location leaks: any customer or delivery-partner socket can `join-tracking` for any order ID and receive that order's live location. | [socket.js:176-181](../Backend/src/config/socket.js#L176-L181) |
| H3 | H | Location spoofing: any delivery partner can push `update-location` for any order, and into any user or store room named in the payload. | [socket.js:189](../Backend/src/config/socket.js#L189), [lines 233-241](../Backend/src/config/socket.js#L233-L241) |
| M4 | M | Public `POST /v1/food/delivery/register` uses the shared upload middleware, which has no size or type limits. That allows unauthenticated uploads to Cloudinary and can exhaust server memory. | [middleware/upload.js:5](../Backend/src/middleware/upload.js#L5), [delivery.routes.js:11](../Backend/src/modules/food/delivery/routes/delivery.routes.js#L11), [line 19](../Backend/src/modules/food/delivery/routes/delivery.routes.js#L19) |
| M5 | M | `/v1/uploads/*` lets the caller choose the Cloudinary folder, so any logged-in customer can write into admin folders such as store-approval documents. | [upload.routes.js:92](../Backend/src/modules/uploads/routes/upload.routes.js#L92), [131](../Backend/src/modules/uploads/routes/upload.routes.js#L131), [171](../Backend/src/modules/uploads/routes/upload.routes.js#L171) |
| M6 | M | OTPs are 4 digits (9,000 combinations), with 5 attempts per code. | [otp.service.js:9](../Backend/src/core/otp/otp.service.js#L9) |
| L7 | L | Backup files containing old, insecure versions of auth and route code are tracked in git: `auth.service.js.orig/.patch/.rej`, `admin.routes.js.bak`, `routes/index.js.bak`, and 5 `.bak` files in the frontend super-admin folder. | `git ls-files \| grep -E '\.(orig\|rej\|patch\|bak)$'` |
| L8 | L | `createStoreManager` body spread (see P0-4). | [storeManager.controller.js:22](../Backend/src/modules/food/franchise/controllers/storeManager.controller.js#L22) |

Checked and found clean in this pass: delivery-partner order lookups are scoped to the assigned partner ([order.service.js:658](../Backend/src/modules/food/orders/services/order.service.js#L658)), and order payments and wallets have ownership checks ([payment.controller.js](../Backend/src/core/payments/payment.controller.js), commit `a44d500`).

---

## 3. Frontend vs backend endpoint gaps (recount)

Same method as audit 1: every static API call in `Frontend/src` was matched against the routes the Express app actually registers (576 routes now, 578 before). Counts are unique method+path per panel. Dynamic URLs built at runtime are not counted.

| Panel | Exists | Mismatched | Missing (now) | Missing (audit 1) |
|---|---|---|---|---|
| Super admin pages | 107 | 0 (2 stub, 1 external) | **0** | 100 (analytics and finance pages removed) |
| Shared admin service (`adminApiModule.js`) | 121 | 0 | **86**, of which **46 are still called by a screen** | 86 |
| Franchise admin pages | 4 | 0 | **0** | 59 (reports and marketing removed, `/stores/dropdown` added) |
| Store manager (pages + tasks + profile) | 27 | 0 | **129** | 163 |
| User app (pages + user services) | 86 | 4 | **9** | 9 |
| Delivery (DeliveryV2) | 36 | 0 | **1** (`/food/zones/nearby`) | 1 |
| Legacy restaurant/dining service | 1 | 0 | **48**, of which **2 are still called** | 60 (in "svc:store") |

Raw call sites: 827 (1,028 before) — 522 exist, 289 missing, 1 captured by a wrong route, 7 stub, 8 external.

**Still called and missing, by area**
- **Franchise admin, through `adminAPI` (46 endpoints):**
  - store performance (17)
  - operating hours and store hours (12)
  - admin dashboard (7)
  - store pricing (6)
  - `/inventory`, `/orders`, `/reviews` and `/users` for the store detail view (4)
- **Store manager (129 endpoints):**
  - `/store/dashboard/*` (18)
  - inventory: waste, shortages, stock requests, alerts, recipes and ingredients (about 30)
  - kitchen station screens: preparation board, pizza, baking, packaging, ovens, order items and delayed orders (about 25)
  - delivery and riders (10)
  - attendance and shifts (12)
  - complaints, reviews and customers (8)
  - `/profile/*` (6 still called)
  - My Tasks modals: `/inventory/request` and `/quality-check`
- **Fixed since audit 1:**
  - My Tasks (10 of 12 calls)
  - `/stores/dropdown`, `/stores/list` and the approval documents `GET`
  - the kitchen hooks' staff lists and order-stage calls
  - the `PUT /orders/:id` and store-approval documents method mismatches

---

## 4. What to do next, by priority

1. **C1:** price orders on the server from the product, variant and add-on catalogue, and ignore client `price` and `pricing`. Then fix N1: re-check the offer's minimum against the server subtotal, bind the token to the user, and allow one use per order.
2. **Deploy, carefully:**
   - Rotate the Atlas password and both JWT secrets to random values.
   - On the server, set `FRONTEND_URL` to the real site and remove `JWT_ACCESS_EXPIRES=7d`.
   - Then push `security-fixes` and deploy.
3. **Sockets:** fix H2 and H3. Check order ownership or assignment on `join-tracking` and `update-location`, and stop trusting `data.userId` and `data.storeId`.
4. **Uploads:** fix M4 and M5. Use a size- and type-limited upload middleware everywhere, and choose the Cloudinary folder on the server.
5. **Low items:** M6 (6-digit OTPs), then L7 and L8 and N2 to N5.
