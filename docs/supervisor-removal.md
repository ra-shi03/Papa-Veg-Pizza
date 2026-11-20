# Removing the kitchen supervisor from the order flow

Client decision (2026-11-19): the kitchen supervisor role is removed from the order flow.

| | Before | After |
|---|---|---|
| Flow | manager accepts and **names a supervisor** -> supervisor (or manager) assigns kitchen staff to stations -> staff prepare -> supervisor / manager / packaging staff mark ready -> rider | manager accepts -> **manager** assigns kitchen staff to stations -> staff prepare -> **the staff member holding the packaging station** does the quality check and marks ready (the manager can override) -> rider (unchanged) |
| Accept | needs a supervisor who is Active in the store and clocked in | no supervisor; `kitchenSupervisorId` is ignored if sent |
| Assign staff | manager, or the order's supervisor | manager only |
| Quality check, mark ready | manager, the order's supervisor, packaging staff (mark ready) / leads only (quality check) | manager, or the person holding that order's packaging station |
| Priority, pause, delay | manager, or the order's supervisor | manager, or a person holding any station of that order |
| Role | `KITCHEN_SUPERVISOR` created by the store manager, approved by the franchise admin | not created any more; existing accounts deactivated by a script (records kept) and refused at sign-in with a clear message |

Unchanged: staff who are given work must be Active in the store and clocked in (`requirePresent`, `requireOnDuty`);
kitchen staff see only orders where they hold a station; store / franchise scope; the rider flow (`docs/rider-flow.md` section 5).

## 1. Backend

### 1.1 Order flow (`store/services/storeOrders.service.js`, `store/routes/storeOrders.routes.js`)

| Where | What it does today | Replacement |
|---|---|---|
| `acceptOrder` | Requires `kitchenSupervisorId`; `findStaffMember(..., 'kitchen_supervisor')` checks Active + clocked in; stores `kitchen.supervisor`; creates a `kind: 'supervisor'` KitchenTask and notifies the supervisor | No supervisor. Accept sets stage, priority, notes, timing only. No supervisor task, no supervisor notification |
| `assignStaff` | Manager or the order's supervisor (`isOrderSupervisor`); refuses picking a supervisor | **Manager only** (`requireManager`). Still refuses a non-kitchen-staff pick; staff must be Active and clocked in |
| `updateKitchenStage` | Manager, the order's supervisor, or any station holder, for every stage | Manager, or a station holder for `preparing` / `baking` / `packaging`; **`ready` only for the manager or the packaging-station holder** |
| `setPriority`, `setPaused`, `logDelay` | Manager or the order's supervisor | Manager, or a person holding any station of the order (`staffSlotsOf`) |
| `listStoreOrders`, `getStoreOrder` | A supervisor sees only `kitchen.supervisor.userId === me` | Branch removed. Manager: the store. Staff: their stations (unchanged) |
| `listTeam` | Counts supervisor load; `kitchen_supervisor` picker | Supervisor load not counted; supervisor records are no longer offered (they are deactivated) |
| `moveToStage` | Moves the supervisor task to `in_progress` | Removed; `ready` still completes every task of the order (so old supervisor tasks close too) |
| `uiRoleOf` / `resolveUiRole` | Map titles / codes to `kitchen_supervisor` | Kept so a legacy record is recognised and refused as an assignee |
| `isOrderSupervisor` | Permission helper | Deleted; no permission reads `kitchen.supervisor` any more |
| Route comments, `requireRoles(... 'KITCHEN_SUPERVISOR' ...)` | Let supervisors call every store route | `KITCHEN_SUPERVISOR` removed from every guard: a left-over supervisor token gets **403** |

### 1.2 Kitchen operations (`kitchenOps.service.js`, `kitchenItems.service.js`, `kitchenTasks.service.js`, their routes)

