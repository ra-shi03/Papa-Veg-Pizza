# Deploy checklist: P1 release (`p1-features`, includes `security-fixes`) to the CloudPanel server

`origin/main` is still at `4e54da6`, which is what the server runs. **Nothing from `security-fixes` has been deployed yet**, so this
one release carries both: the 19 security-fix commits (every P0, the audit-2 findings, `mock_token` removal) and the P1 features
(10 more commits on top: staff and kitchen, inventory, customers and complaints, dashboards, store performance / hours / pricing,
store delivery, live order events, final audit fixes), plus this checklist. 30 commits in all.
Until it is deployed, the live server still accepts `Bearer mock_token` as super admin.

Do the steps in order. **Never paste a real secret into this file, a chat, a ticket or a commit.**

**Read §8 (P1 server requirements) before you start**: the live order screens need a MongoDB replica set and a reverse proxy that
passes WebSockets. Both are quick to check and awkward to find out after the restart.

---

## 0. Before you start

- [ ] Pick a quiet time. Rotating the secrets logs **everyone** out (see §6).
- [ ] Know the real site address(es) the browser loads, e.g. `https://papavegpizza.com` and `https://admin.papavegpizza.com`.
      This becomes `FRONTEND_URL`.
- [ ] Have SSH access to the server and the CloudPanel site user's shell.
- [ ] Back up the current server `.env`, readable only by you:
      `cp Backend/.env ~/env-backup-$(date +%F)` then `chmod 600 ~/env-backup-*`
- [ ] Note the commit the server runs now, for rollback: `git -C <app dir> rev-parse HEAD` (expect `4e54da6`; if it is
      anything else, tag **that** commit as `pre-p1-deploy` in §4, not `4e54da6`).
- [ ] Run the §8 checks (replica set, WebSocket proxy, duplicate-email pre-check) **before** the restart.

## 1. Generate new secrets

Run once per secret, on your own machine or the server. Each run prints a new 96-character random value:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

You need **three** values: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `OFFER_TOKEN_SECRET`.
All three must be different. Never reuse old values or anything that looks typed by hand.

## 2. Rotate, in this order

1. **Atlas database password.**
   - In MongoDB Atlas, go to Database Access, then Edit on the app's user, then Edit Password, then Autogenerate.
   - Copy the new password straight into the server `.env` as part of `MONGO_URI`.
     URL-encode it if it contains `@ : / ? # [ ]`.
   - The old password stops working immediately, so update `.env` and restart (§4) without delay.
   - While you're in Atlas, check Network Access: it should list only the server's IP, not `0.0.0.0/0`.
2. **JWT secrets.** Put the two new values in `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.
   Every access and refresh token issued so far becomes invalid.
3. **Offer secret.** Put the third value in `OFFER_TOKEN_SECRET`.
   Unclaimed limited-time offers in open carts expire; customers just slide again.

## 3. Server `.env` (`Backend/.env`)

`[required]` means the app refuses to start, or is insecure, without it.

### Core

| Variable | Value / note |
|---|---|
| `NODE_ENV` | `production` **[required]**. Turns off dev-only behaviour (default OTP, localhost CORS). |
| `PORT` | The port CloudPanel's reverse proxy forwards to (often `5000`). |
| `HOST` | `0.0.0.0` (default), or `127.0.0.1` if only the proxy should reach it. |
| `MONGO_URI` | **[required]** `mongodb+srv://<user>:<NEW password>@<cluster>/<db>?retryWrites=true&w=majority`. `MONGODB_URI` is accepted as a fallback name; set only one. |
| `FRONTEND_URL` | **[required]** Comma-separated browser origins: scheme + host, no path, e.g. `https://papavegpizza.com,https://admin.papavegpizza.com`. **Remove `http://localhost:5173`.** If this is empty in production, the server exits at startup with "FRONTEND_URL is not set". |
| `SOCKET_CORS_ORIGIN` | Leave unset; sockets use `FRONTEND_URL`. Set it only if the socket origins differ. There is no `*` fallback any more. |

