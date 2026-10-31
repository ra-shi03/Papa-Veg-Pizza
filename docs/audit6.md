# Audit 6: role-by-role completion of v1

Audited: a clean `git archive` export of commit `b50b89d` (the deployed commit). The working tree was not counted.
Scope: CLAUDE.md v1. Deferred and excluded: finance, marketing, reports, rewards.

Method: every frontend call matched to a registered Express route by method and path (779 routes, 886 call sites), then
each screen and flow read by hand. On the export, the backend suite passed (`TZ=UTC npm test`: 824 tests, 824 pass, 0 fail)
and the frontend built (`npm run build`). Nothing was run against the deployed server or a phone, so server settings and
device behaviour are in the manual checklist (section 15).

Path prefixes used in the tables:

| Prefix | Folder |
|---|---|
| `U/` | `Frontend/src/modules/Food/pages/user/` |
| `S/` | `Frontend/src/modules/Food/pages/store-manager/` |
| `F/` | `Frontend/src/modules/Food/pages/franchise-admin/` |
| `A/` | `Frontend/src/modules/Food/pages/superadmin/` |
| `D/` | `Frontend/src/modules/DeliveryV2/pages/` |

Endpoints are shown without `/api/v1`. Status words: DONE, PARTIAL, MISSING (no working feature, including a screen that
only shows mock data), BROKEN (present but fails or does the wrong thing).

---

## Decisions after this audit

Taken by the project owner after the audit was committed. The figures below describe `b50b89d` and were not recalculated.

| Question | Decision | Effect |
|---|---|---|
| Full rider numbers | Left to engineering. **Keep:** the store manager sees the full rider phone (needed to call the rider, documents stay hidden); the franchise admin sees full Aadhaar, PAN and licence numbers only in the one-rider verification view, not in lists | No code change beyond the working tree. Get a legal check on showing the full Aadhaar number before launch |
| What a kitchen supervisor sees | **Only the store orders the store manager assigned to them** | CLAUDE.md updated. Order by id, priority, delivery reads, customers, complaints, reviews, dashboard widgets and shortages now follow it. Section 4 C gaps closed |
| Customer screen for complaints | **Approved, including sending complaints** | New `U/complaints/MyComplaints.jsx`. Section 2 steps 17 and flow 6 link 8 closed; complaints can only be raised against the customer's own order |

---

## Working tree review

Review of the 8 backend source files in section 11 and `GET /food/zones/public`, before committing them. Critical: none.

**Checked and fine:** `?includeUnapproved` goes through `franchiseFilter` (own franchise, super admin all; only the exact value
`true` counts; test covers another franchise). `GET /food/zones/public` returns only id, name, service location and polygon
(test asserts the exact keys). A manager on an unapproved store is created `Pending Approval` with an inactive user, whatever
status is sent, and an edit cannot make them Active; approval activates them. `CREATABLE_MANAGER_FIELDS` and
`UPDATABLE_STORE_FIELDS` block mass assignment (`approvalStatus`, `franchiseId`, `userId`, `role`). Customers cannot order at an
unapproved store (`ORDERABLE`). Lists never contain Aadhaar, PAN or licence numbers (new test); store manager full phone,
supervisor and franchise admin masked (`nearby-people.test.js`).

### High (fixed, with tests)

| # | Issue | Fix |
|---|---|---|
| H1 | **A franchise admin could widen its own rider scope with a Draft store.** `franchiseRiderFilter` counted every store of the franchise, and a Draft store needs no approval and can be placed anywhere. Result: full Aadhaar, PAN and licence numbers and documents of unclaimed riders in any city, and the power to approve or reject them. `deliveryContext` had the same gap for `/store/riders` and `/store/rider/:id` | Only approved stores count, in `franchiseRiderFilter`, `franchiseDeliveryPartners` and the franchise branch of `deliveryContext`. Test: `rider-approval.test.js` |
| H2 | **A store's manager kept access after the store stopped being approved.** Rejecting or requesting changes on an approved store left the team Active, able to sign in and keep working | `moveStoreTeam`: rejection and request for changes move Active team members to `Pending Approval` and deactivate their users (open sessions end at once, `authMiddleware` checks per request); approval restores them; Suspended stays Suspended. Test: `store-list-unapproved.test.js` |

Both tests were confirmed to fail without the fixes.

### Medium (not fixed)

1. **Moving an approved store reopens H1.** `latitude`, `longitude` and `city` stay editable after approval with no re-approval, so a franchise admin can move an approved store and reach the riders there. Decide: lock them, or require re-approval.
2. **The Draft store trick still works on two other reads,** which are outside these files: `/food/store/customers/orders?storeId=` (`customerContext`: names with masked phone and email of nearby customers) and `storeScope` dashboard widgets such as `rider-roster`. Same one-line filter.
3. **Full ID numbers reach every nearby franchise before a rider is claimed.** Needed to verify a pending rider, but it also applies to approved riders with no franchise. Limit to pending riders plus the claiming franchise.
4. **`GET /store/rider/:id` returns email, home address, vehicle number and selfie to a kitchen supervisor** (phone is masked, these are not; the screen is manager-only), and returns them to store managers for pending riders too, although the request was "after approval".
5. **Approving with a different manager email creates a second login.** With a manager already on the store, `adminEmail` that differs creates an active user with a temp password and a store manager role but no `StoreManager` record; an email of an existing user gives that user the role. `AppFranchiseModal` pre-fills the field and lets it be edited (super admin only).
6. **Approve has no status check,** so a Draft store can be approved directly, skipping the rule that a store needs a manager before it is submitted. `store-list-unapproved.test.js` currently relies on this.
7. **Existing data:** a manager marked Active on an unapproved store before this deploy can still sign in until that store is next rejected or approved. Check production once before deploying.
8. **`join-requests` gives a franchise admin the full phone and email** in a list, while `partners` masks the phone.

### Low (not fixed)

1. `createStoreManager` is not a transaction: a failed save leaves a user behind, and the email then reports "already exists".
2. Creating a manager with no `status` on an approved store: record Active, user inactive, so they cannot sign in.
3. A manager moved from an unapproved to an approved store with no `status` stays `Pending Approval`. A Suspended manager edited while the store is unapproved becomes Pending, and approval then activates them.
4. `updateStoreManager` does not check that the target store has no manager, so a store can end up with two.
5. `moveStoreTeam` and `store.save()` are not one transaction.
6. `GET /stores` passes `search` into `$regex` unescaped (signed-in admins only).
7. The 409 on store creation confirms that a code or phone exists in another franchise.
8. `GET /food/zones/public` has no result limit; only the global rate limit applies.

---

## 1. Summary

| Role | v1 screens | Completion at `b50b89d` | If the working tree is committed |
|---|---|---|---|
| Customer | 47 | **84%** | 84% |
| Store manager | 29 | **72%** | 72% |
| Kitchen supervisor | 20 | **78%** | 78% |
| Kitchen staff | 14 | **68%** | 68% |
| Rider | 23 | **98%** | 100% |
| Franchise admin | 25 | **40%** | 46% |
| Super admin | 35 | **69%** | 73% |
| **All screens** (each counted once) | **159** | **74%** | **76%** |

The calculation is in section 12. The percentages measure wiring to real data, not correctness: the rider's 98% sits next
to a high-severity scope bug.

**Not ready for a client demo.** The five blockers:

1. **Every customer order carries a developer's real name and phone.** `U/cart/CheckoutModal.jsx:46-48` hardcodes the
   default contact name, phone and email. They change only if the customer edits them by hand, so the store, the rider and
   tracking see that person's details. The same file invents an Indore address (`:43`) and the street "abc" (`:111`).
2. **Any approved rider sees and can accept any unassigned order, with the customer's details.**
   `GET /food/delivery/orders/available` and `PATCH /food/delivery/orders/:id/accept` have no nearby or franchise check, and
   the list populates the customer's name, phone and email. The delivery home screen polls this list and pops the first
   order as an offer (`D/DeliveryHomeV2.jsx:607`).
3. **The deployed commit lacks the flows you asked for.** Unapproved stores are hidden from the store list and the manager
   picker, the rider action buttons are clipped by the table, and maps break after another admin page. All of this is fixed
   only in the working tree.
4. **The store panel looks offline, and kitchen staff land on a page of errors.** Ten socket hooks connect without a token,
   so the server refuses them: a permanent red OFFLINE badge on kitchen and delivery screens. Kitchen staff are sent to the
   dashboard after login, and every widget there returns 403 for that role.
5. **The super admin's first screens are hardcoded.** The dashboard, All Orders, Order Tracking and Customers run on
   hardcoded data, although the endpoints exist.

### Corrections to my earlier reports

