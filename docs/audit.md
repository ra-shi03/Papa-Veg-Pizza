# Papa Veg Pizza – Backend / Frontend Audit

I didn't change any code. The audit found several problems you should fix before building more features. The worst: the backend accepts the literal token `Bearer mock_token` as a super admin in every environment, including production. Your MongoDB Atlas password is also in the GitHub history.

**How I checked:** I loaded the Express app and listed all 578 routes it actually serves. Then I pulled every API call in `Frontend/src` (1,028 call sites), matched them by method and path, and read the controllers that matter for security. The full per-call table is in [api_audit_calls.tsv](api_audit_calls.tsv) (columns: file, line, client, method, path, status).

**Missing endpoints are hidden in dev.** In `services/api/axios.js`, any 404 or network error in dev silently falls back to `mockService.js`. Most "working" admin screens are showing mock data, and they will break in production.

## 1–2. Frontend calls vs backend (counted by unique method + path)

| Panel | Exists and matches | Exists but mismatched | Missing |
|---|---|---|---|
| Super admin (pages) | 107 | 2 (calls go to a stub and never reach the server) | 100 |
| Shared admin service (`adminApiModule.js`, used by super admin and franchise admin) | 120 | 1 | 86 |
| Franchise admin (pages) | 4 | 1 | 59 |
| Store manager (pages + tasks + profile services) | 18 | 1 | 163 |
| User (pages + user services) | 86 | 4 | 9 |
| Delivery (DeliveryV2, via `deliveryApiModule.js`) | 36 | 0 | 1 (`/food/zones/nearby`) |

**What exists:**
- **Super admin:** products, combos, add-ons, categories, franchises, regions/zones/territories, bulk orders, app config, home page, coupons, showcase, search config, FAQs, cart config.
- **Franchise admin:** stores, store managers, store approvals, `/food/franchise/orders`.
- **Store manager:** the new `/food/store/orders/*` and `/food/store/staff/*`.
- **User:** auth, menu, cart, orders, addresses, wallet, rewards, support.
- **Delivery:** almost everything.

**What's missing (grouped):**
- **Super admin:** `/analytics/*` (65 endpoints) and `/finance/*` (29).
- **Franchise admin:**
  - `/reports/{sales,orders,staff,inventory}` (31)
  - campaigns, banners, notifications, coupons (14)
  - `/admin/dashboard/*` (7)
  - `/store-performance/*` (17)
  - `/operating-hours/*` (9)
  - `/store-pricing`, `/price-history`, `/bulk-price-update`, `/copy-pricing` (7)
- **Store manager:**
  - `/store/dashboard/*` (18)
  - inventory: alerts, stock requests, waste, shortages, recipes (~30)
  - kitchen stations: baking, pizza station, packaging, order items, ovens (~20)
  - `/store/{attendance,shifts}` (12)
  - `/store/delivery/*` and riders (10)
  - complaints and reviews (7)
  - `/tasks/*` (12)
  - `/profile/*` (8)
  - reports (20)
- **Legacy template code:** about 60 `/food/restaurant/*` and `/food/dining/*` endpoints in `restaurantApiModule.js`. Six user files still call `restaurantAPI` for `getRestaurants`, `getRestaurantById`, `getMenuByRestaurantId`, `getPublicOffers` and `saveFcmToken`, including the order tracking and order details pages.

**Exists but mismatched:**
- `GET /stores/dropdown` and `/stores/list` are caught by `/stores/:id` and return 404.
- `GET /store-approvals/:id/documents` doesn't exist on the backend, which only has a POST upload for that path.
- `PUT /orders/:id` in `useKitchenQueue.js` has no matching route.
- The kitchen-ops hooks call `/store/staff` and `/staff?role=`. The real data is at `/food/store/orders/team`.
- Three user calls (hero banners, landing settings) go through the `api` stub in `core.js` and are never sent.
- `/food/admin/profile/work` is meant for store managers, but its route only lets super admins and franchise admins through.
- Staff created through `/food/admin/staff` go into the `food_admins` collection, but login reads `users`, so those accounts can never log in.
- `GET /v1/stores`, `/v1/store-managers` and `/food/admin/orders` return data for every franchise. The franchise panel expects only its own.

## 3. Critical security issues

