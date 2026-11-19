Read docs/audit.md before starting any task. Fix P0 security items first. Do not build
anything on the deferred list.

# Papa Veg Pizza

Indian pizza franchise platform. MERN. Flutter dev will wrap user + delivery apps later (ignore now).

## Structure
- Backend/src/modules/food/<feature>/{controllers,models,routes,services,validators}
- Shared code: Backend/src/{middleware,utils,core,config,services,queues}
- Frontend panels: Frontend/src/modules/Food/pages/{superadmin,franchise-admin,store-manager,user}
- Delivery app: Frontend/src/modules/DeliveryV2

## Roles
super_admin > franchise_admin > store_manager > kitchen_supervisor / kitchen_staff
Also: customer, delivery_partner.
- Super admin creates franchise admins (email + temp password; they change password/profile later).
- Franchise admin creates store managers. Store manager creates kitchen supervisor/staff.
- Everyone except super admin is scoped to franchiseId/storeId.
- Kitchen supervisor sees only the store orders the store manager assigned to them, and assigns staff on those. Kitchen staff sees only assigned tasks.

## Status
DONE: auth; super admin control of user-app content.
DONE: complaints end to end. Customer sends (/food/user/complaints), store manager replies and resolves (/food/store/complaints), franchise admin
handles them on the Customer Complaints desk (/food/admin/stores/complaints/desk: notes, resolve, close; no assigning, escalation or SLA by design). Test: Backend/test/complaint-desk.test.js.
DONE: combos end to end (Combo Builder + meal combos). The server prices a builder combo from the combo-page settings and records what is
inside every combo line (`components`); the kitchen gets one card per pizza (`kitchenUnits`, KitchenItem.lineIndex); the store, packer and
rider payloads carry the contents. Tests: Backend/test/combos.test.js, combo-flow.test.js, the combos block in kitchen-ops.test.js.
DONE (store ops order flow, see docs/rider-flow.md section 5): store manager > supervisor > staff tasks gated by attendance
and stations; real data in Completed Order details; manual rider assignment (`dispatch.manual`) is never undone by
auto-dispatch, its timeout job or the startup watchdog; Confirm Pickup accepts the rider at handover; handover photo
required to complete a delivery (`deliveryVerification.handoverPhotoUrl`).
PENDING: staff management, inventory, customers/menu APIs, dashboards, sockets, delivery/orders
verification (open: store Confirm Pickup skips the rider's bill photo; handover photo not shown in the store panel yet).
Defer: finance, marketing, reports, rewards.

## Rules
- Do NOT change user app or delivery app UI. Admin panel UI is over-built; backend only for v1 features.
- Follow the existing module pattern and existing middleware. Reuse, don't rewrite.
- Response format { success, message, data }. async/await, central error handler, validators per module.
- Enforce role AND scope in the backend, never rely on the UI.
- Match the exact request/response shapes the frontend calls (read the frontend api files first).
- Order flow: placed → accepted → preparing → ready → out_for_delivery → delivered / cancelled