### Auth and secrets

| Variable | Value / note |
|---|---|
| `JWT_ACCESS_SECRET` | **[required]** New random value from §1. Don't also set the legacy `JWT_SECRET`. |
| `JWT_REFRESH_SECRET` | **[required]** New random value from §1, different from the access secret. |
| `JWT_ACCESS_EXPIRES` | **Delete the line** (the server has `7d`). The code default is `15m`. A `7d` value would undo the short-lived-token fix. |
| `JWT_REFRESH_EXPIRES` | Leave unset (default `30d`) or set e.g. `30d`. |
| `OFFER_TOKEN_SECRET` | **[required]** New random value from §1. Signs limited-time-offer tokens, separately from login tokens. |
| `BCRYPT_SALT_ROUNDS` | Leave unset (`10`), or `12`. |

### OTP and SMS

| Variable | Value / note |
|---|---|
| `USE_DEFAULT_OTP` | `false`, or delete the line. On its own it is ignored in production; `false` makes that explicit. Must be `true` only for the temporary demo switch below. |
| `ALLOW_DEFAULT_OTP_IN_PRODUCTION` | **TEMPORARY, remove before the real launch.** Default off. Only when it is exactly `true` **and** `USE_DEFAULT_OTP=true`, customer and delivery-partner phone logins accept `123456` in production and no login SMS is sent. Anything else (`TRUE`, `1`, unset) keeps production as before. The OTP is never returned in the API response; the 6-digit rule, attempt limit and request limits are unchanged; admin password-reset OTPs are not affected. The server logs a loud `DEFAULT OTP 123456 IS ACTIVE IN PRODUCTION` warning at every start while it is on. |
| `TEST_OTP_PHONES` | Optional, only used with the switch above. Comma-separated mobile numbers (e.g. `98xxxxxxx1,98xxxxxxx2`; spaces and `+91` are ignored, the last 10 digits count). When set, only these numbers can request an OTP; every other number gets `403`. **When empty, `123456` works for every number: anyone can sign in as any customer or rider.** Use the list. |
| `SMS_INDIA_HUB_API_KEY`, `SMS_INDIA_HUB_SENDER_ID`, `SMS_INDIA_HUB_USERNAME`, `SMS_INDIA_HUB_DLT_TEMPLATE_ID` | Unchanged. OTPs are now **6 digits**. The DLT template uses `##var##`, so it should accept 6 digits; confirm with one real SMS (§5). |
| `OTP_EXPIRY_SECONDS` / `OTP_EXPIRY_MINUTES` / `OTP_EXPIRY` | Unchanged (default 300 s). |
| `OTP_MAX_ATTEMPTS`, `OTP_RATE_LIMIT`, `OTP_RATE_WINDOW` | Unchanged (defaults 5 attempts, 3 requests per 600 s). |

### Uploads, payments, email, push, queues

