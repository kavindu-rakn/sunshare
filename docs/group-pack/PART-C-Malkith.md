# Part C — Reservations · Malkith G W L

## In one sentence
You own **booking itself**: create, update and cancel reservations (web + mobile), staff **approval**, the **7-day** and **12-hour** rules, keeping slot places correct, and the **summary page** shown after every action.

## Why it exists
This is the heart of the trading system: a prosumer claims one battery place at a station for a time window. Rules keep it fair: book no more than a week ahead (plan capacity), give 12 hours' notice for changes (so the station can plan), never overbook a slot.

## What users see
| Where | Screen | What happens |
|---|---|---|
| Web | **W14 Reservation form** | Staff book on behalf of a prosumer (prosumer → station → available slot → kWh → Sell/Buy), or edit one |
| Web | **W13 row actions** | **Edit**, **Cancel** (only if the API says `canModify`), **Approve** for Pending ones |
| Mobile | **M6 Reservation form** | Prosumer picks station → available slot → kWh → Sell/Buy → Save (create or edit) |
| Mobile | **M9 Cancel button** | Confirm → cancel (only if `canModify`) |
| Mobile | **M7 Summary** | After **every** action: icon, "Reservation created/updated/cancelled", details, status, what happens next |

## Rules you own
| Rule | Plain words | Why |
|---|---|---|
| R9 | Start time must be in the future and **≤ 7 days** away (create, and when moving to another slot) | Brief rule |
| R10 | Update/cancel only if start is **≥ 12 hours** away | Brief rule — gives the station time to plan |
| R11 | Prosumer must be Active; station & slot active; slot has a free place; no double-booking the same slot | Fairness + data sanity |
| R12 | Places counter: create −1, cancel +1, move = old +1 / new −1 | Prevents overbooking |
| R13 | New = **Pending**; staff approve → **Approved** + random QR token; editing an Approved one → back to Pending, token cleared | QR only exists for approved bookings; edits need re-approval |
| R15 | Completed/Cancelled can't be changed | History must stay true |
| R17 | 0 < energyKwh ≤ 100 | Sanity limit |

## Data you touch
`EnergyReservations` (prosumerNic, prosumerName, stationId, stationName, slotId, startTime, endTime, energyKwh, type, status, qrToken, approvedBy/At, cancelledBy/At, …) and the slot's `availableSlots` in `EnergyBookingSlots`.

## Your endpoints
`POST /api/reservations` · `PUT /api/reservations/{id}` · `PATCH /api/reservations/{id}/cancel` · `PATCH /api/reservations/{id}/approve` (+ you use `GET /api/slots/available` and `GET /api/stations`).

## How "cancel" works (step by step)
1. Prosumer opens a booking (M9). The API already said `canModify: true`, so the **Cancel** button shows.
2. Tap Cancel → confirm dialog → Retrofit `PATCH /api/reservations/{id}/cancel` with the token.
3. `ReservationsController.Cancel` → `ReservationService.CancelAsync(id, callerNic, callerRole)`.
4. Service loads the reservation → **R16** is it yours? → **R15** is it already Completed/Cancelled? → **R10** is start ≥ 12 h away?
5. Sets `status = Cancelled`, `cancelledBy`, `cancelledAt`; **R12** adds 1 back to the slot's `availableSlots`.
6. Returns the updated reservation → app opens **M7 Summary** "Reservation cancelled".
7. If a rule fails → `ApiException(400, "Changes need at least 12 hours' notice…")` → the app shows that message.

## Files (planned — updated after the build)
- API: `Controllers/ReservationsController.cs` · `Services/ReservationService.cs` · `Helpers/ReservationMapper.cs` (builds `ReservationResponse` incl. `canModify` and `qrData`, shared with Part D) · `Dtos/CreateReservationRequest.cs`, `UpdateReservationRequest.cs`, `ReservationResponse.cs`
- Web: `pages/ReservationForm.jsx` · action functions in `api/reservationsApi.js` · Edit/Cancel/Approve buttons in `pages/Reservations.jsx` (shared with D)
- Android: `ui/prosumer/ReservationFormActivity.java`, `ReservationSummaryActivity.java` · cancel method in `ReservationDetailActivity.java` (shared with D) · layouts `activity_reservation_form.xml`, `activity_reservation_summary.xml`

## How it works
### API (Phase 4) — ✅ built
**Files** (in `api/SunShare.Api/`): `Services/ReservationService.cs` · `Controllers/ReservationsController.cs` · `Helpers/ReservationMapper.cs` · `Dtos/CreateReservationRequest.cs`, `UpdateReservationRequest.cs`, `ReservationResponse.cs`.

**Create** (`POST /api/reservations`), checks in this order:
1. **Who is it for? (R16)** A Prosumer → their own NIC from the token (a `prosumerNic` in the body is ignored). Staff → must send `prosumerNic`.
2. **Active prosumer? (R11)** Not found / not a Prosumer → 404; Pending or Deactivated → 400.
3. **Energy + type (R17):** `0 < energyKwh ≤ 100`, type `Sell` or `Buy`.
4. **The slot (R11 + R9):** exists, station active, slot open, starts in the future, **≤ 7 days** ahead, has a free place.
5. **Not twice (R11):** the same prosumer can't have two live bookings in one slot (a Cancelled one doesn't count) → 409.
6. **Take a place (R12):** `UpdateOne(filter: id = slot AND availableSlots > 0, update: availableSlots − 1)`. If nothing matched, someone just took the last place → 409. Because the check and the subtraction are **one database step**, two people can't both get the last place (tested: 1 place, 2 parallel bookings → one 201, one 409).
7. Save as **Pending (R13)** with copies of the slot times and station name.

