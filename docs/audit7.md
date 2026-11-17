# Audit 7: complete vs remaining

> **Update, after the customer-app finish.** Decisions from the project owner, applied in the commit
> "feat(customer): finish customer app (order chat, banner, cleanup, cross-role fixes)". The sections below describe the
> state at `f9536b5`; this box records what changed since.
>
> | Item | Result |
> |---|---|
> | Screens removed (files deleted, routes and menu links gone) | `Favorites`, `Collections`, `CollectionDetail`, `Feedback`, `AddPayment`, `EditPayment`, and the whole **Gourmet** page. **`Payments.jsx` was kept**: since `6b851bb` it is the live Payment Options page (cash or online) that Cart and Checkout open; its menu entry now reads "Payment Options". The saved-methods state in `ProfileContext` and the `userFavorites`, `userDishFavorites`, `userPaymentMethods` localStorage keys are gone. The heart on Home product cards and the bookmark on the Category page are session-only (not saved) |
> | Product reviews | None exist on the server and the review form in `ProductDetail` was local page state only: removed, along with fake rating, restaurant and order-history sections and a USD to rupee x83 price bug |
> | Order help | Live chat on the complaint thread over the socket (`support_message`), "Report a problem" with pizza-app rules (24 h after delivery, one open report per order, three in all), support phone, email and WhatsApp from business settings. The store manager's Complaints screen got a reply box |
> | Under 250 banner | Super admin form (User App > Hero Banners), validated, public read route reviewed in `reviewed-routes.json`; the page shows the banner or none |
> | Kitchen rejects an item | The bill drops (food, coupon share, GST again); cash orders collect the lower total; a paid order gets a pending refund for the difference |
> | Scheduled orders | No rider search until 45 minutes before the slot (30 prep + 15 rider); a one-minute sweep starts it, so it works without Redis |
> | OTP SMS | Now "Welcome to the Papa Veg Pizza powered by SMSINDIAHUB. Your OTP ...". The registered DLT template must allow this brand name or the operator can reject the SMS |
> | Other | Home paints a skeleton until the server answers (no `pvp_home_config` / `pvp_categories` first paint); Terms shows server text or an error/empty state; Truecaller button removed; train screens say what the code does (no IRCTC); cart rows show a placeholder until the server prices them; public categories list active ones only; Razorpay webhook compare is constant-time |

Audited on 2026-11-16: `main` at `f9536b5` plus the uncommitted working tree (40 modified files, 1 new). No code was changed.
Tests and builds ran on a clean `git archive` export of `f9536b5` in a plain scratch folder, and again on a copy of the
working tree (section 6).

**Deployed commit: unknown.** Audit 6 recorded `b50b89d`. Since then 16 commits were made, `origin/main` is at `2e8643c`, and
the owner does not know what the server runs. Every finding is tagged with where the code lives:

| Tag | Meaning |
|---|---|
| **[HEAD]** | Committed in `f9536b5`. Deployed only if the server was updated after `b50b89d` |
| **[WT]** | Only in the uncommitted working tree. **Not deployed anywhere** |
| **[old]** | Already in `b50b89d` or earlier, so also on the server if it still runs `b50b89d` |

Status words: DONE, PARTIAL, BROKEN, MISSING. Screen classes: REAL, PARTIAL, MOCK, PHASE2 (deferred list).
Paths: `U/` user pages, `S/` store-manager pages, `F/` franchise-admin pages, `A/` super-admin pages (all under
`Frontend/src/modules/Food/pages/`), `D/` `Frontend/src/modules/DeliveryV2/`. Endpoints are shown without `/api/v1`.

---

## 0. Real state

### 0.1 Commits since audit 6 (`c21d730`)

| Commit | Date | What it is |
|---|---|---|
| `89756a7`, `cbdf90d`, `4c1fd73` | 31 Oct | The audit 6 working tree committed (store-manager approval flow, rider panels, shared Maps loader, docs) |
| `f582366` | 31 Oct | Kitchen supervisor sees only orders assigned to them |
| `91d7aa8` | 31 Oct | Customer complaints screen (`U/complaints/MyComplaints.jsx`) |
| `7573e3b` | 31 Oct | Checkout uses the customer's own contact and address |
| `dbf4502` | 31 Oct | Rider offer list and accept scoped; customer details hidden before accept |
| `66a862b`, `c1ad68d` | 2 Nov | Checkout fixes, train orders get city and state |
| `86246c5` | 2 Nov | Business information from super admin settings |
| `779e163`, `f423f67` | 2 Nov | Train delivery by station mapping and picker |
| `6b851bb` | 10 Nov | Cart, coupons (audience, sizes), coupon popup, Payments page |
| `41960d8` | 13 Nov | **Online payment** (payment gateway admin, Razorpay from the DB), store dashboard and CRM widgets real |
| `2e8643c` | 13 Nov | Order flow: `requireOnDuty`, franchise **staff approval**, coupon audience fields |
| `f9536b5` | 14 Nov | Leave requests, attendance rules (staff clock in, manager marks only leave), franchise staff screens |

### 0.2 Uncommitted working tree

41 files: 13 backend, 26 frontend, `CLAUDE.md`, `docs/rider-flow.md`, plus the new
`Backend/src/modules/food/store/services/attendancePresence.js`. They match the changes made in the last Claude session at
your request. Any manual edits you made in these files are included in what was audited.

| Area | Files | What they change |
|---|---|---|
| Kitchen tasks | `store/services/kitchenTasks.service.js`, `kitchenItems.service.js`, `storeOrders.service.js`, `attendancePresence.js`; `S/myTasks/MyTasks.jsx`, `AssignedTasksTable.jsx`, `S/orders/components/AssignStaffModal.jsx` | Only clocked-in people can be assigned (supervisor at accept, staff at assign); supervisor cannot start until all three stations are staffed; per-role task content |
| Store panel data | `storeOrders.service.js` (`enrichOpsOrders`), `S/orders/components/CompletedOrderDetailsModal.jsx`, `ReadyOrders.jsx`, `ConfirmPickupModal.jsx`, `ReadyOrderDetailsModal.jsx`, 5 kitchen modals | Real GST, payment, feedback, coupon, rider in Completed details; rider from the order instead of `localStorage pvp_riders`; hardcoded officer names removed |
| Rider dispatch | `order-dispatch.service.js`, `order-delivery.service.js`, `order.service.js`, `order.model.js`, `storeDelivery.service.js` | `dispatch.manual`: a store-picked rider is not taken back by auto-dispatch, its timeout or the startup watchdog; store Confirm Pickup accepts the rider; push on assignment |
| Proof of delivery | `order-delivery.service.js`, `order.model.js`, `upload.routes.js`; `D/components/modals/DeliveryVerificationModal.jsx`, `PickupActionModal.jsx`, `D/hooks/useOrderManager.js`, `D/pages/DeliveryHomeV2.jsx`, `services/api/orderApiModule.js` | Handover photo required to complete; rider uploads use the rider token (they were 401) |
| Customer app | `U/orders/OrderTracking.jsx`, `Orders.jsx`, `OrderInvoice.jsx`, `components/ui/loading-skeletons.jsx`, `order.validator.js` | Ratings submit and display fixed; one-time payment splash; skeleton; invoice links, invoice data and PDF fixed |
| Clean-up | `services/api/restaurantApiModule.js`, `index.js`, `auth.js`, `homePage.controller.js`, `order.controller.js`, `A/user-app/HomePageConfig.jsx`, `U/orders/Orders.jsx` | Dead restaurant API removed, Dine-In removed |
| Pricing | `order-pricing.service.js`, `order.service.js` | `gstRate` and `couponCode` snapshotted on the order |

