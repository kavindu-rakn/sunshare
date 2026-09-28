# 04 — API Contract (SunShare.Api)

- Base path: **`/api`** · JSON uses **camelCase** · dates are ISO-8601 **UTC** (`2026-09-29T02:30:00Z`).
- Auth: header `Authorization: Bearer <token>` on everything except `auth/login`, `auth/register` and `health`. The token (JWT, 8 h) carries the claims `nic`, `name` and `role`; controllers read the caller's NIC from `nic` (R16).
- Errors: always `{ "message": "human friendly text" }` with 400 / 401 / 403 / 404 / 409 / 500.
- Roles: **BO** = Backoffice, **GO** = GridOperator, **PR** = Prosumer, **Any** = any logged-in user.
- "Part" = owner in `09-TEAM.md`. "Rules" = IDs in `01-SPEC.md`.

## Shapes (DTOs)

```jsonc
// LoginRequest
{ "nic": "199712345678", "password": "Prosumer@123" }
// LoginResponse
{ "token": "eyJ...", "nic": "199712345678", "fullName": "Nimal Perera", "role": "Prosumer", "expiresAt": "2026-09-27T18:00:00Z" }

// RegisterRequest (mobile self-register)            // CreateUserRequest (BO creates anyone)
{ "nic", "fullName", "email", "phone", "address", "password" }   { "nic", "fullName", "email", "phone", "address", "role", "password" }
// UpdateUserRequest (BO)                            // UpdateProfileRequest (PR)
{ "fullName", "email", "phone", "address" }          { "fullName", "email", "phone", "address", "newPassword": null }
// UserResponse  (never contains passwordHash)
{ "nic", "fullName", "email", "phone", "address", "role", "status", "createdAt", "updatedAt" }

// StationRequest
{ "name", "address", "latitude", "longitude", "capacityKw", "batterySlots", "openTime": "06:00", "closeTime": "18:00" }
// StationResponse
{ "id", "name", "address", "latitude", "longitude", "capacityKw", "batterySlots", "openTime", "closeTime",
  "isActive", "activeReservationCount", "distanceKm": null /* only filled by /nearby */, "createdAt", "updatedAt" }

// SlotRequest (create)                              // SlotUpdateRequest
{ "stationId", "startTime", "endTime", "totalSlots" } { "startTime", "endTime", "totalSlots", "isActive" }
// SlotResponse
{ "id", "stationId", "stationName", "startTime", "endTime", "totalSlots", "availableSlots", "bookedSlots", "isActive" }

// CreateReservationRequest (prosumerNic only used when staff book on behalf)   // UpdateReservationRequest
{ "prosumerNic": null, "slotId", "energyKwh": 12.5, "type": "Sell" }            { "slotId", "energyKwh", "type" }
// ReservationResponse
{ "id", "prosumerNic", "prosumerName", "stationId", "stationName", "slotId", "startTime", "endTime",
  "energyKwh", "type", "status",
  "canModify": true,                              // API-computed: Pending/Approved AND start ≥ 12 h away (R10, R15)
  "qrData": "SUNSHARE|<id>|<token>",               // only when Approved, only to the owner PR or staff; else null
  "approvedBy", "approvedAt", "completedBy", "completedAt", "cancelledBy", "cancelledAt", "createdAt", "updatedAt" }

// VerifyQrRequest / CompleteRequest
{ "qrData": "SUNSHARE|66f6...|9f1c..." }

// StaffDashboardResponse
{ "pendingReservations": 3, "approvedFutureReservations": 5, "todayReservations": 2,
  "activeStations": 4, "pendingActivations": 2, "pendingList": [ /* ReservationResponse x up to 5, soonest first */ ] }
// ProsumerDashboardResponse
{ "pendingCount": 1, "approvedFutureCount": 1, "completedCount": 1, "nextReservation": { /* ReservationResponse or null */ } }
```

## Endpoints

