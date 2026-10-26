# Deploy checklist: `security-fixes` to the CloudPanel server

Branch `security-fixes` (19 commits ahead of `main` at `4e54da6`) closes every P0 and the audit-2 findings.
Until it is deployed, the live server still accepts `Bearer mock_token` as super admin.

Do the steps in order. **Never paste a real secret into this file, a chat, a ticket or a commit.**

---

## 0. Before you start

- [ ] Pick a quiet time. Rotating the secrets logs **everyone** out (see §6).
- [ ] Know the real site address(es) the browser loads, e.g. `https://papavegpizza.com` and `https://admin.papavegpizza.com`.
      This becomes `FRONTEND_URL`.
- [ ] Have SSH access to the server and the CloudPanel site user's shell.
- [ ] Back up the current server `.env`, readable only by you:
      `cp Backend/.env ~/env-backup-$(date +%F)` then `chmod 600 ~/env-backup-*`
- [ ] Note the commit the server runs now, for rollback: `git -C <app dir> rev-parse HEAD`

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
| `USE_DEFAULT_OTP` | `false`, or delete the line. It is ignored in production anyway; `false` makes that explicit. |
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

**Frontend (Vercel or wherever it is built):** `VITE_API_BASE_URL` must point at the API, ending in `/api/v1` (`https://<api host>/api/v1`).
Its origin must also be listed in the backend's `FRONTEND_URL`.

## 4. Merge, push, deploy

On your machine:

```bash
git checkout security-fixes && git pull --ff-only     # nothing unexpected
cd Backend && npm test && cd ..                       # expect: all tests pass
git checkout main && git pull --ff-only
git merge --ff-only security-fixes                    # main has no new commits, so this fast-forwards
git push origin main
git tag pre-security-deploy 4e54da6 && git push origin pre-security-deploy   # rollback point
```

On the server (as the CloudPanel site user, in the app directory):

```bash
git fetch origin && git checkout main && git pull --ff-only
git log -1 --oneline                                  # must show the security-fixes head
cd Backend && npm ci --omit=dev                       # clean install from the lockfile, no test-only packages
# edit Backend/.env now (sections 2-3) if not done yet
```

Restart the process. The repo has no PM2 config, so check what runs it first:

```bash
pm2 ls                                                # if listed: restart with fresh env
pm2 restart <name> --update-env && pm2 save
pm2 logs <name> --lines 50                            # look for "Socket.IO infrastructure initialized", no "FRONTEND_URL is not set"
```

- If it isn't PM2 (systemd, or the CloudPanel Node.js app "Restart" button), restart it that way. Running `node server.js` directly is fine too.
- Background workers (`npm run worker:*`) only run if you use BullMQ. Restart them too if so.

Frontend: redeploy the build (Vercel redeploy, or `cd Frontend && npm ci && npm run build` and publish `dist/`).
The cart, checkout, OTP screens and the new super-admin **Fees & Charges** page depend on this backend.

### Rollback

If the smoke test fails badly, go back to the old code, **but keep the new secrets and Atlas password**: the old ones are burned.

```bash
git checkout pre-security-deploy        # or: git checkout 4e54da6
cd Backend && npm ci --omit=dev
pm2 restart <name> --update-env
```

- The old code accepts `JWT_ACCESS_EXPIRES` and ignores the new variables, so the new `.env` keeps working with it.
- Rolling back brings back every original hole (`mock_token`, client-side prices). Treat it as minutes, not days, and fix forward.
- New collections created by the new code (`food_offer_claims`, `food_store_withdrawals`, `food_store_support_tickets`) are harmless to the old code. Nothing needs undoing in the database.

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
- [ ] Update `docs/audit-2.md`: P0-6 server config, secret rotation and deployment become **Done**.
- [ ] Optional: in Atlas, set up a separate test cluster and point `npm test` at it. Today the tests use throwaway `pvp_test_*` databases on the production cluster (N6).