| Variable | Value / note |
|---|---|
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Unchanged. `CLOUDINARY_CLOUD_NAME` is now also used to accept kitchen-task proof images only from our own account. |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Unchanged. Online amounts are now always computed by the server. |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` | Unchanged (admin forgot-password emails). |
| `FIREBASE_SERVICE_ACCOUNT` or `FIREBASE_SERVICE_ACCOUNT_PATH`, `FIREBASE_*` / `VITE_FIREBASE_*` | Unchanged (push and realtime tracking). |
| `REDIS_ENABLED`, `REDIS_URL`, `BULLMQ_ENABLED` | Unchanged. If `REDIS_ENABLED=true`, `REDIS_URL` is required. |
| `RATE_LIMIT_WINDOW`, `RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_WINDOW`, `AUTH_RATE_LIMIT_MAX`, `UPLOAD_PATH` | Unchanged (defaults are fine). |

After editing: `chmod 600 Backend/.env`.

### What is new or changed since the last deploy (the `4e54da6` server)

Features 1-6 added **no new backend variables**. Everything below is from the security work; check each against the server `.env`:

| Variable | Change |
|---|---|
| `OFFER_TOKEN_SECRET` | **New, required.** Third secret, different from both JWT secrets (§1). |
| `FRONTEND_URL` | **Now required in production** (server exits without it). Remove `http://localhost:5173`. |
| `SOCKET_CORS_ORIGIN` | **New, optional.** Unset means sockets use `FRONTEND_URL`; set it only if socket origins differ. No `*` fallback any more. In production an empty value means every browser socket is refused. |
| `JWT_ACCESS_EXPIRES` | **Delete the line** from the server `.env` (it has `7d`; the code default is `15m`). |
| `USE_DEFAULT_OTP` | Set `false` or delete. Ignored in production, but be explicit (unless the demo switch below is used). |
| `ALLOW_DEFAULT_OTP_IN_PRODUCTION`, `TEST_OTP_PHONES` | **New, temporary.** Demo switch while SMS is not integrated: with `USE_DEFAULT_OTP=true`, phone logins accept `123456` in production, for the numbers in `TEST_OTP_PHONES` (or every number if empty). See the OTP section. **Remove both before the real launch.** |
| `JWT_SECRET` | Legacy name. Remove it so only `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` are used. |
| `REDIS_ENABLED`, `REDIS_URL` | Unchanged names. **Behaviour matters now**, see §8.3. |

Placeholders only, never real values, in any copy of this file:

```bash
NODE_ENV=production
FRONTEND_URL=https://<site>,https://<admin site>
JWT_ACCESS_SECRET=<96 hex chars, §1>
JWT_REFRESH_SECRET=<96 hex chars, different>
OFFER_TOKEN_SECRET=<96 hex chars, different>
# SOCKET_CORS_ORIGIN=https://<site>,https://<admin site>      # only if it must differ from FRONTEND_URL
```

**Frontend (Vercel or wherever it is built):**

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | The API, **ending in `/api/v1`**: `https://<api host>/api/v1`. Its origin must also be in the backend's `FRONTEND_URL`. |
| `VITE_SOCKET_URL` | **New in P1.** Origin of the API server **without** `/api/v1`, e.g. `https://<api host>`. The store and franchise live order screens connect here. If it is unset they connect to the page's own origin, which only works when the site and API share one host; otherwise orders will only appear after the 60-second safety refresh. |
| `VITE_STANDALONE_MOCK`, `VITE_USE_MOCK` | Must be `false` (or absent) in the production build. `true` serves fake data instead of the API. |
| `VITE_RAZORPAY_KEY_ID`, `VITE_GOOGLE_MAPS_API_KEY`, `VITE_FIREBASE_*` | Unchanged. |

`VITE_*` values are baked in at build time: change one and you must rebuild.

## 4. Tag, merge, push, deploy

**Tag first.** The rollback point is the commit the server runs now (`4e54da6`, also `origin/main`). Nothing has been pushed
yet, so tag it before `main` moves.

On your machine:

```bash
git checkout p1-features
cd Backend && npm test && cd ..                       # expect: all tests pass (635 at the time of writing)
git tag pre-p1-deploy 4e54da6 && git push origin pre-p1-deploy    # 1. rollback point (use the §0 commit if it differs)
git checkout main
git merge --ff-only p1-features                       # 2. main has no commits of its own, so this fast-forwards
git push origin main                                  # 3. push
```

Leave the unrelated uncommitted frontend files out of this release; the committed tree builds without them.

On the server (as the CloudPanel site user, in the app directory):

```bash
git fetch origin && git checkout main && git pull --ff-only          # 4. pull
git log -1 --oneline                                  # must show the p1-features head
cd Backend && npm ci --omit=dev                       # 5. clean install from the lockfile, no test-only packages
# edit Backend/.env now (sections 2-3) if not done yet; chmod 600 Backend/.env
```