### Health — shared (Kvn)
| Method | Path | Who | Response |
|---|---|---|---|
| GET | `/api/health` | Public | `{ "api": "ok", "database": "connected", "time": "..." }` — pings MongoDB; `503` with `"database": "unreachable"` if Mongo is down. Used to prove IIS + MongoDB work in the demo. |

### Auth — Part A
| Method | Path | Who | Body → Response | Rules |
|---|---|---|---|---|
| POST | `/api/auth/login` | Public | LoginRequest → LoginResponse. Wrong NIC/password → 401 "NIC or password is incorrect." Pending → 403 "Your account is waiting for Backoffice activation." Deactivated → 403 "Your account is deactivated. Please contact the Backoffice." | R3, R4 |
| POST | `/api/auth/register` | Public | RegisterRequest → 201 UserResponse (always role `Prosumer`, status `Pending`). Bad NIC, missing details or password < 6 chars → 400. NIC exists → 409. | R1, R3 |

### Users — Part A
| Method | Path | Who | Body → Response | Rules |
|---|---|---|---|---|
| GET | `/api/users?role=&status=&search=` | BO, GO (GO: read only, used to pick a prosumer when booking on behalf) | → UserResponse[] | R2 |
| GET | `/api/users/pending-activations` | BO | → UserResponse[] of Prosumers with status `Pending` **or** `Deactivated` (oldest first) | R3, R4 |
| GET | `/api/users/{nic}` | BO | → UserResponse | |
| POST | `/api/users` | BO | CreateUserRequest → 201 UserResponse (status `Active`; password ≥ 6 chars) | R1, R2 |
| PUT | `/api/users/{nic}` | BO | UpdateUserRequest → UserResponse (NIC and role can't change) | R1 |
| PATCH | `/api/users/{nic}/activate` | BO | → UserResponse. `Pending`/`Deactivated` → `Active` | R3, R4 |
| PATCH | `/api/users/{nic}/deactivate` | BO | → UserResponse. Can't deactivate self → 400 | R4 |

### Profile (own account) — Part A
| Method | Path | Who | Body → Response | Rules |
|---|---|---|---|---|
| GET | `/api/profile` | Any | → UserResponse of the caller | R16 |
| PUT | `/api/profile` | PR | UpdateProfileRequest → UserResponse (`newPassword` optional, min 6 chars) | R16 |
| PATCH | `/api/profile/deactivate` | PR | → `{ "message": "Account deactivated." }` | R5 |

### Stations — Part B
| Method | Path | Who | Body → Response | Rules |
|---|---|---|---|---|
| GET | `/api/stations?activeOnly=` | Any (PR always gets active only) | → StationResponse[] | |
| GET | `/api/stations/nearby?lat=&lng=&radiusKm=25` | Any | → StationResponse[] with `distanceKm`, active only, nearest first | R18 |
| GET | `/api/stations/{id}` | Any | → StationResponse | |
| POST | `/api/stations` | BO | StationRequest → 201 StationResponse | lat/lng range, capacity > 0, batterySlots ≥ 1, open < close |
| PUT | `/api/stations/{id}` | BO | StationRequest → StationResponse (updates schedule too) | |
| PATCH | `/api/stations/{id}/deactivate` | BO | → StationResponse. Active reservations → 409 "This station has N active reservations. Cancel or complete them first." | R6 |
| PATCH | `/api/stations/{id}/activate` | BO | → StationResponse | |
| DELETE | `/api/stations/{id}` | BO | → 204. Has any reservations → 409 "Stations with booking history can't be deleted — deactivate it instead." Deletes its slots. | R7 |

### Slots — Part B
| Method | Path | Who | Body → Response | Rules |
|---|---|---|---|---|
| GET | `/api/stations/{stationId}/slots?from=&to=` | BO, GO | → SlotResponse[] (default: from today, 14 days) | |
| GET | `/api/slots/available?stationId=` | Any | → SlotResponse[] that are active, `availableSlots > 0`, start in the future and ≤ 7 days away, station active | R9, R11 |
| GET | `/api/slots/{id}` | Any | → SlotResponse | |
| POST | `/api/slots` | BO, GO | SlotRequest → 201 SlotResponse (`availableSlots = totalSlots`) | R8 |
| PUT | `/api/slots/{id}` | BO, GO | SlotUpdateRequest → SlotResponse (`availableSlots` recalculated = total − booked) | R8 |
| DELETE | `/api/slots/{id}` | BO, GO | → 204. Active reservations → 409 | R8 |

### Reservations: actions — Part C
| Method | Path | Who | Body → Response | Rules |
|---|---|---|---|---|
| POST | `/api/reservations` | PR (own NIC from token), BO/GO (must send `prosumerNic`) | CreateReservationRequest → 201 ReservationResponse (status `Pending`) | R9, R11, R12, R13, R16, R17 |
| PUT | `/api/reservations/{id}` | PR (own), BO, GO | UpdateReservationRequest → ReservationResponse (Approved → back to Pending) | R9, R10, R12, R13, R15, R16, R17 |
| PATCH | `/api/reservations/{id}/cancel` | PR (own), BO, GO | → ReservationResponse (`Cancelled`) | R10, R12, R15, R16 |
| PATCH | `/api/reservations/{id}/approve` | BO, GO | → ReservationResponse (`Approved`, `qrData` filled). Only from `Pending` | R13 |

### Reservations: views & QR — Part D
| Method | Path | Who | Body → Response | Rules |
|---|---|---|---|---|
| GET | `/api/reservations?view=&status=&stationId=&from=&to=&search=` | PR (own only), BO, GO | `view` = `current` \| `pending` \| `history` \| `all` (default). `search` matches station name, reservation id; staff also prosumer NIC/name. → ReservationResponse[] (current/pending: soonest first; history: newest first) | R16, dashboard definitions |
| GET | `/api/reservations/{id}` | PR (own), BO, GO | → ReservationResponse | R16 |
| POST | `/api/reservations/verify-qr` | GO | VerifyQrRequest → ReservationResponse. Bad format → 400 "This is not a SunShare QR code." Wrong token / not Approved → 400 with reason | R14 |
| PATCH | `/api/reservations/{id}/complete` | GO | VerifyQrRequest → ReservationResponse (`Completed`) | R14 |

### Dashboards — Part D
| Method | Path | Who | Response |
|---|---|---|---|
| GET | `/api/dashboard/summary` | BO, GO | StaffDashboardResponse (web dashboard + mobile operator home) |
| GET | `/api/dashboard/prosumer` | PR | ProsumerDashboardResponse (mobile prosumer home) |

## Controller → service map

| Controller | Service | Part |
|---|---|---|
| `AuthController`, `UsersController`, `ProfileController` | `AuthService`, `UserService` | A |
| `StationsController`, `SlotsController` | `StationService`, `SlotService` | B |
| `ReservationsController` — create / update / cancel / approve | `ReservationService` | C |
| `ReservationViewsController` — list / get by id | `ReservationQueryService` | D |
| `QrController` — verify-qr / complete | `QrService` | D |
| `DashboardController` | `DashboardService` | D |

> The three reservation controllers all use `[Route("api/reservations")]`; splitting them by file keeps each member's code in their own files.

## Quick manual test order (Swagger)
1. `POST /auth/login` as Backoffice → click **Authorize** → paste token.
2. `GET /users/pending-activations` → `PATCH /users/200198765432/activate`.
3. `POST /stations` → `POST /slots` for it.
4. Login as Prosumer → `GET /slots/available` → `POST /reservations`.
5. Login as GridOperator → `PATCH /reservations/{id}/approve` → copy `qrData` → `POST /reservations/verify-qr` → `PATCH /reservations/{id}/complete`.
6. Try breaking rules: book 8 days ahead (R9), cancel within 12 h (R10), deactivate a station with bookings (R6).