| Where | Today | Replacement |
|---|---|---|
| `kitchenOps.mustLead` / `mustBeLeadRole` | Manager or the order's supervisor | Split by action (below) |
| `queueOrder` (accept into the kitchen queue) | Lead | Manager or a station holder of the order |
| `assignChef`, `reassignOrderStaff` | Lead (then `assignStaff`) | Manager only |
| `rejectItems` (changes the bill) | Lead | Manager only |
| Delayed orders: list, `escalateOrder`, `notifyCustomer`, `resolveDelay` | Lead role / lead of the order | Manager, or a station holder of the order (the list shows staff only their own orders) |
| Packaging station (`packagingOrder`: start, checklist, seal, mark ready) | Manager, the order's supervisor, or the packaging-station holder | Manager or the packaging-station holder |
| `submitQualityCheck` / `listQualityChecks` | Leads only | Manager, or the packaging-station holder of that order; the list shows staff their own checks |
| `findScopedTask` | Supervisor: tasks of their orders | Branch removed (manager: any task of the store; staff: own) |
| `kitchenItems.visibleKitchenOrders`, `canSeeItem`, issue list | Supervisor branch | Removed |
| `kitchenItems` reassign a pizza | Manager or order supervisor | Manager only |
| `kitchenTasks.mustLead` (team view) | Manager or supervisor | Manager only |
| `kitchenTasks.reassignTask` | Manager or the order's supervisor | Manager only |
| `kitchenTasks` delay / handoff notice | The order's supervisor + the managers | The store's managers |
| `kitchenTasks` supervisor task view (`SUPERVISOR_INFO`, the "all stations staffed" start rule) | Shows / gates `kind: 'supervisor'` tasks | Kept read-only for tasks created before the change (they close when the order is ready); new ones are never created |

### 1.3 Roles, accounts, sign-in

