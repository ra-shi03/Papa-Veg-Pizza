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
super_admin > franchise_admin > store_manager > kitchen_staff
Also: customer, delivery_partner.
- Super admin creates franchise admins (email + temp password; they change password/profile later).
- Franchise admin creates store managers. Store manager creates kitchen staff only (franchise admin approves them).
- Everyone except super admin is scoped to franchiseId/storeId.
- Kitchen staff see only the orders where they hold a station (pizza_chef / baking_chef / packaging_staff), and their own tasks.
- The kitchen supervisor role is REMOVED (client decision, docs/supervisor-removal.md). It is deactivated, not deleted:
  existing accounts are switched off by Backend/scripts/deactivate-supervisors.js (dry run by default, --apply writes),
  sign-in tells them the role is no longer used, every route refuses the role (403), and nobody can create or approve
  one. `order.kitchen.supervisor` on older orders is information only, never a permission.

## Kitchen rules (backend enforces them)
- Accept: store manager only; no supervisor is picked.
- Assign staff to stations (assign-staff, reassign, pizza reassign): store manager only. The person must be active,
  kitchen staff of that store and clocked in (requireOnDuty / requirePresent).
- Quality check and mark ready: the staff member holding that order's packaging station, or the store manager. Nobody else.
- Priority, pause, delay (and delay escalate / notify / resolve): the store manager, or a staff member holding a station of that order.
- Another store's or franchise's order is 404; a role outside the route is 403.

## Status
DONE: auth; super admin control of user-app content.
DONE: complaints end to end. Customer sends (/food/user/complaints), store manager replies and resolves (/food/store/complaints), franchise admin
handles them on the Customer Complaints desk (/food/admin/stores/complaints/desk: notes, resolve, close; no assigning, escalation or SLA by design). Test: Backend/test/complaint-desk.test.js.
DONE: combos end to end (Combo Builder + meal combos). The server prices a builder combo from the combo-page settings and records what is
inside every combo line (`components`); the kitchen gets one card per pizza (`kitchenUnits`, KitchenItem.lineIndex); the store, packer and
rider payloads carry the contents. Tests: Backend/test/combos.test.js, combo-flow.test.js, the combos block in kitchen-ops.test.js.
DONE (store ops order flow, see docs/rider-flow.md section 5): store manager > kitchen staff tasks gated by attendance
and stations; real data in Completed Order details; manual rider assignment (`dispatch.manual`) is never undone by
auto-dispatch, its timeout job or the startup watchdog; Confirm Pickup accepts the rider at handover; handover photo
required to complete a delivery (`deliveryVerification.handoverPhotoUrl`).
PENDING: staff management, inventory, customers/menu APIs, dashboards, sockets, delivery/orders verification.
DONE (delivery, docs/rider-flow.md): bill photo is required for any pickup (rider or store) and the bill and handover photos show in the store,
franchise and super admin order views; franchise admin AND super admin can block / unblock riders (blocked = signed out at once, pre-pickup orders
released); super admin All Orders runs on real data; the rider-accident-cost clause (franchise outlet pays, not the company) is fixed in every Terms page.
DONE (rider readiness, docs/rider-flow.md): bank + UPI details at signup (skippable) and required to go online / accept; delivery wallet
(recharges minus COD cash collected) must be >= the franchise admin's minimum to accept; super admin sees every rider's wallet and payout details.
Defer: finance, marketing, reports, rewards.

## Rules
- Do NOT change user app or delivery app UI. Admin panel UI is over-built; backend only for v1 features.
- Follow the existing module pattern and existing middleware. Reuse, don't rewrite.
- Response format { success, message, data }. async/await, central error handler, validators per module.
- Enforce role AND scope in the backend, never rely on the UI.
- Match the exact request/response shapes the frontend calls (read the frontend api files first).
- Order flow: placed → accepted → preparing → ready → out_for_delivery → delivered / cancelled