### 0.3 CLAUDE.md compared with the code

CLAUDE.md is the source of truth. Neither side was changed.

| # | CLAUDE.md says | The code does | Where |
|---|---|---|---|
| 1 | Order flow `placed → accepted → preparing → ready → out_for_delivery → delivered / cancelled` | `created → confirmed → preparing → ready_for_pickup → (reached_pickup) → picked_up → (reached_drop) → delivered`, cancel is `cancelled_by_user / _store / _admin`. Consistent mapping, different words | `orders/models/order.model.js` |
| 2 | "Store manager creates kitchen supervisor/staff" | The store manager creates them as `Pending Approval` and inactive; **a franchise admin must approve** before they can sign in. Not in CLAUDE.md | `franchise/controllers/staffApproval.controller.js` [HEAD] |
| 3 | Defer finance | **Online payment and a payment gateway admin were built**: Razorpay checkout, gateway CRUD with encrypted secrets, payment logs, automatic refunds on cancel. The super admin `PaymentGateways` screen is real | `settings/services/paymentGateway.service.js`, `U/cart/CheckoutModal.jsx` [HEAD] |
| 4 | Defer marketing | Coupons gained audience (`new`/`old`) and size rules, enforced on the server | `settings/services/couponOffer.service.js` [HEAD] |
| 5 | "Do NOT change user app or delivery app UI" | Changed: coupon popup and Payments page (`6b851bb`) [HEAD]; tracking skeleton, rating auto-open, invoice links and colours, delivery handover-photo step (working tree, done on request) [WT] | listed in 0.2 |
| 6 | DONE: manual rider assignment never undone, Confirm Pickup accepts the rider, handover photo required | **True only in the working tree.** Not committed, not deployed | [WT] |
| 7 | "Enforce role AND scope in the backend, never rely on the UI" | The store's Confirm Pickup screen asks for the rider's OTP, but the server never checks it (`validatePickupDto` accepts only `notes`) | `store/validators/storeDelivery.validator.js:32` [old] |
| 8 | Response format `{ success, message, data }` | Razorpay webhook answers plain text; `requireOnDuty` adds `code` and `error`. Minor | `core/payments/controllers/razorpayWebhook.controller.js`, `middleware/requireOnDuty.js` |
| 9 | PENDING list | Partly out of date: staff management, kitchen tasks, complaints, store dashboards and CRM are now mostly real | sections 2 and 3 |
| 10 | "Kitchen supervisor sees only the store orders the store manager assigned to them" | Matches, including single-order reads (`getStoreOrder`) and priority | `storeOrders.service.js:434`, `:725` [HEAD] |

### 0.4 Earlier docs, item by item (verified in the current code)

**Audit 6 blockers**

| # | Item | Status |
|---|---|---|
| 1 | Developer contact on every order | **FIXED** `7573e3b`: no hardcoded contact, Indore or "abc" in `U/cart/CheckoutModal.jsx` |
| 2 | Rider offers and accept not scoped | **FIXED** `dbf4502`: `order-delivery.service.js:396-413` offers only served stores or `offeredTo`; accept refuses others (`:487-491`); details hidden before accept |
| 3 | Deployed commit lacked the approval flow | **SUPERSEDED**: committed in `89756a7`; deployment unknown |
| 4 | Store panel OFFLINE badge; kitchen staff land on a 403 dashboard | Badge **STILL OPEN** (10 hooks still call `io()` with no token). Landing **FIXED** (`StoreLogin.jsx:75`, `HomeRedirect`); supervisor dashboard now role-aware |
| 5 | Super admin dashboard, All Orders, Order Tracking, Customers hardcoded | **STILL OPEN** |

**Audit 6 new findings (section 10.4)**

| Finding | Status |
|---|---|
| No UI for `reset-drop-otp` | STILL OPEN (no caller in `Frontend/src`) |
| `rejectItems` does not reprice | STILL OPEN (`kitchenOps.service.js:155`) |
| Kitchen roles read any store order | **FIXED** `f582366` (`getStoreOrder` checks supervisor and staff slots) |
| Supervisor changes priority on any order | **FIXED** (`setPriority:728`) |
| Complaint on another customer's order | **FIXED** `91d7aa8` (`supportTicket.controller.js:31` matches `userId`) |
| Customer never sees complaint replies | **FIXED** `91d7aa8` (`MyComplaints.jsx` reads `/food/user/support/my-tickets`) |
| Shared rider pool: global reject, cross-franchise re-activate | STILL OPEN |
| Orphan pending rider | STILL OPEN |
| Fake toasts in franchise staff screen | **SUPERSEDED** `f9536b5`: `F/staffManagement/KitchenStaff.jsx` rewritten on `/staff-approvals/staff` |
| Re-signup deletes history; approve/reject race; join-request regex; `avgApprovalTime` constant | STILL OPEN |

**Audit 6 working-tree review**: H1 and H2 FIXED (committed). Mediums 1 (approved store can move), 2 (Draft store trick in
`storeCrm.service.js` and `storeDashboard.service.js`), 3 (full IDs before claim), 4 (rider details to supervisor),
5 (second login on approve), 6 (approve has no status check, `storeApproval.controller.js:279`), 7 (data check), 8
(join-requests full phone): all STILL OPEN. Lows 1-8: STILL OPEN.

