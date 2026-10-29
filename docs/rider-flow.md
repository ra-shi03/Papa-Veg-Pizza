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
| Store manager / supervisor | `GET /store/riders`, `GET /store/rider/:id` | `name, mobile (masked), vehicleType, joiningDate, rating, approvalStatus, status (pending/online/offline), area, distanceFromStore, availability, currentStatus, lastSeen` + delivery stats. Approved and pending riders near the store. |
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
