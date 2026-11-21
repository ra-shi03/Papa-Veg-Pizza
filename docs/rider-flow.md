# Rider flow: signup, statuses, and what each panel sees

Written from the code on `batch-4-nearby-people` after `5df99ed` (the merge of `073a4dc`), before the fixes in the
commit that adds this file. "Rider" = delivery partner, collection `food_delivery_partners`
([deliveryPartner.model.js](../Backend/src/modules/food/delivery/models/deliveryPartner.model.js)).

## 1. What the delivery app collects, and where it is stored

Signup is two screens. Step 1 keeps everything in `sessionStorage` (`deliverySignupDetails`); step 2 sends one
multipart `POST /v1/food/delivery/register` (public, files through `safeUpload`: images only, size- and signature-checked)
and `registerDeliveryPartner` ([delivery.service.js](../Backend/src/modules/food/delivery/services/delivery.service.js))
creates the record with `status: 'pending'`. Images go to Cloudinary; the record keeps the URL.

| Screen | Field in the app | Stored on the rider as |
|---|---|---|
| Step 1 ([SignupStep1.jsx](../Frontend/src/modules/DeliveryV2/pages/auth/SignupStep1.jsx)) | Full name | `name` |
| | Phone (from the OTP screen) + country code | `phone` (unique), `countryCode` |
| | Email (optional) | `email` |
| | Address (free text) | `address` |
| | City (Google Places pick, **text only**) | `city` |
| | State (Google Places pick, text only) | `state` |
| | Vehicle type (bike / scooter / bicycle / car) | `vehicleType` |
| | Vehicle name (e.g. Honda Activa) | `vehicleName` |
| | Vehicle number | `vehicleNumber` (unique, sparse) |
| | Driving licence number | `drivingLicenseNumber` |
| | PAN number | `panNumber` |
| | Aadhaar number | `aadharNumber` |
| | Referral (`?ref=`) | `referredBy` (credited on approval) |
| Step 2 ([SignupStep2.jsx](../Frontend/src/modules/DeliveryV2/pages/auth/SignupStep2.jsx)) | Profile photo (the selfie) | `profilePhoto` (URL) |
| | Aadhaar card photo (ID card) | `aadharPhoto` (URL) |
| | PAN card photo | `panPhoto` (URL) |
| | Driving licence photo | `drivingLicensePhoto` (URL) |
| | Push token | `fcmTokens` / `fcmTokenMobile` |
| Later, signed in (`PATCH /delivery/profile/bank-details`) | Bank holder, account no., IFSC, bank name, UPI id, UPI QR | `bankAccountHolderName`, `bankAccountNumber`, `bankIfscCode`, `bankName`, `upiId`, `upiQrCode` |

Not collected anywhere: **vehicle RC, address proof, insurance**. **No coordinates at signup**: the city picker only
fills the text fields, so a new rider has no `lastLocation` until the app sends a GPS fix (section 2).

## 2. Statuses and what moves between them

Two separate fields: `status` (approval) and `availabilityStatus` (shift).

| From | To | How |
|---|---|---|
| (none) | `pending` | signup (`POST /delivery/register`) |
| `pending` | `approved` | super admin `PATCH /food/admin/delivery/:id/approve` (sets `approvedAt`, credits the referrer) |
| `pending` / `approved` | `rejected` | super admin `PATCH /food/admin/delivery/:id/reject { reason }` (`rejectionReason`, `rejectedAt`) |
| `rejected` | `pending` | the rider signs up again with the same phone: the old record is **deleted** and a new one created |
| `approved` | `suspended` and back | super admin `PATCH /food/admin/delivery/:id { status: 'suspended' / 'approved' }` |
| `offline` | `online` and back | the rider's toggle, `PATCH /food/delivery/availability { status, latitude?, longitude? }` |

Only an **approved** rider gets a token at login (`verifyDeliveryOtpAndLogin`). Pending, rejected and suspended riders
get `pendingApproval: true` and a message (a suspended rider is told "pending admin verification", which is misleading).
So **a pending rider can never send GPS** and can only match stores by city.

When GPS is saved (`lastLocation` point, `lastLat`, `lastLng`, `lastLocationAt`):
1. an approved rider opens the app home screen and allows location: one fix (`useReportLocationOnOpen`, availability
   endpoint without a status, so online/offline is unchanged);
2. the rider goes online from the navbar toggle (`updateLocation(lat, lng, true)`);
3. while online, `watchPosition` keeps sending fixes; during a trip the tracking worker updates `lastLocation`.
Location denied, or the app never opened after approval = no GPS.

## 3. What each panel receives

