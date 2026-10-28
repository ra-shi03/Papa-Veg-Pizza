# Audit 3: final security review of Features 1-6

Branch `p1-features`. Scope: every route added in Features 1-6 (staff and kitchen, inventory, customers and
complaints, dashboards, store performance / hours / pricing, store delivery, sockets), plus the auth change for
delivery partners, the order-event watcher, uploads, and the customer-app endpoints added for the legacy calls.

How it was checked:

- **Route sweep.** `test/helpers/routes.js` walks the Express router stack (740 routes) and reads the guards in
  front of each one (`authMiddleware`, `requireRoles(...)`, `requireSuperAdmin`, `attachFranchiseScope`).
  `test/audit3.test.js` fails when a route has no `authMiddleware` or no role guard unless it is in
  `test/fixtures/reviewed-routes.json` (122 public routes after the M1 fix, and 17 sign-in-only routes, each reviewed below).
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

## Medium, fixed in the follow-up (exploitable signed out or with a customer token)

| # | Finding | Fix | Tests |
|---|---------|-----|-------|
| M1 | **Unauthenticated catalogue admin lists.** `GET /v1/food/admin/products` returned Draft and Archived products to anyone; `/admin/addons/stats(/public)`, `/admin/category-products`, `/admin/category-products/categories` and `/admin/categories` were open too. Query values reached Mongo filters as given (operator objects; user text used as a regex, so `?search=(a+)+$` or `[` could hang or 500 the request). | The open duplicates in `routes/index.js` are removed: these GETs now reach the admin router (`authMiddleware` + `requireRoles(ADMIN)`, and its own `requireSuperAdmin` for stats, add-ons and combos, unchanged). The `/public` menu routes stay public. New `middleware/sanitizeQuery.js` on the product, category, combo, add-on, menu and staff paths: any key starting with `$` or containing `.` (checked on the raw query string, at any depth) and any non-scalar value (`a[b]=`, repeated keys) is 400; everything else is passed on as a string. `escapeRegex` (`utils/helpers.js`) in the product, category, combo, add-on and staff list handlers. The customer app's own reads of `/food/admin/categories` and `/food/admin/category-products` fall back to the public twin in `services/api/axios.js` (no screen changed). | `audit3-mediums.test.js`: 10 admin lists: signed out 401, customer / manager / rider 403, super admin 200, franchise admin as the admin router allows; 10 public menu routes 200 signed out and never show a Draft; `?price[$gt]=0`, `?name[$ne]=x`, `?$where=1`, `?a.b=1`, nested and repeated keys: 400 on admin, public and staff lists; regex characters: 200 and matched literally |
| M2 | **Public order lookup could be guessed.** Order ids are `FOD-` + 7 digits; with a known mobile number the orders (name, address, rider) could be enumerated at the global rate limit. | `publicOrderLookupLimiters` (`middleware/rateLimit.js`) on `/orders/track` and `/orders/history` (all aliases, GET and POST): failed lookups limited to 30 per IP, 5 per order id and 10 per mobile number per 15 minutes; successful lookups do not count. Side effect, accepted: 5 wrong numbers lock that order's public lookup for 15 minutes (the signed-in app is unaffected). | `audit3-mediums.test.js`: successful lookups unlimited; 6th try for one order is 429 even with the right number (also via the other route and spelling); 11th for one number is 429; one caller stopped by the 31st miss |
| M3 (customer part) | **Customer profile image took any file** (bare `upload`, 50 MB, no type check). | `/v1/food/user/profile/profile-image` uses `safeUpload('image')`: JPEG/PNG/WebP/GIF/HEIC, 5 MB, signature checked. | `audit3-mediums.test.js`: HTML, SVG named `.png` and PDF -> 400; 6 MB -> 413 |

M6 is partly closed by the same middleware (operator injection and unescaped regex in the staff list); the rest of M6 stays below.

## Medium (not fixed)

All of these need a staff, admin or rider sign-in, or are not exploitable.