| What I said | What the code does |
|---|---|
| Commits `7539cbc` and `b50b89d`: a far rider, or one claimed by another franchise, is "never offered" the order | True only for the dispatch path. The rider app's poll of `/orders/available` and the accept route have no such filter (blocker 2) |
| "Indore fallback removed" from checkout | Partly. `CheckoutModal.jsx:43` still starts from an Indore address unless localStorage has `deliveryAddress` |
| Batch 2: no invented live data in admin panels | `F/staffManagement/KitchenStaff.jsx:177-193` still fires fake socket toasts from `Math.random`, not gated |
| Batch 2 removed mock paths safely | Removing the mock path from the store socket hooks exposed that they never connect. That is the OFFLINE badge in your screenshots. I did not catch it then |
| Blocker 2 below, and section 6: the delivery home screen polls the list and pops the first order as an offer, so far riders were being offered other stores' orders in the real app | **Wrong about the popup.** The API returns the list under `data.data`, but `DeliveryHomeV2.jsx` read only `docs` or `items`, so the poll never showed an offer; offers reached riders only by socket. The real problems were that any rider's token could read the list with customer details, and that accept had no scope. Found while fixing batch 3, which also made the poll work |
| Your prompt counted ~27 uncommitted files | The working tree has 42 (40 modified, 2 new). All are listed in section 11 |

---

## 2. Customer (user app)

### A and B. Journey

| # | Step | Status | Screen | Endpoints | Reason |
|---|---|---|---|---|---|
| 1 | Log in with OTP | DONE | `U/auth/Login.jsx`, `U/auth/OTP.jsx` | `POST /food/auth/user/send-otp`, `verify-otp` | The Truecaller button still uses `services/truecallerMock` and only shows a message; the route returns 501 |
| 2 | Set location | DONE | `U/location/LocationSetup.jsx`, `DeliveryLocation.jsx` | `GET/POST /food/user/addresses` | |
| 3 | See home | PARTIAL | `U/home/Home.jsx` | `/settings/home-page`, `/food/admin/products/public`, `/food/admin/menu/public`, `/settings/coupons/public` | Built-in coupons (WELCOME50, PAPAVEG100; about lines 300-340), `localStorage pvp_coupons` (`:274`, `:351`, `:724`), first paint from `HomeData` |
| 4 | Browse menu | DONE | `U/home/MenuList.jsx` | `/food/admin/menu/public`, `/food/admin/products/public`, `/food/combos/public` | Price risk: see section 9, flow 5 |
| 5 | Search | PARTIAL | `U/search/UserSearchPage.jsx`, `components/user/SearchOverlay.jsx`, `MenuSearchOverlay.jsx` | `/settings/search-config/public`; **missing** `GET /food/restaurant/dishes/public` | `pvp_products_v2` in localStorage (`UserSearchPage.jsx:21,58`; `MenuSearchOverlay.jsx:431`) |
| 6 | Categories, Under 250, Gourmet | PARTIAL | `U/Categories.jsx`, `CategoryPage.jsx`, `Under250.jsx`, `Gourmet.jsx` | **missing** `/food/restaurant/categories/public`, `/food/hero-banners/under-250/public`, `/food/hero-banners/gourmet/public`, zone detect | Called paths are not registered |
| 7 | Open a product from a banner | BROKEN | `U/ProductDetail.jsx` | none | Hardcoded `productsData` (`:22,100`); home banners link with a Mongo id (`Home.jsx:1194`) that never matches |
| 8 | Combos | DONE | `U/ComboPage.jsx`, `ComboBuilder.jsx` | `/settings/combo-page`, combos | |
| 9 | Cart and coupon | PARTIAL | `U/cart/Cart.jsx` | `POST /food/orders/calculate`, `/food/offers/public`, `/food/stores/slots` | Totals are server-quoted. Item rows use local prices, static `ALL_PRODUCTS` (`:22`), `pvp_products_v2` (`:419`) |
| 10 | Save an address | DONE | `U/cart/SelectAddress.jsx`, `AddressSelectorPage.jsx` | `POST/PATCH/DELETE /food/user/addresses` | |
| 11 | Checkout contact and address | **BROKEN** | `U/cart/CheckoutModal.jsx` | `/food/stores/resolve` | Hardcoded developer contact (`:46-48`), Indore default (`:43`), street "abc" (`:111`) |
| 12 | Place the order | DONE | `CheckoutModal.jsx` | `POST /food/orders` | Server pricing holds. Cash only (`:178`); online payment is an open decision |
| 13 | Track, see status | DONE | `U/orders/OrderTracking.jsx`, `profile/TrackOrder.jsx` | `GET /food/orders/:id`, polling plus socket | |
| 14 | See drop OTP | DONE | `OrderTracking.jsx:396-411` | `GET /food/orders/:id`, socket `delivery_drop_otp` | |
| 15 | Cancel | DONE | `OrderTracking.jsx:1231` | `PATCH /food/orders/:id/cancel` | Server allows only from `created` |
| 16 | History, invoice, rate, reorder | DONE | `U/orders/Orders.jsx`, `OrderInvoice.jsx`, `UserOrderDetails.jsx` | `GET /food/orders`, `PATCH /food/orders/:id/ratings` | Reorder rebuilds the cart from the order; check by hand |
| 17 | Raise a complaint | PARTIAL | `U/complaints/SubmitComplaint.jsx` | `POST /food/user/support/ticket` | Raising works. **No screen shows the store's reply**: `supportAPI.getMyTickets` has no caller |
| 18 | Get help on an order | BROKEN | `U/help/OrderHelp.jsx` | none | Reads `OrdersContext` (localStorage `userOrders`), not the API |
| 19 | FAQ | MISSING | `U/profile/FAQ.jsx` | none; `/settings/faqs/public` exists | Hardcoded `FAQ_DATA` (`:17`) |
| 20 | Request a refund | MISSING | no screen | `POST /food/user/refunds` exists, no caller | Finance is deferred; see flow 6 |
| 21 | Profile, terms, logout | PARTIAL | `U/profile/ProfileDetails.jsx`, `EditProfile.jsx`, `Terms.jsx`, `Logout.jsx` | `/food/user/profile`, settings pages | Terms falls back to `constants/termsData`; the others are real |

### C. Role and scope

`/food/orders/*` and `/food/user/*` require the customer role and filter by the token's user. Gaps:

- **New, medium:** `POST /food/user/support/ticket` does not check that `orderId` belongs to the caller
  (`supportTicket.controller.js:26-32` uses `findById`). A customer can file complaints against another customer's order, and
  they appear in that store's list.
- Open from audit3: L5 (offer claim open to any signed-in role, `settings.routes.js:121`), L6 (`menuStoreId` does not check
  that `?storeId=` is approved and active).

### D. Depends on

| On | Link | Works? |
|---|---|---|
| Super admin content, products, fees | settings and catalogue public routes | Yes, apart from the 5 missing paths |
| A store that is approved, open and near | `/food/stores/slots`, `/resolve` | Yes |
| Store manager to accept; an active supervisor must exist | `PATCH /food/store/orders/:id/accept` | Yes |
| Rider | Dispatch and rider routes | Works, with the scope bug in section 6 |
| Store to answer complaints | `FoodSupportTicket` | One way only: the customer never sees the answer |

---

## 3. Store manager

### A and B. Journey