Restart the process (6). The repo has no PM2 config, so check what runs it first:

```bash
pm2 ls                                                # if listed: restart with fresh env
pm2 restart <name> --update-env && pm2 save
pm2 logs <name> --lines 80                            # see §8.2 for the lines to look for
```

- If it isn't PM2 (systemd, or the CloudPanel Node.js app "Restart" button), restart it that way. Running `node server.js` directly is fine too.
- Background workers (`npm run worker:*`) only run if you use BullMQ. Restart them too if so.

Frontend (7): build with the right variables (§3), then publish:

```bash
cd Frontend && npm ci
VITE_API_BASE_URL=https://<api host>/api/v1 VITE_SOCKET_URL=https://<api host> npm run build    # or set them in the host's env settings
# publish dist/ (or trigger the Vercel redeploy)
```

Check the value before publishing: `grep -o "https://<api host>/api/v1" dist/assets/*.js | head -1` must print a match, and
the API base must **end in `/api/v1`** (a missing suffix makes every call 404).
The cart, checkout, OTP screens, the live order screens and the super-admin **Fees & Charges** page depend on this backend.

### Rollback

If the smoke test fails badly, go back to the old code, **but keep the new secrets and Atlas password**: the old ones are burned.

```bash
git checkout pre-p1-deploy                # = 4e54da6
cd Backend && npm ci --omit=dev
pm2 restart <name> --update-env
```

- The old code accepts `JWT_ACCESS_EXPIRES` and ignores the new variables, so the new `.env` keeps working with it.
- Rolling back brings back every original hole (`mock_token`, client-side prices). Treat it as minutes, not days, and fix forward.
- Also roll the **frontend** back to its previous build; the old build does not know `VITE_SOCKET_URL` and the new build calls endpoints the old server lacks.
- New collections and indexes created by the new code (§8.4) are harmless to the old code. Nothing needs undoing in the database,
  except the optional drop of the `users.email` index if it caused trouble (§8.5).

## 5. Smoke test (right after the restart)

Set `API=https://<api host>` (no trailing `/api`). Expected results are in the comments.

```bash
# 1. The mock token is dead -> 401
curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer mock_token" "$API/api/v1/food/admin/franchises"

# 2. Stores need a login -> 401
curl -s -o /dev/null -w "%{http_code}\n" "$API/api/v1/stores"

# 3. CORS blocks a random origin -> no "access-control-allow-origin" line in the output
curl -s -D - -o /dev/null -H "Origin: https://evil.example.com" "$API/api/v1/health" | grep -i access-control-allow-origin || echo "blocked (good)"
#    ...and allows the real site -> prints the real origin
curl -s -D - -o /dev/null -H "Origin: https://<your real site>" "$API/api/v1/health" | grep -i access-control-allow-origin

# 4. Truecaller shortcut is off -> 501
curl -s -o /dev/null -w "%{http_code}\n" -X POST -H "Content-Type: application/json" -d '{"payload":{"phone":"9000000000"}}' "$API/api/v1/auth/user/verify-truecaller"
```

**5. Login with a 6-digit OTP.** Open the user app on a phone and log in with your own number.
- The SMS must contain **6 digits**, and the screen must show 6 boxes. Entering them logs you in.
- Repeat once in the delivery app.
- In the browser dev tools, copy `user_accessToken` from localStorage for the next step.

**6. A tampered price is corrected by the server.** Use a real product id from the super-admin product list and the store id from the store list.
This calls the price check endpoint, so no order is created.

```bash
TOKEN=<user_accessToken from step 5>
curl -s -X POST "$API/api/v1/food/orders/calculate" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"storeId":"<storeId>","items":[{"itemId":"<productId>","name":"x","price":1,"quantity":1,"kind":"product"}]}'
#   -> "subtotal" is the catalogue price, not 1
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$API/api/v1/food/orders/calculate" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"storeId":"<storeId>","items":[{"itemId":"000000000000000000000000","name":"x","price":1,"quantity":1}]}'
#   -> 400 (unknown item rejected)
```

