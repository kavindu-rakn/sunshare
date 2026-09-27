# 05 — Screens (Web + Android) and Design System

Every screen below must exist, work through the API, and get **one unique screenshot** (file name in the last column) for the report.

## 1. Design system (same feel on web and Android)

| Token | Value | Use |
|---|---|---|
| Primary | **Deep Teal `#0F766E`** | Buttons, links, active menu, Approved badge (white text passes contrast) |
| Accent | **Solar Amber `#F59E0B`** | Sun logo, highlights, Pending badge (**dark text on amber**, never white) |
| Dark | **Night Navy `#0B1F33`** | Web sidebar, Android toolbar, headings |
| Background | `#F8FAFC` | Page background |
| Success / Danger / Info | `#16A34A` / `#DC2626` / `#0284C7` | Completed & Active / Cancelled, Deactivated, errors / info |
| Font | **Inter** (web, Google Fonts) · Roboto (Android default) | |
| Logo | Sun icon (`bi-sun-fill` on web, a Material "sunny" vector on Android) + wordmark **SunShare** | Original, no third-party brand |

**Status badges** (web `StatusBadge` component, Android coloured chip): Pending = amber, Approved = teal, Completed = green, Cancelled = grey, Active = green, Deactivated = red.

**Patterns:** page title + short subtitle · cards with soft shadow and 12 px radius · tables with a filter bar on top · loading spinner while calling the API · empty state message when a list is empty · API error shown in a red alert (web) / Toast (Android) · green success alert after saves · `window.confirm` / AlertDialog before deactivate, delete or cancel.

**Responsive web:** sidebar on large screens; on small screens a top navbar with a menu toggle (React state, no Bootstrap JS needed). Tables wrap in `.table-responsive`.

## 2. Web app (React + Bootstrap 5, HashRouter)

| # | Route | Page | Who | What it does / API calls | Part | Screenshot |
|---|---|---|---|---|---|---|
| W1 | `#/` | **Home (index)** | Public | Landing: hero ("Trade your sunshine"), 3-step "how it works" (Register → Reserve → Scan), role cards (Backoffice / Grid Operator / Prosumer), CTA to Login, footer with group info. **Rubric: Home page 1 mark — make it the prettiest page.** | Shared (Kvn) | `W01-home.png` |
| W2 | `#/login` | **Login** | Public | NIC + password → `POST /auth/login`. Backoffice/GridOperator → `#/dashboard`. Prosumer → message "Prosumers use the SunShare mobile app". Shows API messages for Pending/Deactivated. | A | `W02-login.png` |
| W3 | `#/dashboard` | **Dashboard** | BO, GO | Count cards: Pending reservations, **Approved future reservations**, Today's reservations, Active stations, Pending activations (BO). Table: next pending reservations with **Approve** button. `GET /dashboard/summary` | D | `W03-dashboard.png` |
| W4 | `#/users` | **Web Users** | BO | List Backoffice + GridOperator users, filter by role/status, Activate/Deactivate. `GET /users?role=` | A | `W04-users.png` |
| W5 | `#/users/new`, `#/users/:nic/edit` | **User form** | BO | Create (NIC, name, email, phone, role, password) / edit. `POST`/`PUT /users` | A | `W05-user-form.png` |
| W6 | `#/prosumers` | **Prosumers** | BO | List prosumers, search, status filter, Deactivate/Reactivate, Edit. | A | `W06-prosumers.png` |
| W7 | `#/prosumers/new`, `#/prosumers/:nic/edit` | **Prosumer form** | BO | Create/edit prosumer profile (NIC is the key, read-only on edit). | A | `W07-prosumer-form.png` |
| W8 | `#/activations` | **Pending Activations** | BO | Prosumers waiting: **Pending** (new sign-ups) and **Deactivated** (need reactivation). One-click Activate. Sidebar shows a count badge. `GET /users/pending-activations`, `PATCH /users/{nic}/activate` | A | `W08-activations.png` |
| W9 | `#/stations` | **Stations** | BO (edit), GO (view) | Table: name, location, capacity, battery slots, schedule, status, active bookings. Actions: Edit, Slots, Deactivate/Activate, Delete. Shows API's R6/R7 messages. | B | `W09-stations.png` |
| W10 | `#/stations/new`, `#/stations/:id/edit` | **Station form** | BO | Name, address, latitude, longitude (+ "Open in Google Maps" link to check the pin), capacity kW, battery slots, open/close time. | B | `W10-station-form.png` |
| W11 | `#/stations/:id/slots` | **Slots** | BO, GO | Slot table for the station (date, time, total, booked, available, active). Add / Edit / Delete. | B | `W11-slots.png` |
| W12 | `#/slots/new?stationId=`, `#/slots/:id/edit` | **Slot form** | BO, GO | Start, end (`datetime-local`), total places, active toggle. | B | `W12-slot-form.png` |
| W13 | `#/reservations` | **Reservations** | BO, GO | **Filter bar** (view: all/current/pending/history, status, station, date range, search). Table with status badges. Row actions shown only if API says `canModify`: Edit, Cancel; plus **Approve** for Pending. | D (list + filters), C (actions) | `W13-reservations.png` |
| W14 | `#/reservations/new`, `#/reservations/:id/edit` | **Reservation form** | BO, GO | Pick prosumer (active) → station → available slot → kWh → type (Sell/Buy). Shows 7-day / 12-hour errors from API. | C | `W14-reservation-form.png` |
| W15 | `*` | Not found | Public | Friendly 404 with link home. | Shared | — |

