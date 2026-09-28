# 07 — Build Plan (phases for Claude Code)

**How to use:** open Claude Code in the `sunshare/` folder and say **"Do Phase N"**. Claude Code reads `CLAUDE.md` + this file, works on a `phase-N-...` branch, does the phase, tests it, ticks the boxes here, commits (with the Part owner as co-author), opens a pull request for Kvn to review and merge, and explains what it did in plain words.

**Tips to save your weekly Claude usage:** start each phase in a fresh session (`/clear`) — `CLAUDE.md` reloads automatically. Use Plan mode for the big phases (2, 4, 5, 13, 16–18). If Claude runs out, Codex or Antigravity can continue: they read `AGENTS.md` → `CLAUDE.md` → this plan.

## Timeline (deadline Wed 30 Sep 11:59 PM — aim to submit by 10 PM)

| When | Phases | You (manual, in parallel) |
|---|---|---|
| **Sun 27** (now → night) | 0, 1, 2, 3 | Install VS 2026, turn on IIS, install Hosting Bundle, create GitHub repo, create Android project, Google Maps key |
| **Mon 28** | 4, 5, 6, 7, 8, 9, 10, 11, 12 | Test web pages as they land; send teammates' IT numbers + emails |
| **Tue 29** | 13, 14, 15, 16, 17, 18 | Test on emulator + phone; set up the phone on the same Wi-Fi |
| **Wed 30** | 19, 20, 21, 22 | Screenshots, record the video, upload, submit zip |

Legend: **Owner** = whose Part it is (header `Author` + `Co-authored-by` trailer). Kvn = Ranathunga R A K N (no trailer).

---

## Phase 0 — Repo & project scaffolds · Owner: Kvn
- [x] (Manual, Kvn) Create empty GitHub repo `sunshare`, then `git remote add origin <url>` and push the docs commit.
- [x] `api/`: `dotnet new webapi --use-controllers -n SunShare.Api -f net10.0` → remove WeatherForecast sample → add allowed NuGet packages.
- [x] Set `launchSettings.json` http profile to `http://localhost:5080`.
- [x] `web/`: `npm create vite@latest web -- --template react` → `npm i bootstrap bootstrap-icons react-router-dom` → remove Vite demo content.
- [x] (Manual, Kvn) Android Studio → New Project → Empty Views Activity → steps in `08-SETUP-AND-HOSTING.md §5` → saved to `android/`.
- [x] Header comments on every generated `.cs`/`.jsx`/`.java` file that stays.
- **Done when:** `dotnet build` passes · `npm run dev` shows a blank page · Android template app runs on the emulator.
- **Commits:** `chore(api): scaffold SunShare.Api`, `chore(web): scaffold React + Bootstrap app`, `chore(android): add Android Studio project`.

## Phase 1 — API foundation (shared) · Owner: Kvn
- [x] `MongoDbSettings` + `appsettings.json` (`ConnectionString`, `DatabaseName = SunShareDb`); `MongoDbContext` exposing the 4 collections with the **exact names** from `03-DATABASE.md` + indexes.
- [x] Models: `User`, `SolarStation`, `EnergyBookingSlot`, `EnergyReservation`; constants `Roles`, `UserStatuses`, `ReservationStatuses`, `ReservationTypes`.
- [x] Helpers: `ApiException` (the other helpers belong to their Parts: `JwtTokenHelper` + `NicValidator` → Phase 2, `GeoHelper` → Phase 3, `ReservationMapper` → Phase 4).
- [x] `ErrorHandlingMiddleware` (→ `{ message }`).
- [x] `Program.cs`: DI, JWT auth, CORS (5173, 8081), Swagger **with Authorize button**, camelCase JSON, Swagger ON in all environments.
- [x] `web.config` for IIS that **removes WebDAV** (otherwise PUT/DELETE/PATCH return 405 on IIS).
- [x] `DataSeeder` — full sample data from `03-DATABASE.md §5` (only when `Users` is empty).
- [x] `HealthController`: `GET /api/health` → `{ "api": "ok", "database": "connected", "time": ... }` (pings MongoDB — proves the DB connection in the demo).
- **Done when:** `dotnet run` → Swagger opens → `/api/health` says connected → Compass shows the 4 collections full of seed data.
- **Commits:** foundation, seeder, health (separately).

