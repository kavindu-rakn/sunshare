# 01 — SunShare Product Spec

**SunShare** — *Trade your sunshine.* A Smart Solar Microgrid Trading System.
Prosumers (homes with solar panels) book time slots at microgrid **stations** (solar hubs with battery storage) to either **drop off** spare energy (Sell) or **charge** from the grid (Buy). Staff manage stations, slots, accounts and bookings.

> Plain words:
> - **Prosumer** = producer + consumer. A house that makes solar power and also uses power.
> - **Station / node / hub** = a microgrid site with solar capacity and battery storage slots. Same thing, three names. In code we call it **Station**.
> - **Slot** = a time window at a station (e.g. Tue 08:00–10:00) with N battery places.
> - **Reservation / booking** = a prosumer's claim on one place in one slot. Same thing, two names. In code we call it **Reservation**.

## 1. Roles

| Role | Uses | Can do |
|---|---|---|
| **Backoffice** | Web | Everything admin: web users, prosumers, activations, stations, slots, reservations, approve |
| **GridOperator** | Web + Mobile | Operational: slots (availability), reservations (create for prosumer / edit / cancel / approve), view stations. **Mobile: scan QR → verify → finalize** |
| **Prosumer** | Mobile only | Register, login, edit profile, deactivate self, map of nearby stations, reserve / modify / cancel, bookings + history + search, show QR |

Login on the "wrong" client is refused with a clear message (e.g. Prosumer on web → "Prosumers use the SunShare mobile app").

## 2. Permission matrix

| Feature | Backoffice | GridOperator | Prosumer |
|---|---|---|---|
| Create/edit web users (Backoffice/GridOperator) | ✅ | ❌ | ❌ |
| Create/edit/deactivate prosumers | ✅ | ❌ (read list only, for booking on behalf) | ❌ |
| Activate / reactivate accounts | ✅ | ❌ | ❌ |
| Create/edit/deactivate/delete stations | ✅ | ❌ (view) | ❌ (view on map) |
| Create/edit/delete slots | ✅ | ✅ | ❌ |
| Create/edit/cancel reservations | ✅ (any) | ✅ (any) | ✅ (own only) |
| Approve reservation | ✅ | ✅ | ❌ |
| Verify QR + finalize | ❌ | ✅ | ❌ |
| Own profile edit / self-deactivate | — | — | ✅ |

The API enforces this with `[Authorize(Roles = "...")]`. The clients only hide buttons for nicer UX — they never decide.

## 3. Statuses

**User.status:** `Pending` → `Active` → `Deactivated` → (Backoffice only) `Active`

```
Mobile register ──► Pending ──(Backoffice activates)──► Active
Staff creates user ───────────────────────────────────► Active
Active ──(self or Backoffice deactivates)──► Deactivated ──(Backoffice reactivates)──► Active
```

**Reservation.status:** `Pending` → `Approved` → `Completed`, or → `Cancelled`

```
create ──► Pending ──(staff approves, QR token made)──► Approved ──(operator scans QR)──► Completed
Pending/Approved ──(cancel, ≥12h before)──► Cancelled
Approved ──(edited, ≥12h before)──► Pending again (old QR stops working)
```

## 4. Business rules (all enforced in the API — FAT service)

Every rule has an ID. In code, put `// RULE Rx: ...` on the line where it is enforced so anyone can search it.