| Panel | Endpoint | Rider fields received |
|---|---|---|
| Super admin, list | `GET /food/admin/delivery/partners` (approved; `?status=approved,suspended`) | `name, email, phone (full), deliveryId, zone (city/state/address), vehicleType, vehicleName, status, availability, activeOrders, rating, lastSeen, storeId, franchiseId, totalOrders, profilePhoto` |
| Super admin, pending | `GET /food/admin/delivery/join-requests?status=pending` | `name, email, phone, zone, jobType, vehicleType, status, rejectionReason, profilePhoto` |
| Super admin, one rider | `GET /food/admin/delivery/:id` | the whole record: every field in section 1, including document URLs and the full bank details, plus `documents`, `location`, `vehicle` groupings. **The Partner Profile drawer did not call it**: it showed the list row plus a fake map image, the stock "Alex" photo, "Last Active: 2 mins ago", "#ORD-11502" and a fixed "VERIFIED" badge. |
| Franchise admin | `GET /food/admin/delivery/partners` (franchise branch, `franchiseRiders.service.js`) | `name, phone (masked), deliveryId, zone, vehicleType, status, availability, activeOrders, rating, lastSeen, totalOrders, ordersToday, storeIds, storeNames`. Never documents, bank, Aadhaar/PAN, email, photo, vehicle number. Read only. |
| Store manager / supervisor | `GET /store/riders`, `GET /store/rider/:id` | `name, mobile (full for the store manager, masked for the supervisor), vehicleType, joiningDate, rating, approvalStatus, status (pending/online/offline), area, distanceFromStore, availability, currentStatus, lastSeen` + delivery stats. Approved and pending riders near the store. |
| | `GET /store/delivery/available-riders` (Assign Rider) | the same minus stats; **approved and online** riders near the store only |
| | `GET /store/dashboard/rider-roster`, `/delivery-overview` | name, status word, orders, area; counts of free online riders near the store |

Who is "near" a store (`store/services/nearby.js`, shared by all of the above and by auto-dispatch): the store's own
riders always; riders of its franchise or of the shared fleet when their saved GPS point is within
`NEARBY_RADIUS_KM` (default 10) of the store, or, **without a GPS point**, when their `city` equals the store's city
or its zone's name / service location (case-insensitive, trimmed).

## 4. Why "DeliveryBoy" does not appear

The dev record (`food_delivery_partners`, name "DeliveryBoy"): `status: approved`, `availabilityStatus: offline`,
`city: "Delhi"`, `address: "karol bagh"`, no `lastLocation`, no `storeId` / `franchiseId` (shared fleet).
The only store, "Papa Veg Pizza - Karol Bagh", has coordinates (28.659, 77.199), **`city: "North India (Delhi)"`** and no zone.

1. No GPS point, so the rider can only match by city.
2. The city rule compared the whole strings: `"delhi"` vs `"north india (delhi)"`. Not equal, so the rider is not near
   the store. That one rule hides it from the franchise admin list (`riderScope` per franchise store), the store's
   Rider Availability (`/store/riders`) and the dashboard roster.
3. Assign Rider (`/store/delivery/available-riders`) additionally needs `approved` **and** `online`; the rider is
   offline, so even with a matching city it is not offered there (by design: only riders who can take the order now).

Fix in this commit: the city fallback also accepts the parts of the store's city text (the name inside brackets and
the comma-separated parts, e.g. "North India (Delhi)" gives "Delhi"), still case-insensitive with spaces trimmed and
collapsed. With that, DeliveryBoy shows as offline for the Karol Bagh manager and its franchise admin. To appear in
Assign Rider, the rider must go online (which also sends a GPS fix).

## 5. After packaging: store manager to rider to customer (updated 2026-11-16)

Order status: `ready_for_pickup` -> `picked_up` -> `delivered`. Rider side: `dispatch.status` unassigned -> assigned -> accepted.

| Step | Who | Where | What happens |
|---|---|---|---|
| Ready | kitchen | Orders > Ready Orders | Packaging done: order is `ready_for_pickup`, rider dispatch starts |
| Assign | store manager | Delivery Operations > Assign Rider (or Assign Rider on Ready Orders) | `POST /store/.../assign`: only an **approved, online** rider near the store. Sets `dispatch.status: assigned`, `dispatch.manual: true`, pushes `new_order_available` over the socket plus a push notification |
| Accept | rider | delivery app | Accepts the offer; `dispatch.status: accepted`. Reject clears `manual` and the order goes back to auto-dispatch |
| Reached pickup | rider | delivery app | `deliveryState` only; the store is notified |
| Bill photo | rider | delivery app (pickup modal) | The rider uploads the bill photo, then swipes pickup (`billImageUrl` saved) |
| Store handover | store manager | Ready Orders > Confirm Pickup (rider OTP) | `PATCH /store/orders/:id/pickup` moves the order to `picked_up`. **This path skips the rider's bill-photo step.** A rider who never tapped Accept is accepted here |
| Reached drop | rider | delivery app | Generates the customer's 4-digit OTP (`deliveryOtp`) |
| OTP | rider | Handover Code modal | The rider types what the customer says. 5 wrong tries per order, then the store manager resets (`POST /store/orders/:id/reset-drop-otp`) |
| **Handover photo** | rider | Handover Photo modal (after the OTP) | **New.** Photo of the order at the door. Required: `completeDelivery` returns 400 without `handoverPhotoUrl`. Saved on `deliveryVerification.handoverPhotoUrl` / `handoverPhotoAt` |
| Payment, complete | rider | delivery app | Cash or QR for pay-on-delivery; prepaid must already be verified. Order becomes `delivered` |