**Audit 6 business settings and train delivery**: FIXED as described there. Still open from that section: SMS text
`Foodelo`, Appzeto image URL in pushes (14 places, e.g. `order.service.js:517`), franchise navbar sample email, the IRCTC
history modal and T&C text, "Another station" only with a default store.

**Audit 5**

| Item | Status |
|---|---|
| Medium 1: scheduled orders dispatch at once | STILL OPEN (no `scheduledAt` check in dispatch or accept) |
| Medium 2: `PUT /settings/delivery-login` no validator | STILL OPEN |
| Medium 3: `GET /settings/delivery-login` writes | STILL OPEN |
| Medium 4: fake coupons on Home and Coupons | **FIXED**: `U/profile/Coupons.jsx:61` reads `/settings/coupons/public`; no WELCOME50 in Home |
| Medium 5: "abc" street | **FIXED** `7573e3b` |
| Lows 1-5 | STILL OPEN (not re-checked individually; no change in those files) |

**Audit 4 batches**

| Batch | Status |
|---|---|
| 1 Rider order integrity | FIXED (`rider-flow.test.js`) |
| 2 No invented live data | FIXED except 4 store files listed in 2.8 |
| 3 Customer price | FIXED for quote = charge. Menu location key still open |
| 4 User app missing endpoints | STILL OPEN: 5 paths (2.8) |
| 5 Super admin orders, customers, dashboard | STILL OPEN |
| 6 Franchise CRM | STILL OPEN |
| 7 Franchise orders | PARTIAL (read-only done, analytics mock) |
| 8 Franchise catalogue and inventory | STILL OPEN |
| 9 Super admin people and complaints | PARTIAL (riders done) |
| 10 Franchise staff lists | **FIXED** (riders `89756a7`, kitchen staff `f9536b5`) |
| 11 Store leftovers | PARTIAL: CRM KPI cards and resolver FIXED (`41960d8`); reorder, notifications, delayed-order pickers, supplier filter, shortages still open |
| 12-15 Security mediums, lows, dead code, out-of-scope | PARTIAL: M8 fixed, dead restaurant API removed [WT], rest open |

**Audit 3 items**: M8 (rider gets customer email) **FIXED** (`order.service.js:707-709`). M3 bare uploads STILL OPEN at
`storeApproval.routes.js:27`, `storeManager.routes.js:19,22`, `settings.routes.js:30`, `dynamicHome.routes.js:44`. M6 STILL
OPEN (`kitchenStaff.controller.js:404` accepts `Inactive`, model enum at `storeManager.model.js:66` has none). M7 STILL OPEN
(`deleteKitchenStaff:489` hard-deletes despite its comment). L4 STILL OPEN (`fcm.routes.js:18`, token previews logged in
`auth.service.js:529`, `firebase.service.js:260`). M4, M5, M9, L1-L3, L5-L8, L10: STILL OPEN (unchanged files).

**docs/rider-flow.md**: sections 1-3 match the code. Section 4 fix (city text parts) FIXED (`store/services/nearby.js:31-33`).
Section 5 open items: store Confirm Pickup skips the bill photo STILL OPEN; handover photo not shown in the store panel STILL
OPEN. Section 5 "fixed" items are [WT] only.

**docs/deploy-checklist.md**: written for the P1 release from `4e54da6`. Audit 6 says `b50b89d` was deployed, so the release
itself is SUPERSEDED. Every server step (secrets, `.env`, replica set, WebSocket proxy, Redis, indexes, smoke tests) cannot be
verified from code. **Needs an update before the next deploy:** `PAYMENT_SECRETS_KEY` is missing (see S-M1), and the Razorpay
rows still say "unchanged" although keys now come from the database once a gateway is saved.

---

## 1. Order flow, end to end

Columns: status at **HEAD** and in the **working tree**. Role and scope are the backend checks.

| # | Link | HEAD | WT | Endpoint and file | Role and scope |
|---|---|---|---|---|---|
| 1 | Customer places order (cash or online) | DONE | DONE | `POST /food/orders` (`order.service.js:175`), Razorpay via `POST /food/orders/verify-payment` | Customer token. **Payment proof not bound to the order: S-H1** |
| 2 | Store sees it | DONE | DONE | `GET /food/store/orders?view=incoming`, socket `order_event` with token | Manager only; online orders only once paid |
| 3 | Store accepts, names a supervisor | DONE | DONE, **needs the supervisor clocked in** | `PATCH /food/store/orders/:id/accept` (`storeOrders.service.js:520`, `requirePresent:356`) | Manager; supervisor must be Active in the store |
| 4 | Supervisor assigns staff | PARTIAL | DONE | `PATCH .../assign-staff` | Manager or that order's supervisor. HEAD: absent staff can be assigned; supervisor can "start" before staffing |
| 5 | Staff prepare (stations) | PARTIAL | PARTIAL | `/food/store/kitchen/*`, `/tasks/*`, `requireOnDuty` on 3 routers | Staff see only their slots. OFFLINE badge on all 5 stations |
| 6 | Ready | DONE | DONE | `moveToStage` to `ready_for_pickup` | Supervisor or manager |
| 7 | Rider offered | PARTIAL | PARTIAL | `tryAutoAssign` (at accept, not at ready), socket `new_order_available`, `GET /food/delivery/orders/available` | Scoped to served stores or `offeredTo`. HEAD: a manual assignment can be undone by auto-dispatch or by the startup watchdog (`recoverStuckOrders`) |
| 8 | Rider accepts | DONE | DONE | `PATCH /food/delivery/orders/:id/accept` | Offered or served-store riders only |
| 9 | Pickup | **BROKEN** | PARTIAL | Rider: `PATCH .../confirm-pickup` with bill photo; store: `PATCH /store/orders/:id/pickup` | HEAD: the rider's bill upload returns 401 (customer token used), and a store pickup on an unaccepted order leaves the rider app empty. WT: both fixed, but the store path still skips the bill photo and the "rider OTP" is not checked (S-M2) |
| 10 | Drop OTP | PARTIAL | PARTIAL | `reached-drop`, `verify-drop-otp` | Own order. 5 tries, no screen calls `POST /store/orders/:id/reset-drop-otp` |
| 11 | Delivered | DONE | DONE + photo | `PATCH .../complete` | Own order, OTP. WT: handover photo required (any http(s) URL, S-L1) |
| 12 | Customer sees status | DONE | DONE | `GET /food/orders/:id`, polling and socket | Own order |
| 13 | Customer rates | **BROKEN** | DONE | `PATCH /food/orders/:id/ratings` | HEAD: app sends `restaurantRating`, validator wants `storeRating`: every submit is 400 |

### Exceptions

