# Audit 4: v1 completion audit

Date: 2026-10-29 · Branch `main` at `36d9944` · Scope: v1 as defined in [CLAUDE.md](../CLAUDE.md), deferred list excluded (finance, marketing, reports, rewards) · Compared with [audit.md](audit.md), [audit-2.md](audit-2.md), [audit3.md](audit3.md)

No code was changed. Everything below was read from a clean export of `36d9944`, not from the working tree: the working tree has uncommitted work (nutrition, scheduled orders, cart offers) that is not counted here.

## Summary

| Panel | Screens | REAL | PARTIAL | MOCK | PHASE2 | Endpoints called | Endpoints missing |
|---|---|---|---|---|---|---|---|
| Super admin | 46 | 23 | 0 | 16 (10 in v1 scope) | 7 | 129 | **0** |
| Franchise admin | 27 | 7 | 5 | 13 | 2 | 72 | **0** |
| Store (manager, supervisor, staff) | 30 | 23 | 6 | 0 | 1 | 167 | **5** (2 belong to the deferred Performance screen) |
| User app | 56 | 39 | 4 | 11 (4 in v1 scope) | 2 | 79 | **5** |
| Delivery (DeliveryV2) | 23 | 22 | 1 | 0 | 0 | 40 | **1** |
| **Total** | **182** | **114** | **16** | **40** | **12** | **487** | **11** |

**v1 completion: 78%** (calculation below). The backend is nearly complete: 476 of the 487 endpoints the screens call exist, so most of the remaining work is wiring screens that still run on sample data, mainly in the franchise panel and parts of the super admin panel.

**Not ready for a client demo yet.** Three things block it, whatever the percentage says:

1. **A rider can mark any order of theirs "delivered" without pickup, drop OTP or payment check.** `PATCH /food/delivery/orders/:id/status` sets any status up to `delivered` or `cancelled_by_store`. The dedicated routes also let a rider skip steps. Found in this pass; present since the first commit (see §5).
2. **The franchise and store panels show invented live activity.** The franchise navbar posts fake "New order received" and "Critical complaint" toasts every 50 s. The franchise dashboard moves real orders to random statuses every 20 s. Store Performance inflates revenue every 6 s. The store navbar always shows three made-up alerts.
3. **The customer menu can show prices the order does not charge.** In a browser that also holds an admin login, which is typical on a demo laptop, the menu loads the admin catalogue list (catalogue prices, draft products) before the store-priced list. The cart total is also computed in the browser, and the server total is not shown before the order is placed.

Backend regression suite on `36d9944`: 735 tests, all passing (2026-10-29). No test covers the rider leg.

---

## How the completion percentage is calculated

- **Unit:** a routed screen (a distinct component behind a `<Route>` in the five routers; redirects not counted).
- **v1 scope:** all screens except PHASE2 (12) and 13 MOCK screens that are neither in CLAUDE.md's v1 list nor on the deferred list. Those 13 are 6 super admin screens (roles and permissions, settings, notification settings, audit logs, franchise tickets, support requests) and 7 user screens (favourites, collections ×2, saved payment methods ×3, feedback). That leaves **157 v1 screens**.
- **Score:** REAL = 1, PARTIAL = 0.5, MOCK = 0.
- **Result:** (114 REAL + 16 × 0.5) / 157 = 122 / 157 = **77.7%**. Counting PARTIAL as 0 gives a strict lower bound of 114 / 157 = **72.6%**.

| Panel | v1 screens | Score | Completion |
|---|---|---|---|
| Super admin | 33 | 23 | 70% |
| Franchise admin | 25 | 9.5 | **38%** |
| Store | 29 | 26 | 90% |
| User app | 47 | 41 | 87% |
| Delivery | 23 | 22.5 | 98% |

The percentage measures how much of v1 is wired to real data. It does not measure correctness: the flow gaps (§4) and security items (§5, §6) are separate and come first in the work list.

---

## Prioritised work list

Each batch is sized to fit one Claude run. Batches 1-3 block the demo. Batches 4-11 cover screens a client will see. Batches 12-15 are polish. Per CLAUDE.md and the existing rule: wire data only, no user-app or delivery-app UI changes.

