# Part B — Nodes, Slots & Map (+ foundation & hosting) · Ranathunga R A K N

## In one sentence
You own **where and when energy can be traded**: solar stations (create, edit schedule, deactivate, delete), their time **slots**, the **nearby-stations Google Map** on the phone with details on tap — plus the shared foundation (MongoDB connection, errors, seeding), **IIS hosting**, and the web/Android app shells.

## Why it exists
Prosumers can only book if there are stations with battery places and open time windows. Backoffice registers stations and their schedules; operators open or close windows. Prosumers need to find the **closest** station quickly — hence the map.

## What users see
| Where | Screen | What happens |
|---|---|---|
| Web | **W1 Home** | Landing page (first impression — rubric mark) |
| Web | **W9–W10 Stations** | List + create/edit (name, address, lat/lng, capacity kW, battery slots, open/close time); deactivate/activate/delete with clear messages |
| Web | **W11–W12 Slots** | Per-station time windows: start, end, total places, booked, available, active |
| Mobile | **M5 Nearby Stations map** | Google Map + my-location dot + a marker per station; tap → name, address, capacity, battery slots, hours, distance. Works offline from the SQLite cache |

## Rules you own
| Rule | Plain words | Why |
|---|---|---|
| R6 | Can't deactivate a station with active (Pending/Approved future) reservations | Brief rule — don't strand booked prosumers |
| R7 | Delete only if the station never had reservations; otherwise deactivate | Keeps booking history consistent (no reservations pointing at a deleted station) |
| R8 | Slot end > start; start in future; station active; 1 ≤ totalSlots ≤ station.batterySlots; can't shrink below booked; can't delete with active bookings | A slot can't offer more places than the hub has batteries |
| R18 | API calculates distance (Haversine), returns active stations within 25 km, nearest first | FAT service — even the distance maths is on the server |

## Data you touch
`SolarStationInfo` (name, address, latitude, longitude, capacityKw, batterySlots, openTime, closeTime, isActive) · `EnergyBookingSlots` (stationId, startTime, endTime, totalSlots, availableSlots, isActive) · phone SQLite `stations_cache` + `app_settings`.

## Your endpoints
`GET /api/health` · `GET /api/stations` · `GET /api/stations/nearby` · `GET /api/stations/{id}` · `POST /api/stations` · `PUT /api/stations/{id}` · `PATCH /api/stations/{id}/deactivate` · `PATCH /api/stations/{id}/activate` · `DELETE /api/stations/{id}` · `GET /api/stations/{id}/slots` · `GET /api/slots/available` · `GET /api/slots/{id}` · `POST /api/slots` · `PUT /api/slots/{id}` · `DELETE /api/slots/{id}`

## How "nearby stations" works (step by step)
1. `StationMapActivity` asks for location permission → Fused Location gives the phone's lat/lng.
2. Retrofit calls `GET /api/stations/nearby?lat=6.91&lng=79.97&radiusKm=25`.
3. `StationService.GetNearbyAsync` loads active stations, uses `GeoHelper.DistanceKm` (Haversine) for each, keeps those ≤ 25 km, sorts nearest first, fills `distanceKm`.
4. The phone saves the list into SQLite `stations_cache`, then fills the Google Maps key and the data into `assets/map.html`, which a WebView shows: a Google map (Maps JavaScript API), a blue dot for me and a numbered marker per station from its stored latitude/longitude (1 = nearest).
5. Tapping a marker opens an info window with the station's details and a *Directions in Google Maps* link.
6. If the API can't be reached, the map loads stations from `stations_cache` and shows an "Offline: showing N saved stations (saved …)" note.

