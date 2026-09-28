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
4. The phone saves the list into SQLite `stations_cache`, then adds a marker per station from its stored latitude/longitude.
5. Tapping a marker opens an info window with the station's details.
6. If the API can't be reached, the map loads stations from `stations_cache` and shows an "offline" note.

## Hosting in one breath
`dotnet publish` → files in `C:\inetpub\sunshare\api` → IIS site **SunShareApi** on port 8080 (app pool "No Managed Code"; the **Hosting Bundle** lets IIS run .NET) → `web.config` removes **WebDAV** (otherwise PUT/DELETE/PATCH give 405) → firewall rule so the phone can reach `http://<laptop-IP>:8080`.

## Files (planned — updated after the build)
- API (Part B): `Controllers/StationsController.cs`, `SlotsController.cs` · `Services/StationService.cs`, `SlotService.cs` · `Helpers/GeoHelper.cs` · `Dtos/StationRequest.cs`, `StationResponse.cs`, `SlotRequest.cs`, `SlotUpdateRequest.cs`, `SlotResponse.cs`
- API (shared foundation) — ✅ **built in Phase 1** (all in `api/SunShare.Api/`):
  - `Program.cs` (start-up), `appsettings.json` (Mongo address, JWT settings, CORS list), `web.config` (IIS)
  - `Data/MongoDbSettings.cs`, `Data/MongoDbContext.cs`, `Data/DataSeeder.cs`
  - `Models/User.cs`, `SolarStation.cs`, `EnergyBookingSlot.cs`, `EnergyReservation.cs`, `Roles.cs`, `UserStatuses.cs`, `ReservationStatuses.cs`, `ReservationTypes.cs`
  - `Helpers/ApiException.cs`, `Middleware/ErrorHandlingMiddleware.cs`, `Controllers/HealthController.cs`
  - still to come: `scripts/deploy-api.ps1` (Phase 6)
- Web: `pages/Home.jsx`, `Stations.jsx`, `StationForm.jsx`, `Slots.jsx`, `SlotForm.jsx`, `NotFound.jsx` · `api/client.js`, `stationsApi.js`, `slotsApi.js` · `components/*` · `context/AuthContext.jsx` · `styles/theme.css` · `App.jsx`, `main.jsx`
- Android: `ui/map/StationMapActivity.java` · `db/SunShareDbHelper.java` · `api/ApiClient.java`, `ApiService.java`, `ApiConfig.java`, `ApiErrorParser.java`, `api/models/*` · `util/*` · `res/values/*`, `AndroidManifest.xml`, `res/xml/network_security_config.xml`

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

**`web.config`:** tells IIS to run the app through the ASP.NET Core Module (from the Hosting Bundle), and **removes WebDAV** — an IIS module that would otherwise grab PUT/DELETE/PATCH and answer 405.

## Your demo (≈ 60 s)
1. Browser: `http://localhost:8080/api/health` → database connected; IIS Manager shows both sites.
2. Web as Backoffice: create "SLIIT Rooftop Hub" with lat/lng → add two slots.
3. Try **Deactivate** on Malabe Solar Hub → blocked: "has N active reservations" (R6).
4. Phone: **Nearby Stations** → markers around Malabe → tap one → details + distance.
5. (Optional) Turn Wi-Fi off → reopen map → cached stations still show (SQLite).

## Viva questions
1. **How is the API hosted on IIS?** — Published to a folder, an IIS site on port 8080 points at it, and the ASP.NET Core Hosting Bundle's module starts our app inside IIS. The app pool uses "No Managed Code" because .NET Core runs its own runtime.
2. **Why did PUT/DELETE fail on IIS at first / why is WebDAV removed?** — IIS's WebDAV module grabs those verbs and returns 405; our `web.config` removes it.
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