**Update** (`PUT /{id}`): R16 own booking (else 403) → R15 not Completed/Cancelled → R10 ≥ 12 h before start → prosumer still Active → R17. Moving to another slot = new slot −1, old slot +1 (R12). If an **Approved** booking really changed → back to **Pending**, QR token cleared (R13) — the old QR stops working. Nothing changed → returned as it is (D32).

**Cancel** (`PATCH /{id}/cancel`): R16 → R15 → R10 → status Cancelled, who/when saved, QR token cleared → slot +1 (R12).

**Approve** (`PATCH /{id}/approve`, Backoffice/Grid Operator only): only **Pending** and not already started → Approved + a random 32-character token (`RandomNumberGenerator`, 16 bytes → hex) + approvedBy/At.

**ReservationMapper** builds every reservation answer (Part D reuses it):
- `canModify` = (Pending or Approved) AND start − now ≥ 12 h → the apps show Edit/Cancel only when true (the apps never do the maths).
- `qrData` = `SUNSHARE|<id>|<token>` **only** when Approved; otherwise null.

_(Claude Code fills this in after Phases 4, 11 and 17.)_

### Web (Phase 11) — ✅ built
**Files** (in `web/src/`): `pages/ReservationForm.jsx` · the row actions inside `pages/Reservations.jsx` · `createReservation`, `updateReservation`, `cancelReservation` in `api/reservationsApi.js`.

- **Reservation form (W14):** staff book *on behalf of* a prosumer. Drop-downs come from the API: active prosumers (`GET /api/users?role=Prosumer&status=Active`), active stations, then **bookable slots** of that station (`GET /api/slots/available?stationId=` — the API already applied R9 ≤ 7 days and R11 free place). Energy and Sell/Buy are typed/picked. Save → `POST /api/reservations` (new, starts **Pending**) or `PUT /api/reservations/{id}` (edit). The browser only blocks empty boxes; everything else (R9–R13, R17) is the API's answer, shown in a red alert — e.g. *"Energy must be more than 0 and at most 100 kWh."* or *"Changes and cancellations need at least 12 hours' notice…"*.
- **Edit an Approved booking:** the API sends it back to Pending and deletes its QR token (R13); the page tells staff *"It went back to Pending and needs approval again."*
- **Row actions on the Reservations list (W13):** **Approve** for Pending; **Edit** and **Cancel** (with "Are you sure?") **only when the API's `canModify` is true** — so a booking that starts in under 12 hours, or is Completed/Cancelled, shows no Edit/Cancel. The page never calculates the 12 hours itself.
- **Checked in the database after the web tests:** every slot's free places still matched its bookings (create −1, cancel +1, move old +1 / new −1 — R12).

## Your demo (≈ 60 s)
1. Phone (prosumer): **New Reservation** → Malabe Solar Hub → a slot 2 days ahead → 12 kWh → Sell → **Summary: Created (Pending)**.
2. Edit it → change slot → **Summary: Updated**.
3. Open the booking that starts in < 12 h → Cancel → error message (R10).
4. Web (Grid Operator): Reservations → **Approve** the new booking → status Approved.
5. Web: try booking 8 days ahead → error (R9).

## Viva questions
1. **Explain the 7-day rule in your code.** — In `ReservationService`, on create and when the slot changes: if slot start ≤ now or start > now + 7 days → 400 with a message (`// RULE R9`).
2. **And the 12-hour rule?** — Before update/cancel: if `startTime − UtcNow < 12 hours` → 400 (`// RULE R10`). The API also sends `canModify` so the apps know whether to show the buttons — the apps don't calculate it.
3. **How do you stop overbooking?** — Each slot has `availableSlots`. Create only works if it's > 0 and then subtracts 1; cancel adds 1; moving slots adds 1 to the old and subtracts 1 from the new (R12). Same prosumer can't book the same slot twice.
4. **What happens when an approved booking is edited?** — It goes back to Pending and the QR token is cleared, so the old QR stops working and staff must approve again (R13).
5. **What does approval do?** — Only from Pending: status Approved, a random 32-character token is saved, and `qrData = SUNSHARE|id|token` is returned.
6. **Why the summary page?** — Required by the rubric, and it confirms to the user exactly what happened and what comes next. The previous screen passes the saved reservation to it.
7. **How does the phone create a booking?** — Retrofit `createReservation(body)` → `enqueue` runs it in the background → on success open the summary; on error `ApiErrorParser` shows the API's message.
8. **Why do staff send `prosumerNic` but prosumers don't?** — R16: a prosumer's NIC is taken from their login token, so they can't book for someone else.
9. **Why can't Completed/Cancelled bookings change?** — R15: they're history; changing them would make records untrue.
10. **How do you handle time zones?** — Stored in UTC, rules compare with `DateTime.UtcNow`, apps convert to Sri Lanka time only for display.