| # | Step | Status | Screen | Endpoints | Reason |
|---|---|---|---|---|---|
| 1 | Log in | DONE | `S/auth/StoreLogin.jsx` | `POST /food/auth/store/login` | |
| 2 | Dashboard | PARTIAL | `S/dashboard/StoreOperationsDashboard.jsx` | `/store/dashboard/*`, `/stores/list`; **missing** `POST /inventory/reorder`, `POST /notifications/read`, `POST /notifications/delete` | Hardcoded store list as the default (`:29-35`); the backend treats a non-id as "my store". Reorder and notification actions fail |
| 3 | Create supervisor and staff | DONE | `S/staffManagement/KitchenStaff.jsx` | `POST/GET/PATCH/DELETE /food/store/staff` | Confirm-password field is only in the working tree |
| 4 | Shifts and attendance | DONE | `S/staffManagement/ShiftManagement.jsx`, `Attendance.jsx` | `/store/shifts*`, `/store/attendance*` | |
| 5 | Accept or reject an order | DONE | `S/orders/IncomingOrders.jsx` | `PATCH /food/store/orders/:id/accept`, `/reject`, `/reopen` | Accept needs an active supervisor |
| 6 | Follow active orders, assign staff | DONE | `S/orders/ActiveOrders.jsx` | `/assign-staff`, `/stage`, `/priority`, `/pause`, `/delay` | |
| 7 | Watch the kitchen | PARTIAL | `S/kitchenOperations/KitchenQueue.jsx`, `PreparationBoard.jsx`, `PizzaStation.jsx`, `BakingStation.jsx`, `PackagingStation.jsx` | `/food/store/kitchen/*` | Data is real and polled. Socket refused: permanent OFFLINE badge (section 9, flow 1) |
| 8 | Handle delayed orders | PARTIAL | `S/kitchenOperations/DelayedOrders.jsx` | `/food/store/kitchen/delayed-orders`, `escalate`, `reassign` | Pickers from `kitchenOperations/mockData` (`DelayedOrdersTable.jsx:20,36`, `EscalationModal.jsx:4,107`) |
| 9 | Ready orders and assign a rider | PARTIAL | `S/orders/ReadyOrders.jsx`, `S/deliveryOperations/AssignRider.jsx` | `GET /store/orders/ready`, `/store/delivery/available-riders`, `POST /store/delivery/assign` | Works. OFFLINE badge; `useAvailableRiders` has no polling |
| 10 | See nearby riders | PARTIAL | `S/deliveryOperations/RiderAvailability.jsx` | `GET /store/riders`, `/store/rider/:id` | OFFLINE badge, `useRiders` needs manual refresh. Rider details cards improved only in the working tree |
| 11 | Track deliveries, reset a locked OTP | PARTIAL | `S/deliveryOperations/DeliveryTracking.jsx` | `GET /store/delivery/live`, `/store/tracking/:id` | **No screen calls `POST /store/orders/:id/reset-drop-otp`**, so a locked drop OTP cannot be reset |
| 12 | Delivery issues | PARTIAL | `S/deliveryOperations/DeliveryIssue.jsx` | `/store/delivery/issues*` | OFFLINE badge; data real |
| 13 | Completed, cancelled, refund note | PARTIAL | `S/orders/CompletedOrders.jsx`, `CancelledOrders.jsx` | `POST /store/orders/:id/refund` | Lists are real. A refund only records a pending request that no screen processes |
| 14 | Inventory | PARTIAL | `S/inventory/IngredientStock.jsx`, `StockRequests.jsx`, `WasteManagement.jsx`, `LowStockAlerts.jsx`, `IngredientShortages.jsx` | `/food/store/inventory/*` | Mostly real. Supplier filter from `inventory/mockData` (`InventoryFilters.jsx:11`); affected orders from `mockAffectedOrders` (`IngredientShortages.jsx:29,350`) |
| 15 | Customers and nearby people | PARTIAL | `S/customers/CustomerOrders.jsx` | `/food/store/customers/*` | KPI and invoice from `customers/mockData` frozen date (`:21,67-80,158`); new/nearby tag and area are returned but not displayed |
| 16 | Complaints | PARTIAL | `S/customers/Complaints.jsx` | `/food/store/complaints*`, `/resolve` | `/respond` has no caller. KPI from `mockData` (`:17,54`), resolver dropdown from `mockStaff` (`ResolveComplaintModal.jsx:4,31,185`) |
| 17 | Reviews | PARTIAL | `S/customers/Reviews.jsx` | `/food/store/reviews*` | KPI from `mockData` (`:19,64`) |
| 18 | Own tasks and profile | DONE | `S/myTasks/MyTasks.jsx`, `S/profile/Profile.jsx` | `/tasks*`, profile routes | |

PHASE2: `S/staffManagement/Performance.jsx` (`GET /store/performance`, `/store/performance/:id` do not exist; deferred).

### C. Role and scope

Store routes use `requireRoles` and take `storeId` from the token, never the body. The franchise and super admin variants
check `?storeId`. Gaps:

- The UI limits delivery, complaints and customer screens to the manager, but the backend also lets the supervisor read
  `/store/riders`, `/store/delivery/*`, `/food/store/complaints*` and `/food/store/customers/*`. Writes there are refused
  in the service layer (`canWrite`, `mustManager`), including `/store/orders/:id/refund` and `reset-drop-otp`, although the
  route lists the role. It stays inside the store. Decide whether the backend should match the UI.
- Open from audit3: M6 (staff `status: 'Inactive'` causes a 500, `kitchenStaff.controller.js:402`), M7 (staff delete is a hard
  delete, `:535`), L2 (no schema validation), L10 (leave dates not stored).

### D. Depends on

| On | Link | Works? |
|---|---|---|
| Franchise admin creates the manager and the store is approved | `POST /store-managers`, `/store-approvals/:id/approve` | Yes, but at `b50b89d` a manager cannot be picked for an unapproved store from the UI |
| A supervisor exists before any order can be accepted | `findStaffMember(..., 'kitchen_supervisor')` | Works. A new store with no supervisor cannot accept orders |
| Riders near the store | `riderScope` | Works |
| Rider approval by a franchise | `status: approved` | Works; see section 6 gap on orphan riders |

---

## 4. Kitchen supervisor

### A and B. Journey

| # | Step | Status | Screen | Endpoints | Reason |
|---|---|---|---|---|---|
| 1 | Log in with the manager-issued password | DONE | `S/auth/StoreLogin.jsx` | `POST /food/auth/store/login` | |
| 2 | Dashboard | PARTIAL | `S/dashboard/StoreOperationsDashboard.jsx` | `/store/dashboard/*` | Only `SUPERVISOR_WIDGETS` are allowed (`dashboardAccess.js:18`). The same page requests the rest (today-sales, top-products and others) and gets 403, with no role check in the frontend |
| 3 | Clock in | DONE | `S/myTasks/MyTasks.jsx` | `POST /store/attendance/clock-in`, `clock-out` | |
| 4 | See orders | PARTIAL | `S/orders/IncomingOrders.jsx`, `ActiveOrders.jsx`, `ReadyOrders.jsx`, `CompletedOrders.jsx`, `CancelledOrders.jsx` | `GET /food/store/orders` | `incoming` returns `[]` for non-managers and other views show only orders assigned to this supervisor. CLAUDE.md says "sees store orders": **decide which is right** |
| 5 | Assign staff to an order | DONE | `S/orders/components/AssignStaffModal.jsx` | `PATCH /food/store/orders/:id/assign-staff`, `GET .../team` | Limited to that order's supervisor |
| 6 | Run the kitchen boards | PARTIAL | `S/kitchenOperations/*` (5 stations) | `/food/store/kitchen/*` | OFFLINE badge |
| 7 | Reject an item | PARTIAL | `KitchenQueue.jsx` | `POST /food/store/kitchen/orders/item-reject` | Marks the item rejected but does not change the order total: the customer pays full price |
| 8 | Delayed orders | PARTIAL | `S/kitchenOperations/DelayedOrders.jsx` | `delayed-orders`, `escalate`, `reassign` | Mock pickers, as in section 3 step 8 |
| 9 | Quality check, mark ready | DONE | `S/kitchenOperations/PackagingStation.jsx`, `MyTasks.jsx` | `quality-checks`, `PUT /food/store/kitchen/orders/:id/ready`, `PATCH .../stage` | |
| 10 | Inventory | PARTIAL | `S/inventory/*` | `/food/store/inventory/*` | Mock supplier filter and affected orders, as in section 3 step 14 |
| 11 | View attendance | DONE | `S/staffManagement/Attendance.jsx` | `GET /store/attendance` | |
| 12 | Profile and password | DONE | `S/profile/Profile.jsx`, `tabs/SecurityTab.jsx` | profile routes | |

### C. Role and scope

Store comes from the token. Write actions check `isOrderSupervisor`, except:

- **Medium:** `GET /food/store/orders/:orderId` (`storeOrders.service.js:284`) has no check beyond the store, so a supervisor
  can read any order of the store by id.
- **Medium:** `PATCH /food/store/orders/:orderId/priority` (`setPriority`, `:535`) lets a supervisor change any store order.
  `setPaused` and `logDelay` do check.
- `toOpsOrder` sends the customer's phone to kitchen roles, who do not need it.

### D. Depends on

| On | Link | Works? |
|---|---|---|
| Store manager creates the account | `POST /food/store/staff` | Yes |
| Manager names this supervisor on accept | `kitchen.supervisor.userId` | Yes |
| Staff exist to assign | `GET /food/store/orders/team` | Yes |

---

## 5. Kitchen staff

### A and B. Journey

| # | Step | Status | Screen | Endpoints | Reason |
|---|---|---|---|---|---|
| 1 | Log in | DONE | `S/auth/StoreLogin.jsx` | `POST /food/auth/store/login` | |
| 2 | Landing page after login | **BROKEN** | `S/dashboard/StoreOperationsDashboard.jsx` | `/store/dashboard/*` | `StoreLogin.jsx:75` sends everyone to the dashboard. `storeDashboardRouter` excludes `KITCHEN_STAFF`, so every widget returns 403. The `accessDenied` event has no listener |
| 3 | Clock in | DONE | `S/myTasks/MyTasks.jsx`, `profile/tabs/AttendanceTab` | `POST /store/attendance/clock-in`, `clock-out` | |
| 4 | See assigned tasks | DONE | `MyTasks.jsx` | `GET /tasks`, `/tasks/stats`, `/tasks/notifications` | |
| 5 | Work a station | PARTIAL | `S/kitchenOperations/KitchenQueue.jsx`, `PreparationBoard.jsx`, `PizzaStation.jsx`, `BakingStation.jsx`, `PackagingStation.jsx` | `/food/store/kitchen/*` | Filtered to their slots, polled. OFFLINE badge |
| 6 | Start, complete, delay, ask for reassign | DONE | `MyTasks.jsx`, `S/orders/ActiveOrders.jsx` | `PATCH /tasks/:id/start`, `complete`, `delay`, `request-reassign`, `PATCH /food/store/orders/:id/stage` | |
| 7 | Request stock | DONE | `S/inventory/StockRequests.jsx`, `MyTasks.jsx` | `POST /food/store/kitchen/inventory-requests` | |
| 8 | Stock, waste, shortages | PARTIAL | `S/inventory/IngredientStock.jsx`, `WasteManagement.jsx`, `IngredientShortages.jsx` | `/food/store/inventory/*` | Allowed by the router but hidden from the sidebar, so reachable only by URL; the same mock items apply |
| 9 | Profile and password | DONE | `S/profile/Profile.jsx` | profile routes | |

