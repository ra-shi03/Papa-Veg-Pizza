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
- Kitchen supervisor sees store orders and assigns staff. Kitchen staff sees only assigned tasks.

## Status
DONE: auth; super admin control of user-app content.
PENDING: staff management, kitchen ops/tasks, inventory, customers/menu APIs, complaints,
dashboards, delivery/orders verification, sockets. Defer: finance, marketing, reports, rewards.

## Rules
- Do NOT change user app or delivery app UI. Admin panel UI is over-built; backend only for v1 features.
- Follow the existing module pattern and existing middleware. Reuse, don't rewrite.
- Response format { success, message, data }. async/await, central error handler, validators per module.
- Enforce role AND scope in the backend, never rely on the UI.
- Match the exact request/response shapes the frontend calls (read the frontend api files first).
- Order flow: placed → accepted → preparing → ready → out_for_delivery → delivered / cancelled