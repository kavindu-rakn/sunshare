# 02 — Architecture

## 1. Big picture (caveman version)

```
 ┌──────────────────────┐        HTTP + JSON (REST)        ┌─────────────────────────────┐        ┌──────────────┐
 │ Android app (Java)   │ ───────────────────────────────► │  SunShare.Api (C#, .NET 10) │ ─────► │   MongoDB    │
 │  + SQLite on phone   │ ◄─────────────────────────────── │  hosted on Windows IIS      │ ◄───── │  SunShareDb  │
 └──────────────────────┘                                  │  ALL business rules here    │        └──────────────┘
 ┌──────────────────────┐        HTTP + JSON (REST)        │  (FAT service)              │
 │ Web app (React +     │ ───────────────────────────────► │                             │
 │  Bootstrap 5)        │ ◄─────────────────────────────── └─────────────────────────────┘
 └──────────────────────┘
```

- **Clients are "thin"**: they show screens, collect input, call the API, and show what the API says. They never touch MongoDB and never decide business rules.
- **API is "fat"**: it checks roles, validates, applies every rule (R1–R18 in `01-SPEC.md`), and reads/writes MongoDB.
- **SQLite** lives only on the phone: saved login session, cached stations, and the server address setting.

## 2. Tech stack (locked)

| Layer | Choice | Why (one line for the viva) |
|---|---|---|
| API | **ASP.NET Core Web API, .NET 10 (LTS), C#, Controllers** | Brief demands C# Web API; controllers are the classic, easy-to-explain style |
| Hosting | **IIS** + ASP.NET Core Hosting Bundle 10 | Brief demands IIS (4 marks) |
| Database | **MongoDB Community Server (local)** + **MongoDB.Driver** | Brief demands NoSQL/MongoDB; local = works at viva without internet |
| Auth | **JWT** bearer tokens + **BCrypt** password hashing | JWT = a signed "login ticket" the client sends with every call; BCrypt = passwords are never stored as plain text |
| API docs/test | **Swagger UI** (Swashbuckle) at `/swagger` | Click-to-test every endpoint; great for demo |
| Web | **React (Vite) + JavaScript + Bootstrap 5 + Bootstrap Icons + React Router (HashRouter)** | React is named in the brief; Bootstrap 5 is marked in the rubric; HashRouter means IIS needs no extra rewrite module |
| Mobile | **Java + XML layouts (Android Studio "Empty Views Activity")**, minSdk 26 | Pure native Android; Java looks like C# |
| Mobile HTTP | **Retrofit + Gson** (OkHttp underneath) | One short line per API call |
| Mobile DB | **SQLite via `SQLiteOpenHelper`** (no Room) | Rubric says SQLite — raw SQLite is the most literal match |
| Maps | **Google Maps JavaScript API** shown in Android's built-in **WebView** (Maps Demo Key, D53) + **Fused Location** | Rubric says Google Maps API (3 + 5 marks); the no-card demo key works with the JavaScript API but not the native Android SDK |
| QR | **ZXing Android Embedded** (journeyapps) | One library both makes and scans QR codes |