| # | Batch | What it covers | Size | Depends on |
|---|---|---|---|---|
| 1 | **Rider order integrity** | Remove `PATCH /food/delivery/orders/:id/status` (the delivery app never calls it) or limit it to non-terminal statuses. `confirm-pickup` only from `ready_for_pickup` / `reached_pickup`. `complete` only from `picked_up` / `reached_drop`, with the drop OTP always required (today it is required only if the rider called `reached-drop`). Add an end-to-end test: cash order → accept (with supervisor) → kitchen stages → rider accept → pickup → drop OTP → delivered, with the customer's `GET /food/orders/:id` checked at each step. No test covers the rider leg today. | M | - |
| 2 | **No invented live data in admin shells** | Franchise [Navbar.jsx:188-230](../Frontend/src/modules/Food/pages/franchise-admin/layout/Navbar.jsx#L188-L230) fake socket events, fake store list (`:75`) and notifications. Franchise dashboard [LiveOrders.jsx:43-66](../Frontend/src/modules/Food/pages/franchise-admin/dashboard/components/LiveOrders.jsx#L43-L66) random status changes. [StorePerformance.jsx:158-190](../Frontend/src/modules/Food/pages/franchise-admin/storeManagement/StorePerformance.jsx#L158-L190) random drift. Franchise Live Orders "Simulate New Order" ([LiveOrders.jsx:120](../Frontend/src/modules/Food/pages/franchise-admin/orders/LiveOrders.jsx#L120)). Store [Navbar.jsx:46-56](../Frontend/src/modules/Food/pages/store-manager/layouts/Navbar.jsx#L46-L56) alerts (read `/tasks/notifications`) and store list (the token's store). The 10 store hooks that treat a missing `VITE_API_BASE_URL` as mock mode and run simulated sockets (§3). The dev axios fallback, which is on by default ([axios.js:20-23](../Frontend/src/services/api/axios.js#L20-L23)). Everything goes behind `VITE_STANDALONE_MOCK` only. Hiding the Simulate button outside mock mode is a small admin-UI change: confirm first. | M | - |
| 3 | **Customer price and demo readiness** | [Home.jsx:650-680](../Frontend/src/modules/Food/pages/user/home/Home.jsx#L650-L680) and [MenuList.jsx:484-505](../Frontend/src/modules/Food/pages/user/home/MenuList.jsx#L484-L505): read the store-priced `/food/admin/products/public` and `/menu/public` first, and drop the admin-list and `pvp_products_v2` fallbacks. Show the server quote (`POST /food/orders/calculate` exists) as the cart total before placing. Production env check: `VITE_API_BASE_URL`, `FRONTEND_URL`, `JWT_ACCESS_EXPIRES`, `TEST_OTP_PHONES` if the default-OTP switch is on. Script to check demo data: each demo store approved, open, has an **active kitchen supervisor** (accepting an order is impossible without one), and has an approved rider online in range. | S | - |
| 4 | **User app missing endpoints (service layer only)** | `getPublicCategories` → `/food/categories/public`. `getPublicDishes` → `/food/admin/products/public`. Gourmet and Under-250 hero banners. `/food/zones/detect` and `/food/zones/public` (add public routes or map to `/food/search/serviceability`). FAQ page → `/settings/faqs/public`. ProductDetail → product by id. OrderHelp → `orderAPI` instead of local `userOrders`. Fixes Categories, Category page, Under 250, Gourmet, search overlay, rider map zones. | M | - |
| 5 | **Super admin orders, customers, dashboard** | AllOrders and OrderTracking → `/food/admin/orders(/:id)`. CustomerList → `/food/admin/customers` (+ status). Dashboard → `/admin/dashboard/*` (super admin sees all; `?franchiseId` narrows). All endpoints exist. `UserProfile.jsx` is entirely commented out: decide whether to restore it or point the route at the customer drawer. | M | - |
| 6 | **Franchise CRM** | CustomersList → `/food/admin/customers` (franchise-scoped, exists). CustomerComplaints → `/food/admin/stores/complaints` (exists). ReviewsRatings and OrderIssues need franchise-scoped list endpoints (new). Franchise dashboard reviews / complaints / notifications / refund lists. | L | 2 |
| 7 | **Franchise orders** | Decide what a franchise admin may do on Live Orders (read-only, or cancel / assign rider through existing store endpoints). Remove the local-only writes in [ordersQuery.js:293-450](../Frontend/src/modules/Food/pages/franchise-admin/orders/ordersQuery.js#L293-L450). Completed / Cancelled analytics from real aggregates instead of `mockOrders.js`. | M | 2, decision |
| 8 | **Franchise catalogue and inventory** | Products / Categories / Add-ons: read the real catalogue, read-only, with per-store availability from store pricing; today they run on `mockProducts.js` + localStorage. Ingredients / Stock levels / Low-stock alerts / Purchase requests: read `/food/store/inventory/*?storeId=`, which franchise admins can already read. Approving purchase requests needs a backend decision, because franchise access is read-only today. | L | decision |
| 9 | **Super admin people and complaints** | DeliveryPartnersManagement → `/food/admin/delivery/partners`, `join-requests`, `/:id/approve|reject`. KitchenStaffManagement → `/food/admin/staff`. CustomerComplaints → `/food/admin/stores/complaints`. FeedbackAndReview → `/food/admin/feedback-experiences`, `/food/admin/stores/reviews`. Disputes: map to complaints or hide. | M | - |
| 10 | **Franchise staff lists** | KitchenStaff → `/food/admin/staff` (franchise-scoped). DeliveryPartners needs a franchise rider list (new; the store delivery module already has the rider filter). | M | 6 |
| 11 | **Store leftovers** | Dashboard "Reorder" (`POST /inventory/reorder`, missing) → create a stock request. Notifications drawer (`/notifications/read`, `/notifications/delete`, missing) → `/tasks/notifications/:id/read`. Delayed-orders reassign, escalation and complaint-resolver pickers → `/food/store/orders/team`. KPI cards on Customer Orders / Complaints / Reviews from a real summary. Ingredient-shortage affected orders. Supplier filter options. | M | 2 |
| 12 | **Security mediums** | audit3 M3 (6 routes still on bare `upload`), M5 (disconnect sockets on deactivate / re-scope), M6 + M7 + L2 + L10 (staff module: zod, soft delete, leave dates), M8 (rider gets customer email), L5 (offer claim for customers only), L6 (menu `?storeId` must be approved), new N-L1 (rider roster across franchises), new N-L2 (staff phone change without verification). | M | 1 |
| 13 | **Lows and launch hardening** | M4 (single change-stream watcher), M9, L1 (delete dead Truecaller code), L4, L8. Remove the production default-OTP switch before the real launch. | S | 12 |
| 14 | **Dead code** | 100 call sites to endpoints that don't exist, in service methods no screen uses (`restaurantApiModule.js` 49, `adminApiModule.js` 39, `userApiModule.js` 7, `locationApiModule.js` 3, `auth.js` restaurant OTP 2). Dead backend `core/auth/adminAuth.service.js` (logs in against `FoodAdmin`; not imported). | S | 4 |
| 15 | **Out-of-scope screens** | Decide hide / label / defer for the 13 non-v1 MOCK screens (see the calculation section). Decide whether online payment is in v1: checkout always places cash orders today ([CheckoutModal.jsx:187](../Frontend/src/modules/Food/pages/user/cart/CheckoutModal.jsx#L187)). | S | decision |

---

## 1. Endpoint recount

Same method as audit.md and audit-2.md. The Express app was loaded and its router stack walked (`test/helpers/routes.js`): **767 registered routes** (aliases under `/api`, `/api/v1` and `/api/v1/food` included). Every static API call in `Frontend/src` was extracted. The clients are `adminClient`, `apiClient`, `userClient`, `restaurantClient`, `deliveryClient`, `axiosInstance` and the default `api` export. URL constants and multi-line chains were resolved, and comments ignored. Calls were matched by method and path. A call is attributed to a panel if a routed screen of that panel reaches it through its imports, directly or through a service method.

- **Raw call sites: 869.** 738 match, 9 match a `:param` route correctly (e.g. `/food/pages/:key`), 10 are built at runtime and were resolved by hand (all exist), 111 are missing and 1 is captured by a wrong route.
- Of the 111 missing call sites, **100 are dead code** (service methods no screen uses) and **11 are live**.
- Correction to earlier audits: the "stub" calls (`About`, `Terms`, `Privacy`, `Gourmet`, `Under250`, FAQ / Policy management) use the **default** export of `services/api`, which is the real `apiClient`, not the `{ api }` stub. They reach the server. `DesktopNavbar`'s call is commented out.

| Panel | Unique endpoints | Exist | Missing (live) |
|---|---|---|---|
| Super admin | 129 | 129 | 0 |
| Franchise admin | 72 | 72 | 0 |
| Store | 167 | 162 | `POST /inventory/reorder`, `POST /notifications/read`, `POST /notifications/delete`, `GET /store/performance`, `GET /store/performance/:id` (deferred screen) |
| User | 79 | 74 | `GET /food/restaurant/categories/public` (Categories, Category page, Under 250), `GET /food/restaurant/dishes/public` (search overlay in the layout, Under 250), `GET /food/zones/detect` (`useZone`: Categories, Category page, Under 250, search), `GET /food/hero-banners/gourmet/public`, `GET /food/hero-banners/under-250/public` |
| Delivery | 40 | 39 | `GET /food/zones/public` (zone overlay on the live map) |

Mismatches from audit 1 (`/stores/dropdown`, store-approval documents, `PUT /orders/:id`, kitchen hooks' staff lists, `profile/work`): all fixed, none found again.

---

## 2. Screen classification

REAL = reads and writes real backend data · PARTIAL = some calls real, some mock or missing · MOCK = local sample data or localStorage · PHASE2 = deferred list.

### Super admin (46): 23 REAL · 0 PARTIAL · 16 MOCK · 7 PHASE2

**REAL:** FranchiseStores, FranchiseApprovals, RegionsZones, TerritoryManagement, FranchiseList, StoreManagers, StoreManagersList, ProductsManagement, CategoriesManagement, Addons, ComboDeals, BulkOrdersManagement, AppConfiguration, FeesAndCharges, ContentManagement, and the 8 user-app / delivery-app content pages (welcome, home page, promise campaign, showcase sections, search, combo page, cart config, delivery welcome).

| MOCK screen (`pages/superadmin/…`) | Reason | v1 | Backend already there |
|---|---|---|---|
| `Dashboard/SuperAdminDashboard.jsx` | KPIs, hourly/daily charts, live orders, franchises and "simulatedRiders" are hardcoded (lines 142-256); only the theme save is real | yes | `/admin/dashboard/*` |
| `userManagement/CustomerList.jsx` | `INITIAL_CUSTOMERS` | yes | `/food/admin/customers`, `/:id`, `/:id/status` |
| `userManagement/UserProfile.jsx` | Whole file is commented out; the route has no component to render | yes | `/food/admin/customers/:id` |
| `userManagement/DeliveryPartnersManagement.jsx` | `INITIAL_RIDERS` | yes | `/food/admin/delivery/partners`, `join-requests`, approve / reject |
| `userManagement/KitchenStaffManagement.jsx` | `INITIAL_STAFF`, ids from `Math.random` | yes | `/food/admin/staff` |
| `orderManagement/AllOrders.jsx` | `AllOrdersData` + fake delay | yes | `/food/admin/orders` |
| `orderManagement/OrderTracking.jsx` | Same local data | yes | `/food/admin/orders/:orderId` |
| `orderManagement/Disputes.jsx` | `DisputesData` | yes | none (map to complaints) |
| `support/CustomerComplaints.jsx` | Inline `useState([...])` list | yes | `/food/admin/stores/complaints` |
| `support/FeedbackAndReview.jsx` | Local components only | yes | `/food/admin/feedback-experiences`, `/food/admin/stores/reviews` |
| `userManagement/RolesPermissionManagement.jsx` | `INITIAL_ROLES`; roles are fixed in code | no | - |
| `settings/Settings.jsx` | localStorage (`sa_companyName`, `sa_logo`, `pvp_order_methods`) | no | partly (`business-settings`) |
| `settings/NotificationsSettings.jsx` | `INITIAL_TEMPLATES / PROVIDERS / LOGS` | no | - |
| `settings/AuditLogs.jsx` | `INITIAL_AUDITS` | no | - |
| `support/FranchiseTicket.jsx` | Inline list | no | - |
| `support/SupportRequests.jsx` | Inline list | no | `/food/admin/support-tickets` |

**PHASE2:** CustomerAnalysis (analytics), RefundRequests (finance), PaymentGateways (finance), CouponsManagement, Campaign and PushNotification (marketing; Coupons calls real `/settings/coupons`, but those coupons are display-only), RewardsManagement (rewards).

### Franchise admin (27): 7 REAL · 5 PARTIAL · 13 MOCK · 2 PHASE2

**REAL:** AdminForgotPassword, Stores, StoreManagers, StoreApprovals, OperatingHours, StorePricing, AdminProfile.

| PARTIAL screen (`pages/franchise-admin/…`) | Reason |
|---|---|
| `dashboard/FranchiseAdminDashboard.jsx` | Real `/admin/dashboard/*`, but `components/LiveOrders.jsx:43-66` changes real orders to random statuses every 20 s with toasts (not gated). Reviews / complaints / notifications / refund lists are empty (no franchise-scoped endpoints). The navbar on every franchise screen posts fake socket events and lists made-up stores. |
| `storeManagement/StorePerformance.jsx` | Real `/store-performance/*`, but table values (orders, revenue, waste, score) drift randomly every 6 s (lines 158-190) |
| `orders/LiveOrders.jsx` | List from `GET /food/franchise/orders`; status change, assign rider and cancel write only to a local array (`ordersQuery.js:293-450`); "Simulate New Order" button injects fake orders |
| `orders/CompletedOrders.jsx` | List real; reorder analytics from `mockReorderAnalytics` (`ordersQuery.js:658`) |
| `orders/CancelledOrder.jsx` | List real; analytics and charts from `mockCancelled*` (`ordersQuery.js:868-878`); "initiate refund" is local |

| MOCK screen | Reason |
|---|---|
| `customers/CustomersList.jsx` | `customers/mockData.js` + localStorage |
| `customers/CustomerComplaints.jsx` | `mockComplaints` |
| `customers/ReviewsRatings.jsx` | `mockReviews` |
| `staffManagement/KitchenStaff.jsx` | `mockManagersData.js` |
| `staffManagement/DeliveryPartners.jsx` | `mockManagersData.js` |
| `orders/OrderIssues.jsx` | `mockOrderIssues`, simulated new issues |
| `products/Products.jsx`, `Categories.jsx`, `Addons.jsx` | `productService` / `categoryService` / `addonService` on `mockProducts.js` + localStorage with fake delays |
| `inventory/Ingredients.jsx`, `StockLevels.jsx`, `LowStockAlerts.jsx`, `PurchaseRequests.jsx` | `inventory/services/*` on `inventory/mockData.js` + `mockStoresData.js` |

**PHASE2:** LoyaltyMembers (rewards), RefundRequests (finance).

### Store: manager, supervisor, staff (30): 23 REAL · 6 PARTIAL · 0 MOCK · 1 PHASE2

**REAL:** Incoming / Active / Ready / Completed / Cancelled orders (Completed's "reorder" now says it is not available), Kitchen Queue, Preparation Board, Pizza / Baking / Packaging stations, Assign Rider, Rider Availability, Delivery Tracking, Delivery Issues, Ingredient Stock, Stock Requests, Waste, Low Stock, Kitchen Staff, Attendance, Shifts, My Tasks, Profile.

| PARTIAL screen (`pages/store-manager/…`) | Reason |
|---|---|
| `dashboard/StoreOperationsDashboard.jsx` | 39 real endpoints; "Reorder" calls missing `POST /inventory/reorder`; notifications drawer calls missing `/notifications/read` and `/notifications/delete`; the store navbar (every store screen) shows 3 hardcoded alerts and a hardcoded store list (`layouts/Navbar.jsx:46-56`) |
| `kitchenOperations/DelayedOrders.jsx` | Reassign picker lists `mockChefs / mockStaff / mockPackagingStaff` (`components/DelayedOrdersTable.jsx:36`); escalation recipients are `mockManagementStaff` (`components/EscalationModal.jsx:107`) |
| `inventory/IngredientShortages.jsx` | Affected-orders revenue in the notify dialog from `mockAffectedOrders` (line 350) |
| `customers/CustomerOrders.jsx` | Table real; KPI cards computed from `mockCustomers / mockOrders`, frozen at 25 Jun 2026 (lines 66-90) |
| `customers/Complaints.jsx` | Table real; KPI cards from `mockComplaints` (line 54); resolver dropdown is `mockStaff` (`components/ResolveComplaintModal.jsx:185`) |
| `customers/Reviews.jsx` | Table real; KPI cards from `mockReviews` (line 64) |

**PHASE2:** `staffManagement/Performance.jsx` (staff performance report; `GET /store/performance` does not exist).

### User app (56): 39 REAL · 4 PARTIAL · 11 MOCK · 2 PHASE2

**REAL:** Welcome, Home, Menu, Promise, Search, Cart, Select Address, Address Selector, Orders, Order Tracking, Invoice, Order Details, Coupons, Combo page, Combo builder, Bulk Order, Track Order, Profile details / edit / create, Addresses, Support, About, Safety report, Accessibility, Logout, Terms, Privacy, Refund, Shipping, Cancellation, Login, Auth callback, Delivery location, Train terms, Help, Notifications, Wallet, Submit complaint. (Accessibility, Logout, Auth callback and Train terms are static: no data needed.)

| PARTIAL screen (`pages/user/…`) | Reason |
|---|---|
| `Under250.jsx` | Missing: categories (`/food/restaurant/categories/public`), dishes, Under-250 hero banners, zone detect |
| `Categories.jsx` | Category list from missing `/food/restaurant/categories/public`; zone detect missing |
| `CategoryPage.jsx` | Same two missing calls; products via the store adapter are real |
| `Gourmet.jsx` | Gourmet hero banners endpoint missing |

| MOCK screen | Reason | v1 |
|---|---|---|
| `ProductDetail.jsx` | Hardcoded `productsData` keyed by number (line 22); home banners link here with a Mongo id, which never matches | yes |
| `help/OrderHelp.jsx` | Order from `OrdersContext`, which reads localStorage `userOrders`, not the API | yes |
| `profile/FAQ.jsx` | Hardcoded `FAQ_DATA` (line 17); the super-admin-managed `/settings/faqs/public` is not read | yes |
| `profile/Nutrition.jsx` | Hardcoded `NUTRITION_DATABASE` (backend work exists uncommitted in the working tree) | yes |
| `profile/Feedback.jsx` | "Simulate API request" (line 108) | no |
| `Collections.jsx`, `CollectionDetail.jsx`, `profile/Favorites.jsx` | `ProfileContext`, localStorage `userFavorites` | no |
| `profile/Payments.jsx`, `AddPayment.jsx`, `EditPayment.jsx` | localStorage (`userPaymentMethods`, `preferred_payment_method`) | no |

**PHASE2:** Rewards, Refer & Earn.

Layout note: the search overlay in `UserLayout` calls the missing `/food/restaurant/dishes/public`, so the global search overlay has no dishes.

### Delivery (23): 22 REAL · 1 PARTIAL

**REAL:** welcome, sign in, OTP, signup ×2, terms, privacy, notifications, profile details / bank / documents, support tickets ×3, ID card, and the 7 pocket screens.

**PARTIAL:** `DeliveryHomeV2.jsx` (feed, pocket, history, profile tabs; 27 real endpoints). The live map's zone overlay calls the missing `GET /food/zones/public` (`components/map/LiveMap.jsx:159`).

---

## 3. Mock data imports and mockPolicy fallbacks

The single switch for local data is `VITE_STANDALONE_MOCK=true` ([mockPolicy.js](../Frontend/src/services/api/mockPolicy.js)). A mock import is **gated** when its file uses `failOrMock` / `STANDALONE_MOCK`.

**Mock-data imports: 156 in 138 files.** 47 are gated; the rest load sample data unconditionally:

- **Franchise admin, 54 (all ungated):**
  - `customers/` (3 screens, 4 hooks, 7 components → `mockData.js`)
  - `staffManagement/` (2 screens, 11 components → `mockManagersData.js`)
  - `orders/ordersQuery.js` and `CompletedOrders.jsx` → `mockOrders.js`
  - `products/` (3 services, 7 components; `storePricingService.js` too, but Store Pricing no longer uses it) → `mockProducts.js`
  - `inventory/` (4 services, 5 components → `mockData.js`, `mockStoresData.js`)
  - `storeManagement/components/useMockQuery.js` (only a query hook, despite the name)
- **Super admin, 37 (all ungated):** `marketing/` → `CouponsData`, `CampaignData`, `NotificationData`, `LoyaltyData` (all PHASE2); `settings/ContentManagement.jsx` → `ContentData` (a table component, not data); `settings/PolicyManagement.jsx` → `constants/termsData` (default text).
- **Store, 54 (46 gated).** Ungated:
  - `customers/Complaints.jsx`, `CustomerOrders.jsx`, `Reviews.jsx` (KPI cards)
  - `inventory/IngredientShortages.jsx`
  - `customers/components/ResolveComplaintModal.jsx`
  - `inventory/components/InventoryFilters.jsx` (supplier options)
  - `kitchenOperations/components/DelayedOrdersTable.jsx` and `EscalationModal.jsx`
- **User, 3:** `home/Home.jsx` → `HomeData` `DEALS` (first paint only, replaced by the server); `profile/Terms.jsx` → default terms text; `auth/Login.jsx` → `services/truecallerMock` (the Truecaller button; the server returns 501).
- **Shared:** `services/api/axios.js` → `mockService.js` (6,566 lines). It imports 7 sample-data files and answers **any 404 or network error in dev** unless `VITE_USE_MOCK=false` ([axios.js:20-23](../Frontend/src/services/api/axios.js#L20-L23)). Production builds are not affected, but a demo run from `npm run dev` hides every failing call.

**mockPolicy fallbacks: 70 files, 87 `failOrMock` calls** (counting `axios.js` and `mockPolicy.js` themselves).

- `services/api`: `myTasksService.js`, `profileApi.js`
- `store-manager/inventory/hooks`: 30 files
- `store-manager/dashboard/components`: 11 files
- `store-manager/deliveryOperations/hooks`: 7 files
- `store-manager/kitchenOperations/hooks`: 6 files
- `store-manager/customers/hooks`: 3 files
- `store-manager/orders/hooks`: 3 files
- `store-manager/staffManagement/hooks`: 4 files
- `franchise-admin/products/hooks/useStorePricing.js`
- `franchise-admin/dashboard/FranchiseAdminDashboard.jsx`

**Wrong gate in 10 store hooks.** They also treat a missing `VITE_API_BASE_URL` as mock mode, and then run simulated sockets with fake orders and toasts: `useKitchenQueue`, `usePreparationBoard`, `usePizzaStation`, `useBakingStation`, `usePackagingStation`, `useDelayedOrders`, `useDeliverySocket`, `useRiderSocket`, `useSocketAssignment`, `useIssueSocket`. Axios falls back to `/api/v1` when the variable is unset, so a same-origin deployment without it would work **and** show the fake orders.

---

## 4. End-to-end flows

### Customer order → store → kitchen → rider → customer

| Link | Code | Status |
|---|---|---|
| Customer places order | `POST /food/orders`, priced on the server; checkout always sends `paymentMethod: "cash"` ([CheckoutModal.jsx:187](../Frontend/src/modules/Food/pages/user/cart/CheckoutModal.jsx#L187)) | Works (cash only) |
| Store sees it | `GET /food/store/orders?view=incoming` (manager only; online orders only once paid) + `order_event` socket | Works |
| Store accepts | `acceptOrder` **requires an active kitchen supervisor** ([storeOrders.service.js:360](../Backend/src/modules/food/store/services/storeOrders.service.js#L360)); sets `confirmed` and starts auto-dispatch (`tryAutoAssign`) | Works if the store has a supervisor; otherwise accept fails |
| Kitchen prepares | assign staff → stages `preparing → baking → packaging → ready` → `ready_for_pickup` | Works |
| Rider delivers | accept → reached-pickup → confirm-pickup → reached-drop (OTP to customer) → verify OTP → complete | **Broken integrity:** confirm-pickup only checks "forward" ([order-delivery.service.js:747](../Backend/src/modules/food/orders/services/order-delivery.service.js#L747)), so a rider can "pick up" an order the kitchen has not finished. The kitchen is then locked out ("not in the kitchen"). `complete` needs the OTP only if `reached-drop` was called ([:963](../Backend/src/modules/food/orders/services/order-delivery.service.js#L963)), so skipping it delivers without OTP. `PATCH …/status` sets `delivered` directly, skipping OTP, QR-payment check and COD accounting. |
| Customer sees status | `GET /food/orders/:id` polled every 30 s + `order_status_update` socket on store changes | Works (store-confirmed pickup reaches the customer on the next poll) |

No automated test covers the rider leg.

### Account chain

| Link | Status |
|---|---|
| Super admin creates franchise + franchise admin (`POST /food/admin/franchises`, password set in the form, hashed) | Works; tested |
| Franchise admin logs in (`/food/auth/franchise/login`) and changes password / profile (`/auth/admin/change-password`, `/auth/admin/profile`) | Works; tested |
| Franchise admin creates store manager (`POST /store-managers`, password in the form; temp password if blank) | Works; tested. The edit form's `••••••••` placeholder is ignored by the update whitelist (safe). |
| Store manager logs in (`/food/auth/store/login`) | Works. Login does not need the store to be approved, but customers are served only by approved, open stores. |
| Store manager creates kitchen supervisor / staff (`POST /food/store/staff`, password in the form) | Works; tested |
| Kitchen roles log in; see only their own work | Works. The supervisor sees only orders where they are the assigned supervisor (set at accept); staff see only orders where they hold a station. |

No broken link. The super admin and franchise "kitchen staff" and "delivery partner" lists are MOCK, so people created through this chain don't appear there.

### Store price shown = price charged

The server side holds: `menu-pricing.test.js` checks "menu price == price charged in a real order, for every product and size". Menu and checkout pick the store from the same saved location. Links at risk:

1. **Admin login in the same browser.** `Home.jsx` and `MenuList.jsx` call `adminClient.get('/food/admin/products')` first. With an admin token present this returns the catalogue (catalogue prices, draft and archived products), and the store-priced list is never read.
2. When every call fails, the menu falls back to localStorage `pvp_products_v2` (stale prices).
3. The cart total, tax and fees are computed in the browser from `/food/fee-config`. The server recomputes, but the customer never sees the server total before placing a cash order (`/food/orders/calculate` is not called).
4. Combos and add-ons use catalogue prices on both sides (consistent).

---

## 5. Security re-check of commits after `dee483a`

Commits: `d84002c` (M1 fix, reviewed in audit3), `1a95416` (docs), `d46e012` (production default-OTP switch), `f466453` (frontend + delivery welcome config), `fb13350` (store profile, attendance, shifts), `800dd11` (frontend), `36d9944` (wiring + store dashboard drill-downs, pickup, reopen).

| Item | Finding |
|---|---|
| `d46e012` default OTP in production | Off unless `USE_DEFAULT_OTP=true` **and** `ALLOW_DEFAULT_OTP_IN_PRODUCTION=true`. The OTP is never returned in the response, and a loud startup warning is logged. **Risk: High while it is on and `TEST_OTP_PHONES` is empty**: anyone can sign in as any customer with `123456`. Rider accounts still need approval. Set `TEST_OTP_PHONES` for the demo and remove the switch before launch. Tested (`otp-production-switch.test.js`). |
| `fb13350` attendance and shifts | Clean. Scope from the token only (`attendanceAccess.js`), writes by the store manager only, other store or franchise → 404. |
| `fb13350` store profile | Clean: `/profile/photo` uses `safeUpload`; change-password checks the current password and revokes other sessions; sessions are scoped to the caller. **N-L2 (low):** `PUT /profile/personal` changes the login phone number without verifying it (uniqueness is checked). |
| `f466453` delivery welcome config | `PUT /settings/delivery-welcome` is super admin only; GET is public by design. Clean. |
| `36d9944` pickup / reopen / refunds | `PATCH /store/orders/:id/pickup` and reopen enforce the store manager in the service (route also lets supervisors in, then 403). Reopen: 5-minute window, never for paid or refunded orders. Clean. |
| `36d9944` dashboard drill-downs | **N-L1 (low):** `rider-roster` lists every approved online rider on the platform (names, up to 50), not only riders this store may use ([storeDashboard.service.js:237](../Backend/src/modules/food/dashboard/services/storeDashboard.service.js#L237)). Reuse the delivery module's rider filter. |
| **Pre-existing, missed by audits 1-3** | **N-H1 (High):** `PATCH /food/delivery/orders/:orderId/status` ([delivery.routes.js:49](../Backend/src/modules/food/delivery/routes/delivery.routes.js#L49), validator [order.validator.js:143](../Backend/src/modules/food/orders/validators/order.validator.js#L143)) lets the assigned rider set `delivered` or `cancelled_by_store`, skipping drop OTP, QR-payment verification and COD settlement. The delivery app does not use it. Since `935cca5`. **N-M1 (Medium):** the dedicated rider routes allow skipping steps (see §4). Both go into batch 1. |

Routes added since audit3 are all behind `authMiddleware` and a role guard; the route sweep fixture still passes.

Backend suite on the `36d9944` snapshot (in-memory MongoDB, 2026-10-29): **735 tests in 159 suites, all passing.** None of them drive the rider leg of an order.

---

## 6. Remaining items from audit3

None of these changed after audit3. All are still open unless marked otherwise.

| # | Item | Status on `36d9944` |
|---|---|---|
| M3 (rest) | Bare `upload` without MIME/signature checks | Open: `admin.routes.js`, `storeApproval.routes.js`, `storeManager.routes.js` (×2), `dynamicHome.routes.js`, `settings.routes.js` |
| M4 | Change-stream watcher runs on every instance | Open (`order-events.service.js:72`, no single-instance flag) |
| M5 | Socket rooms fixed at connect | Open (no disconnect on deactivate / re-scope) |
| M6 (rest) | Staff `status: 'Inactive'` accepted, model enum has no `Inactive` → 500; no zod | Open (`kitchenStaff.controller.js:402`, model enum `Active / On Leave / Suspended / DELETED`) |
| M7 | Staff delete is a hard delete | Open (`kitchenStaff.controller.js:535`) |
| M8 | Rider receives customer email | Open (`order.service.js:602`) |
| M9 | Public offers list | Open, accepted as not exploitable |
| L1 | `verifyTruecallerAndLogin` dead but present | Open (route returns 501) |
| L2 | Staff module has no schema validation | Open |
| L3 | `StoreManager.role` free text | Open |
| L4 | `/fcm-tokens/check` open; token prefix in `console.log` | Open (`fcm.routes.js:18`, `:33`) |
| L5 | Offer claim open to any signed-in role | Open (`settings.routes.js:116`, `authMiddleware` only) |
| L6 | Menu `?storeId=` not checked for approved / active | Open (`menu-store-pricing.service.js` `menuStoreId`) |
| L7 | DB read per request in `authMiddleware` | Open (fine at current load) |
| L8 | Dashboard / performance aggregations only globally rate limited | Open |
| L9 | Super admin read-only on store delivery | By design |
| L10 | Leave dates not stored | Open (`markLeave` only returns them in the message) |
| audit-2 L7 | Backup files tracked in git | **Fixed** (none tracked) |
| audit-2 server items | Server `.env` (`JWT_ACCESS_EXPIRES=7d`, `FRONTEND_URL`), secret rotation, deploy | Not verifiable from code; see the checklist |

---

## Manual test checklist (what code cannot prove)

Run on the production build (`npm run build`, with `VITE_API_BASE_URL` set), not `npm run dev`. Use a separate browser profile per role. Never open the customer app in a browser that holds an admin login.

**Deployment**
- [ ] Server `.env`: `FRONTEND_URL` = real site origin(s), `JWT_ACCESS_EXPIRES` unset or `15m`, new random JWT secrets, `NODE_ENV=production`.
- [ ] Default OTP switch: off, or on with `TEST_OTP_PHONES` listing only the demo numbers. A number not on the list is refused.
- [ ] Sockets connect over HTTPS (`VITE_SOCKET_URL`); with more than one server instance, each event arrives once.
- [ ] Dashboards just after local midnight show today's figures, not yesterday's.

**Super admin**
- [ ] Log in, create a franchise with an admin email and password, and give the password to the franchise admin.
- [ ] Approve a store submitted by that franchise; it appears for customers at its location.
- [ ] Change home page, search, cart and combo content; the user app shows it after refresh.
- [ ] Change a fee; the next order charges it.
- [ ] Note for the demo: dashboard, orders, customers, riders, kitchen staff and complaints screens still show sample data (batches 5 and 9).

**Franchise admin**
- [ ] Log in with the given password, change it, and log in again.
- [ ] Create a store and submit it for approval; create a store manager for it; the manager can log in.
- [ ] Change a product's price for one store; the customer menu at that store's location shows it, and the order charges it.
- [ ] Close a store via operating hours; customers there cannot order.
- [ ] Dashboard KPIs match the orders placed during the test; no toasts appear for orders that do not exist (after batch 2).

**Store manager**
- [ ] Create a kitchen supervisor and kitchen staff; both can log in on another device.
- [ ] A new cash order appears in Incoming without refresh (socket) and makes a sound.
- [ ] Accept it with a supervisor; assign staff; move through stages to ready.
- [ ] If no rider accepts, assign one manually; confirm pickup.
- [ ] Request a refund on a delivered order; it shows in refund history.
- [ ] Attendance, shifts and inventory changes persist after logout and login.

**Kitchen supervisor and kitchen staff**
- [ ] The supervisor sees only orders assigned to them and can assign staff.
- [ ] Staff see only their own tasks; start and complete work.
- [ ] Both can clock in and out.
- [ ] Neither can open manager-only pages, even by typing the URL (backend 403).

**Customer (real phone)**
- [ ] OTP login: an SMS arrives, or the test number works.
- [ ] Choosing a location picks the expected store.
- [ ] The menu price equals the cart price, which equals the order total. Check a plain item, a sized pizza, toppings and extra cheese, a coupon, and the delivery-fee threshold.
- [ ] Place the order and watch tracking go through accepted → preparing → ready → picked up → delivered within 30 s of each step.
- [ ] The drop OTP shows on the tracking page; a push notification arrives on the device (FCM).
- [ ] Cancelling before acceptance works.

**Delivery partner (real phone)**
- [ ] Sign up and upload documents; super admin approves; the rider logs in and goes online.
- [ ] An order offer arrives by socket and push; accept it.
- [ ] Map navigation and live location work; the customer sees the rider moving.
- [ ] Reached pickup → pickup → reached drop → enter the customer's OTP → complete. With a wrong OTP, completion is refused.
- [ ] Cash collection updates the pocket balance and cash limit; QR payment blocks completion until paid.