### C. Role and scope

Tasks and stations are filtered to the staff member's slots and store (`findVisibleOrder`). Gaps:

- **Medium:** `GET /food/store/orders/:orderId` lets staff read any order of the store by id, including the customer's phone
  (`toOpsOrder`). CLAUDE.md says "sees only assigned tasks".
- `setPriority` refuses staff correctly.

### D. Depends on

| On | Link | Works? |
|---|---|---|
| Manager creates the account | `POST /food/store/staff` | Yes |
| Supervisor assigns a slot | `/assign-staff` creates `KitchenTask` (`storeOrders.service.js:468`) | Yes |
| Manager assigns a shift, for clock-in | `assignedShiftOf` | Yes |

---

## 6. Rider

### A and B. Journey

| # | Step | Status | Screen | Endpoints | Reason |
|---|---|---|---|---|---|
| 1 | Sign up | DONE | `D/auth/SignIn.jsx`, `OTP.jsx`, `SignupStep1.jsx`, `SignupStep2.jsx` | `POST /food/auth/delivery/send-otp`, `verify-otp`, `POST /food/delivery/register` | Public upload through `safeUpload` |
| 2 | Wait for approval | PARTIAL | `D/auth/OTP.jsx:235` | `verify-otp` returns `pendingApproval` | A suspended rider is told "pending". **A pending rider whose city matches no store is visible to no franchise and cannot be approved by anyone** (see C) |
| 3 | Log in when approved | DONE | `D/auth/OTP.jsx` | `POST /food/auth/delivery/verify-otp` | |
| 4 | Go online, send location | DONE | `D/DeliveryHomeV2.jsx`, `useReportLocationOnOpen` | `PATCH /food/delivery/availability` | |
| 5 | See the map | PARTIAL | `components/map/LiveMap.jsx:159` | **missing** `GET /food/zones/public` | Zone overlay 404s at `b50b89d`; added in the working tree |
| 6 | Receive an offer | **BROKEN** | `D/DeliveryHomeV2.jsx:607` | socket `new_order_available` (scoped), `GET /food/delivery/orders/available` (**not scoped**) | Any approved rider with capacity gets every unassigned order in the system |
| 7 | Accept | **BROKEN** | `DeliveryHomeV2.jsx` | `PATCH /food/delivery/orders/:id/accept` | No offered-to, nearby or franchise check |
| 8 | Reach store, pick up | DONE | `DeliveryHomeV2.jsx` | `reached-pickup`, `confirm-pickup` | Step order enforced (`rider-flow.test.js`) |
| 9 | Reach customer, enter OTP, complete | DONE | `DeliveryHomeV2.jsx` | `reached-drop`, `verify-drop-otp`, `complete` | The dev-only SIM button is gated by `import.meta.env.DEV` |
| 10 | History, pocket | DONE | `DeliveryHomeV2.jsx`, `D/pocket/*` (7) | `/food/delivery/wallet*` and others | |
| 11 | Profile, bank, documents | DONE | `D/profile/*` | `/food/delivery/profile*` | |
| 12 | Support and ID card | DONE | `D/help/*` | `/food/delivery/support-tickets*` | |

### C. Role and scope

All rider routes require `DELIVERY_PARTNER` and an approved status. Step actions are limited to the rider's own order. Gaps:

- **High, new:** `listOrdersAvailableDelivery` (`order-delivery.service.js:388-413`) filters only on `dispatch.status:
  'unassigned'` and the order status, then populates `userId 'name phone email'`. Customer details of all franchises reach
  any approved rider before accept.
- **High, new:** `acceptOrderDelivery` lets such a rider take the order, so a far rider or one claimed by another franchise
  can accept it.
- **Medium, new:** a pending rider with no city match has no GPS (only approved riders can send it), so no franchise sees
  them and the super admin is read-only. They are stuck with no path forward.
- Open from audit3: M8 (rider gets customer email, `order.service.js:602`).

### D. Depends on

| On | Link | Works? |
|---|---|---|
| A franchise admin near the rider's city approves | `PATCH /food/admin/delivery/:id/approve` | Backend yes. At `b50b89d` the 3-dot menu is clipped by the table (fixed in the working tree) |
| Store accepts, so dispatch starts | `updateOrderStatusStore('confirmed')` | Yes. Retries need Redis, `BULLMQ_ENABLED` and the worker; the app's poll is the real fallback, which is why fixing the scope must keep offers working |
| Customer gives the OTP | `delivery_drop_otp`, tracking screen | Yes. If locked, no screen can reset it |

---

## 7. Franchise admin

### A and B. Journey

| # | Step | Status | Screen | Endpoints | Reason |
|---|---|---|---|---|---|
| 1 | Log in, forgot password | DONE | franchise login, `F/auth/AdminForgotPassword.jsx` | `POST /food/auth/franchise/login`, `/auth/admin/forgot-password/*` | |
| 2 | Dashboard | PARTIAL | `F/dashboard/FranchiseAdminDashboard.jsx` | `/admin/dashboard/*` | KPIs real. Reviews, complaints, notifications and refunds lists are empty outside mock mode (`:39-59`) |
| 3 | Create a store | PARTIAL | `F/storeManagement/Stores.jsx` | `POST /stores`, `GET /stores` | `GET /stores` returns only `approvalStatus: 'Approved'` (`store.controller.js:91`), so a new store vanishes from the list. Fixed in the working tree |
| 4 | Create a store manager | PARTIAL | `F/staffManagement/StoreManagers.jsx` | `POST /store-managers`, `GET /stores` | The picker has the same filter, so a new store cannot be chosen. Fixed in the working tree |
| 5 | Submit the store for approval | PARTIAL | `F/storeManagement/StoreApprovals.jsx` | `POST /store-approvals/:id/submit`, documents | Works, but a manager is not required at submit. Fixed in the working tree. `avgApprovalTime` is a backend constant "24.5" (`storeApproval.controller.js:125`) |
| 6 | Hours and store status | DONE | `F/storeManagement/OperatingHours.jsx` | `/stores/:id/hours`, `/stores/:id/status` | |
| 7 | Store pricing | DONE | `F/products/StorePricing.jsx` | `/store-pricing*`, `/bulk-price-update`, `/copy-pricing` | `storePricingService.js` still holds mock data but the hooks use only its change subscription |
| 8 | Approve, reject, suspend riders | PARTIAL | `F/staffManagement/DeliveryPartners.jsx`, `components/RiderVerificationDrawer.jsx` | `GET /food/admin/delivery/partners`, `/:id`, `PATCH /:id/approve`, `/reject`, `/suspend`, `/activate` | Backend real and tested. Row menu clipped by the table. Fixed in the working tree |
| 9 | Live orders (read-only) | DONE | `F/orders/LiveOrders.jsx` | `GET /food/franchise/orders` | Write actions blocked by `READ_ONLY` in `ordersQuery.js` |
| 10 | Completed and cancelled orders | PARTIAL | `F/orders/CompletedOrders.jsx`, `CancelledOrder.jsx` | `GET /food/franchise/orders` | Lists real. Analytics from `orders/mockOrders` |
| 11 | Order issues | MISSING | `F/orders/OrderIssues.jsx` | none | `orders/mockOrders`; new list endpoint needed |
| 12 | Customers | MISSING | `F/customers/CustomersList.jsx` | `/food/admin/customers` exists, not called | `customers/mockData.js` |
| 13 | Complaints | MISSING | `F/customers/CustomerComplaints.jsx` | `/food/admin/stores/complaints` exists, not called | `customers/mockData.js` |
| 14 | Reviews | MISSING | `F/customers/ReviewsRatings.jsx` | no franchise-scoped route (`/food/admin/stores/reviews` is super admin only) | `customers/mockData.js` |
| 15 | Kitchen staff | MISSING | `F/staffManagement/KitchenStaff.jsx` | `/food/admin/staff` exists, not called | `mockManagersData.js`, plus fake socket toasts (`:177-193`) |
| 16 | Catalogue | MISSING | `F/products/Products.jsx`, `Categories.jsx`, `Addons.jsx` | not called | `products/mockProducts.js`, localStorage |
| 17 | Inventory | MISSING | `F/inventory/Ingredients.jsx`, `StockLevels.jsx`, `LowStockAlerts.jsx`, `PurchaseRequests.jsx` | not called | `inventory/mockData.js`, `storeManagement/mockStoresData.js` |
| 18 | Store performance | DONE | `F/storeManagement/StorePerformance.jsx` | `/store-performance/*` | |
| 19 | Profile and password | DONE | `F/AdminProfile.jsx` | `PATCH /food/auth/admin/profile`, `change-password` | |