| Flow | HEAD | WT | Evidence |
|---|---|---|---|
| Customer cancels | DONE | DONE | `PATCH /food/orders/:id/cancel`, only from `created`; online orders refunded automatically minus the cancellation fee (`order.service.js:880-915`) |
| Store rejects | DONE | DONE | `PATCH /food/store/orders/:id/reject` calls `updateOrderStatusStore('cancelled_by_store')` (`storeOrders.service.js:563`), which refunds a paid Razorpay order in full and records a failed refund for follow-up (`order.service.js:1375-1400`). Reopen within 5 minutes, never for paid orders |
| Kitchen rejects an item | PARTIAL | PARTIAL | Marked and logged; **total not changed** (`kitchenOps.service.js:155`) |
| Refund request | PARTIAL | PARTIAL | Store records pending (`POST /store/orders/:id/refund`); `POST /food/user/refunds` has no screen; processing screen is PHASE2 (deferred) |
| Complaint | PARTIAL | PARTIAL | Customer raises and reads replies (DONE). Store resolves; `POST /food/store/complaints/:id/respond` has no caller. Franchise and super admin screens are MOCK |
| Scheduled order | PARTIAL | PARTIAL | Accepted and dispatched at once (audit 5 medium 1) |
| Train order | DONE | DONE | Station picker, `resolveTrainStore`, client store id ignored (`order.service.js:175-177`) |

---

## 2. Completion per role

### 2.1 Method

Same as audit 6: the unit is a routed screen. REAL = 1, PARTIAL = 0.5, MOCK or BROKEN = 0. PHASE2 and non-v1 screens excluded.
A screen with real data but a broken link, a mock control or a localStorage read is PARTIAL. Store panel screens are split
by `allowedRoles` in `S/routes/StoreManagerRouter.jsx`.

### 2.2 Summary

| Role | v1 screens | REAL | PARTIAL | MOCK/BROKEN | HEAD % | WT % |
|---|---|---|---|---|---|---|
| Customer | 48 | 34 → 37 | 10 → 8 | 4 → 3 | **81.3** (39 / 48) | **85.4** (41 / 48) |
| Store manager | 30 | 15 → 17 | 15 → 13 | 0 | **75.0** (22.5 / 30) | **78.3** (23.5 / 30) |
| Kitchen supervisor | 20 | 10 → 12 | 10 → 8 | 0 | **75.0** (15 / 20) | **80.0** (16 / 20) |
| Kitchen staff | 14 | 6 → 7 | 8 → 7 | 0 | **71.4** (10 / 14) | **75.0** (10.5 / 14) |
| Delivery boy | 23 | 22 → 23 | 1 → 0 | 0 | **97.8** (22.5 / 23) | **100** (23 / 23) |
| Franchise admin | 27 | 13 | 3 | 11 | **53.7** (14.5 / 27) | 53.7 |
| Super admin | 36 | 25 | 2 | 9 | **72.2** (26 / 36) | 72.2 |
| **All screens, each once** | **165** | | | | **76.1** (125.5 / 165) | **78.2** (129 / 165) |