### P1 smoke test

Run the curl checks first (they need no login), then the people checks with real accounts. Use a test franchise with two stores, so
"only their store" can be tried against the other one.

```bash
# P1-a. Admin product list without a token -> 401   (it used to return Draft and Archived products to anyone)
curl -s -o /dev/null -w "%{http_code}\n" "$API/api/v1/food/admin/products"
# P1-b. Same for the other admin catalogue lists -> 401 each
for p in category-products categories addons addons/stats combos; do curl -s -o /dev/null -w "$p %{http_code}\n" "$API/api/v1/food/admin/$p"; done
# P1-c. Query operators are refused on the public menu -> 400   (-g stops curl treating [] as a range)
curl -g -s -o /dev/null -w "%{http_code}\n" "$API/api/v1/food/products/public?price[\$gt]=0"
# P1-d. The public menu still works signed out -> 200
curl -s -o /dev/null -w "%{http_code}\n" "$API/api/v1/food/admin/menu/public"
# P1-e. mock_token is still dead, now on a P1 route -> 401
curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer mock_token" "$API/api/v1/food/store/orders"
```

- [ ] **Delivery partner login works.** In the delivery app, log in with an **approved** partner's number and OTP; the home screen loads.
      A suspended or rejected partner is refused on the next request (expected).
- [ ] **Store manager login works and sees only their store.** Log in at `/store-operation/login`. Orders, staff, inventory and customers
      show only that store. Open another store's record by id (for example `/store-operations/staff/<other store staff id>` or an order id from the other store): not found, not shown.
- [ ] **Kitchen staff sees only assigned tasks.** Log in as a kitchen staff member who has been assigned one order and another who has none:
      **My Tasks** shows only their own task(s); the other member sees none. The supervisor sees all of the store's orders and can assign.
- [ ] **A customer order appears on the store screen without a refresh.** Keep the store manager's **Incoming Orders** open (do not touch it),
      place a cash order from the user app for that store: it appears within a few seconds. The "live" indicator on the screen stays on.
      If it only appears after about a minute, the socket is not connected: see §8.2.
- [ ] **The store price matches the cart total.** Set a store price on one product (franchise admin, **Store Pricing**). In the user app with a delivery address
      served by that store, the menu shows the store price, and the cart total at checkout is the same price plus the Fees & Charges. The order placed from that cart has that total.
- [ ] **A suspended staff account is locked out.** Suspend a test kitchen staff member from the store manager's Kitchen Staff screen; their next request fails (401). A franchise admin opening another franchise's store by id gets 404.