PHASE2: `F/customers/LoyaltyMembers.jsx`, `F/orders/RefundRequests.jsx`.

### C. Role and scope

`requireRoles('ADMIN')` with `attachFranchiseScope`; `franchiseFilter`, `withFranchiseScope` and `findScopedStore` narrow
queries, and `/food/franchise/orders` always filters on the token's franchise. Gaps:

- **Medium, new:** the rider pool is shared before a rider is claimed. Any nearby franchise can reject a pending rider, and
  that rejection is global. Franchise A can suspend an unclaimed approved rider, and franchise B (also near) can re-activate
  them.
- Low, new: approve and reject can race. `rejectDeliveryPartner` updates with no status condition after the guarded step.
- Open from audit3: M3 (bare upload at `storeApproval.routes.js:27`, `storeManager.routes.js:19,22`).

### D. Depends on

| On | Link | Works? |
|---|---|---|
| Super admin creates the franchise and the login | `POST /food/admin/franchises` | Yes |
| Super admin approves the store | `PATCH /store-approvals/:id/approve` | Yes |
| Territories and zones from the super admin | `/food/admin/territories`, `/zones` | Yes |
| Store managers report data | `/food/franchise/orders`, dashboards | Yes for orders and KPIs |

---

## 8. Super admin

### A and B. Journey

| # | Step | Status | Screen | Endpoints | Reason |
|---|---|---|---|---|---|
| 1 | Log in | DONE | admin login | `POST /food/auth/admin/login` | Session fix `ba5a93f` is in this commit |
| 2 | Dashboard | MISSING | `A/Dashboard/SuperAdminDashboard.jsx` | `/admin/dashboard/*` exists, not called | Hardcoded `kpis:131`, `inventory:193`, `systemAlerts:244`, `simulatedRiders:256`; only the theme save is real |
| 3 | User app and delivery app content | DONE | `A/user-app/*` (8), `A/delivery-app/*` (2) | `/settings/*` | |
| 4 | Content pages | PARTIAL | `A/settings/ContentManagement.jsx` | `/settings/*` | The tab at `:126` renders `ContentData.jsx`, which has no API call |
| 5 | Regions, zones, territories | PARTIAL | `A/franchiseManagement/RegionsZones.jsx`, `TerritoryManagement.jsx` | `/food/admin/regions`, `/zones`, `/territories` | Data real. Maps fail after another admin page (loader option conflict). Fixed in the working tree |
| 6 | Create a franchise admin | DONE | `A/userManagement/FranchiseList.jsx` | `POST/GET/PATCH/DELETE /food/admin/franchises` | Confirm-password only in the working tree |
| 7 | Approve stores | PARTIAL | `A/franchiseManagement/FranchiseApprovals.jsx` | `/store-approvals*` | Approve works. Franchise name is free text; the dropdown is in the working tree |
| 8 | See stores and managers | DONE | `A/franchiseManagement/FranchiseStores.jsx`, `A/userManagement/StoreManagers.jsx`, `StoreManagersList.jsx` | `/stores`, `/store-managers` | |
| 9 | Catalogue and fees | DONE | `A/productsManagement/*` (4), `A/settings/FeesAndCharges.jsx`, `AppConfiguration.jsx` | `/food/admin/products`, `/categories`, `/addons`, `/combos`, fees | |
| 10 | See riders, read-only | DONE | `A/userManagement/DeliveryPartnersManagement.jsx` | `GET /food/admin/delivery/partners`, `/:id`, `/join-requests` | Writes return 403 |
| 11 | See kitchen staff | MISSING | `A/userManagement/KitchenStaffManagement.jsx` | `/food/admin/staff` exists, not called | `INITIAL_STAFF:30` |
| 12 | See customers | MISSING | `A/userManagement/CustomerList.jsx`, `UserProfile.jsx` | `/food/admin/customers*` exists, not called | `INITIAL_CUSTOMERS:28`; `UserProfile.jsx` is commented out |
| 13 | See all orders | MISSING | `A/orderManagement/AllOrders.jsx` | `/food/admin/orders` exists, not called | `AllOrdersData` |
| 14 | Track an order | MISSING | `A/orderManagement/OrderTracking.jsx` | `/food/admin/orders/:id` exists, not called | `AllOrdersData` |
| 15 | Bulk orders | DONE | `A/orderManagement/BulkOrdersManagement.jsx` | `/food/admin/bulk-orders*` | |
| 16 | Complaints | MISSING | `A/support/CustomerComplaints.jsx` | `/food/admin/stores/complaints` exists, not called | Inline list `:80` |
| 17 | Feedback | MISSING | `A/support/FeedbackAndReview.jsx` | `/food/admin/stores/reviews` exists, not called | Local data |
| 18 | Disputes | MISSING | `A/orderManagement/Disputes.jsx` | none | `DisputesData`; decide whether this maps to complaints |

PHASE2: CustomerAnalysis, RefundRequests, PaymentGateways, CouponsManagement, Campaign, PushNotification, RewardsManagement.
Non-v1 mock: RolesPermissionManagement, Settings, NotificationsSettings, AuditLogs, FranchiseTicket, SupportRequests.

### C. Role and scope

`requireSuperAdmin` guards the admin router after the rider routes. The rider routes run before it and the controller
refuses every write for a super admin. Gaps:

- Low, new: `adminService.getDeliveryJoinRequests` takes an unescaped regex and status from the query (super admin only).
- Low: dead admin controllers remain (`updateDeliveryPartner` and others).
- Open from audit3: M3 (`admin.routes.js:262`, `settings.routes.js:30`, `dynamicHome`).

### D. Depends on

| On | Link | Works? |
|---|---|---|
| Franchise admin submits stores | `/store-approvals/:id/submit` | Yes |
| Franchise admins approve riders | Rider writes are theirs only | Yes, except the orphan rider case (section 6) |
| Real orders and customers in the data | Endpoints exist | The data exists; the screens do not read it |

---

## 9. Cross-role flows

### Flow 1: order, from placing to delivered

| # | Link | Status | Evidence |
|---|---|---|---|
| 1 | Customer places the order | **BROKEN** | `POST /food/orders` is correct and server-priced, but contact is hardcoded (`CheckoutModal.jsx:46-48`) and the address may be invented (`:43`, `:111`) |
| 2 | Store sees it | DONE | `GET /food/store/orders`, `order_event` socket with token (`S/api/storeOrdersApi.js:62`) |
| 3 | Store accepts and names a supervisor | DONE | `acceptOrder`, then `updateOrderStatusStore('confirmed')`, which also starts dispatch |
| 4 | Supervisor assigns staff | DONE | `assignStaff` for manager or that order's supervisor; creates `KitchenTask` |
| 5 | Staff prepares | PARTIAL | `updateKitchenStage`, `/tasks/*` work. Ten hooks call `io()` with no `auth` token and listen to events the server does not emit (`new_order_received`, `preparation_started`, `rider:online`). Kitchen data still polls via `refetchInterval` |
| 6 | Ready | DONE | `moveToStage` to `ready_for_pickup` |
| 7 | Rider offered | **BROKEN** | Dispatch (`order-dispatch.service.js`, `riderScope`) is scoped. The poll is not. Offers go out at accept, not at ready. **Scheduled orders dispatch immediately** (audit5 medium 1) |
| 8 | Pickup | DONE | `confirm-pickup` only from `ready_for_pickup` or `reached_pickup` |
| 9 | Drop OTP | PARTIAL | `verify-drop-otp` works. No screen for `reset-drop-otp` |
| 10 | Delivered | DONE | `complete` from `picked_up` or `reached_drop`, with OTP check |
| 11 | Customer sees status | DONE | `OrderTracking.jsx`: polling and socket |

Status names differ from CLAUDE.md. In code: `created` → `confirmed` → `preparing` → `ready_for_pickup` → `picked_up` →
`reached_drop` → `delivered`, and `cancelled_by_*`. The mapping is consistent; only the words differ.

### Flow 2: account chain

| # | Link | Status | Evidence |
|---|---|---|---|
| 1 | Super admin creates a franchise admin | DONE | `POST /food/admin/franchises`, login `POST /food/auth/franchise/login` |
| 2 | Franchise admin creates a store | PARTIAL | Store is created but hidden from the list until approved |
| 3 | Franchise admin creates a store manager | PARTIAL | Picker excludes unapproved stores. Your wanted order (store, manager, approval) needs the working tree |
| 4 | Store goes for approval, super admin approves | DONE | `/store-approvals/:id/submit`, `/approve`. Approval can also create the manager with a temp password |
| 5 | Manager logs in | DONE | `POST /food/auth/store/login` |
| 6 | Manager creates supervisor and staff | DONE | `POST /food/store/staff` uses the caller's store |
| 7 | Each logs in | PARTIAL | Login works. Kitchen staff then land on the broken dashboard |
| 8 | Password change | DONE | `AdminProfile.jsx`, `tabs/SecurityTab.jsx`. Not forced at first login (CLAUDE.md says "later") |

### Flow 3: rider signup to panels