| Where | Today | Replacement |
|---|---|---|
| `admin/controllers/staff.controller.js` (`MANAGEABLE['store-manager']`) | Store manager may create `kitchen-staff` or `kitchen-supervisor` | `kitchen-staff` only; asking for `kitchen-supervisor` is refused (403, as for any role outside the caller's reach) |
| `store/controllers/kitchenStaff.controller.js` (store manager adds staff, title -> role code) | `'Kitchen Supervisor'` -> `KITCHEN_SUPERVISOR` | Supervisor title refused on create and edit (400 with the reason). A former supervisor's record (kept, `Suspended`) cannot be switched back to `Active` by edit or by `PATCH /:id/status` (400) |
| `franchise/controllers/staffApproval.controller.js` | Pending supervisors and staff; approve / reject | Kitchen staff only. A left-over pending supervisor request is not offered and cannot be approved (404) |
| `core/auth/auth.service.js` (`ADMIN_PANEL_ROLES`, store-role scope) | Signs supervisors in | Supervisors are refused: *"The kitchen supervisor role is no longer used, so this account has been deactivated. Ask your store manager to add you as kitchen staff."* (shown only after the right password). A refresh token of a supervisor is revoked |
| `core/auth/auth.controller.js` (store login allowed roles) | Includes `kitchen-supervisor` | Removed |
| `core/auth/auth.middleware.js` (`ADMIN_PANEL_ROLES`) | Includes `KITCHEN-SUPERVISOR` | Removed: `requireAdmin` refuses a supervisor token (403) |
| `core/auth/adminAuth.service.js` | Legacy FoodAdmin login, **not imported anywhere** (dead code) | List updated for consistency |
| `core/admin/admin.model.js` role enum | Includes `kitchen-supervisor` | **Kept**: old records must still load |
| `scripts/deactivate-supervisors.js` (new) | - | Dry run by default, `--apply` writes. Sets the users inactive, their staff records `Suspended`, revokes their refresh tokens. Prints counts only. Nothing is deleted |

### 1.4 Middleware, sockets, uploads, tracking

| Where | Today | Replacement |
|---|---|---|
| `middleware/requireOnDuty.js` | Supervisors and staff must be clocked in for kitchen work | Kitchen staff only |
| `config/socket.js` | Manager and supervisor join the store room | Manager only (staff keep their own rooms) |
| `uploads/routes/upload.routes.js` | Allows `KITCHEN-SUPERVISOR` | Removed |
| `orders/services/order-tracking-access.service.js` | Supervisor may open the store's tracking | Removed |

### 1.5 Other store screens

| Where | Today | Replacement |
|---|---|---|
| `storeCrm` (customers, complaints, reviews) + routes | Supervisor read-only, masked, only own orders | Manager (and admin for customers) only |
| `storeDelivery` + route | Supervisor read-only on own orders, masked rider phones | Manager and admin only |
| `inventoryAccess` / `inventoryOps` + route | Supervisor reads stock, files waste / shortage / stock requests, own-order filter | Supervisor removed; kitchen staff keep their rights |
| `attendanceAccess`, `attendance.service`, `leaveRequests.service`, routes | Supervisors clock in / out, ask for leave, are counted on the attendance board | Kitchen staff only |
| `storeProfile` + route | Supervisor profile | Removed from the guard and the role map |
| Dashboard (`dashboardAccess.js`, `SUPERVISOR_WIDGETS`, `storeDashboard.service.js`, route) | Supervisor gets kitchen / order widgets of own orders | Supervisor removed: manager and admins only. History labels `KITCHEN_SUPERVISOR: 'Supervisor'` kept for old timeline entries |
| `franchiseDashboard.service.js` live orders | `chef` falls back to the supervisor's name | Fallback removed |
| `scripts/check-demo.js` | Readiness counts an active supervisor per store | Counts active kitchen staff |

### 1.6 Models (kept, informational)

| Model | Field | Decision |
|---|---|---|
| `order.model.js` | `kitchen.supervisor`; `statusHistory.byRole` enum `KITCHEN_SUPERVISOR` | Kept: old orders and their history still load; never read for permissions |
| `kitchenTask.model.js` | `kind: 'supervisor'` | Kept for old tasks |
| `qualityCheck`, `kitchenEscalation`, `leaveRequest`, `storeManager` | Comments mention supervisors | Comments updated |

## 2. Frontend (store operations panel unless noted)

| Where | Today | Replacement |
|---|---|---|
| `app/routes.jsx`, `StoreManagerRouter.jsx` (`ProtectedRoute`, `RoleProtectedRoute`) | `kitchen-supervisor` / `kitchen_supervisor` allowed; `/profile/supervisor` route | Removed from every guard; supervisor-only routes become manager-only; the supervisor profile route is gone |
| `auth/StoreLogin.jsx` (login redirect) | Accepts `kitchen-supervisor` | Removed; the server's message is shown (it now reads `error` as well as `message`, since the error handler answers `{ success: false, error }`) |
| `layouts/storeOperationsSidebarMenu.js`, `Sidebar.jsx`, `Navbar.jsx`, `AttendanceBanner.jsx` | Menu entries and labels for the supervisor | Removed |
| `orders/components/AcceptOrderModal.jsx`, `hooks/useIncomingOrders.js` (`useActiveSupervisors`) | Step 3 "Kitchen Supervisor Assignment" picker; sends `kitchenSupervisorId` | Step removed; accept sends prep time, priority, notes |
| `IncomingOrders.jsx`, `ViewDetailsModal.jsx` | Supervisor may accept / print | Manager only (as the server) |
| `ActiveOrders.jsx`, `ActiveOrderDetailsModal.jsx` | Manager or supervisor manage; "Mark Ready" for packaging role | Manager manages; "Mark Ready" for the manager or the person holding that order's packaging station (new helper `orders/utils/kitchenRights.js`, user id from the token) |
| `CompletedOrders.jsx`, `CompletedOrderDetailsModal.jsx`, `PrintReceiptModal.jsx` | Hide manager tools from supervisors; receipt line "Prepared under kitchen supervisor" | Manager tools hidden from kitchen staff (the details modal now matches the list); the receipt line reads "Prepared by our kitchen team" / "Packed by <name>" (same layout) |
| `kitchenOperations/OrderCard.jsx`, `OrderDetailsModal.jsx`, `PizzaCard.jsx`, `useKitchenQueue.js`, `EscalationModal.jsx`, `StartAssemblyModal.jsx` | "manager or supervisor" actions; "Your supervisor will accept" text | Manager actions; texts say the store manager |
| `myTasks/MyTasks.jsx`, `CompletedTasksTable.jsx`, `DelayedTasksTable.jsx`, `AssignedTasksTable.jsx`, `ReassignTaskModal.jsx`, `ClockInOutButton.jsx`, `hooks/useMyTasks.js` | Supervisor team widget, reassign, quality check; supervisors clock in | Team widget and reassign: manager. Quality check: manager, or the packaging-station holder on their own packaging task. Clock in: kitchen staff |
| `dashboard/StoreOperationsDashboard.jsx`, `KpiCards.jsx`, `DeliveryOverview.jsx` | Supervisor-only kitchen view of the dashboard | Supervisor code path removed (manager dashboard unchanged) |
| `staffManagement/*` (`AddStaffModal`, `EditStaffModal`, `KitchenStaff`, `Attendance`, `Performance`, `StaffProfileModal`, `ShiftDetailsModal`, `useStaff`, `LeaveRequests`) | "Kitchen Supervisor" option and labels | Option removed; the remaining options are unchanged |
| `inventory/*`, `attendance/*`, `profile/*`, `customers/Complaints.jsx`, `deliveryOperations/CreateIssueModal.jsx` | Supervisor branches and texts | Removed / reworded |
| `franchise-admin/staffManagement/StaffApprovals.jsx`, `KitchenStaff.jsx`, `StaffAttendance.jsx` | Supervisor filter option and texts | Kitchen staff only |
| `franchise-admin/dashboard/LiveOrders.jsx`, `orders/ordersQuery.js` | Shows the supervisor of an order | `ordersQuery.js` keeps the supervisor name as information for old orders; the LiveOrders card label now reads "Kitchen Staff" (same layout) |
| `superadmin/userManagement/KitchenStaffManagement.jsx`, `KitchenStaffFilters.jsx` | "Supervisor" job title (mock screen, no API behind it) | Left as is; listed in the summary |
| Mock data (`*/mockData.js`, `services/api/mockService.js`, `myTasksService.js`, `profileApi.js`) and unrelated job titles ("Escalation Supervisor", "Delivery Supervisor" in super-admin support mocks) | Sample text | Left as is (not part of the order flow); listed in the summary |

## 3. Tests

| File | Today | Replacement |
|---|---|---|
| `test/helpers/fixture.js` | No supervisor; store manager per store | `fx.staff(k, role, tag, { clockIn })` creates kitchen staff the real way (store manager adds, **franchise admin approves**, signs in, clocks in). `fx.legacySupervisor(k, tag)` models a pre-change supervisor account (role switched in the DB) with an old-style token |
| `kitchen-ops`, `kitchen-tasks`, `rider-flow`, `combo-flow`, `inventory`, `attendance-shifts`, `profile`, `dashboards`, `customers-complaints`, `store-wiring`, `delivery-store`, `nearby-people`, `socket-access`, `operating-hours`, `store-pricing`, `store-performance` | Create a supervisor, accept with it, act as it | Accept without a supervisor; the manager assigns; supervisor-specific cases become "the role is refused" cases |
| `supervisor-assigned-only.test.js` | The supervisor sees only assigned orders | Replaced by `kitchen-flow-no-supervisor.test.js` (the new rules) |
| Fixture drift | Staff created through the API are `Pending Approval` and inactive; setups that sign them in fail and everything under them is cancelled | The shared helper approves as the franchise admin, so the cancelled suites run. Running them surfaced older drift unrelated to the supervisor: the manager can no longer mark staff present (`POST /store/attendance` is gone; check-ins are the staff's own and the manager only marks leave, through approved leave requests), deliveries need a handover photo, kitchen staff writes need a clock-in, station tasks complete only when the station's work is done, the top-products widget carries a 7-day `trend`, coupons are `FoodCoupon` records (not `FoodOffer`), and two checkout source checks matched older code. All are updated in the tests (no application code changed for them) |

## 4. Orders already in progress with a supervisor

- **Nothing breaks and nothing moves.** `kitchen.supervisor` stays on the order and in its history. It is shown where screens already
  show it (franchise live orders), and is **never** used as a permission.
- **The supervisor's account is deactivated**, so they cannot act on it. Their tokens stop working: every store route refuses the
  role (403) and a refresh is revoked.
- **The order carries on like a new one.** The manager assigns or reassigns the stations, station holders prepare, and the
  packaging-station holder (or the manager) does the quality check and marks it ready. If no staff were assigned yet (the supervisor
  had not done it), the manager does it from Active Orders.
- **Old supervisor tasks** (`kind: 'supervisor'`) are not shown to anyone who can act on them, and close with the rest when the order is
  ready, as before.
- **Accepted but not started orders** need no migration: the stage, timing and staff fields do not depend on the supervisor.
