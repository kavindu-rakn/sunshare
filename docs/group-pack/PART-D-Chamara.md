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
- Android: `ui/prosumer/ProsumerHomeActivity.java`, `BookingsActivity.java`, `BookingAdapter.java`, `ReservationDetailActivity.java` · `ui/operator/OperatorHomeActivity.java`, `ScanResultActivity.java` · their layouts

> **Built for you in Phase 4 (reuse, don't copy):** `ReservationMapper.ToResponse(r)` builds every `ReservationResponse` (incl. `canModify`, `qrData`); `ReservationMapper.QrPrefix` = `"SUNSHARE"`; `ReservationService.FindOrThrowAsync(id)` (404 incl. bad ids) and `ReservationService.CheckOwner(r, nic, role)` (R16 → 403) are public.

## How it works
_(Claude Code fills this in after Phases 5, 10, 16 and 18.)_

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