Then check in the apps:
- [ ] Place one real cash order. The total on the order matches the fees set in super admin → Fees & Charges, and it shows in the store panel.
- [ ] Old browser sessions were logged out (expected, see §6). Admins can log back in.
- [ ] `pm2 logs` (or the platform's logs) show no new errors for 10 minutes.

## 6. Tell people, and fix old accounts

- **Everyone is logged out once.** Rotating the JWT secrets invalidates every session: customers, riders, store staff and admins.
  - Customers and riders log in again with OTP.
  - Admins and staff log in with their password.
  - Say so in advance to franchise owners and stores.
- **Franchise admins created before the hashing fix may not be able to log in.** Before the fix, their passwords were saved as plain text, and login compares against a hash, so it fails. The fix hashes on save, so any password reset repairs the account:
  - The admin uses **Forgot password** on the franchise login (email OTP), or
  - the super admin sets a new password on the franchise's edit form.

  To find the affected accounts, run this read-only query in Atlas Data Explorer or mongosh. It shows emails only, never the password field:

  ```js
  db.users.find({ password: { $exists: true, $not: /^\$2[aby]\$/ } }, { email: 1, _id: 0 })
  ```
- **Store-manager accounts made with the old default password `12345678`** can no longer be created. Existing ones should be reset the same way.

## 7. After a successful deploy

- [ ] Delete the `.env` backup from §0 (it holds the old, burned secrets): `shred -u ~/env-backup-*` or `rm`.
- [ ] **Before the real launch (as soon as SMS works): turn off the default-OTP demo switch.** In `Backend/.env` delete
      `ALLOW_DEFAULT_OTP_IN_PRODUCTION` and `TEST_OTP_PHONES` and set `USE_DEFAULT_OTP=false`, restart, and check that `pm2 logs` no longer shows
      `DEFAULT OTP 123456 IS ACTIVE IN PRODUCTION` and that a login SMS arrives with a random 6-digit code. Then remove the switch from the code
      (`allowDefaultOtpInProduction` / `testOtpPhones` in `config/env.js`, `otp.service.js`, `validateEnv.js`, and `test/otp-production-switch.test.js`).
      While it is on, anyone who knows a listed number (or any number, if the list is empty) can sign in as that customer or rider.
- [ ] Update `docs/audit-2.md`: P0-6 server config, secret rotation and deployment become **Done**.
- [x] Tests no longer touch Atlas (N6): `npm test` runs every file on its own in-memory MongoDB, and refuses any `mongodb.net` / `mongodb+srv` URI. Nothing to clean up on the cluster.

---

## 8. P1 server requirements (check before the restart)

### 8.1 MongoDB replica set (live order events)

The store and franchise order screens are pushed by `order_event`. The server produces those events by watching the `food_orders`
collection with a MongoDB **change stream** (`order-events.service.js`, started from `server.js`). Change streams only work on a
**replica set** (or sharded cluster), not on a standalone `mongod`.

**On Atlas** every cluster is a replica set, so a `mongodb+srv://` connection string is already fine. Check anyway:

1. Atlas → your project → **Database** → the cluster. The card should say it has 3 nodes (one Primary, two Secondary). A cluster
   showing a single node, or a connection string with a single host and no `replicaSet=`, is not what you want.
2. **Connect → Shell** (or mongosh with the new `MONGO_URI`), then:

   ```js
   db.hello().setName          // prints the replica set name, e.g. "atlas-xxxxxx-shard-0". "undefined" = standalone
   db.getSiblingDB("<db>").food_orders.watch().close()   // no error = change streams work for this user
   ```
3. The app's database user needs the built-in **readWrite** role on the app database (it includes the `changeStream` action). A user limited to read-only
   roles on `food_orders` would fail with "not authorized".

**If it is not a replica set** the server still starts and everything else works, but the logs repeat
`Order event stream error: ...` every 5 seconds and the live screens only refresh on their 60-second safety poll
(orders appear a minute late). That is a degraded launch, not a crash, so do not roll back for it: fix the connection string/cluster and restart.

### 8.2 WebSocket proxy and the log lines to look for

The live screens connect with `transports: ["websocket"]` only (no long-polling fallback). The reverse proxy (CloudPanel's nginx) must pass the upgrade
for `/socket.io/`:

```nginx
location /socket.io/ {
    proxy_pass http://127.0.0.1:<PORT>;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 86400;
}
```

(In CloudPanel: the site's **Vhost** editor. The API location may already have these headers; confirm rather than assume.)
In `pm2 logs` after the restart you want to see `Socket.IO infrastructure initialized`, and **not** `FRONTEND_URL is not set` or repeating `Order event stream error`.
In the browser dev tools → Network → WS, the admin panel should show one open `socket.io` connection with `101 Switching Protocols`.

### 8.3 Several server instances and Redis (duplicate order events)

If you run **more than one** server process or instance (PM2 cluster mode, `-i N`, or several machines) with `REDIS_ENABLED=true`:

- Every instance opens its own change stream and every instance emits, so each `order_event` reaches the screen **once per instance**
  (known issue M4 in `docs/audit3.md`; not fixed in P1).
- Effect: the order list refetches 2-3 times for one change. Harmless but wasteful; no duplicate orders are created and no data is changed by an event.
- For P1 launch, **run a single instance** (one PM2 process, no `-i`). Without Redis, a single instance is the only supported shape for live events anyway:
  with two instances and no Redis adapter, a client connected to instance A never hears an event emitted by instance B.
- Scale out later by running the watcher on one instance only (env flag) or de-duplicating by event id.

### 8.4 Indexes created on first start

There is no migration step. Mongoose builds the indexes declared in the models when the server connects (`autoIndex` is left at its default, on).

- **New collections** (empty, so instant): shifts and attendance (`food_store_shifts`, `food_store_attendance`), inventory and stock (`stockrequests`, stock transactions/transfers, recipes, ingredient shortages and alerts), kitchen
  (`kitchenitems`, ovens, tasks, escalations, issues, quality checks), store hours, store product prices, price history, delivery issues, offer claims.
- **Existing collections that gain indexes:**
  - `food_orders`: four new indexes (`storeId+createdAt`, `franchiseId+createdAt`, `franchiseId+orderStatus`, and a partial index on store ratings).
  - `users`: `email` (**unique, sparse**), `refresh tokens` (`index`), offer usage and transactions (`userId`).
- **First-boot cost:** index builds on Atlas run on the primary and do not block reads/writes, but they use CPU and I/O. For a few thousand orders and users this is
  seconds. With hundreds of thousands of orders, expect the first minute after the restart to be slower; do the deploy in the quiet window (§0).
  Check **Atlas → Collections → food_orders → Indexes** (or `db.food_orders.getIndexes()`) afterwards; they should all be listed, none "building".
- Mongoose starts the builds when the server connects; the server then goes on to start listening. If a build is slow, expect slower queries on that collection meanwhile rather than a slow boot, but watch the first minutes of `pm2 logs` for index errors.

### 8.5 One pre-check before the restart: duplicate emails on `users`

The unique `users.email` index fails to build if two user records already share an email (or case-variants of one: the field is now lowercased on save).
The server keeps running if it fails, but then email uniqueness is **not enforced**. Check in mongosh first (read-only):

```js
db.users.aggregate([
  { $match: { email: { $type: "string", $ne: "" } } },
  { $group: { _id: { $toLower: "$email" }, n: { $sum: 1 } } },
  { $match: { n: { $gt: 1 } } }
])                                    // expect: no results
db.users.countDocuments({ email: null, $expr: { $eq: [{ $type: "$email" }, "null"] } })   // expect: 0 (a stored null counts as a value in a sparse index)
```

If there are results, fix those accounts first (merge or change one email). To drop the index after a failed build: `db.users.dropIndex("email_1")`.

---

## 9. Click-through before you show the client

Do this on the **deployed** site after the smoke test, with one real account per role. A screen is "working" only when its data comes from the server
(create something, reload the page, it is still there; look at another account's view and it is not shared). Several store-panel screens still carry demo/mock data
files as a fallback, so a screen that loads but shows data you never created is **not** passing. Mark it down and hide it for now.

Phase-1 scope is what the backend supports and the audits tested. **Phase 2, do not show to the client:** staff Performance, reports,
finance, marketing and rewards. They exist in the menus, but their backend is deferred or demo-only.
(Attendance, shifts and the profile pages are built server-side in Feature 7. Check each one in the click-through below before showing it.)

### Super admin
- [ ] Works: sign in; Dashboard; Franchises (create a franchise admin with email + temporary password); Stores and Store Approvals; Products, Categories, Add-ons, Combos;
      User-app settings (home page, welcome screen, cart config, fees and charges); Orders; Coupons/Offers that customers actually receive.
- [ ] Phase 2, hide: Finance and payouts; Marketing and campaigns; Rewards management; Reports and analytics pages.

### Franchise admin
- [ ] Works: sign in with the temporary password then change it; Dashboard; Stores (own franchise only) and Operating Hours; Store Performance; Store Pricing;
      Store Managers (create); Kitchen Staff list; Delivery Partners; Live / Completed / Cancelled Orders; Refund Requests and Order Issues; Products/Categories/Add-ons (read);
      Inventory (ingredients, stock levels, low-stock alerts, purchase requests); Customers, Complaints, Reviews.
- [ ] Phase 2, hide: Reports; Marketing; Loyalty Members; anything under Finance; Profile editing beyond password change.
- [ ] Scope check: another franchise's store/order/staff id returns "not found".

### Store manager
- [ ] Works: sign in at `/store-operation/login`; Dashboard; Orders (Incoming, Active, Ready, Completed, Cancelled) with live updates; Kitchen Operations (queue, preparation, stations, delayed orders);
      Delivery Operations (assign rider, rider availability, tracking, delivery issues); Inventory (stock, requests, waste, low stock, shortages); Staff Management → **Kitchen Staff** (add supervisor/staff, edit, suspend);
      Customers (orders, complaints, reviews); My Tasks.
- [ ] Feature 7, check before showing: **Attendance** (mark, bulk mark, edit, delete), **Shift Management** (create, edit, assign staff, delete) and **Profile** (personal info, password, photo, notifications, sessions). Create something, reload, and confirm it is still there; a record that only exists in your browser is the demo fallback, not the server.
- [ ] Phase 2, hide: **Performance** (staff), Reports, any revenue/finance figures.
- [ ] A store manager can create kitchen supervisor/staff but cannot see, edit or delete their own manager account or anyone outside their store.

### Kitchen supervisor
- [ ] Works: sign in; sees all of the store's orders; accepts/assigns staff to an order; Kitchen Queue and stations; Delayed Orders; My Tasks; stage changes on orders they run.
- [ ] Feature 7: can read the store's shifts and attendance, clock in and out for themselves, and edit their own Profile. Cannot create shifts or mark other people's attendance (403).
- [ ] Phase 2, hide: Performance, Reports.
- [ ] Cannot reach store-manager-only pages (staff creation, inventory approvals, delivery assignment): the screen or the API says no.

### Kitchen staff
- [ ] Works: sign in; **My Tasks** shows only the tasks assigned to them; start/complete a task; move the stage of an order assigned to them; notifications.
- [ ] Feature 7: can clock in and out and see only their own attendance and shift; can edit their own Profile.
- [ ] Phase 2, hide: Performance, and any menu item other than My Tasks / their station / Profile.
- [ ] Sees no other staff's tasks. (Kitchen staff are given store orders only through the tasks assigned to them.)

### Customer (user app)
- [ ] Works: OTP login (6 digits); home, menu and search with store prices for their location; cart and checkout (cash order, and a Razorpay test payment if enabled);
      order placed, then tracked through placed → accepted → preparing → ready → out for delivery → delivered; coupons page; order history; profile image upload (images only).
- [ ] Truecaller buttons show "use your mobile number" and do nothing else (expected; not a bug).
- [ ] Phase 2: rewards/loyalty, gift cards, wallet top-up beyond what the cart already offers.

### Delivery partner (delivery app)
- [ ] Works: welcome screen, login with OTP (approved partners only), go online, receive/accept an assigned order, delivery, history.
- [ ] A partner who is pending, suspended or rejected cannot get past login/next request.
- [ ] Phase 2: earnings withdrawal, incentives and anything finance-related beyond viewing an order.

### Last check
- [ ] Nothing in the admin panels shows "mock", "demo" or "Please switch your role using the demo toggle": if it does, that screen is not ready for the client.
- [ ] `pm2 logs` quiet for 10 minutes while the above is clicked through.
