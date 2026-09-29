# Part D — Dashboards & QR · Chamara R M L K

## In one sentence
You own **seeing and finishing bookings**: booking lists (current / pending / history) with a **search filter**, the **dashboards** (pending reservations + count of approved future reservations), the **QR code** on the prosumer's phone, and the operator's **scan → verify with server → finalize** flow.

## Why it exists
Prosumers need to see what's coming up and what happened before. Staff need a quick view of what's waiting for approval. And at the station, the operator must be sure a booking is real before moving energy — the QR code carries a secret only the server and the booking owner know.

## What users see
| Where | Screen | What happens |
|---|---|---|
| Web | **W3 Dashboard** | Count cards: Pending, **Approved future**, Today, Active stations, Pending activations + table of next pending reservations |
| Web | **W13 Reservations** | **Filter bar**: view (all/current/pending/history), status, station, date range, search text |
| Mobile | **M3 Prosumer Home** | Counts: Pending, Approved upcoming, Completed + "Next booking" card |
| Mobile | **M8 My Bookings** | Tabs **Current · Pending · History** + **search box** |
| Mobile | **M9 Booking detail** | Details + **QR code** when Approved |
| Mobile | **M10 Operator Home** | Counts + big **Scan QR** button |
| Mobile | **M11 Scan result** | ✓ "Verified with server" + details → **Finalize energy transfer** → summary (Completed) |

## Rules & definitions you own
| Item | Plain words |
|---|---|
| **R14** | QR text = `SUNSHARE|<reservationId>|<qrToken>`. Verify: right format, reservation exists, status Approved, token matches. Finalize: same checks again → Completed + who/when. Grid Operator only |
| R16 (shared) | Prosumer lists only ever contain their own bookings |
| Pending | status Pending |
| Approved future count | status Approved **and** start time > now |
| Current | Approved and in the future |
| History | Completed, Cancelled, or start already passed |

## Data you touch
Reads `EnergyReservations` (status, startTime, stationName, prosumerNic…), `SolarStationInfo` (active count), `Users` (pending activations count). Writes `status`, `completedBy`, `completedAt` on finalize.

## Your endpoints
`GET /api/reservations?view=&status=&stationId=&from=&to=&search=` · `GET /api/reservations/{id}` · `POST /api/reservations/verify-qr` · `PATCH /api/reservations/{id}/complete` · `GET /api/dashboard/summary` · `GET /api/dashboard/prosumer`

## How the QR flow works (step by step)
1. Staff approve a booking (Part C) → the server saves a random token.
2. Prosumer opens it (M9) → `GET /api/reservations/{id}` returns `qrData` (only to the owner, only when Approved).
3. The phone turns that text into a QR image with ZXing's `BarcodeEncoder` → shown on screen.
4. Operator (M10) taps **Scan QR** → ZXing opens the camera → returns the text it read.
5. App sends `POST /api/reservations/verify-qr { qrData }` → `QrService` splits it, finds the reservation, checks Approved + token match → returns details → M11 shows them with ✓.
6. Operator taps **Finalize** → `PATCH /api/reservations/{id}/complete { qrData }` → same checks again → `Completed`, `completedBy`, `completedAt` → M7 summary.
7. Scanning it again later → "already completed" error, so a QR can't be used twice.

## Files (planned — updated after the build)
- API: `Controllers/ReservationViewsController.cs`, `QrController.cs`, `DashboardController.cs` · `Services/ReservationQueryService.cs`, `QrService.cs`, `DashboardService.cs` · `Dtos/VerifyQrRequest.cs`, `StaffDashboardResponse.cs`, `ProsumerDashboardResponse.cs`
- Web: `pages/Dashboard.jsx`, `Reservations.jsx` (list + filter bar; C adds row actions) · `api/dashboardApi.js` + list functions in `api/reservationsApi.js`
- Android prosumer views ✅ (Phase 16; basic homes from Phase 14, D49): `ui/prosumer/ProsumerHomeActivity.java`, `BookingsActivity.java`, `BookingAdapter.java`, `ReservationDetailActivity.java` · layouts `activity_prosumer_home.xml`, `activity_bookings.xml`, `item_booking.xml`, `activity_reservation_detail.xml` · `ui/operator/OperatorHomeActivity.java` + `activity_operator_home.xml` (basic)
- Android (planned, Phase 18): operator counts + **Scan QR** on `OperatorHomeActivity`, `ui/operator/ScanResultActivity.java` + layout