| # | Finding | Where | Suggestion |
|---|---------|-------|-----------|
| M3 (rest) | Uploads on the remaining `upload.*` routes have limits but no MIME or file-signature check (store documents accept anything; `.pdf` by file name is stored as a PDF). All need an admin or franchise-admin sign-in. | store approvals, store managers, admin, settings, dynamic-home routes | Move those routes to `safeUpload`. |
| M4 | With the Redis adapter and several server instances, every instance runs the order change stream and emits, so a screen gets each `order_event` once per instance. | `order-events.service.js` | Run the watcher on one instance (env flag) or dedupe with an event id. |
| M5 | Socket rooms are fixed at connect from the token. A manager who is removed or moved keeps receiving their old store's events until the socket reconnects or the access token expires. | `socket.js` | Disconnect a user's sockets when the account is deactivated or re-scoped. |
| M6 (rest) | Staff module (store manager only): `PATCH .../status` accepts `Inactive` but the model rejects it (500). Non-string `email` / `role` bodies give 500. (The list's regex and operator injection are fixed, see above.) | `kitchenStaff.controller.js` | zod validator for the staff module. |
| M7 | `DELETE /food/store/staff/:id` is a hard delete (user, profile, role link, staff record) although documented as a soft delete; orders keep the staff name only as text. | `kitchenStaff.controller.js` | Soft delete (`status: DELETED`, `isActive: false`). |
| M8 | The assigned rider receives the customer's email with the order (`getOrderById` populates `email`). Riders do not need it. | `order.service.js getOrderById` | Remove `email` from the rider view. |
| M9 | Public `GET /v1/food/offers/public` lists coupon codes to anyone, including first-time-only codes. By design for the coupons page, but it exposes codes to non-customers. Re-checked in the follow-up: not exploitable, because checkout enforces `first-time` for the signed-in customer (`order-pricing.service.js`) and orders need a sign-in, so knowing a code gives nothing. | `storePublic.controller.js` | Require sign-in, or hide `customerScope: first-time` codes from signed-out callers. |

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

## Mock fallbacks that hide errors

Found by scanning every `catch` in the store manager panel (`Frontend/src/modules/Food/pages/store-manager/`, 226 of them) and the service modules its
screens call (`profileApi.js`, `myTasksService.js`). The risk: a `catch` that answers a failed request with sample data or a success toast, so a refused or
lost action looks like it worked. With a backend, the answer must be the server's. The only switch for local mock data is `VITE_STANDALONE_MOCK=true`
(`services/api/mockPolicy.js`, the same rule the inventory and kitchen hooks already follow).

Three patterns turned up:

- **A. Swallows everything.** Any error, including a 403 / 404 / 409, is replaced by local data or a fake success.
- **B. Rethrows only when the server answered.** `if (err?.response) throw err` is right for a 4xx, but a network failure still shows sample data or a fake success.
- **C. Never calls the server.** The hook only reads and writes `localStorage` (after a fake delay) and reports success.

### Fixed (every hook that writes: create, update, delete, mark, resolve, reply, refund, assign)

Each now stops at the real error unless `VITE_STANDALONE_MOCK=true`, and the toast shows the server's own message (the 403 / 409 text), not a fixed "Failed to ...".

| File | Hooks | Was |
|---|---|---|
| `staffManagement/hooks/useAttendance.js` | `useMarkAttendance`, `useBulkMarkAttendance`, `useUpdateAttendance`, `useDeleteAttendance` (+ list and details reads) | A: a refused mark / edit / delete saved a fake record and showed a success toast |
| `staffManagement/hooks/useShifts.js` | `useCreateShift`, `useUpdateShift`, `useDeleteShift`, `useAssignStaffToShift` (+ list and details reads) | A: same |
| `staffManagement/hooks/useStaff.js` | `useDeleteStaff`, `useCreateStaff` | A for delete (any error deleted the person locally and said "deleted"); B for create (network failure registered a fake person) |
| `customers/hooks/useComplaints.js`, `useCustomerOrders.js`, `useReviews.js` | `useResolveComplaint`, `useCreateRefund`, `useReplyToReview` | B: network failure resolved / refunded / replied in `localStorage` |
| `deliveryOperations/hooks/useAssignRider.js` | `useAssignRider` | A: any error "assigned" the rider locally ("Simulated") |
| `services/api/myTasksService.js` | `startTask`, `completeTask`, `reportDelay`, `requestIngredient`, `requestReassignment`, `reassignTask`, `submitQualityCheck`, `markNotificationRead` | B: a kitchen worker's "Start" or "Complete" could succeed only in their own browser |
| `services/api/profileApi.js` | `updatePersonalInfo`, `updateNotifications`, `deleteSession`, `logoutOtherSessions`, `logoutAllSessions` | A: a failed profile save returned `success: true` |

Also in `BulkAttendanceModal.jsx`: the roster listed nobody (the request asked the server for `status=active`, which matches nothing because the value is `Active`, and the shift list was hard-coded to names instead of the real shift ids). It now reads all staff, compares status case-insensitively, and uses the real shift ids and each shift's `assignedStaff`.

Already correct (no change): all inventory hooks (`failOrMock`), all six kitchen operations hooks (`STANDALONE_MOCK`), `orders/hooks/useActiveOrders.js` and `useIncomingOrders.js` (no fallback), and the delivery issue, rider, tracking and live-delivery hooks (no fallback).

### Listed, not fixed: reads (a failed or empty read shows sample data)

| Where | Pattern | What the person sees |
|---|---|---|
| `deliveryOperations/hooks/useReadyOrders.js`, `useAvailableRiders.js` | A, and **also an empty answer** | A store with no ready orders or no riders is shown the seeded sample orders and riders. This is the worst of the list: it needs no error at all. |
| `dashboard/components/*` (KpiCards x8, StaffOverview, LiveOrderBoard, OrderStatusDonut, SalesAnalytics, TopSellingProducts, KitchenPerformance, DeliveryOverview, InventoryAlerts, ActivityTimeline, CustomerComplaints) and `StoreOperationsDashboard.jsx` | B | When the server cannot be reached, the dashboard shows sample figures (for example 12 staff on duty) instead of an error. |
| `customers/hooks/useComplaints.js`, `useCustomerOrders.js`, `useReviews.js` (lists, `useComplaintDetails`, `useCustomerProfile`, `useOrderDetails`, `useReviewDetails`) | B | Sample customers, complaints and reviews when the server is unreachable. |
| `staffManagement/hooks/usePerformance.js` (list and details) | A | Sample performance for any error (the screen is deferred). |
| `staffManagement/hooks/useStaff.js` `useStaffDetails` | A | Calls `getLocalStaff`, which does not exist in that file: a real error turns into a `ReferenceError`. |
| `services/api/profileApi.js` (`getProfile`, `getPermissions`, `getPerformance`, `getAttendance`, `getActivityLogs`) and `profile/Profile.jsx` | A | If the server fails, the profile page shows a made-up person ("Siddharth Verma") and sample attendance. |
| `services/api/myTasksService.js` (`getMyTasks`, `getMyTaskStats`, `getTeamTasks`, `getNotifications`) | B | Sample tasks when the server is unreachable. |

### Listed, not fixed: writes that never call the server (pattern C)

These cannot be fixed by rethrowing, because there is no request to fail. They need endpoints and a repoint. They show a success toast and change only the browser's `localStorage`.

| File | Hooks | Notes |
|---|---|---|
| `orders/hooks/useReadyOrders.js` | `useAssignRider`, `useConfirmPickup`, `useEscalateOrder` | Used by Ready Orders. The real rider assignment is `/store/delivery/assign`, used by `deliveryOperations/AssignRider.jsx`; the Ready Orders screen should be pointed at it. |
| `orders/hooks/useCancelledOrders.js` | `useInitiateRefund`, `useReopenOrder` | The store refund request exists server-side (`POST /store/orders/:id/refund`, a pending record only), used by `useCreateRefund`. |
| `orders/hooks/useCompletedOrders.js` | `useReorderOrder` | No endpoint yet. |

(`useExportCompletedOrders` also makes no request, but it only exports data already on the screen.)