### Bugs fixed in this area
- **Manual rider assignment undone.** Auto-dispatch (`tryAutoAssign`), its timeout job (`processDispatchTimeout`) and the
  startup watchdog (`recoverStuckOrders`, runs on every backend start) reset any assigned-but-not-accepted order. All three now skip
  `dispatch.manual: true`. `rejectOrderDelivery` clears the flag.
- **Out for delivery, nothing in the rider app.** The rider's current trip needs `dispatch.status: accepted`; Confirm Pickup now accepts at handover.
- **Ready Orders showed "No rider assigned".** It looked the rider up in a mock `pvp_riders` list in localStorage; it now uses the order's `deliveryPartner`.

### Bill photo and handover photo (updated 2026-11-21)
- The rider's bill photo is saved on the order as soon as it is uploaded (`PATCH /food/delivery/orders/:id/bill-photo`,
  `deliveryState.billImageUrl`). The rider's own pickup (`confirm-pickup`) needs a bill photo too (sent or already saved).
- The store's **Confirm Pickup** now needs the rider's bill photo: without it the server answers 400 ("The rider has not uploaded the
  bill photo yet..."). `deliveryState.pickupConfirmedBy` says whether the rider or the store confirmed the pickup.
- Store, franchise admin and super admin all see the same delivery proof: the store and franchise order lists carry `delivery`
  (bill photo, handover photo, times, `dropOtpVerified`; never the OTP), the super admin order detail carries `deliveryState` and
  `deliveryVerification`. The franchise order list also names the rider (masked phone).

### Blocking a delivery partner (updated 2026-11-21)
- **Franchise admin** (riders in its scope) and **super admin** (any rider) can block (`PATCH /food/admin/delivery/:id/suspend { reason }`)
  and unblock (`/activate`). Approve and reject stay with the franchise admin.
- A blocked rider is refused on the very next request (token needs an `approved` record), cannot sign in (the sign-in message
  carries the reason), is set offline, and gets no offers. Orders they had **not picked up** go back to dispatch; orders already on
  the road stay with them and are counted in the response (`releasedOrders`, `ordersInProgress`).
- The history on the rider records who blocked (`byRole` FRANCHISE_ADMIN or SUPER_ADMIN).

### Client rule: rider accident cost
- The cost of a rider's accident recovery and treatment is borne by the franchisee outlet; for any mishap the store / outlet owner
  is responsible, not the company. It is a fixed clause in every Terms & Conditions page (customer, delivery, franchise), added
  by the server (`withRiderLiabilityClause`) so it cannot be edited away. Shown in the super admin panel (Policies > Terms) and in the franchise panel (Terms & Conditions).

### Bank details and the delivery wallet (updated 2026-11-21)
- **Signup**: a "Bank & Payment Details" step (account holder, number, IFSC, bank name, UPI id) comes after the personal details.
  It has **Skip**; the details go with the registration (`POST /delivery/register`, validated: 9-18 digit account, IFSC, UPI format).
- **Going online** (`PATCH /delivery/availability { status: 'online' }`) needs account holder, number, IFSC and UPI id, else 400
  `code: PAYOUT_DETAILS_REQUIRED` (the app opens Profile > Bank details). Profile > Bank details now really saves
  (it used to call `/profile/details`, which ignored bank fields) and includes the UPI id.
- **Delivery wallet** = every completed deposit (rider recharges `purpose: wallet_recharge`, and the older COD settlements)
  minus the COD cash collected on delivered orders. It goes below zero after cash orders; the rider recharges
  (Pocket > Delivery wallet, Razorpay, `POST /delivery/wallet/deposit/order { amount, purpose: 'wallet_recharge' }`, not capped by cash in hand).
- **Minimum**: each franchise admin sets `FoodFranchise.riderWalletMinBalance` (`GET/PATCH /food/admin/delivery/wallet-settings`,
  Delivery Partners page). The super admin reads every franchise's (cannot set). Default ₹0 (balance must not be negative).
- **Accept** needs payout details and a balance at least the order's franchise minimum, else 400 `WALLET_RECHARGE_REQUIRED`
  (the app offers Recharge). Offers, auto-dispatch and the store's Assign Rider list skip riders who cannot accept;
  assigning one is refused. Orders already accepted continue.
- **Super admin** sees per rider: wallet balance, recharges, COD collected, minimum, deposit history, bank + UPI and what is missing;
  the list carries `walletBalance` and `payoutDetailsComplete`. The franchise list carries the same two fields.
- Without a payment gateway configured, recharges are refused in production (dev servers accept them unsigned).