## Hosting in one breath
Run `scripts/deploy-api.ps1` in an **admin** PowerShell → it publishes to `C:\inetpub\sunshare\api` → IIS site **SunShareApi** on port 8080 (app pool **No Managed Code**; the **Hosting Bundle's ASP.NET Core Module** starts our app inside IIS) → `web.config` removes the **WebDAV handler** (otherwise PUT/DELETE/PATCH could get 405) → firewall rule so the phone can reach `http://<laptop-IP>:8080`. Tested from an iPhone and an Android phone on the same Wi-Fi.

## Files (planned — updated after the build)
- API (Part B) — ✅ **built in Phase 3**: `Controllers/StationsController.cs`, `SlotsController.cs` · `Services/StationService.cs`, `SlotService.cs` · `Helpers/GeoHelper.cs` · `Dtos/StationRequest.cs`, `StationResponse.cs`, `SlotRequest.cs`, `SlotUpdateRequest.cs`, `SlotResponse.cs`
- API (shared foundation) — ✅ **built in Phase 1** (all in `api/SunShare.Api/`):
  - `Program.cs` (start-up), `appsettings.json` (Mongo address, JWT settings, CORS list), `web.config` (IIS)
  - `Data/MongoDbSettings.cs`, `Data/MongoDbContext.cs`, `Data/DataSeeder.cs`
  - `Models/User.cs`, `SolarStation.cs`, `EnergyBookingSlot.cs`, `EnergyReservation.cs`, `Roles.cs`, `UserStatuses.cs`, `ReservationStatuses.cs`, `ReservationTypes.cs`
  - `Helpers/ApiException.cs`, `Middleware/ErrorHandlingMiddleware.cs`, `Controllers/HealthController.cs`
  - `scripts/deploy-api.ps1` — ✅ built in Phase 6 (IIS deploy)
- Web — ✅ Home (Phase 7), Stations / Slots (Phase 9): `pages/Home.jsx`, `Stations.jsx`, `StationForm.jsx`, `Slots.jsx`, `SlotForm.jsx`, `NotFound.jsx` · `api/client.js`, `stationsApi.js`, `slotsApi.js` · `components/*` · `context/AuthContext.jsx` · `styles/theme.css` · `App.jsx`, `main.jsx`
- Android shell — ✅ **built in Phase 13** (in `android/app/src/main/java/com/sunshare/app/`): `api/ApiConfig.java`, `ApiClient.java`, `ApiService.java`, `ApiErrorParser.java`, `api/models/*` (15 classes) · `db/SunShareDbHelper.java`, `db/Session.java` · `util/DateUtils.java`, `UiUtils.java`, `SessionGuard.java` · `MainActivity.java` (temporary server check) · `res/values/*`, `res/layout/activity_main.xml`, `AndroidManifest.xml`, `res/xml/network_security_config.xml`, `app/build.gradle.kts`
- Android map ✅ (Phase 15): `ui/map/StationMapActivity.java` · `assets/map.html` · `res/layout/activity_station_map.xml` · uses `db/SunShareDbHelper.java` (`stations_cache`) · Nearby stations buttons on both home screens · `api/ApiClient.java`, `ApiService.java`, `ApiConfig.java`, `ApiErrorParser.java`, `api/models/*` · `util/*` · `res/values/*`, `AndroidManifest.xml`, `res/xml/network_security_config.xml`

## How it works
_(Claude Code fills this in after Phases 1, 3, 6, 7, 9, 12, 13 and 15.)_

### API foundation (Phase 1)
**Start-up (`Program.cs`, top to bottom):**
1. Reads `appsettings.json` → makes **one** `MongoDbContext` for the whole app (a *singleton*: one shared object, because `MongoClient` is built to be shared and keeps its own pool of connections).
2. Turns on **controllers** with **camelCase JSON** (`availableSlots`). If a request body is missing fields or has the wrong types → 400 `{ "message": "..." }`.
3. Turns on **JWT checking**: a token is only accepted if it is signed with our secret key, came from our API (*issuer*), is meant for our apps (*audience*) and hasn't expired. No/expired token → 401 `{ "message": "Please log in to continue." }`; wrong role → 403 `{ "message": "You don't have permission to do that." }`.
4. Turns on **CORS** (see Q11 below) for `localhost:5173` and `localhost:8081` (+ any localhost port only while developing).
5. Turns on **Swagger** with an **Authorize** button (paste a token once, then every test call sends it).
6. **Prepares the database:** creates 3 indexes, then runs `DataSeeder` (only if `Users` is empty). If MongoDB is down it just logs an error, so the API still starts.
7. Builds the **request pipeline** — every request passes these steps in order: error handler → Swagger → CORS → authentication (*who are you?*) → authorization (*may you do this?*) → the controller.

**Models** = C# classes that match the MongoDB documents. `[BsonElement("fullName")]` gives each field its camelCase name in the database; `[BsonId]` marks the `_id` (the NIC for users, an ObjectId for the others). Status/role words live in constant classes (`Roles.Prosumer`, `ReservationStatuses.Approved`) so nobody misspells them.

**Errors:** a service that finds a broken rule does `throw new ApiException(409, "This slot is full.")`. `ErrorHandlingMiddleware` (first in the pipeline) catches it and sends status 409 + `{ "message": "This slot is full." }`. MongoDB timeouts → 503 "The database can't be reached right now…"; any other crash → 500 "Something went wrong on the server." (details only in the server log, never shown to users).

**Seeder:** builds everything in memory first (so bookings can point at slot ids), then inserts. Slot times are chosen in Sri Lanka time (08:00, 11:00, 14:00) and stored in UTC (subtract 5 h 30 min). Each sample booking takes a place from its slot and the cancelled one gives it back, so `availableSlots` is always right. Dates are relative to "now" → re-seed the day before the viva (`08-SETUP-AND-HOSTING.md §8`).

**`GET /api/health` flow:** browser → `HealthController.Get` → `MongoDbContext.PingAsync` sends MongoDB `{ ping: 1 }` → answer within 5 s? `200 "connected"` : `503 "unreachable"`.

**`web.config`:** tells IIS to run the app through the ASP.NET Core Module (from the Hosting Bundle), and **removes the WebDAV handler** — WebDAV would otherwise grab PUT/DELETE/PATCH and answer 405. (We first also removed the WebDAV *module*, but IIS locks the `<modules>` section → error 500.19; see C4.)

### Stations, slots and nearby (Phase 3)
**Stations** (`StationService`, `StationsController`, route `/api/stations`):
- **Who:** anyone logged in can *read*; only Backoffice can *change* (`[Authorize(Roles = Roles.Backoffice)]`). Prosumers only ever get **active** stations in the list (R2).
- **Form checks:** name + address filled in, latitude −90..90 and longitude −180..180, capacity > 0 kW, at least 1 battery slot, open/close time as `HH:mm` with open before close.
- **`activeReservationCount`** on every station = bookings that are Pending/Approved **and** haven't started (this is also the R6 definition). For a list, one query fetches the station ids of all active bookings and we count them in C# — instead of asking MongoDB once per station.
- **Deactivate (R6):** if that count is > 0 → **409** "This station has 2 active reservations. Cancel or complete them first." Otherwise `isActive = false` (it vanishes from the map and from booking).
- **Delete (R7):** if the station has **any** booking at all (even Completed/Cancelled history) → **409** "…deactivate it instead." Otherwise its slots are deleted, then the station.
- **Rename:** bookings keep a copy of the station name (for fast lists/search), so a rename also updates those copies (D29).
- **Bad ids:** `ObjectId.TryParse` first → **404** "Station not found." (a typo id would otherwise crash with 500).

**Nearby (R18)** — `GET /api/stations/nearby?lat=6.9147&lng=79.9730&radiusKm=25`:
1. Check lat/lng were sent and are in range; radius > 0 (default 25 km).
2. Load all **active** stations.
3. For each: `GeoHelper.DistanceKm(phone, station)` (Haversine: distance along the Earth's curved surface, radius 6371 km).
4. Keep those ≤ radius, fill `distanceKm` (2 decimals), sort **nearest first**.
From SLIIT: Malabe 0.00 km → Kaduwela 2.42 → Battaramulla 6.23 → Kottawa 8.24; Nugegoda (inactive) is left out. The phone only draws the markers — the maths is on the server (FAT service).

**Slots** (`SlotService`, `SlotsController`) — Backoffice **and** Grid Operator manage them (`Roles.Staff`):
- **Create (R8):** station must exist and be active; start in the future; end after start; places `1..station.batterySlots`; `availableSlots = totalSlots`.
- **Edit (R8):** `booked = total − available`; new total must be ≥ booked and ≤ batterySlots; then `available = newTotal − booked`. `isActive = false` closes the window. Changing the **time** of a slot that already has bookings → **409** (D28: people chose that time).
- **Delete (R8):** blocked (409) while the slot has active bookings — close it instead.
- **Bookable list** (`GET /api/slots/available?stationId=`, used by the booking forms): slot open, at least 1 free place, station active (R11), and starts in the future but **no more than 7 days** ahead (R9).
- **Station's slot list** (`GET /api/stations/{id}/slots`, staff): default from the start of today (UTC) for 14 days, soonest first.
- **Times:** everything is UTC; a time sent without a zone is taken as UTC (D30). The web converts its `datetime-local` input to UTC before sending.

### IIS hosting (Phase 6)
- **Deploy:** admin PowerShell → `powershell -ExecutionPolicy Bypass -File .\scripts\deploy-api.ps1` (safe to repeat after every change).
- **What IIS does:** the site listens on port 8080; the **ASP.NET Core Module** (installed by the Hosting Bundle) starts our `SunShare.Api.dll` *inside* the IIS worker process ("in-process hosting") and hands it every request. The app pool uses **No Managed Code** because IIS must not load the old .NET Framework.
- **Why stop the pool before publishing:** Windows locks files that a running program is using.
- **Environment:** IIS runs the app as **Production** → Swagger still on (we turned it on for every environment), CORS only allows 5173 and 8081.
- **Phone:** firewall rule on port 8080 + the laptop's Wi-Fi IPv4 (`ipconfig`). It changes with the network (hotspot `172.20.10.x`, home Wi-Fi `192.168.1.x`) — that's why the Android app has an editable server address.

### Web shell + Home page (Phase 7)
**Files** (in `web/src/`): `App.jsx` (all routes) · `main.jsx` · `styles/theme.css` · `api/client.js`, `api/healthApi.js` · `context/AuthContext.jsx` · `utils/format.js` · `components/AppLayout.jsx`, `Sidebar.jsx`, `ProtectedRoute.jsx`, `SkipLink.jsx`, `PageHeader.jsx`, `StatusBadge.jsx`, `AlertMessage.jsx`, `EmptyState.jsx`, `ConfirmButton.jsx`, `LoadingSpinner.jsx`, `PagePlaceholder.jsx` · `pages/Home.jsx`, `NotFound.jsx`.

- **How a page calls the API (`api/client.js`):** every call goes through one `request()` function → URL = `VITE_API_BASE_URL` + path (`.env.development` = dev API :5080, `.env.production` = IIS :8080) → adds `Authorization: Bearer <token>` from the saved session → if the answer is not OK, throws an `ApiError` holding the API's `{ message }` so the page can show it in an `AlertMessage` → on **401** (token expired) it logs out automatically. No Axios — plain `fetch`.
- **Who is logged in (`AuthContext`):** a React *context* = a value every component can read with `useAuth()`. The session (`token, nic, fullName, role, expiresAt`) is saved in `localStorage`, so a page refresh keeps you logged in; an expired one is dropped.
- **Routes (`App.jsx`, HashRouter):** addresses look like `/#/stations`. The part after `#` never reaches IIS, so IIS always serves `index.html` and needs no rewrite rules. Public: `/` Home, `/login`. Staff pages sit inside `ProtectedRoute` (not logged in → Login) and `AppLayout` (sidebar). Backoffice-only pages have a second `ProtectedRoute` → a Grid Operator sees "You don't have access to this page". This is only for a nicer UI — the **API** still checks the role on every call (R2).
- **Sidebar:** the menu list is filtered by role (Backoffice 6 links, Grid Operator 3). On phones it turns into a top bar; the menu button toggles a React state (`menuOpen`) — no Bootstrap JavaScript needed.
- **Accessibility:** page regions (`header/nav/main/footer`), a "Skip to main content" link (first Tab), bold visible focus outline, `aria-expanded` on the menu button, screen-reader text for icon buttons and spinners.
- **Home page (W1):** hero "Trade your sunshine", 3 steps (Register → Reserve → Scan), the 3 roles, a call-to-action band, and a footer with the team and a **live "Server and database online" light** from `GET /api/health` — proves web → API → MongoDB in one glance.
- **Theme:** our colours are CSS variables over Bootstrap (`--ss-primary` teal, `--ss-accent` amber, `--ss-dark` navy); status badges: Pending amber (dark text), Approved teal, Completed/Active green, Cancelled grey, Deactivated red.

### Stations & slots web pages (Phase 9)
**Files** (in `web/src/`): `pages/Stations.jsx`, `StationForm.jsx`, `Slots.jsx`, `SlotForm.jsx` · `api/stationsApi.js`, `api/slotsApi.js` · helpers in `utils/format.js` (`googleMapsUrl`, `formatDate`, `toDateTimeInput`, `fromDateTimeInput`).

- **Stations (W9):** one table with location (+ a **Map** link that opens Google Maps at the coordinates), capacity, battery slots, hours, **active bookings** (from the API's `activeReservationCount`) and status. Backoffice sees Edit / Deactivate / Activate / Delete; a Grid Operator sees only Map + Slots (and the API would refuse them anyway — R2).
- **Deactivate / Delete:** the page just calls the API and shows its answer, e.g. Malabe → *"This station has 2 active reservations. Cancel or complete them first."* (R6) or *"…deactivate it instead."* (R7). The browser never counts bookings itself.
- **Station form (W10):** number inputs for GPS/capacity/battery slots, time inputs for the hours, and an **Open in Google Maps** button to check the pin before saving. The API checks the ranges and "open before close".
- **Slots (W11):** the station's windows for 14 days — total / booked / free, Open or Closed — with Add, Edit, Delete.
- **Slot form (W12):** staff type times in their local time (`datetime-local`); the page converts to UTC (`new Date(value).toISOString()`) because the API works in UTC. For a booked slot the form shows *"1 already booked - the time can't change…"*, and the API enforces it (R8, D28).

### Web app on IIS (Phase 12)
- **Deploy:** admin PowerShell → `powershell -ExecutionPolicy Bypass -File .\scripts\deploy-web.ps1`.
- **What happens:** `npm run build` turns the React code into plain files (`index.html`, one CSS, one JS, the icon fonts) using `.env.production`, so every API call goes to the IIS API `http://localhost:8080`. The script mirrors `web/dist` into `C:\inetpub\sunshare\web`, and the IIS site **SunShareWeb** on port **8081** serves those files. No .NET runs in this site — it is static files only.
- **Why no rewrite rules:** HashRouter keeps the page in the part after `#` (e.g. `/#/stations`), which never reaches IIS, so IIS always serves `index.html`.
- **Two sites, two ports:** web 8081 → API 8080 → MongoDB. The browser allows the web page to call the API only because the API's CORS list contains `http://localhost:8081`.
- **Tested:** Kvn logged in on `http://localhost:8081` (Dashboard with live counts); the icon font is served as `font/woff2`; the built JS contains `http://localhost:8080`.

### Android shell (Phase 13)
The "plumbing" every Android screen uses. No business rules live here — the phone only asks the API and shows the answer.
- **Models (`api/models/`)** — one small Java class per JSON shape (e.g. `LoginResponse`, `ReservationResponse`). The field names are exactly the JSON names, so **Gson** (the JSON library) fills them in by itself.
- **`ApiService`** — a Retrofit *interface*: each line says "this Java method = this HTTP call", e.g. `@GET("api/health") Call<HealthResponse> health();`. Retrofit writes the networking code. It lists the 20 endpoints the phone screens use (D48).
- **`ApiClient`** — builds Retrofit once. Before **every** request an *interceptor* (a hook that runs before each call) reads the token from the SQLite `session` table and adds `Authorization: Bearer <token>`.
- **`ApiConfig`** — the server address: default `http://10.0.2.2:8080/` (the emulator's name for "my laptop"), or the phone's saved value in SQLite `app_settings` (the ⚙ setting on Login). Changing it calls `ApiClient.reset()` so the next call uses the new address.
- **`ApiErrorParser`** — the API always sends errors as `{ "message": "…" }`; this reads that text so the screen shows the API's own words. If the server can't be reached at all, it says so and names the address in use.
- **`SunShareDbHelper`** — the phone's own SQLite file `sunshare_local.db` with 3 tables: `session` (who is logged in + token), `stations_cache` (map offline copy), `app_settings` (server address). `onCreate` makes the tables the first time the app runs.
- **Helpers** — `DateUtils` shows the API's UTC times in the phone's local time; `UiUtils` = toast, "field not empty" check, "Please wait…" button; `SessionGuard` = kick logged-out users back to Login, logout, and handle an expired token (HTTP 401).
- **Screen helpers added in Phase 14 (D50):** `UiUtils.setupEdgeToEdge(activity, root, topBar)` — Android 15+ draws every app behind the status bar and navigation bar, so the navy top bar is stretched under the status bar (white icons) and the screen gets bottom padding for the navigation bar or, while typing, the **keyboard**. `UiUtils.showFieldError` puts form errors in red **under** the box. Also a navy toolbar style in `themes.xml`. **Phase 16:** `UiUtils.showStatusBadge(label, status)` colours a status pill like the web (Pending amber, Approved teal, Completed green, Cancelled grey) using `bg_status_badge.xml` + the `Widget.SunShare.StatusBadge` style.
- **Why 10.0.2.2?** Inside the emulator `localhost` means the emulator itself; `10.0.2.2` is Android's fixed address for the laptop running it.
- **Tested:** emulator → `http://10.0.2.2:8080/api/health` (IIS) → green "API: ok · Database: connected" with the server time in local time; the phone's `sunshare_local.db` contained exactly the 3 tables.

### Android map (Phase 15) — ✅ built
**Files:** `android/app/src/main/java/com/sunshare/app/ui/map/StationMapActivity.java` · `android/app/src/main/assets/map.html` · `res/layout/activity_station_map.xml`.

**Words first:** a **WebView** is a small browser window inside an app screen. **Fused Location** is Google Play services' location helper (GPS + Wi-Fi + mobile network). **Maps JavaScript API** = Google's map for web pages — the same Google map, drawn by JavaScript.

**Why a web map inside the app?** Google needs a card for a normal Maps key. The no-card **Maps Demo Key** was *refused* by the native Android map but *accepted* by the Maps JavaScript API — tested with a throwaway screen (D51, D53). So the screen is native Java and only the map drawing is a tiny web page. It is still the real **Google Maps API**.

- **Step 1 — permission + location (Java):** Android's "Allow SunShare to access this device's location?" box. Allowed → Fused Location, *high accuracy*, a fix up to 1 minute old is fine, **10-second limit**. Denied or no fix → SLIIT Malabe (6.9147, 79.9729) and the status line says so.
- **Step 2 — the API (Java):** `GET /api/stations/nearby?lat=&lng=&radiusKm=25` → active stations within 25 km, `distanceKm` filled, nearest first (R18). The phone does no distance maths.
- **Step 3 — SQLite (Java):** `SunShareDbHelper.cacheStations(list)` replaces the rows of `stations_cache` (id, name, address, lat/lng, kW, battery slots, hours, distance, cached_at).
- **Step 4 — the page (JavaScript):** Java reads `assets/map.html`, replaces `__MAPS_API_KEY__` (from `local.properties` → manifest) and `__DATA__` (my position + stations, turned into JSON by Gson, which also escapes `<` `>`), and loads it into a WebView. `initMap()` draws the map, a blue dot for me and markers **1, 2, 3 …** (nearest first), then zooms to fit them all. Tap a marker → info window: **name, address, kW, battery slots, opening hours, distance, "Directions in Google Maps"** (opens the Google Maps app). Text is added with `textContent`, so a station name can never run as code.
- **Offline:** if the API can't be reached, the stations saved in SQLite are drawn with "Offline: showing N saved stations (saved …)". If Google's map itself can't load (no internet, key refused), the page shows the same stations as a plain list.
- **Freeze-proof (C13):** the first WebView starts Chrome's engine, which took 2.8 s on the emulator, so the WebView is created only when the map is ready and the screen opens at once.
- **Tested on the emulator (29 Sep):** at SLIIT → 4 markers: 1 Malabe 0.01 km, 2 Kaduwela 2.42, 3 Battaramulla 6.22, 4 Kottawa 8.24 (Nugegoda is inactive, so it's left out); tap 1 → details; Directions → Google Maps app opened; `stations_cache` had the 4 rows; wrong server address → "Offline: showing 4 saved stations"; location denied → SLIIT Malabe note; the Grid Operator's home opens the same map.

### End-to-end check (Phase 19)
- **Comments rule** (brief: missing = not marked): a checker script scanned **132 files / 498 methods** (C#, Java, JS/JSX, map page) for the header block and a `//` comment above every method → 2 small helpers were missing one, now fixed. Every `// Reference:` in the code is listed in `13-REFERENCES.md`.
- **Rubric walk on IIS:** web on `:8081` — Backoffice (dashboard, stations, pending activations, users, reservations history), Grid Operator (only Dashboard / Reservations / Stations & slots; Users → "You don't have access"), Prosumer refused; the network log shows every call going to the IIS API on `:8080`. Rules straight against the IIS API: R6 deactivate with bookings → 409, R7 delete with history → 409, R9 8 days ahead → 400, R10 change/cancel < 12 h → 400 (`canModify = false`).
- **Security fix:** the Android template's backup rules would have copied `sunshare_local.db` — which holds the **login token** — to Google Drive backups and to a new phone. Now excluded (D57).

### Diagrams (Phase 20)
`diagrams/` has five PlantUML text files and their PNGs (re-draw command in `diagrams/README.md`):
1. **High-level architecture** — users → Android app (+ SQLite) and web app → SunShare.Api on IIS (Controllers → Services with all rules → MongoDbContext) → MongoDB; Android app → Google Maps.
2. **Use case** — Prosumer on the left, *Staff* (Backoffice or Grid Operator) on the right, both staff roles inherit the Staff use cases; `Finalize` **includes** `Scan QR`; `Show booking QR` **extends** `View bookings` (only when Approved).
3. **DFD level 0** — SunShare as one process with Prosumer, Grid Operator, Backoffice and Google Maps.
4. **DFD level 1** — processes 1.0 accounts, 2.0 stations & slots, 3.0 bookings, 4.0 verify QR, 5.0 lists & dashboards, 6.0 nearby stations; stores D1–D4 = the MongoDB collections, D5 = the phone's SQLite.
5. **Database design** — the 4 collections with fields; one station → many slots → many reservations; one prosumer → many reservations (ids stored as references).

### Screenshots, report and README (Phase 21)
**Files:** `screenshots/web/W01…W14 + MAIN-SCREEN-web.png` · `screenshots/mobile/M01…M11 (+ M05b, M07b, M08b) + MAIN-SCREEN-mobile.png` · `report/generate-report.js`, `report/update-toc.ps1`, `report/report.config.json`, `report/contributions/*.md`, `report/package.json` · `README.md`.

- **Screenshots:** web pages from the IIS site (`:8081`) at 1440 px wide, logged in as Backoffice with the seeded data; Android screens from the emulator talking to the IIS API. One picture per screen/state, named as in `05-SCREENS.md`.
- **The report is built by a program, not typed (D59).** `cd report; npm run build` runs `generate-report.js` (Node + the `docx` package), which:
  1. reads the docs (`01-SPEC`, `02-ARCHITECTURE`, `03-DATABASE`, `04-API`, `08-SETUP`, `11-DECISIONS`, `12-CHALLENGES`, `13-REFERENCES`, `09-TEAM`, the group-pack sheets) and turns their Markdown (headings, lists, tables, **bold**, `code`) into Word paragraphs and tables;
  2. puts in the 5 diagrams and all screenshots with numbered captions (the captions come from the `05-SCREENS.md` table);
  3. adds each member's own AI statement from `report/contributions/<Part>-<name>.md` — if it still says `TODO`, a yellow "to be written by …" box shows instead (nobody's reflection is written for them);
  4. pastes **every source file** as text in Appendix A (the list comes from `git ls-files`, so a new file is never forgotten);
  5. saves `SunShare-Report.docx`. Then `update-toc.ps1` opens it in Word in the background, fills in the contents page and page numbers, and saves `SunShare-Report.pdf` (~1 minute; the file paths are passed to Word as plain `[string]`s — as PowerShell objects the PDF took 15+ minutes, C14).
- **Why like this:** if a doc or the code changes at the last minute, one command rebuilds the report, so the report and the repo always say the same thing.
- **README:** Git link, video link, team table, how to run (IIS scripts + dev), all 5 test accounts, what each folder holds.
- **Zip:** `scripts/make-zip.ps1` → `IT22552860.zip` next to the repo folder, made with `git archive` from the last commit — only files Git tracks, so `node_modules`, `bin`, `obj`, `build`, `.gradle` and `local.properties` (Maps key) can't get in; the report and both main-screen pictures are copied to the top of the zip.

## Your demo (≈ 60 s)
1. Browser: `http://localhost:8080/api/health` → database connected; IIS Manager shows both sites.
2. Web as Backoffice: create "SLIIT Rooftop Hub" with lat/lng → add two slots.
3. Try **Deactivate** on Malabe Solar Hub → blocked: "has N active reservations" (R6).
4. Phone: **Nearby Stations** → markers around Malabe → tap one → details + distance.
5. (Optional) Turn Wi-Fi off → reopen map → cached stations still show (SQLite).

## Viva questions
1. **How is the API hosted on IIS?** — Published to a folder, an IIS site on port 8080 points at it, and the ASP.NET Core Hosting Bundle's module starts our app inside IIS. The app pool uses "No Managed Code" because .NET Core runs its own runtime.
2. **Why is WebDAV mentioned in `web.config`, and what went wrong at first?** — IIS's WebDAV feature can grab PUT/DELETE/PATCH and answer 405, so `web.config` removes the WebDAV *handler*. Our first version also removed the WebDAV *module*, but IIS locks the `<modules>` section for sites → every request gave **500.19 (0x80070021)**. WebDAV isn't installed here, so we dropped that part and proved PUT/PATCH/DELETE reach the API (our own 400/403/404 answers, no 405).
3. **How does the phone reach the API?** — Same Wi-Fi, the laptop's LAN IP on port 8080, and a firewall rule. The emulator uses 10.0.2.2, which means "the host computer".
4. **How does "nearby" work?** — Phone sends its location; API calculates Haversine distance to each active station, filters by radius, sorts nearest first; phone just plots them.
5. **What is Haversine?** — A formula for the distance between two GPS points on a sphere, using their latitudes and longitudes.
6. **Why can't a station with bookings be deactivated?** — R6: people have booked it. The service counts Pending/Approved future reservations for the station and returns 409 with the count.
7. **Delete vs deactivate?** — R7: delete only if it never had bookings (and its slots go with it); otherwise deactivate so history stays correct.
8. **What's in `stations_cache` and why?** — Reference data. Saved after each successful nearby call so the map still works if the server is unreachable.
9. **How does MongoDB connect?** — `MongoClient` with the connection string from `appsettings.json`; `MongoDbContext` exposes the 4 collections; it's registered once (singleton) and `/api/health` pings the DB.
10. **Why HashRouter in React?** — The part after `#` is handled by the browser, so IIS always serves `index.html` and needs no rewrite module.
11. **What is CORS and why configure it?** — Browser rule: a page from `:8081` may call `:8080` only if the API allows that origin. We allow the dev and IIS web addresses.
12. **Why a slot's `totalSlots` can't exceed `batterySlots`?** — R8: a time window can't offer more places than the hub physically has.
13. **Is a map in a WebView still "Google Maps API"?** — Yes: it is Google's Maps JavaScript API with our key, drawing Google's map, markers and info windows. We used it because the no-card demo key works there but not in the native Android SDK (tested, D53). Location, the API call and SQLite are all native Java.
14. **What if the phone has no location?** — After 10 seconds (or if permission is denied) the app searches around SLIIT Malabe and says so on the screen — it never waits for ever.
15. **How was the report made, and is the code in it really ours?** — A Node script builds it from our own docs, diagrams, screenshots and the files Git tracks, so the code in Appendix A is exactly the code in the repository. Each member's AI statement is their own text from `report/contributions/`.
