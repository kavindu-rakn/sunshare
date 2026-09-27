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
- API (shared foundation): `Program.cs`, `appsettings.json`, `web.config`, `Data/MongoDbContext.cs`, `MongoDbSettings.cs`, `DataSeeder.cs`, `Models/*`, `Helpers/ApiException.cs`, `Middleware/ErrorHandlingMiddleware.cs`, `Controllers/HealthController.cs`, `scripts/deploy-api.ps1`
- Web: `pages/Home.jsx`, `Stations.jsx`, `StationForm.jsx`, `Slots.jsx`, `SlotForm.jsx`, `NotFound.jsx` · `api/client.js`, `stationsApi.js`, `slotsApi.js` · `components/*` · `context/AuthContext.jsx` · `styles/theme.css` · `App.jsx`, `main.jsx`
- Android: `ui/map/StationMapActivity.java` · `db/SunShareDbHelper.java` · `api/ApiClient.java`, `ApiService.java`, `ApiConfig.java`, `ApiErrorParser.java`, `api/models/*` · `util/*` · `res/values/*`, `AndroidManifest.xml`, `res/xml/network_security_config.xml`

## How it works
_(Claude Code fills this in after Phases 1, 3, 6, 7, 9, 12, 13 and 15.)_

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