> **Built for you in Phase 4 (reuse, don't copy):** `ReservationMapper.ToResponse(r)` builds every `ReservationResponse` (incl. `canModify`, `qrData`); `ReservationMapper.QrPrefix` = `"SUNSHARE"`; `ReservationService.FindOrThrowAsync(id)` (404 incl. bad ids) and `ReservationService.CheckOwner(r, nic, role)` (R16 → 403) are public.

## How it works
### API (Phase 5) — ✅ built
**Files** (in `api/SunShare.Api/`): `Services/ReservationQueryService.cs`, `QrService.cs`, `DashboardService.cs` · `Controllers/ReservationViewsController.cs`, `QrController.cs`, `DashboardController.cs` · `Dtos/VerifyQrRequest.cs`, `StaffDashboardResponse.cs`, `ProsumerDashboardResponse.cs`. (Reuses Part C's `ReservationMapper`, `ReservationService.FindOrThrowAsync` and `CheckOwner`.)

**Lists** (`GET /api/reservations?view=&status=&stationId=&from=&to=&search=`):
- **R16 first:** if the caller is a Prosumer, the filter always starts with `prosumerNic = my NIC` (from the token) — they can never see anyone else's booking, even by searching. Opening someone else's by id → 403.
- **Views** (01-SPEC §5): `current` = Approved and start > now · `pending` = Pending · `history` = Completed **or** Cancelled **or** start ≤ now · `all` = everything.
- **Filters:** status, station, start-time range. **Search:** station name contains the text (not case-sensitive); a full reservation id; staff also NIC / prosumer name.
- **Order:** history newest first (what just happened is on top); the others soonest first.

**QR** (Grid Operator only):
- **Verify** splits the text on `|` and checks, in order: 3 parts and starts with `SUNSHARE` → booking exists → not Completed ("a QR code can only be used once") → not Cancelled → Approved → **token matches** the one saved at approval. Each failure has its own message for the operator's red card.
- **Complete** runs the same checks, makes sure the QR belongs to the booking in the URL, then sets `Completed` + `completedBy` (operator NIC) + `completedAt`.
- Why it's safe: the QR only contains the booking id and a random token; the **server** decides. Edit a booking → it goes Pending and loses its token; re-approval makes a new token, so an old screenshot is useless (tested).

**Dashboards** — every number is counted on the server (`CountDocumentsAsync`), so web and mobile always agree:
- Staff: Pending · Approved + future · Today (Sri Lanka date, not cancelled) · active stations · Pending/Deactivated prosumers · next 5 upcoming Pending (for the Approve table).
- Prosumer: my Pending · my Approved + future · my Completed · my next upcoming booking (or null).
- Checked against raw MongoDB with separate code: the numbers matched exactly.

_(Claude Code fills this in after Phases 5, 10, 16 and 18.)_

### Web pages (Phase 10) — ✅ built
**Files** (in `web/src/`): `pages/Dashboard.jsx`, `pages/Reservations.jsx` · `components/ReservationTable.jsx` · `api/dashboardApi.js`, `api/reservationsApi.js` · `utils/format.js` (`fromDateInput`).

- **Dashboard (W3):** one call `GET /api/dashboard/summary` → count cards (Pending, Approved upcoming, Today, Active stations, and Pending activations for Backoffice only). Each card is a link to the matching list (e.g. `/reservations?view=pending`). The table "Waiting for approval" shows the API's next 5 upcoming Pending bookings with an **Approve** button → `PATCH /api/reservations/{id}/approve` → the cards reload (pending −1, approved +1). The browser never counts anything — web and mobile show the same numbers because the API counts.
- **Reservations (W13):** view buttons (All / Current / Pending / History) + status + station + date range + search → `GET /api/reservations?view=&status=&stationId=&from=&to=&search=`. The API applies the definitions (Current = Approved & future; History = Completed, Cancelled or already started). The date boxes pick *local* days; the page turns them into UTC (`from` = that day's midnight, `to` = the next day's midnight so the whole day counts).
- **ReservationTable:** When · Station (+ id) · Prosumer (+ NIC) · Energy (kWh, Sell/Buy) · Status badge. Pages add buttons with `renderActions` (dashboard: Approve; Malkith's Phase 11: Edit / Cancel / Approve).

### Android prosumer screens (Phase 16) — ✅ built
**Files** (in `android/app/src/main/java/com/sunshare/app/ui/prosumer/`): `ProsumerHomeActivity.java`, `BookingsActivity.java`, `BookingAdapter.java`, `ReservationDetailActivity.java` · layouts in `res/layout/`: `activity_prosumer_home.xml`, `activity_bookings.xml`, `item_booking.xml`, `activity_reservation_detail.xml`.

**Words first:** `onResume` = Android calls it every time a screen comes to the front (first open *and* coming back), so loading there keeps numbers fresh. A **RecyclerView** is a scrolling list that re-uses a few row views; the **adapter** fills a row with one booking. **Retrofit** runs the HTTP call in the background and calls `onResponse` / `onFailure` back on the screen.

- **M3 Home:** `onResume` → `GET /api/dashboard/prosumer` → three count cards (**Pending**, **Approved upcoming**, **Completed**) and a **Next booking** card. The API counts only this prosumer's bookings (NIC from the token, R16) using the definitions in `01-SPEC.md` §5 — the phone just shows the numbers. Tapping a card opens My bookings on that tab (Pending → Pending, Approved upcoming → Current, Completed → History); tapping the next booking opens its details.
- **M8 My bookings:** a `TabLayout` with **Current · Pending · History** and a search box. Each tab calls `GET /api/reservations?view=current|pending|history&search=…`; the **API** decides what belongs in each tab (Current = Approved and still to come; History = Completed, Cancelled or already started). Search runs when the keyboard's 🔍 key is pressed (station name, or a full 24-character booking id); the ✕ button clears it and shows the whole tab again. If you switch tabs quickly, the older request is **cancelled** so a slow old answer can't overwrite the new tab (D52). Empty tab → a friendly line ("No bookings waiting for approval."); tap a row → M9.
- **BookingAdapter:** `onCreateViewHolder` builds a row from `item_booking.xml`; `onBindViewHolder` puts a booking into it (station, time in phone time via `DateUtils`, "12.5 kWh · Sell", coloured status badge via `UiUtils.showStatusBadge`); tapping the card calls back to the screen.
- **M9 Booking details:** `onResume` → `GET /api/reservations/{id}` (someone else's id → the API answers 403, R16). Shows station, time, energy + type, status badge, booking id and a history line (booked / approved / completed / cancelled times). **QR:** only when the booking is Approved does the API send `qrData` = `SUNSHARE|<id>|<token>` (R14); the phone turns that text into a QR picture with ZXing's `BarcodeEncoder` (600 × 600 px). Pending / Completed / Cancelled show a short "what happens next" note instead. Malkith adds **Edit / Cancel** here in Phase 17 (only when the API says `canModify`).
- **Tested on the emulator (29 Sep, Nimal):** Home 1 / 1 / 1 + next booking Malabe (Approved); next booking → details with QR; the QR was **decoded from a screenshot** and matched the API's `qrData` exactly, and `POST /api/reservations/verify-qr` (as Grid Operator) accepted it; Pending card → Pending tab (Kaduwela); Current (Malabe) and History (Battaramulla Cancelled, Malabe Completed); search "Batta" → 1, "xyz" → "No bookings match", full id → the Completed booking, ✕ → all again; Cancelled and Pending details show their notes and no QR.

## Your demo (≈ 75 s)
1. Phone (prosumer): Home → counts. **My Bookings** → Current / Pending / History tabs → search "Kaduwela".
2. Open the Approved booking → **QR code** on screen (emulator).
3. Second phone (operator): **Scan QR** → point at the laptop screen → ✓ Verified → **Finalize** → Summary: Completed.
4. Back on the prosumer phone: booking moved to **History**; Home counts changed.
5. Web dashboard: counts updated live.

## Viva questions
1. **Current vs pending vs history?** — Current = Approved and in the future; Pending = waiting for approval; History = Completed, Cancelled or already past. The API decides which list a booking belongs to.
2. **How does search work?** — The app sends `search`, `view`, `status` and dates as query parameters; `ReservationQueryService` filters in MongoDB (station name or id; staff also NIC/name), case-insensitive. The app does no filtering itself.
3. **How is "approved future reservations" counted?** — `DashboardService` counts documents where status is Approved and `startTime > UtcNow`.
4. **Who generates the QR?** — The phone draws the image with ZXing, but the secret inside it comes from the server when staff approve the booking.
5. **Why is the QR secure?** — It contains a random 32-character token stored only on the server and shown only to the booking owner. Guessing it is practically impossible; it's cleared on edit, and a completed booking can't be completed again.
6. **What happens when the operator scans?** — See the 7 steps above: scan → verify-qr → show details → finalize → Completed → summary.
7. **Why check again on finalize when you already verified?** — Never trust the client: the booking could have been cancelled between the two steps, or someone could call the endpoint directly.
8. **Why are the dashboard numbers "live"?** — Each screen calls the API every time it opens/resumes; nothing is hard-coded or cached.
9. **What is a RecyclerView adapter?** — It turns the list of bookings into rows on screen and reuses row views while scrolling so it stays fast.
10. **How do you make sure a prosumer only sees their own bookings?** — The API reads the NIC from the login token and always filters `prosumerNic` by it (R16).
11. **Why load in `onResume` and not only `onCreate`?** — `onCreate` runs once when the screen is built; `onResume` runs every time it comes back to the front. So after you open a booking and come back, or a booking is cancelled, Home and the list show the new numbers without restarting the app.
12. **What if you tap Pending and then History very fast?** — Two requests start. Before starting a new one we `cancel()` the old one, and a cancelled call is ignored, so only the History answer is shown (D52).