| # | Link | Status | Evidence |
|---|---|---|---|
| 1 | Rider signs up | DONE | `POST /food/delivery/register`, status `pending` |
| 2 | Franchise admin approves | PARTIAL | Backend tested (`rider-approval.test.js`). Row menu clipped. Orphan pending riders have no approver |
| 3 | Rider goes online | DONE | `PATCH /food/delivery/availability` |
| 4 | Appears in store manager panel | PARTIAL | `GET /store/riders` tested. No auto refresh; OFFLINE badge |
| 5 | Appears in franchise admin panel | DONE | `GET /food/admin/delivery/partners`, tested |
| 6 | Super admin read-only | DONE | Tested 403 on writes |

### Flow 4: saved address to nearby customer

| # | Link | Status | Evidence |
|---|---|---|---|
| 1 | Customer saves an address | PARTIAL | `POST /food/user/addresses` with coordinates from `SelectAddress`. Checkout can save the invented Indore city or "abc" street |
| 2 | Store query finds them | DONE | `nearbyAddressFilter`, `storeCrm.service.js:188`, `nearby-people.test.js` |
| 3 | Store panel shows them | PARTIAL | Row appears in `CustomerOrders.jsx`. New/nearby tag and area are not displayed; KPI cards are mock |

### Flow 5: menu price = cart quote = charge

| # | Link | Status | Evidence |
|---|---|---|---|
| 1 | Menu shows store price | PARTIAL | `withMenuLocation` reads only `userLocation`, while `getCartCoords` tries `deliveryLocation.selectedAddress`, `user_location`, `userLocation`. With another key, or all stores closed, `menuStoreId` returns null and the menu shows catalogue prices |
| 2 | Cart quote | PARTIAL | Total from `POST /food/orders/calculate`. Item rows use local prices. Quote store comes from `/food/stores/slots` |
| 3 | Charge = quote | DONE | Same `buildOrderPricing`; `quote-equals-charge.test.js`, `menu-pricing.test.js`. Client prices ignored |

### Flow 6: cancel, reject item, refund, complaint

| # | Link | Status | Evidence |
|---|---|---|---|
| 1 | Customer cancels | DONE | `PATCH /food/orders/:id/cancel`, from `created` only |
| 2 | Store rejects the order | DONE | `PATCH /food/store/orders/:id/reject`, reopen within 5 minutes |
| 3 | Kitchen rejects an item | PARTIAL | Item marked and logged, customer optionally notified. **Total not changed** |
| 4 | Refund requested | PARTIAL | `POST /store/orders/:id/refund` records `pending`. No customer screen |
| 5 | Refund processed | MISSING | `/food/admin/refunds*` exist, but `A/orderManagement/RefundRequests.jsx` is PHASE2 mock. Requests dead-end |
| 6 | Complaint raised | PARTIAL | `POST /food/user/support/ticket`; no ownership check |
| 7 | Store responds and resolves | PARTIAL | Resolve works from the screen. `POST /food/store/complaints/:id/respond` exists but no screen calls it, so a store cannot send a reply before resolving. Mock KPI and resolver dropdown |
| 8 | Customer sees the answer | MISSING | No caller of `getMyTickets` |
| 9 | Franchise and super admin see it | MISSING | Both screens are mock |

---

## 10. Status of earlier audits, and security re-check

### 10.1 Audit4 batches

| Batch | Status at `b50b89d` |
|---|---|
| 1 Rider order integrity | **Fixed** (`0df705e`). Step order holds. The offer list and accept scope are a new, separate finding |
| 2 No invented live data | **Mostly fixed** (`f00d9df`). New: fake toasts in `F/staffManagement/KitchenStaff.jsx` |
| 3 Customer price | **Fixed** for quote = charge (`1288e14`, `ab8c710`). Menu location key risk still open |
| 4 User app missing endpoints | **Open**, except Nutrition (real now) and `zones/public` (working tree only) |
| 5 Super admin orders, customers, dashboard | **Open** |
| 6 Franchise CRM | **Open** |
| 7 Franchise orders | **Partly**: read-only guards done, analytics mock, issues mock |
| 8 Franchise catalogue and inventory | **Open** |
| 9 Super admin people and complaints | **Partly**: riders done; kitchen staff, complaints, feedback, disputes open |
| 10 Franchise staff lists | **Partly**: riders done; kitchen staff open |
| 11 Store leftovers | **Open** |
| 12 Security mediums | **Partly**: N-L1 fixed, others open. M8 is worse because of the available list |
| 13-15 Lows, dead code, out-of-scope screens | **Open** |

### 10.2 Audit3 items

M3, M4, M5, M6, M7, M8, M9, L1, L2, L3, L4, L5, L6, L7, L8, L10: all **still open**, as listed in audit4 section 6.
Confirmed again at `b50b89d`: bare uploads (`storeApproval.routes.js:27`, `storeManager.routes.js:19,22`, `settings.routes.js:30`,
`admin.routes.js:262`), `kitchenStaff.controller.js:402,535`, `order.service.js:602`, `settings.routes.js:121`,
`fcm.routes.js:33,41,57` (token preview in logs).

### 10.3 Audit5 items

| Item | Status |
|---|---|
| Medium 1: scheduled orders run immediately | Open |
| Medium 2: `PUT /settings/delivery-login` no validator | Open |
| Medium 3: `GET /settings/delivery-login` writes | Open |
| Medium 4: fake coupons on Home and Coupons | Open (`Home.jsx`, `profile/Coupons.jsx:84`) |
| Medium 5: checkout "abc" street | Open, now part of blocker 1 |
| Lows 1-5 | Open |

### 10.4 New in this audit

| Sev | Finding | Where |
|---|---|---|
| High | Hardcoded developer contact on every order; privacy issue | `CheckoutModal.jsx:46-48` |
| High | Rider offer list and accept not scoped; customer details exposed | `order-delivery.service.js:388-413`, accept |
| High for demo | 10 store socket hooks never connect | `S/kitchenOperations/hooks/*`, `S/deliveryOperations/hooks/*` |
| High for demo | Kitchen staff dashboard is all 403 | `StoreLogin.jsx:75`, `dashboard.routes.js:11` |
| Medium | No UI for `reset-drop-otp` | no caller in `Frontend/src` |
| Medium | `rejectItems` does not reprice | `kitchenOps.service.js:155` |
| Medium | Kitchen roles read any store order, with phone | `storeOrders.service.js:284` |
| Medium | Supervisor changes priority on any store order | `storeOrders.service.js:535` |
| Medium | Complaint can target another customer's order | `supportTicket.controller.js:26-32` |
| Medium | Customer never sees complaint replies | no caller of `getMyTickets` |
| Medium | Shared rider pool: global reject, cross-franchise re-activate | `franchiseRiders.service.js` |
| Medium | Orphan pending rider, no approver | `franchiseRiderFilter` |
| Medium | Fake socket toasts in franchise staff screen | `F/staffManagement/KitchenStaff.jsx:177-193` |
| Low | Rejected rider's re-signup deletes the record and its `approvalHistory` | `delivery.service.js` |
| Low | Approve and reject race | `franchiseRiders.service.js`, `rejectDeliveryPartner` |
| Low | Unescaped regex in join requests, super admin only | `admin.service.js` |
| Low | Backend constant `avgApprovalTime: "24.5"` | `storeApproval.controller.js:125` |

### 10.5 Security re-check of commits after `ab8c710`

Two commits: `ba5a93f` (frontend session) and `b50b89d` (rider approval).

| Check | Result |
|---|---|
| New routes | `GET /food/admin/delivery/:id`, `PATCH .../approve`, `/reject`, `/suspend`, `/activate`, `PATCH /:id`, and `partners`, `join-requests` now reachable by franchise admins, placed before `requireSuperAdmin` in `admin.routes.js` |
| Auth | All use `authMiddleware` |
| Role | `requireRoles('ADMIN')`. Store manager, rider and customer get 403 (`rider-panels.test.js`, `rider-approval.test.js`). Super admin writes get 403 |
| Scope | `findManaged` applies `franchiseRiderFilter` from the token; out of scope is 404 and tested. Gap: the shared pool before a rider is claimed (section 7) |
| Mass assignment | None. `PATCH /:id` reads only `status`; reject and suspend read only `reason`, trimmed to 500 |
| IDOR | `:id` has a 24-hex route pattern and goes through `findManaged`. Claim is guarded by a conditional update |
| Field exposure | At `b50b89d` a franchise admin gets ID numbers masked to the last 4, no bank, UPI or push tokens. The super admin gets the full record, no push tokens |
| New public routes | **None** at `b50b89d`. `GET /food/zones/public` is new only in the working tree |
| `ba5a93f` | `isModuleAuthenticated` accepts a valid refresh token on the client. Client-side only; the server still checks every request. The shell can render briefly before a refresh fails. Acceptable |
| `check-riders.js` | Read-only script. No route |

**Decisions in the working tree you should confirm when you review it:** your later instructions changed earlier rules. The
franchise verify view returns full Aadhaar, PAN and licence numbers, and the store manager's rider lists return the full phone
(`franchiseRiders.service.js`, `storeDelivery.service.js`). Batch 4 said "never show ... full phone to the store". I followed
the later request, but it should be a deliberate choice, and tests were changed to match.