| ID | Rule |
|---|---|
| **R1** | **NIC is the primary key** (`_id`) of every user. Must be unique and a valid Sri Lankan NIC: old format 9 digits + `V`/`X` (e.g. `981234567V`) or new format 12 digits (e.g. `199812345678`). |
| **R2** | **Role access:** Backoffice = admin functions, GridOperator = operational tools, Prosumer = own data only (see matrix). |
| **R3** | A prosumer who **self-registers on mobile starts `Pending`** and cannot log in until a Backoffice user activates them. |
| **R4** | A **`Deactivated`** user cannot log in. **Only Backoffice can reactivate.** A Backoffice user cannot deactivate their own account. |
| **R5** | A prosumer can **deactivate their own account** from mobile. They are logged out immediately. |
| **R6** | A station **cannot be deactivated while it has active reservations** (status `Pending` or `Approved` with start time in the future). |
| **R7** | A station can be **deleted only if it has no reservations at all** (otherwise deactivate it). Deleting a station also deletes its slots. |
| **R8** | **Slot rules:** end after start; start in the future; station must be active; `totalSlots` between 1 and the station's `batterySlots`; `totalSlots` can't go below places already booked; a slot with active reservations can't be deleted. |
| **R9** | Reservation start time must be **in the future and no more than 7 days from now** (on create, and when moving to another slot). |
| **R10** | A reservation can be **updated or cancelled only if its start is at least 12 hours away.** |
| **R11** | Only an **Active** prosumer can hold a reservation; the station and slot must be active; the slot must have a free place; a prosumer can't book the same slot twice (unless the earlier one is Cancelled). |
| **R12** | **Availability counter:** create → slot `availableSlots − 1`; cancel → `+ 1`; move to another slot → old `+ 1`, new `− 1`. |
| **R13** | New reservations are **`Pending`**. Backoffice/GridOperator **approve** → `Approved` + a random **QR token** is generated. Editing an `Approved` reservation sends it back to `Pending` and clears the token. |
| **R14** | **QR verification:** QR text format is `SUNSHARE|<reservationId>|<qrToken>`. The API checks the reservation exists, is `Approved`, and the token matches. **Finalize** does the same checks, then sets `Completed` + who/when. Only GridOperator. |
| **R15** | `Completed` and `Cancelled` reservations **cannot be changed.** |
| **R16** | Prosumers can only see and change **their own** profile and reservations (NIC is taken from the login token, never from the request body). |
| **R17** | `energyKwh` must be **greater than 0 and at most 100**. |
| **R18** | **Nearby stations:** the API calculates distance from the phone's location (Haversine formula) and returns **active** stations within the radius (default 25 km), **nearest first**. |

Also computed by the API (so clients don't hold logic):
- `canModify` on each reservation = status is `Pending`/`Approved` **and** start is ≥ 12 h away (R10, R15). Clients show Edit/Cancel buttons only when this is `true`.

## 5. Dashboard and list definitions

| Term | Meaning |
|---|---|
| **Pending reservations** | status `Pending` |
| **Approved future reservations (count)** | status `Approved` **and** start time > now |
| **Current bookings** (mobile tab) | `Approved`, start time > now |
| **Pending bookings** (mobile tab) | `Pending` |
| **History** (mobile tab) | `Completed`, `Cancelled`, or start time already passed |
| **Search filter** | text match on station name / reservation id (staff also: prosumer NIC/name) + optional status, station and date range |

## 6. Features by part (who owns what — see `09-TEAM.md`)

- **Part A — Accounts & Access (Gimhan T P K):** login + role redirect (web & mobile), web users, prosumer management, pending activations page, mobile register / edit profile / deactivate, session saved in SQLite. Rules R1–R5, R16.
- **Part B — Nodes, Slots & Map (Ranathunga R A K N):** stations CRUD + deactivate/delete, slots CRUD, nearby-stations API, Google Map on mobile with station details, stations cached in SQLite. Rules R6–R8, R18. Also shared foundation, IIS hosting, integration.
- **Part C — Reservations (Malkith G W L):** create / update / cancel (web + mobile), approve (web), 7-day + 12-hour rules, availability counter, mobile summary page after each action. Rules R9–R13, R15, R17.
- **Part D — Dashboards & QR (Chamara R M L K):** reservation lists (current / pending / history + search filter), dashboards (web + mobile counts), QR display on mobile, operator scan → verify → finalize. Rule R14 + dashboard definitions.

## 7. Out of scope (do NOT build)
Payments/pricing, real energy metering, email/SMS, password reset, push notifications, file uploads, multi-language, dark mode, charts beyond simple count cards, HTTPS certificates (demo runs on LAN HTTP — noted in decisions).