### Allowed packages (do not add others without asking Kvn)
- API: `MongoDB.Driver`, `Microsoft.AspNetCore.Authentication.JwtBearer`, `BCrypt.Net-Next`, `Swashbuckle.AspNetCore`
- Web: `react`, `react-dom`, `react-router-dom`, `bootstrap`, `bootstrap-icons` (+ Vite's own dev deps)
- Android: `retrofit2:retrofit`, `retrofit2:converter-gson`, `com.journeyapps:zxing-android-embedded`, `play-services-maps`, `play-services-location`, `androidx.recyclerview:recyclerview`, plus the template defaults (`appcompat`, `material`, `constraintlayout`, `activity`)
- Android map key: **Maps Demo Key** (D51). If the native Maps SDK refuses it, the map screen uses the **Maps JavaScript API inside Android's built-in `WebView`** (no extra package; the key is injected at runtime from `local.properties`)
- Android **last-resort fallback only** (D47, if no Google key works at all): `org.osmdroid:osmdroid-android` (OpenStreetMap map, no key)

### Banned (keeps it explainable)
TypeScript, Redux/Zustand, Axios (use `fetch`), react-bootstrap, Tailwind, AutoMapper, MediatR, CQRS, generic repository / unit-of-work, Entity Framework, Kotlin source files, Jetpack Compose, Room, Hilt/Dagger, RxJava, Flutter/React Native/Xamarin/MAUI, any cloud DB.

## 3. Folder layout

```
EAD/                               ← Cowork folder (Assignment.pdf lives here)
└── sunshare/                      ← GIT REPO ROOT
    ├── CLAUDE.md  AGENTS.md  README.md  .gitignore  .gitattributes
    ├── docs/                      ← these docs + group-pack/
    ├── api/
    │   └── SunShare.Api/
    │       ├── Controllers/       HealthController                                             (shared)
    │       │                      AuthController, UsersController, ProfileController,          (Part A)
    │       │                      StationsController, SlotsController,                         (Part B)
    │       │                      ReservationsController,                                      (Part C)
    │       │                      ReservationViewsController, QrController, DashboardController (Part D)
    │       ├── Services/          AuthService, UserService | StationService, SlotService |
    │       │                      ReservationService | ReservationQueryService, QrService, DashboardService
    │       ├── Models/            User, SolarStation, EnergyBookingSlot, EnergyReservation, Roles, Statuses
    │       ├── Dtos/              *Request / *Response classes (shapes of JSON in and out)
    │       ├── Data/              MongoDbContext, MongoDbSettings, DataSeeder
    │       ├── Helpers/           ApiException (shared) | JwtTokenHelper, NicValidator (A) | GeoHelper (B) | ReservationMapper (C)
    │       ├── Middleware/        ErrorHandlingMiddleware
    │       ├── Program.cs  appsettings.json  web.config
    ├── web/                       ← Vite React app
    │   ├── .env.development  .env.production
    │   └── src/
    │       ├── api/               client.js (fetch wrapper) + one file per resource (usersApi.js, stationsApi.js …)
    │       ├── context/           AuthContext.jsx
    │       ├── components/        AppLayout, Sidebar, ProtectedRoute, StatusBadge, AlertMessage, ConfirmButton, EmptyState
    │       ├── pages/             Home, Login, Dashboard, Users, UserForm (also the Prosumer form: kind="prosumer"), Prosumers, PendingActivations,
    │       │                      Stations, StationForm, Slots, SlotForm, Reservations, ReservationForm, NotFound
    │       ├── styles/            theme.css (brand colours over Bootstrap)
    │       ├── App.jsx  main.jsx
    ├── android/                   ← Android Studio project (created by Kvn from the template)
    │   └── app/src/main/
    │       ├── java/com/sunshare/app/
    │       │   ├── api/           ApiClient, ApiService, ApiConfig, ApiErrorParser, models/ (Java classes for JSON)
    │       │   ├── db/            SunShareDbHelper (SQLite)
    │       │   ├── ui/auth/       LoginActivity, RegisterActivity
    │       │   ├── ui/prosumer/   ProsumerHomeActivity, ProfileActivity, BookingsActivity, BookingAdapter,
    │       │   │                  ReservationFormActivity, ReservationDetailActivity, ReservationSummaryActivity
    │       │   ├── ui/map/        StationMapActivity
    │       │   ├── ui/operator/   OperatorHomeActivity, ScanResultActivity
    │       │   └── util/          DateUtils, UiUtils, SessionGuard
    │       └── res/               layout/*.xml, values/colors.xml, strings.xml, themes.xml, xml/network_security_config.xml
    ├── diagrams/                  high-level, use-case, DFD (source + PNG)
    ├── screenshots/               web/ and mobile/ PNGs for the report
    └── report/                    report generator + final .docx
```

## 4. How one request flows (example: prosumer cancels a booking)

1. **Android** `ReservationDetailActivity` → user taps **Cancel** → `apiService.cancelReservation(id)`.
2. **Retrofit** sends `PATCH http://<server>:8080/api/reservations/{id}/cancel` with header `Authorization: Bearer <token from SQLite>`.
3. **IIS** receives it and hands it to the ASP.NET Core app.
4. **JWT middleware** checks the token is valid and reads NIC + role from it.
5. **`ReservationsController.Cancel`** is allowed for Prosumer/staff → calls `ReservationService.CancelAsync(id, callerNic, callerRole)`.
6. **`ReservationService`** loads the reservation from MongoDB, checks **R16** (own booking), **R15** (not already done), **R10** (≥ 12 h away), sets `Cancelled`, and does **R12** (slot `availableSlots + 1`).
7. Returns the updated reservation as JSON → Android opens **`ReservationSummaryActivity`** ("Cancelled ✓").
8. If any rule fails, the service throws `ApiException(400, "…clear message…")` → middleware returns `{ "message": "…" }` → Android shows it in a Snackbar/Toast.

## 5. Auth flow

1. `POST /api/auth/login { nic, password }` → API finds user by NIC, checks BCrypt hash, checks status (R3, R4).
2. API returns `{ token, nic, fullName, role }`. Token = JWT signed with the secret in `appsettings.json`, valid 8 hours, contains NIC + role.
3. **Web** saves it in `localStorage`; **Android** saves it in the SQLite `session` table.
4. Every later call sends `Authorization: Bearer <token>`. `[Authorize(Roles = "...")]` on controllers enforces R2.
5. On `401`, clients clear the saved session and go back to Login.

## 6. Error handling (same everywhere)

- Services throw **`ApiException(statusCode, message)`** — e.g. `400` rule broken, `401` bad login, `403` wrong role/not yours, `404` not found, `409` conflict (duplicate NIC, slot full).
- **`ErrorHandlingMiddleware`** turns it into JSON: `{ "message": "Cancellations need at least 12 hours' notice." }`. Unknown errors → `500 { "message": "Something went wrong on the server." }` (details only in the server log).
- Web shows `message` in a Bootstrap alert; Android shows it in a Toast/Snackbar. **Messages must be human-friendly.**
- **Ids from the URL or body** (stations, slots, reservations are MongoDB ObjectIds): check `ObjectId.TryParse(id, out _)` first and throw `404` if it fails — otherwise a typo like `/api/stations/abc` crashes the query with a 500. Reuse `StationService.FindOrThrowAsync` / `SlotService.FindOrThrowAsync` where possible.
- **Times in requests** must be UTC ISO strings (`2026-09-30T02:30:00Z`). A time with an offset (`+05:30`) is converted to UTC; a time with no zone at all is taken as UTC. The web converts `datetime-local` values with `new Date(value).toISOString()` before sending.

## 7. Addresses and ports

| Thing | Development | Hosted (demo / viva) |
|---|---|---|
| API | `http://localhost:5080` (`dotnet run`) | IIS site **SunShareApi** → `http://localhost:8080`, phone: `http://<laptop-LAN-IP>:8080` |
| Swagger | `http://localhost:5080/swagger` | `http://localhost:8080/swagger` (kept ON for the demo) |
| Web | `http://localhost:5173` (`npm run dev`) | IIS site **SunShareWeb** → `http://localhost:8081` |
| Android → API | Emulator: `http://10.0.2.2:8080/` · Phone: `http://<laptop-LAN-IP>:8080/` — changeable at runtime via the ⚙ **Server address** setting on the Login screen (saved in SQLite) |
| MongoDB | `mongodb://localhost:27017`, database **`SunShareDb`** |

CORS on the API allows `http://localhost:5173` and `http://localhost:8081` (list in `appsettings.json` → `Cors:AllowedOrigins`). **Only while developing** (`ASPNETCORE_ENVIRONMENT=Development`, i.e. `dotnet run`) any `http://localhost:<port>` is also allowed; on IIS (Production) only the list counts (D23).

## 8. Time handling
- MongoDB stores **UTC**. API sends ISO strings like `2026-09-29T02:30:00Z`.
- Clients convert to the device's local time (Sri Lanka, UTC+5:30) only for display.
- All rule maths (7 days, 12 hours) happens in the API using `DateTime.UtcNow`.

## 9. SQLite on the phone (`sunshare_local.db`, version 1)

| Table | Columns | Used for |
|---|---|---|
| `session` | `nic TEXT PK, full_name TEXT, role TEXT, token TEXT, logged_in_at TEXT` | Stay logged in; attach token to API calls; role-based home on app start (max 1 row) |
| `stations_cache` | `id TEXT PK, name TEXT, address TEXT, latitude REAL, longitude REAL, capacity_kw REAL, battery_slots INTEGER, open_time TEXT, close_time TEXT, distance_km REAL, cached_at TEXT` | Reference data: stations saved after each successful nearby-stations call; shown on the map if the API is unreachable |
| `app_settings` | `key TEXT PK, value TEXT` | `api_base_url` (server address) |

## 10. Security notes (honest limits, also go in the report)
- Passwords hashed with BCrypt; JWT signed with HMAC-SHA256.
- QR "security" = a random 32-char token that only the server and the booking owner know; faking a QR needs that token.
- Demo runs on **HTTP over the local network** (no HTTPS certificate) — acceptable for a lab demo, would be HTTPS in production.
- JWT secret sits in `appsettings.json` for simplicity; production would use environment variables / a secret store.
- A token stays valid until it expires (8 h), even if the account is deactivated meanwhile — the server keeps no session list. We limit the damage: login is refused (R4), profile edits check the status again, and reservations need an Active prosumer (R11). Production could use short-lived tokens + refresh tokens or a revocation list.