## Phase 2 — API Part A: accounts & access · Owner: Gimhan T P K
- [x] `NicValidator` (R1), `JwtTokenHelper` (makes the signed token).
- [x] `AuthService` + `AuthController` (login R3/R4, register R1/R3).
- [x] `UserService` + `UsersController` (list/filter, pending-activations, get, create, update, activate, deactivate R4).
- [x] `ProfileController` (get/update own, self-deactivate R5, R16).
- **Done when:** Swagger: BO login → activate the Pending seed prosumer → that prosumer can now log in; register with `12345` NIC → 400; login as Deactivated → 403; PR token calling `/api/users` → 403.

## Phase 3 — API Part B: stations & slots · Owner: Kvn
- [ ] `GeoHelper` (Haversine distance in km).
- [ ] `StationService` + `StationsController` (CRUD, activate/deactivate R6, delete R7, nearby R18, `activeReservationCount`).
- [ ] `SlotService` + `SlotsController` (per-station list, available R9/R11, create/update/delete R8).
- **Done when:** create station + slot works; deactivate Malabe Solar Hub (has bookings) → 409; nearby from SLIIT (6.9147, 79.9730) returns stations sorted by distance, inactive one excluded.

## Phase 4 — API Part C: reservation actions · Owner: Malkith G W L
- [ ] `ReservationService` + `ReservationsController`: create (R9, R11, R12, R13, R16, R17), update (R9, R10, R12, R13, R15), cancel (R10, R12, R15), approve (R13 → `qrToken`).
- [ ] `Helpers/ReservationMapper` builds `ReservationResponse` incl. `canModify` + `qrData` (reused by Part D).
- **Done when:** book 2 days ahead ✓ · 8 days ahead → 400 · same slot twice → 409 · cancel a booking < 12 h away → 400 · approve → `qrData` present · edit an Approved one → back to Pending, `qrData` null · slot `availableSlots` correct in Compass after each step.

## Phase 5 — API Part D: views, QR, dashboards · Owner: Chamara R M L K
- [ ] `ReservationQueryService` + `ReservationViewsController` (list with `view/status/stationId/from/to/search`, get by id; R16).
- [ ] `QrService` + `QrController` (verify-qr, complete — R14).
- [ ] `DashboardService` + `DashboardController` (summary for staff, prosumer counts).
- **Done when:** PR sees only own bookings · `view=history` includes Completed/Cancelled/past · search "malabe" works · wrong token → 400 · complete → Completed · counts match Compass.

## Phase 6 — Host the API on IIS · Owner: Kvn
- [ ] Follow `08-SETUP-AND-HOSTING.md §3`: publish → IIS site **SunShareApi** on port 8080 → firewall rule.
- [ ] Test: `http://localhost:8080/swagger`, and **from the phone's browser** `http://<LAN-IP>:8080/api/health`.
- [ ] Write any problems + fixes into `12-CHALLENGES.md`.
- **Commit:** `chore(api): add IIS publish profile and hosting notes`.

## Phase 7 — Web shell + Home page · Owner: Kvn
- [ ] `styles/theme.css` (brand tokens from `05-SCREENS.md §1` over Bootstrap), Inter font.
- [ ] `api/client.js` (fetch wrapper: base URL from `VITE_API_BASE_URL`, token header, `{message}` errors, 401 → logout).
- [ ] `AuthContext`, `ProtectedRoute` (role check), `AppLayout` + `Sidebar` (role-based menu, responsive), `StatusBadge`, `AlertMessage`, `EmptyState`, `ConfirmButton`.
- [ ] **W1 Home** (make it polished) + W15 NotFound + HashRouter routes (placeholders for others).
- **Done when:** Home looks great on desktop + phone width; routes work.

## Phase 8 — Web Part A · Owner: Gimhan T P K
- [ ] W2 Login (role redirect; Prosumer blocked with message), W4–W5 Users, W6–W7 Prosumers, W8 Pending Activations (+ count badge in sidebar).

## Phase 9 — Web Part B · Owner: Kvn
- [ ] W9–W10 Stations (deactivate/activate/delete with API messages, "Open in Google Maps" link), W11–W12 Slots.

## Phase 10 — Web Part D · Owner: Chamara R M L K
- [ ] W3 Dashboard (count cards + pending table), W13 Reservations list with the **filter bar** (view/status/station/date/search).

## Phase 11 — Web Part C · Owner: Malkith G W L
- [ ] W14 Reservation form (create/edit on behalf of a prosumer) + W13 row actions Edit / Cancel / Approve (shown only when `canModify` / Pending).