---

## 11. Uncommitted files in the working tree

42 files: 40 modified, 2 new. None are deployed. I did not re-run tests on the working tree in this audit; run the full
suite before committing. Demo need: **Yes** = a client would see the problem, **Nice** = improves it, **Test** = needed
for the suite to match the code.

### Backend (8)

| File (`Backend/src/modules/food/`) | What it does | Demo |
|---|---|---|
| `franchise/controllers/store.controller.js` | `?includeUnapproved=true`; clear 400 and 409 errors on create | **Yes** |
| `franchise/controllers/storeApproval.controller.js` | Submit requires a manager; approve activates pending managers; manager fields in the list | **Yes** |
| `franchise/controllers/storeManager.controller.js` | Manager on an unapproved store is `Pending Approval`, cannot sign in until approved; lists them | **Yes** |
| `franchise/models/storeManager.model.js` | Adds the `Pending Approval` status | **Yes** |
| `admin/services/franchiseRiders.service.js` | Full ID numbers in the verify view; selfie in the list | **Yes** (decision above) |
| `store/controllers/storeDelivery.controller.js` | Handler for public `GET /food/zones/public` | **Yes** |
| `store/routes/storeDelivery.routes.js` | Registers that route | **Yes** |
| `store/services/storeDelivery.service.js` | Zones list; full phone for manager and super admin; rider details fields; null metrics; last active from GPS only | **Yes** (decision above) |

### Tests (9)

| File (`Backend/test/`) | What it does | Demo |
|---|---|---|
| `audit3.test.js` | Route sweep pattern updated for the changed routes | Test |
| `delivery-store.test.js` | Expects the full phone in the store rider list | Test |
| `field-whitelist.test.js` | Approves the store first, because a manager on an unapproved store can no longer sign in | Test |
| `fixtures/reviewed-routes.json` | Adds `GET /food/zones/public` to reviewed public routes | Test |
| `nearby-people.test.js` | Updated for full phone | Test |
| `rider-approval.test.js` | Updated for full ID numbers | Test |
| `rider-lists.test.js` | Updated for selfie and fields | Test |
| `rider-panels.test.js` | Updated for rider details | Test |
| `store-list-unapproved.test.js` (new) | Covers the unapproved store list and manager flow | Test |

### Frontend (25)

| File | What it does | Demo |
|---|---|---|
| `modules/Food/utils/adminGoogleMaps.js` (new) | Shared Maps loader, fixes the loader conflict | **Yes** |
| `DeliveryV2/components/map/LiveMap.jsx` | Readable map style, shared loader | **Yes** |
| `F/staffManagement/DeliveryPartners.jsx` | Inline Approve, Reject, Suspend, Activate instead of the clipped menu | **Yes** |
| `F/staffManagement/components/RiderVerificationDrawer.jsx` | Always-visible buttons, `initialMode` | **Yes** |
| `F/staffManagement/useFranchiseRiders.js` | Selfie in the list | **Yes** |
| `F/staffManagement/StoreManagers.jsx` | Pending status hint | **Yes** |
| `F/staffManagement/components/AddEditManagerModal.jsx` | Unapproved stores in the picker, confirm password | **Yes** |
| `F/storeManagement/StoreApprovals.jsx` | Shows the server's error | **Yes** |
| `F/storeManagement/Stores.jsx` | Lists unapproved stores with a tag; real create errors | **Yes** |
| `F/storeManagement/components/StoreModal.jsx` | Shared Maps loader | **Yes** |
| `S/deliveryOperations/components/CurrentStatusCard.jsx` | Rider details, real data | **Yes** |
| `S/deliveryOperations/components/PerformanceCard.jsx` | Real data only, fake numbers removed | **Yes** |
| `S/deliveryOperations/components/PersonalInformationCard.jsx` | Full contact, address, vehicle | **Yes** |
| `S/deliveryOperations/components/RiderStatsCards.jsx` | Real data only | **Yes** |
| `S/deliveryOperations/components/RidersTable.jsx` | Full phone, alignment | **Yes** |
| `S/staffManagement/components/AddStaffModal.jsx` | Confirm password | Nice |
| `A/franchiseManagement/FranchiseApprovalsData.jsx` | Franchise dropdown | **Yes** |
| `A/franchiseManagement/components/AddTerritoryModal.jsx` | Shared Maps loader | **Yes** |
| `A/franchiseManagement/components/AddZoneModal.jsx` | Shared Maps loader | **Yes** |
| `A/franchiseManagement/components/EditTerritoryModal.jsx` | Shared Maps loader | **Yes** |
| `A/franchiseManagement/components/EditZoneModal.jsx` | Shared Maps loader | **Yes** |
| `A/franchiseManagement/components/TerritoryDetails.jsx` | Shared Maps loader | **Yes** |
| `A/franchiseManagement/components/ZoneDetailsDrawer.jsx` | Shared Maps loader | **Yes** |
| `A/userManagement/components/AddFranchiseModal.jsx` | Confirm password, shared loader | Nice (loader: Yes) |
| `A/userManagement/components/EditFranchiseModal.jsx` | Shared Maps loader | Nice (loader: Yes) |

Counts: 8 backend source files + 9 test files + 25 frontend files = 42.

---

## 12. Completion per role

**Method** (same as audit4): the unit is a routed screen. REAL = 1, PARTIAL = 0.5, MOCK = 0. PHASE2 and non-v1 mock screens are
excluded. Store panel screens are split by `allowedRoles` in `S/routes/StoreManagerRouter.jsx`, so supervisor and staff are
subsets of the manager's set. **Stricter than audit4 in one way:** a screen with real data but a broken live link or a
mock-driven control now counts as PARTIAL, as your brief asks.

| Role | Screens | REAL | PARTIAL | MOCK | PHASE2 | Non-v1 | Endpoints missing | Calculation | % |
|---|---|---|---|---|---|---|---|---|---|
| Customer | 56 | 35 | 9 | 3 | 2 | 7 | 5 | (35 + 4.5) / 47 | **84.0** |
| Store manager | 30 | 13 | 16 | 0 | 1 | 0 | 5 (2 deferred) | (13 + 8) / 29 | **72.4** |
| Kitchen supervisor | 21 | 11 | 9 | 0 | 1 | 0 | 3 (dashboard) | (11 + 4.5) / 20 | **77.5** |
| Kitchen staff | 14 | 6 | 7 | 1 (dashboard, BROKEN) | 0 | 0 | 3 (dashboard) | (6 + 3.5) / 14 | **67.9** |
| Rider | 23 | 22 | 1 | 0 | 0 | 0 | 1 | (22 + 0.5) / 23 | **97.8** |
| Franchise admin | 27 | 7 | 6 | 12 | 2 | 0 | 0 called (new ones needed for reviews and issues) | (7 + 3) / 25 | **40.0** |
| Super admin | 48 | 22 | 4 | 9 | 7 | 6 | 0 | (22 + 2) / 35 | **68.6** |

**All screens, each once** (customer, store panel, rider, franchise, super admin): (39.5 + 21 + 22.5 + 10 + 24) / 159 = 117 / 159
= **73.6%**. Audit4 said 78% at `36d9944`. Under audit4's looser rule, `b50b89d` scores 128 / 159 = 80.5%, so the work moved
forward. The lower figure comes from the stricter rule.

**If the working tree is committed:** rider 23 / 23 = 100%; franchise (10 + 1.5) / 25 = 46%; super admin (25 + 0.5) / 35 = 72.9%;
others unchanged; total 120.5 / 159 = 75.8%.

**Screens behind the numbers:**

- Customer PARTIAL: Home, Cart, Coupons, UserSearchPage, Terms, Under250, Categories, CategoryPage, Gourmet. MOCK: ProductDetail,
  OrderHelp, FAQ. Non-v1 mock: Favorites, Collections, CollectionDetail, Payments, AddPayment, EditPayment, Feedback. PHASE2:
  Rewards, ReferEarn.
- Store manager REAL: Incoming, Active, Ready, Completed, Cancelled, StockRequests, WasteManagement, LowStockAlerts, KitchenStaff,
  Attendance, ShiftManagement, MyTasks, Profile. PARTIAL: Dashboard, KitchenQueue, PreparationBoard, PizzaStation, BakingStation,
  PackagingStation, DelayedOrders, AssignRider, RiderAvailability, DeliveryTracking, DeliveryIssue, IngredientStock,
  IngredientShortages, CustomerOrders, Complaints, Reviews.
- Supervisor REAL: the 5 order screens, StockRequests, WasteManagement, LowStockAlerts, Attendance, MyTasks, Profile. PARTIAL:
  Dashboard, 6 kitchen screens, IngredientStock, IngredientShortages.
- Staff REAL: Active, Ready, StockRequests, WasteManagement, MyTasks, Profile. PARTIAL: 5 kitchen screens, IngredientStock,
  IngredientShortages. BROKEN: Dashboard.