## 3. Android app (Java + XML)

| # | Screen (Activity) | Who | What it does / API calls | Part | Screenshot |
|---|---|---|---|---|---|
| M1 | **LoginActivity** (launcher) | All | If a session exists in SQLite → jump to the right home. Else NIC + password → `POST /auth/login` → save session in SQLite → **Prosumer → M3, GridOperator → M10**, Backoffice → "Please use the web app". ⚙ icon → dialog to change **Server address** (saved in SQLite). Link to Register. | A (+ server setting: B/shared) | `M01-login.png` |
| M2 | **RegisterActivity** | Public | NIC, full name, email, phone, address, password, confirm password → `POST /auth/register` → message "Registered! A Backoffice officer will activate your account." | A | `M02-register.png` |
| M3 | **ProsumerHomeActivity** | PR | Greeting + **count cards: Pending, Approved upcoming, Completed** + "Next booking" card. Buttons: New Reservation, My Bookings, Nearby Stations (map), Profile, Logout. `GET /dashboard/prosumer` (refresh on resume). | D (counts) | `M03-prosumer-home.png` |
| M4 | **ProfileActivity** | PR | View/edit name, email, phone, address, optional new password → `PUT /profile`. **Deactivate my account** (confirm dialog) → `PATCH /profile/deactivate` → clear SQLite session → Login. | A | `M04-profile.png` |
| M5 | **StationMapActivity** | PR, GO | Google Map. Gets phone location (permission prompt) → `GET /stations/nearby?lat&lng` → markers for each station; **tap marker → info window with name, address, capacity, battery slots, schedule, distance**. Blue "my location" dot. Saves stations to SQLite `stations_cache`; if offline, shows cached stations + "offline" note. | B | `M05-map.png`, `M05b-map-details.png` |
| M6 | **ReservationFormActivity** (create + edit) | PR | Station dropdown (`GET /stations?activeOnly=true`) → available slot dropdown (`GET /slots/available?stationId=`) → kWh → Sell/Buy → `POST` or `PUT /reservations`. On success → M7. | C | `M06-reservation-form.png` |
| M7 | **ReservationSummaryActivity** | PR, GO | **Shown after every action** (Created / Updated / Cancelled / Completed): big status icon, action title, booking details (station, time, kWh, type, status), "what happens next" line, buttons: View bookings / Home. | C | `M07-summary-created.png`, `M07b-summary-cancelled.png` |
| M8 | **BookingsActivity** | PR | Tabs **Current · Pending · History** + **search box** (station name / id). `GET /reservations?view=&search=`. Tap row → M9. | D | `M08-bookings-current.png`, `M08b-history-search.png` |
| M9 | **ReservationDetailActivity** | PR | Full details + status badge. If Approved → **QR code** made on the phone from `qrData` (ZXing). If `canModify` → **Edit** (→ M6) and **Cancel** (confirm → `PATCH /cancel` → M7). | D (view + QR) / C (edit, cancel) | `M09-detail-qr.png` |
| M10 | **OperatorHomeActivity** | GO | Greeting + counts (today, pending, approved upcoming) from `GET /dashboard/summary`. Big **Scan QR** button (ZXing scanner), Nearby Stations (M5), Logout. | D | `M10-operator-home.png` |
| M11 | **ScanResultActivity** | GO | After scanning: `POST /reservations/verify-qr` → shows prosumer, station, time, kWh, type ✓ "Verified with server". **Finalize energy transfer** → `PATCH /reservations/{id}/complete` → M7 (Completed). Invalid QR → red card with the API's reason. | D | `M11-scan-verified.png` |

**Android UI kit:** Material Components theme with the brand colours (`Theme.Material3.Light.NoActionBar` + `MaterialToolbar`), `MaterialCardView` for count cards, `TextInputLayout` for forms, `RecyclerView` for lists, `TabLayout` for the booking tabs, Toast/Snackbar for messages.

## 4. Screenshots for the report
- Save to `screenshots/web/` and `screenshots/mobile/` using the names above.
- Take them **with real seeded data** (no empty tables) and after the final UI polish.
- Also save **`MAIN-SCREEN-web.png`** (W1) and **`MAIN-SCREEN-mobile.png`** (M3) in the zip root — the brief asks for "a screenshot of the main opening menu/screen of the app".