## Phase 12 — Host the web app on IIS · Owner: Kvn
- [ ] `npm run build` with `.env.production` → copy `dist/` → IIS site **SunShareWeb** on port 8081 (`08 §4`).
- **Done when:** `http://localhost:8081` works end to end against IIS API.

## Phase 13 — Android shell · Owner: Kvn
- [ ] Gradle deps (allowed list), Manifest permissions (INTERNET, CAMERA, ACCESS_FINE/COARSE_LOCATION), `network_security_config.xml` (allow HTTP for the LAN demo), Maps key from `local.properties` → manifest placeholder.
- [ ] Brand `colors.xml`, `themes.xml`, `strings.xml`, app icon (sun).
- [ ] `ApiConfig`, `ApiClient` (Retrofit + token interceptor + base URL from SQLite), `ApiService` (every endpoint in `04-API.md`), model classes, `ApiErrorParser`.
- [ ] `SunShareDbHelper` with the 3 tables from `02-ARCHITECTURE.md §9`; `DateUtils`, `UiUtils`, `SessionGuard`.
- **Done when:** app builds; a temporary test call to `/api/health` from the emulator shows "connected".

## Phase 14 — Android Part A · Owner: Gimhan T P K
- [ ] M1 Login (session check, role routing, ⚙ server address dialog), M2 Register, M4 Profile (edit + deactivate → clear session).

## Phase 15 — Android Part B · Owner: Kvn
- [ ] M5 StationMapActivity: location permission, `/stations/nearby`, markers, **info window with station details**, my-location dot, save to `stations_cache`, offline fallback.

## Phase 16 — Android Part D (prosumer views) · Owner: Chamara R M L K
- [ ] M3 Prosumer Home (counts + next booking), M8 Bookings (tabs Current/Pending/History + search, RecyclerView), M9 Detail (details + **QR from `qrData`**).

## Phase 17 — Android Part C · Owner: Malkith G W L
- [ ] M6 Reservation form (create + edit), Cancel button on M9, **M7 Summary after every action**.

## Phase 18 — Android Part D (operator mode) · Owner: Chamara R M L K
- [ ] M10 Operator Home (counts + Scan QR + map), ZXing scanner, M11 Scan Result (verify → **Finalize** → M7 Completed).
- **Done when:** emulator shows the prosumer QR on screen, the phone (operator) scans it, it's verified and completed; Compass shows `Completed`.

## Phase 19 — End-to-end test + polish · Owner: Kvn
- [ ] Walk every row of `10-RUBRIC-CHECKLIST.md` on the IIS-hosted build (web + emulator + phone). Fix bugs.
- [ ] UI consistency pass (spacing, empty states, loading, messages). Check every file has the header + method comments (script it: search for methods without a comment above).
- [ ] Re-seed fresh data.

## Phase 20 — Diagrams · Owner: Kvn (+ team review)
- [ ] `diagrams/`: **high-level architecture**, **use case** (actors Backoffice, Grid Operator, Prosumer; system boundary SunShare), **DFD level 0 (context) + level 1**. Also an **ER-style collection diagram** for the database design section.
- [ ] Sources in PlantUML/Mermaid + exported PNGs (PlantUML can run with Android Studio's bundled Java; fallback: mermaid.live / draw.io).

## Phase 21 — Report, README, video, zip · Owner: Kvn
- [ ] `report/` generator → **`SunShare-Report.docx`** with: cover (group, members, IT numbers), intro, high-level diagram, use case, DFD, database design, API summary, design decisions (`11`), screenshots of all UIs, **source code pasted as text** (all `.cs`, `.java`, `.js/.jsx`, key XML), hosting steps (`08`), references (`13`), individual contribution + **AI disclosure & reflection** per member (`09`), challenges (`12`), Git link.
- [ ] Final `README.md` (Git link, contributions table, video link, how to run, test accounts).
- [ ] (Manual, Kvn) Record ≤ 5 min video (script in `group-pack/00-INDEX.md`), upload unlisted to YouTube/OneDrive, paste link in README + report.
- [ ] Zip → **`IT22552860.zip`**: repo **without** `node_modules`, `bin`, `obj`, `build`, `.gradle`, `.vs` + report + `MAIN-SCREEN-web.png` + `MAIN-SCREEN-mobile.png`.

## Phase 22 — Group pack final · Owner: all
- [ ] Update each `group-pack/PART-*.md`: real file paths, how it works, viva Q&A checked against the final code.