- Rider PARTIAL: DeliveryHomeV2 (scope bug listed separately, zone overlay).
- Franchise REAL: AdminForgotPassword, StoreApprovals, OperatingHours, StorePricing, AdminProfile, StorePerformance, LiveOrders.
  PARTIAL: Stores, StoreManagers, DeliveryPartners, Dashboard, CompletedOrders, CancelledOrder. MOCK: CustomersList,
  CustomerComplaints, ReviewsRatings, KitchenStaff, OrderIssues, Products, Categories, Addons, Ingredients, StockLevels,
  LowStockAlerts, PurchaseRequests.
- Super admin PARTIAL: RegionsZones, TerritoryManagement, FranchiseApprovals, ContentManagement. MOCK (v1): SuperAdminDashboard,
  CustomerList, UserProfile, KitchenStaffManagement, AllOrders, OrderTracking, Disputes, CustomerComplaints, FeedbackAndReview.

**Live missing endpoints:**

| Panel | Method and path | Called from |
|---|---|---|
| Customer | `GET /food/hero-banners/gourmet/public` | `U/Gourmet.jsx:49` |
| Customer | `GET /food/hero-banners/under-250/public` | `U/Under250.jsx:237` |
| Customer | `GET /food/restaurant/categories/public` | `adminApiModule.js:420` |
| Customer | `GET /food/restaurant/dishes/public` | `locationApiModule.js:21` |
| Customer | `GET /food/dining/restaurants/public` | `restaurantApiModule.js:476` |
| Store | `POST /inventory/reorder` | `S/dashboard/components/InventoryAlerts.jsx:41` |
| Store | `POST /notifications/read`, `/notifications/delete` | `NotificationsDrawer.jsx:13,30` |
| Store (deferred) | `GET /store/performance`, `/:id` | `usePerformance.js` |
| Rider | `GET /food/zones/public` | `LiveMap.jsx:159` |

---

## 13. Prioritised batches

Each fits one Claude run. Order: demo blockers, then screens by role in your order, then polish. Rules kept: wire data only;
no user-app or delivery-app UI change without your approval.

### Blockers

| # | Batch | Covers | Size | Depends on |
|---|---|---|---|---|
| 1 | **Review and commit the working tree** | Section 11, in two commits: store-manager-approval flow plus rider panels; shared Maps loader. Run the full suite. Confirm the two data decisions | S | your review |
| 2 | **Checkout contact and address** | Remove hardcoded contact: prefill from the profile. Remove the Indore default and "abc"; require real address fields. Use the existing fields, no visual change | S | none |
| 3 | **Rider offer scope** | `/orders/available` and `/accept` limited to the same rule as dispatch (`riderScope`, franchise claim, or `offeredTo`). No customer name, phone or email before accept. Keep offers working without Redis. Tests for far rider and other franchise's rider | M | 1 |
| 4 | **Store panel live and staff landing** | Token and real event names in 10 socket hooks, or drop the badge where polling is the truth. Add polling to `useRiders`, `useAvailableRiders`. Land kitchen staff on `/tasks`; skip widgets a role cannot read | M | 1 |
| 5 | **Super admin dashboard and orders** | `SuperAdminDashboard`, `AllOrders`, `OrderTracking`, `CustomerList`, `UserProfile` to existing endpoints | M | none |

### Screens, by role

| # | Batch | Covers | Size | Depends on |
|---|---|---|---|---|
| 6 | **Customer data leftovers** | 5 missing paths at the service layer. `ProductDetail` from real product. `OrderHelp` from API. `FAQ` from `/settings/faqs/public`. Remove fake coupons and `pvp_products_v2`. Fix the menu location key | M | 2 |
| 7 | **Order exceptions** | Reset-OTP button in `DeliveryTracking`. `rejectItems` repricing decision. Ticket ownership check. Customer view of complaint replies (needs your approval: user-app UI) | M | 3 |
| 8 | **Store manager leftovers** | Real KPI cards on customers, complaints, reviews. Resolver from the team list. Supplier filter, mock chefs, escalation recipients, affected orders. `reorder` to a stock request. Notification read and delete. New/nearby tag and area | M | 4 |
| 9 | **Kitchen roles scope** | Decide if a supervisor sees all store orders. `getStoreOrder` limited by role. `setPriority` check. No customer phone to kitchen roles | S | 4 |
| 10 | **Rider approval edge cases** | Orphan pending rider (who approves?). Rejection scope in the shared pool. Re-activate only by the suspending franchise. Keep history on re-signup. Correct "suspended" message | S | 3 |
| 11 | **Scheduled orders** | Hold dispatch until `scheduledAt - prep`, badge in the store queue | S | 3 |
| 12 | **Franchise CRM and staff** | `CustomersList`, `CustomerComplaints` to existing routes. `ReviewsRatings`, `OrderIssues` with new scoped lists. `KitchenStaff` to `/food/admin/staff`, remove fake toasts. Dashboard lists | L | 1 |
| 13 | **Franchise catalogue and inventory** | Products, Categories, Addons (read-only real). Ingredients, StockLevels, LowStockAlerts, PurchaseRequests (scoped reads) | L | 12 |
| 14 | **Franchise order analytics** | Completed and cancelled analytics from real data, or remove | S | 12 |
| 15 | **Super admin people and support** | `KitchenStaffManagement`, `CustomerComplaints`, `FeedbackAndReview`, `Disputes` (decide), `ContentData` | M | 5 |

### Polish

| # | Batch | Covers | Size | Depends on |
|---|---|---|---|---|
| 16 | **Security mediums** | Audit3 M3, M5, M6, M7, M8, L2, L5, L6, L10. Audit5 mediums 2 and 3 | M | 3 |
| 17 | **Lows and launch hardening** | M4, M9, L1, L3, L4, L8; default-OTP switch; race and regex lows; `avgApprovalTime` | S | 16 |
| 18 | **Dead code** | 92 dead call sites, dead admin controllers | M | none |
| 19 | **Out-of-scope screens** | Hide, label or defer the 13 non-v1 mock screens. Decide on online payment and refund processing | S | none |

---

## 14. What code cannot prove

Production settings (`JWT_ACCESS_EXPIRES`, `FRONTEND_URL`, `REDIS`, `BULLMQ_ENABLED`, workers running), Google Maps key
restrictions, SMS OTP delivery, push notifications on a phone, GPS accuracy, Cloudinary uploads, and whether the deployed
server really runs `b50b89d`.

## 15. Manual test checklist

### Customer
- [ ] Log in with a real number and receive the OTP.
- [ ] On a fresh browser, open checkout: is the contact yours, and is the address the one you chose?
- [ ] Compare one item's price across menu, cart and the order total, with location set by map and by saved address.
- [ ] Place an order, keep tracking open, and confirm each status appears without refreshing.
- [ ] Read the drop OTP on the phone and give it to the rider.
- [ ] Cancel before acceptance; try again after acceptance and read the message.
- [ ] Press Reorder on a past order: are the items and prices correct?
- [ ] Raise a complaint; look for the store's reply.

### Store manager
- [ ] Log in; note any red toasts or empty widgets on the dashboard.
- [ ] Create a supervisor and a staff member; log in as each in another browser.
- [ ] With a sound on, does a new order alert you within seconds on Incoming?
- [ ] Accept with no active supervisor; then with one.
- [ ] Open each kitchen and delivery screen: is the badge red?
- [ ] Assign a rider manually; then enter a wrong OTP until locked, and try to recover.
- [ ] Save a new customer address near the store; find it in Customers.

### Kitchen supervisor
- [ ] Log in and read the dashboard errors.
- [ ] Clock in with and without an assigned shift.
- [ ] Confirm Incoming is empty and Active shows only your orders; decide if that is what you want.
- [ ] Assign staff; reject one item and check the customer's total.

### Kitchen staff
- [ ] Log in: what is the first screen?
- [ ] Clock in, see only assigned tasks, start and complete one, on a real kitchen tablet.
- [ ] Open an unassigned order by URL.

### Rider
- [ ] Sign up on a real phone with all photos; confirm uploads.
- [ ] Log in while pending, rejected and suspended; read each message.
- [ ] Go online with location on and off.
- [ ] With two riders, one far away: does the far rider get a popup? (Expected at `b50b89d`: yes.)
- [ ] Accept, pick up, reach drop, OTP, complete. Lock the phone mid-trip: does tracking continue?
- [ ] Sign up with a city with no store: who can approve?

### Franchise admin
- [ ] Log in with the temp password; change it.
- [ ] Create a store and look for it in the list; then assign a manager.
- [ ] Approve, reject, suspend and activate a rider; check the buttons are visible.
- [ ] Set a store price; check it in the customer menu.
- [ ] Open every sidebar screen and note which show sample names.

### Super admin
- [ ] Refresh after 20 minutes idle: are you still signed in?
- [ ] Create a franchise admin; log in as them.
- [ ] Open a territory modal after visiting another page: does the map load?
- [ ] Approve a store with a manager; log in as the manager.
- [ ] Try to approve a rider: is it refused?
- [ ] Compare dashboard numbers with real orders.