"All screens" counts the store panel once (manager's 30 plus kitchen-only `MyAttendance` = 31):
HEAD 39 + 23.5 + 22.5 + 14.5 + 26 = 125.5; WT 41 + 24.5 + 23 + 14.5 + 26 = 129. Audit 6 was 73.6% (117 / 159).

### 2.3 Customer

New: `U/complaints/MyComplaints.jsx` (REAL). Changed class: `U/profile/Coupons.jsx` PARTIAL → REAL.

- **REAL (37 in WT):** login, OTP, location, menu, combos, address screens, checkout and payment, tracking, history, invoice,
  order details, coupons, complaints, profile screens, support pages and the static pages.
- **HEAD only, not REAL:** `U/orders/OrderTracking.jsx` and `Orders.jsx` PARTIAL (ratings never submit; "already rated"
  check counts `null` as rated); `U/orders/OrderInvoice.jsx` BROKEN (reads `order.subtotal` on the API order and crashes;
  no link reached it).
- **PARTIAL (8):** `home/Home.jsx` (localStorage first paint), `cart/Cart.jsx` (static `ALL_PRODUCTS` at `:25`,
  `pvp_products_v2` at `:403`), `search/UserSearchPage.jsx` (`pvp_products_v2` `:21`), `Terms.jsx` (static fallback),
  `Under250.jsx`, `Categories.jsx`, `CategoryPage.jsx`, `Gourmet.jsx` (missing endpoints).
- **MOCK (3):** `ProductDetail.jsx` (`productsData` `:22`), `help/OrderHelp.jsx` (`OrdersContext` `:24`), `profile/FAQ.jsx`
  (`FAQ_DATA` `:17`).
- **Missing endpoints (5 at HEAD, 4 in WT):** `GET /food/restaurant/categories/public` (`adminApiModule.js:420`),
  `/food/restaurant/dishes/public` (`locationApiModule.js:21`), `/food/zones/detect` (`locationApiModule.js:11`),
  `/food/hero-banners/gourmet/public` (`Gourmet.jsx:49`), `/food/hero-banners/under-250/public` (`Under250.jsx:237`).
  `/food/dining/restaurants/public` was removed in the WT.

### 2.4 Store manager

New: `S/staffManagement/LeaveRequests.jsx` (REAL). Changed: `CustomerOrders`, `Complaints`, `Reviews` MOCK-KPI → REAL
(`41960d8`, `customers/mockData.js` deleted).

- **REAL (17 in WT):** Incoming, Active, Ready*, Completed*, Cancelled, StockRequests, WasteManagement, LowStockAlerts,
  KitchenStaff, Attendance, ShiftManagement, LeaveRequests, MyTasks, Profile, CustomerOrders, Complaints, Reviews.
  (*HEAD: Ready reads the rider from `localStorage pvp_riders` and shows "Unassigned"; Completed details show invented GST,
  payment and feedback. Both PARTIAL at HEAD.)
- **PARTIAL (13):** Dashboard (`POST /inventory/reorder`, `/notifications/read`, `/notifications/delete` missing:
  `dashboard/components/InventoryAlerts.jsx:29`, `NotificationsDrawer.jsx:13,30`); KitchenQueue, PreparationBoard,
  PizzaStation, BakingStation, PackagingStation (OFFLINE badge); DelayedOrders (`DelayedOrdersTable.jsx`, `EscalationModal.jsx`
  mock pickers); AssignRider, RiderAvailability, DeliveryIssue (OFFLINE badge); DeliveryTracking (no reset-OTP);
  IngredientStock (`InventoryFilters.jsx` mock suppliers); IngredientShortages (`mockAffectedOrders`).
- PHASE2: Performance.

### 2.5 Kitchen supervisor

Screens: Dashboard, Active, Ready, Completed, Cancelled, 6 kitchen screens, 5 inventory screens, staff Attendance, MyTasks,
MyAttendance (new), Profile = 20. Incoming is no longer theirs.

- **REAL (12 in WT):** Dashboard (now shows only supervisor widgets), Active, Ready*, Completed*, Cancelled, StockRequests,
  WasteManagement, LowStockAlerts, Attendance, MyTasks, MyAttendance, Profile (*PARTIAL at HEAD as above).
- **PARTIAL (8):** 5 stations and DelayedOrders, IngredientStock, IngredientShortages.

### 2.6 Kitchen staff

Screens: Active, Ready, 5 stations, IngredientStock, StockRequests, WasteManagement, IngredientShortages, MyTasks,
MyAttendance, Profile = 14. The dashboard is gone for them (redirect to tasks).

- **REAL (7 in WT):** Active, Ready*, StockRequests, WasteManagement, MyTasks, MyAttendance, Profile.
- **PARTIAL (7):** 5 stations, IngredientStock, IngredientShortages.

### 2.7 Delivery boy

All 23 REAL in WT. At HEAD `D/pages/DeliveryHomeV2.jsx` is PARTIAL: bill and handover uploads go through `userClient` and
return 401 (`orderApiModule.js` `uploadMedia`), and a store-confirmed pickup on an unaccepted order shows nothing. Zone overlay
and offer scope are fixed.

### 2.8 Franchise admin

New: `F/staffManagement/StaffApprovals.jsx`, `StaffAttendance.jsx` (REAL). Changed: `KitchenStaff.jsx` MOCK → REAL;
`Stores`, `StoreManagers`, `DeliveryPartners` PARTIAL → REAL (committed audit 6 working tree).

- **REAL (13):** AdminForgotPassword, Stores, StoreManagers, StoreApprovals, OperatingHours, StorePricing, DeliveryPartners,
  KitchenStaff, StaffApprovals, StaffAttendance, LiveOrders, StorePerformance, AdminProfile.
- **PARTIAL (3):** Dashboard (lists empty), CompletedOrders (`orders/mockOrders.js`), CancelledOrder (mock analytics).
- **MOCK (11):** CustomersList, CustomerComplaints, ReviewsRatings (`customers/mockData.js` via hooks), OrderIssues
  (`mockOrders`), Products, Categories, Addons (`mockProducts.js`), Ingredients, StockLevels, LowStockAlerts,
  PurchaseRequests (`inventory/mockData.js`).
- PHASE2: LoyaltyMembers, RefundRequests.

### 2.9 Super admin

Changed: RegionsZones, TerritoryManagement, FranchiseApprovals → REAL. `Settings.jsx` now partly v1 (Company Info and the
Train Delivery tab are real; Localization, Orders, Tax, Invoices, Security still local) and counted as PARTIAL.
`PaymentGateways.jsx` is real but on the deferred list (finance), so not counted.

- **PARTIAL (2):** ContentManagement (`ContentData.jsx` tab), Settings.
- **MOCK (9):** `Dashboard/SuperAdminDashboard.jsx`, `userManagement/CustomerList.jsx`, `UserProfile.jsx` (commented out),
  `KitchenStaffManagement.jsx`, `orderManagement/AllOrders.jsx`, `OrderTracking.jsx`, `Disputes.jsx`,
  `support/CustomerComplaints.jsx`, `FeedbackAndReview.jsx`. All except Disputes have a backend endpoint already.

### 2.10 Hardcoded business data (outside mock files)

Most 10-digit matches in the code are Unsplash image ids. These are real hardcoded values:

| Where | Value | Seen by |
|---|---|---|
| `U/profile/MyProfile.jsx:85` | Fallback phone `8770552411` | Customer, when the profile has no phone |
| `A/profile/Profile.jsx:28,38` | Fallback phone `+91 9876543210` | Super admin |
| `D/pages/auth/Signup.jsx:371` | Demo phone `+91 9876543210` | Old signup screen |
| `U/profile/Feedback.jsx:482` | Licence number `10017011004220` | Non-v1 screen |
| `U/help/OrderHelp.jsx:437-440` | `support@papavegpizza.com` | Customer (screen is MOCK anyway) |
| `S/orders/components/PrintReceiptPreviewModal.jsx:210` | `feedback@papavegpizza.in` | Printed store receipts |
| `A/orderManagement/components/PrintInvoiceModal.jsx` | `customercare@papavegpizza.com` | Super admin invoice |
| `F/` and `A/` login screens | `admin@papavegpizza.com` placeholder | Login pages |
| `A/layouts/Navbar.jsx` | `manager@papaveg.com` | Super admin navbar |
| `A/userManagement/*`, `A/support/*` | Sample names and emails (`a.patel@`, `amit.sharma@`, `gurpreet@capitalcrust.in`) | MOCK screens |
| `U/cart/Cart.jsx:25` | Static products with prices (`ALL_PRODUCTS`) | Cart row fallback |
| `U/ProductDetail.jsx:22` | Static products with prices | Product page |
| 14 backend pushes | `Appzeto-Brand-Image.png` URL | Customers' notifications |
| `core/otp/otp.service.js:48` | SMS text `Foodelo` | Every OTP SMS (DLT template) |

No station names, store addresses or prices are hardcoded in live backend code; the train stations come from the settings
record.

---

## 3. Security re-check of changes since audit 6

Scope: the 16 commits and the working tree. Checked: auth, role, scope, mass assignment, IDOR, public routes against
`test/fixtures/reviewed-routes.json`, uploads, sockets. Socket code (`config/socket.js`) did not change.

### High

| # | Finding | Where | Tag |
|---|---|---|---|
| S-H1 | **An online order can be marked paid with another order's payment.** `verifyPayment` checks the Razorpay signature for whatever `razorpayOrderId` the client sends, but never compares it with `order.payment.razorpay.orderId` or the amount. A customer pays a cheap order, then submits that payment's id and signature for an expensive order. The code is old, but checkout now uses online payment, so it is reachable. The webhook path matches by Razorpay order id and is not affected | `orders/services/order.service.js:471-500` | [old], live since `41960d8` |

### Medium

| # | Finding | Where | Tag |
|---|---|---|---|
| S-M1 | **Gateway secrets are encrypted with the JWT secret when `PAYMENT_SECRETS_KEY` is unset.** The deploy checklist rotates JWT secrets and does not mention `PAYMENT_SECRETS_KEY`. After a rotation, `decrypt` silently returns `''` and online payment stops with no error | `settings/services/paymentGateway.service.js:9-33` | [HEAD] |
| S-M2 | **The store's "rider OTP" at Confirm Pickup is never checked.** Any 4 digits pass. In the WT the same call also accepts the rider and skips the rider's bill photo | `store/validators/storeDelivery.validator.js:32`, `storeDelivery.service.js:confirmPickup` | [old] / [WT] |
| S-M3 | Unreviewed public route: `GET /settings/payment-gateways/public` is not in `reviewed-routes.json`. The response is safe (names and mode only), but the route-sweep test should fail until it is reviewed | `settings/routes/settings.routes.js:138` | [HEAD] |
| S-M4 | Bare uploads (audit 3 M3) still on 5 routes | `storeApproval.routes.js:27`, `storeManager.routes.js:19,22`, `settings.routes.js:30`, `dynamicHome.routes.js:44` | [old] |
| S-M5 | Kitchen roles still receive the customer's phone and address | `storeOrders.service.js:134,177` (`toOpsOrder`) | [old] |
| S-M6 | A manual rider assignment never times out. If the rider ignores it, the order waits until the store reassigns; nothing alerts the store | `order-dispatch.service.js` (`dispatch.manual`) | [WT] |
| S-M7 | Audit 6 mediums 1-8 (approved store can move; Draft store trick in CRM and dashboard reads; full IDs before claim; rider details to supervisor; second login on approve; approve without status check; join-requests full phone) | see audit 6 | [old] |

### Low

| # | Finding | Where | Tag |
|---|---|---|---|
| S-L1 | Handover photo accepts any http(s) URL, not one this rider uploaded | `order-delivery.service.js:~1010` | [WT] |
| S-L2 | Staff approve and reject read then save, with no conditional update (two admins can both decide) | `staffApproval.controller.js` `decide` | [HEAD] |
| S-L3 | Signature compare uses `===`, not a constant-time compare | `orders/helpers/razorpay.helper.js:78` | [old] |
| S-L4 | `requireOnDuty` makes two DB reads per kitchen write, and covers only the orders, kitchen and tasks routers (inventory writes are not gated) | `middleware/requireOnDuty.js` | [HEAD] |
| S-L5 | M6 and M7 staff module (Inactive → 500; hard delete) | `kitchenStaff.controller.js:404,489` | [old] |
| S-L6 | FCM token previews logged; `/fcm-tokens/check` open | `auth.service.js:529`, `firebase.service.js:260`, `fcm.routes.js:18` | [old] |
| S-L7 | Suspended rider is told "pending admin verification" | `core/auth/deliveryAuth.service.js:128` | [old] |
| S-L8 | Coupons are now read only from Marketing coupons (`FoodCoupon`). Codes saved through `/food/admin/offers` (`FoodOffer`) are no longer honoured by pricing or the public list; the admin offer routes still accept them | `orders/services/order-pricing.service.js` (`6b851bb`), `admin.routes.js:243-244` | [HEAD] |

**Checked and fine:** `/staff-approvals` (ADMIN plus `attachFranchiseScope`; `findScopedStaff` returns 404 outside the
franchise; only `reason` read from the body). Leave requests (kitchen roles ask, manager decides, store from the token,
dates and length validated). Attendance (manager writes only leave; worked days cannot be edited or deleted). Payment gateway
admin routes (super admin only, secrets write-only and masked). Coupon audience and sizes enforced on the server. Train
stations and zones public routes reviewed. WT upload folder whitelist. WT rating alias. No new mass-assignment paths found.

---

## 4. Tests and builds

| Run | Result |
|---|---|
| Backend suite, clean export of `f9536b5` (`TZ=UTC npm test`) | **Fail.** 996 tests in 217 suites: **674 pass, 27 fail, 295 cancelled** (7 min 43 s). Exit code 1 |
| Backend suite, working tree copy | **Fail, same failures as HEAD.** 996 tests: 666 pass, 28 fail, 302 cancelled. The 8 extra failures are `undefined-refs.test.js`, which hung and was stopped by hand; run alone it passes (8 / 8 in 8 s) |
| Frontend `npm run build`, clean export of `f9536b5` | **Pass** (built in 9.1 s; chunk-size warnings only) |
| Frontend `npm run build`, working tree copy | **Pass** (built in 9.5 s; chunk-size warnings only) |

**The count is not low:** 996 tests ran (audit 6 had 824). But **295 are cancelled**: when a test file's setup fails, every
test under it is cancelled without running. So only 674 tests ran and passed; the store, kitchen, inventory, attendance and
rider-leg coverage did not run at HEAD.

**Why HEAD fails.** The tests were last updated in `f423f67`. The four commits after it (`6b851bb`, `41960d8`, `2e8643c`,
`f9536b5`) changed behaviour without updating them:

| Cause | Commit | Files affected | Real bug or test drift |
|---|---|---|---|
| Staff are created `Pending Approval` and inactive, so the test fixtures' kitchen supervisor and staff cannot sign in (`Cannot read properties of undefined (reading 'accessToken')`, 401 on `/auth/store/login`). The setup fails and everything under it is cancelled | `2e8643c` | `kitchen-ops`, `inventory`, `attendance-shifts`, `kitchen-tasks`, `profile`, `rider-flow`, `customers-complaints`, `dashboards`, `supervisor-assigned-only`, `store-wiring`, `credentials-and-sessions`, `audit3` (staff management) | Drift: the fixtures must approve the staff (or call `/staff-approvals/:id/approve`) |
| Manager can no longer mark present, bulk-mark or edit worked days | `f9536b5` | `attendance-shifts` | Drift: tests describe the old rule |
| `GET /settings/payment-gateways/public` is a new unreviewed public route | `41960d8` | `audit3` route sweep | **Real (S-M3):** review and add to `reviewed-routes.json` |
| Coupons now come from `FoodCoupon`, tests create `FoodOffer` (discount 0 instead of 80; public list empty instead of `LIVE10`) | `6b851bb` | `quote-equals-charge`, `audit3` offers | Drift, plus S-L8 for old offer data |
| Checkout source no longer matches the asserted `navigate(...?confirmed=true)` text | `41960d8` | `checkout-details` | Drift (source-text test) |

Not proven at HEAD: the rider leg (`rider-flow.test.js`), kitchen tasks and inventory, because their setup did not run.

**Working tree.** No test fails in the working tree that passes at HEAD. That does **not** prove the working tree is safe:
the files that would exercise its changes (`rider-flow`, `kitchen-tasks`, `kitchen-ops`) are cancelled by the same setup
failure. Expect more failures once the fixtures are fixed: `complete` now needs `handoverPhotoUrl`, and assignment and accept
now need the person clocked in.

**Runner hangs.** Twice the full working-tree run stopped making progress near the last files (`uploads.test.js`, then
`undefined-refs.test.js`), with the child process idle at 0% CPU for hours, even under `caffeinate`. The HEAD run did not
hang. Both files pass on their own. Likely an open handle that keeps a test process alive; watch for it in batch 1 and
consider `--test-force-exit`.

---

## 5. COMPLETE (finished and verified in code)

| Role | Complete |
|---|---|
| Customer | OTP login, location, menu, combos, server-priced cart quote, checkout with own contact and address, cash and online payment, train orders, tracking with live status and drop OTP, cancel with automatic refund, order history, complaints with replies, coupons from the server. WT adds: ratings, invoice and PDF |
| Store manager | Login, staff creation (pending franchise approval), shifts, leave requests, accept and reject with supervisor, active orders, priority and pause, rider assignment, completed and cancelled lists, inventory core, customers, complaints, reviews, dashboard KPIs. WT adds: real completed-order details, rider shown on Ready Orders, presence-gated assignment |
| Kitchen supervisor | Sees only assigned orders (lists, single reads, priority), assigns staff, clock in and out, own attendance, role-aware dashboard, quality check and ready. WT adds: assign only present staff, start only when all stations are staffed |
| Kitchen staff | Lands on My Tasks, clock in required for work, own tasks and stations, stock requests, leave requests. WT adds: per-station task content |
| Delivery boy | Signup and approval, online with GPS, scoped offers and accept, step order enforced, drop OTP, cash and QR, pocket, profile, support. WT adds: working photo uploads, handover photo, trip after store handover, manual assignment kept |
| Franchise admin | Stores and managers including unapproved stores, approvals, hours, pricing, rider approval, kitchen staff approval and attendance, live orders read-only, store performance, profile |
| Super admin | Franchise admins, store approval, regions, zones, territories, catalogue, fees, app content, business information, train station mapping, payment gateways, bulk orders, riders read-only |

## 6. REMAINING

Severity: High / Medium / Low. Size: S (hours), M (a day), L (several days). Demo: **Yes** = a client would see it.

### Customer

| Item | Sev | Size | Demo |
|---|---|---|---|
| S-H1 payment proof not bound to the order | High | S | No (but money) |
| Commit the WT: ratings, invoice, splash, skeleton | High | S | **Yes** |
| ProductDetail, OrderHelp, FAQ on real data | Medium | M | **Yes** (banners open a wrong product) |
| 5 missing endpoints (categories, dishes, zone detect, 2 hero banners) | Medium | M | **Yes** (Categories, Under 250, Gourmet, search) |
| Cart rows from `ALL_PRODUCTS` / `pvp_products_v2`; menu location key | Medium | S | Maybe |
| Fallback phone in MyProfile | Low | S | Maybe |
| Refund request screen | PHASE2 | M | No |

### Store manager

| Item | Sev | Size | Demo |
|---|---|---|---|
| Commit the WT (rider on Ready, real Completed details, presence rules) | High | S | **Yes** |
| OFFLINE badge on 9 screens (10 socket hooks without token) | High | M | **Yes** |
| Reset locked drop OTP (no button) | Medium | S | Maybe |
| Confirm Pickup OTP not checked; skips bill photo (decision) | Medium | S | No |
| Dashboard reorder and notification actions (missing endpoints) | Medium | S | **Yes** |
| Delayed-order pickers, supplier filter, shortages from mock | Medium | S | **Yes** |
| Complaint `respond` not called | Low | S | No |
| Handover photo not shown in order details | Low | S | No |
| Kitchen roles get customer phone (S-M5) | Medium | S | No |

### Kitchen supervisor

| Item | Sev | Size | Demo |
|---|---|---|---|
| OFFLINE badge on the 5 stations | High | M (shared) | **Yes** |
| Item reject does not reprice | Medium | M | Maybe |
| Accept blocked when the supervisor has not clocked in (WT): check the store opens with someone clocked in | Medium | S | **Yes** (decision) |

### Kitchen staff

| Item | Sev | Size | Demo |
|---|---|---|---|
| OFFLINE badge | High | M (shared) | **Yes** |
| Inventory writes not gated by attendance | Low | S | No |

### Delivery boy

| Item | Sev | Size | Demo |
|---|---|---|---|
| Commit the WT (uploads 401 at HEAD) | High | S | **Yes** |
| Manual assignment never expires (S-M6) | Medium | S | Maybe |
| Orphan pending rider; shared pool reject; suspended message | Medium | S | No |
| Scheduled orders dispatched at once | Medium | S | Maybe |

### Franchise admin

| Item | Sev | Size | Demo |
|---|---|---|---|
| Customers, complaints, reviews, order issues (MOCK) | Medium | L | **Yes** |
| Catalogue and inventory (MOCK) | Medium | L | **Yes** |
| Completed and cancelled analytics, dashboard lists | Low | S | **Yes** |
| Audit 6 mediums 1-3, 5, 6, 8 | Medium | M | No |

### Super admin

| Item | Sev | Size | Demo |
|---|---|---|---|
| Dashboard, All Orders, Order Tracking, Customers, UserProfile (MOCK, endpoints exist) | High | M | **Yes** |
| Kitchen staff, complaints, feedback, disputes (MOCK) | Medium | M | **Yes** |
| Settings tabs still local | Low | S | Maybe |
| Appzeto image in pushes; `Foodelo` SMS (needs DLT) | Medium | S | **Yes** (customers see it) |

### Platform

| Item | Sev | Size | Demo |
|---|---|---|---|
| Backend suite red since `6b851bb`: 27 fail, 295 cancelled; rider leg and kitchen not tested (section 4) | High | M | No |
| Deploy checklist: `PAYMENT_SECRETS_KEY`, gateway keys from DB (S-M1) | Medium | S | No |
| Bare uploads, FCM logs, staff module M6/M7 | Medium | M | No |
| Status names differ from CLAUDE.md (decision) | Low | S | No |

---

## 7. Batch plan

Each fits one Claude run. Demo blockers first, then screens by role, then polish.

### Blockers

| # | Name | Covers | Size | Depends on |
|---|---|---|---|---|
| 1 | **Green suite and commit the working tree** | Review section 0.2, run the full suite on the WT, update the tests the HEAD commits and the WT changed (staff approval, attendance rules, handover photo, presence rules, public-route fixture), commit in 3 to 4 commits | M | your review |
| 2 | **Payment proof binding** | S-H1: compare `razorpayOrderId` with the order's and check the amount with Razorpay; constant-time compare; test that a second order's proof is refused. Add `PAYMENT_SECRETS_KEY` to `validateEnv` and the checklist | S | 1 |
| 3 | **Store panel live** | Token and real event names in the 10 socket hooks, or polling-only with the badge removed; polling for riders | M | 1 |
| 4 | **Super admin first screens** | Dashboard, All Orders, Order Tracking, Customers, UserProfile on existing endpoints | M | none |
| 5 | **Pickup and drop recovery** | Reset-drop-OTP button; decide and implement Confirm Pickup (verify a real rider OTP, or record handover only and let the rider finish pickup with the bill photo); manual-assignment reminder | M | 1, decision |

### Screens, by role

| # | Name | Covers | Size | Depends on |
|---|---|---|---|---|
| 6 | **Customer leftovers** | ProductDetail, OrderHelp, FAQ, 5 missing paths, cart rows, menu location key, MyProfile fallback | M | 1 |
| 7 | **Store manager leftovers** | Dashboard reorder and notifications, delayed-order pickers, supplier filter, shortages, complaint respond, handover photo in details, no customer phone to kitchen roles | M | 3 |
| 8 | **Kitchen exceptions** | Item reject repricing (or refund note), scheduled-order hold, inventory writes behind attendance | M | 1 |
| 9 | **Rider edge cases** | Orphan pending rider, shared-pool reject and re-activate, suspended message, keep history on re-signup | S | 1 |
| 10 | **Franchise CRM** | Customers, complaints, reviews, order issues, dashboard lists | L | 1 |
| 11 | **Franchise catalogue and inventory** | Products, categories, add-ons (read-only), inventory reads | L | 10 |
| 12 | **Franchise analytics** | Completed and cancelled analytics | S | 10 |
| 13 | **Super admin people and support** | Kitchen staff, complaints, feedback, disputes decision, content tab, settings tabs | M | 4 |

### Polish

| # | Name | Covers | Size | Depends on |
|---|---|---|---|---|
| 14 | **Security mediums** | Bare uploads, audit 6 mediums, delivery-login validator and upsert, staff M6/M7 | M | 1 |
| 15 | **Branding and contacts** | Appzeto image, `Foodelo` SMS (after DLT), receipt and invoice emails from business settings, sample emails | S | none |
| 16 | **Lows and dead code** | FCM logs, race conditions, regex lows, remaining dead calls | S | 14 |

---

## 8. Manual test checklist (what code cannot prove)

Run on a production build with one browser profile per role. Find out first which commit the server runs.

### Customer
- [ ] Pay online for an order; refresh the tracking page: the success screen does not replay.
- [ ] Cancel a paid order before acceptance: the refund reaches the source or wallet, minus the fee after the free window.
- [ ] After delivery: the rating dialog opens once; submit store and rider ratings with comments; they show on the order.
- [ ] Download the invoice PDF: totals match the order, no broken rupee signs.
- [ ] Open a home banner product, Categories, Under 250 and Gourmet: note blank or wrong pages.
- [ ] Raise a complaint and read the store's reply.

### Store manager
- [ ] Create a supervisor and two staff: they cannot sign in until the franchise admin approves them.
- [ ] Try to accept an order while the chosen supervisor has not clocked in (WT: refused with a clear message).
- [ ] Assign a rider; leave the rider idle for 5 minutes: the assignment stays (WT) and the rider app shows the offer.
- [ ] Confirm pickup with a wrong 4-digit OTP: it is accepted today (S-M2).
- [ ] Look at the badge on each kitchen and delivery screen.
- [ ] Lock a drop OTP with 5 wrong tries and try to recover.

### Kitchen supervisor
- [ ] Without clocking in, try to assign staff or move a stage: refused.
- [ ] Assign staff who are absent (WT: they are not offered).
- [ ] Reject one item and check the customer's total.

### Kitchen staff
- [ ] Sign in: you land on My Tasks.
- [ ] Request leave; the manager approves; clock in that day is refused.
- [ ] On a real tablet: start and finish a station task.

### Delivery boy
- [ ] Reach the store, take the bill photo (WT: upload works), swipe pickup.
- [ ] At the door: OTP, then handover photo, then payment and complete.
- [ ] On a real phone: camera capture works for both photos; tracking continues with the screen locked.

### Franchise admin
- [ ] Approve and reject kitchen staff; the rejected person cannot sign in.
- [ ] Open the staff attendance screen for each store.
- [ ] Open every sidebar screen and note which show sample data.

### Super admin
- [ ] Save a Razorpay gateway in sandbox, run its test, place an online order.
- [ ] Restart the backend after rotating the JWT secret with no `PAYMENT_SECRETS_KEY`: does online payment still work? (S-M1)
- [ ] Compare the dashboard with real orders.

---

## 9. Decisions you need to make

| # | Question | Recommendation |
|---|---|---|
| 1 | Online payment is built although finance is on the deferred list. Keep it in v1? | Keep it (it works and customers expect it), fix S-H1 first, and update CLAUDE.md so finance means reports and payouts only |
| 2 | Kitchen staff need franchise admin approval before they can sign in. Keep it? | Keep it, and add it to CLAUDE.md's roles section |
| 3 | Store Confirm Pickup: verify a real rider OTP, or record the handover only and let the rider finish pickup with the bill photo? | Record handover only; the rider's own pickup already enforces the bill photo and the step order |
| 4 | Accept needs the chosen supervisor clocked in (WT). Keep it? | Keep it, but show "clock in a supervisor" in the accept dialog instead of a bare error |
| 5 | A manual rider assignment never expires (WT). Add a timeout? | Keep it from auto-dispatch, but alert the store after 3 minutes without accept |
| 6 | Use CLAUDE.md's status words in the API, or change CLAUDE.md to the code's words? | Change CLAUDE.md; renaming statuses touches every app and the database |
| 7 | Should a rejected item reduce the bill? | Yes: reprice for unpaid orders, record a partial refund for paid ones |
| 8 | Commit the working tree as is, including the user-app and delivery-app UI changes made on request? | Yes, after batch 1's test run, in separate commits so each can be reverted |
| 9 | Which commit does the server run? | Check with `git rev-parse HEAD` on the server and record it in this file |