1. **Anyone can log in as super admin** ([auth.middleware.js:44-64](../Backend/src/core/auth/auth.middleware.js#L44-L64)). The tokens `mock_token` or `dummy_access_token` are accepted as super admin, and so is any `mockHeader.<base64 json>.x` token with any role and franchise/store you put in it. None of this checks `NODE_ENV`. In dev, unsigned tokens claiming super admin are also accepted through `jwt.decode`.
2. **Routes with no auth at all:**
   - `/v1/store-managers/*`: anyone can create or delete login accounts. If no password is given, the default is `12345678`.
   - `/v1/stores` GET/PATCH/PUT/DELETE: anyone can hard-delete or edit any store.
   - `/v1/uploads/*`: open writes to your Cloudinary, with no file-size limit and in-memory storage.
   - `/fcm-tokens/test-set-token/:phone/:token`: anyone can redirect any user's push notifications. `test-get-token` leaks their tokens.
3. **Logged in, but no role check:**
   - `/v1/store-approvals/*`: a customer token can approve stores, which also creates a manager account with password `12345678`.
   - `/v1/food/payments/*`: any customer can view the admin wallet and finance summary, create and process settlements, and read any order's payments.
4. **Data leaks across franchises (IDOR):**
   - Everything under `/v1/food/admin` lets franchise admins in, and `admin.controller.js` never filters by `franchiseId`. A franchise admin can create or delete franchises, edit fee and business settings, see every customer and order, and approve stores in any franchise.
   - The store-approval approve/reject/verify actions have no scope check.
   - Store orders and kitchen staff are scoped correctly.
5. **Mass assignment:**
   - `updateStore` copies `{...req.body}`, so a caller can set `franchiseId` or `approvalStatus` and skip approval (and this route has no auth).
   - `updateStoreManager` can set `userId` or `storeId` and re-point the user's role to another franchise.
   - `updateFranchise` takes any field except `ownerUserId`/`createdBy`.
6. **Passwords:**
   - The `User` pre-save hook does nothing, so `createFranchise` and `updateFranchise` save franchise-admin passwords **in plaintext**. Those admins probably can't log in either, because bcrypt compare fails against plaintext. Check this against the DB.
   - Forgot-password resets `FoodAdmin`, not `users`, so it does nothing for real accounts.
   - The default password is `12345678`, and the minimum length is 6.
7. **JWT and OTP:**
   - Access tokens last 7 days.
   - Refresh doesn't issue a new refresh token and copies the old role and scope, so a reassigned user keeps their old access for up to 30 days.
   - `USE_DEFAULT_OTP=true`, and the OTP is returned in the API response when not in production.
8. **CORS:** `app.use(cors())` allows every origin. `FRONTEND_URL` is set in `.env` but never used.
9. **Secrets in git:** `.env` isn't tracked, but deleted scripts in the history of `origin/main` on GitHub contain the MongoDB Atlas username and password (commits from 2026-09-17 to 10-01). Change that password now. Cleaning the history alone isn't enough. Untracked `Backend/script/*.js` files also hold credentials locally.
10. **Customer data leak:** `POST /v1/orders/history` returns the customer's name, phone and email, plus the rider's phone, to anyone who has the order ID. The phone number is optional.

## 4. Build list, in priority order

### P0 – security fixes (do first)

| # | Module | Work | Size |
|---|---|---|---|
| 1 | auth | Remove the mock-token and `jwt.decode` fallbacks and the "missing user is fine in dev" branch | S |
| 2 | franchise / uploads / fcm / payments | Add `authMiddleware` and role checks to `/v1/stores`, `/v1/store-managers`, `/v1/store-approvals`, `/v1/uploads`; delete the fcm test routes; role-gate `/v1/food/payments` | S |
| 3 | admin | Split `/v1/food/admin` into super-admin-only and franchise-scoped routes, with a shared franchise-scope helper | L |
| 4 | franchise / admin | Field whitelists for `updateStore`, `updateStoreManager`, `updateFranchise`; derive `franchiseId` from the token, never the request body | S |
| 5 | auth / users | Hash passwords in `createFranchise`/`updateFranchise`; point forgot-password at `User`; drop `12345678`; move `staff.controller` onto `User` + `UserRole` | M |
| 6 | config | Change the Atlas password and clean history; CORS allow-list from `FRONTEND_URL`; 15-minute access tokens with refresh rotation; `USE_DEFAULT_OTP` off; require phone on the public order history route | S |

### P1 – v1 features (the PENDING list in CLAUDE.md)

| Module | Work | Size |
|---|---|---|
| Staff | Scope `/v1/store-managers` to the franchise; point the kitchen-ops hooks at `/food/store/orders/team` | S |
| Kitchen ops / tasks | `/tasks/*` (12) for kitchen supervisor and staff, built on `kitchenTask.model` and the store-orders stage flow; station endpoints (baking, pizza station, packaging, order item, delayed orders, kitchen issues) | L |
| Store profile | `/profile/*` (8); some can reuse `/auth/me` | M |
| Inventory | Ingredients, stock, stock requests, waste, alerts, shortages, recipes, transfers (~35, no models yet) | L |
| Customers | `/store/customers/*`; franchise-scoped `/food/admin/customers` | M |
| Menu / pricing | `/store-pricing`, `/price-history`, bulk price and copy pricing (`storeFoodPrice.model` exists) | M |
| Complaints | `/store/complaints/*` and resolve; scope the existing admin complaints | M |
| Dashboards | `/store/dashboard/*` (18) and `/admin/dashboard/*` (7) | L |
| Store performance / hours | `/store-performance/*` (17) is L; `/operating-hours/*` and `/stores/:id/hours` are M | L + M |
| Delivery / orders | `/store/delivery/*` and riders, tracking, store refund, `/food/zones/nearby`; check the delivery order-by-id scope | M |
| Sockets | Push order events to store and franchise rooms (the screens poll every 8 seconds today) | M |
| Mismatches | `/stores/dropdown` and `/stores/list`, the store-approval documents GET, `PUT /orders/:id`, the `profile/work` role gate | S |
| User legacy calls | Re-map the `restaurantAPI` calls in the service module only, so no user UI changes | S–M |

### Deferred (per CLAUDE.md)

- super admin analytics (65) and finance (29)
- franchise reports (31) and marketing (14)
- store reports (20)
- rewards
- legacy dining/restaurant endpoints (remove them rather than build them)
