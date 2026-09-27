# 03 — Database Design (MongoDB)

Database: **`SunShareDb`** on `mongodb://localhost:27017`.
**Exactly 4 collections, named to match the rubric** ("User's detail · SolarStationInfo · EnergyBookingSlots · Energy Reservation"):

| Rubric line | Collection name | C# model class |
|---|---|---|
| User's detail | **`Users`** | `User` |
| SolarStationInfo | **`SolarStationInfo`** | `SolarStation` |
| EnergyBookingSlots | **`EnergyBookingSlots`** | `EnergyBookingSlot` |
| Energy Reservation | **`EnergyReservations`** | `EnergyReservation` |

> MongoDB stores **documents** (JSON-like records) in **collections** (like tables). There are no JOINs, so we store the *id* of the related document (a "reference") and sometimes a copy of a name for fast display.

## Relationships

```
Users (_id = NIC) 1 ────< EnergyReservations >──── 1 EnergyBookingSlots >──── 1 SolarStationInfo
                         prosumerNic                   slotId      stationId            _id
                         (also stationId → SolarStationInfo, for quick station queries)
```
- One **station** has many **slots**. One **slot** has many **reservations** (up to `totalSlots`). One **prosumer** has many **reservations**.
- `prosumerName` and `stationName` inside a reservation are **copies** (snapshots) for fast lists and search.

---

## 1. `Users` — User's detail
All people: Backoffice, GridOperator and Prosumer. **`_id` is the NIC** (rule R1).

| Field | Type | Req | Notes |
|---|---|---|---|
| `_id` | string | ✅ | **NIC** — `981234567V` (old) or `199812345678` (new). Unique by nature of `_id`. |
| `fullName` | string | ✅ | |
| `email` | string | ✅ | |
| `phone` | string | ✅ | e.g. `0771234567` |
| `address` | string | ➖ | Prosumers' property address |
| `role` | string | ✅ | `Backoffice` \| `GridOperator` \| `Prosumer` |
| `status` | string | ✅ | `Pending` \| `Active` \| `Deactivated` |
| `passwordHash` | string | ✅ | BCrypt hash — **never** the plain password; never returned by the API |
| `createdAt` | date (UTC) | ✅ | |
| `updatedAt` | date (UTC) | ✅ | |

```json
{
  "_id": "199712345678",
  "fullName": "Nimal Perera",
  "email": "nimal.perera@example.com",
  "phone": "0771234567",
  "address": "12 Temple Road, Malabe",
  "role": "Prosumer",
  "status": "Active",
  "passwordHash": "$2a$11$Qm3...",
  "createdAt": { "$date": "2026-09-27T10:00:00Z" },
  "updatedAt": { "$date": "2026-09-27T10:00:00Z" }
}
```

## 2. `SolarStationInfo` — stations / microgrid nodes

| Field | Type | Req | Notes |
|---|---|---|---|
| `_id` | ObjectId | ✅ | C#: `string` with `[BsonRepresentation(BsonType.ObjectId)]` |
| `name` | string | ✅ | e.g. "Malabe Solar Hub" |
| `address` | string | ✅ | |
| `latitude` | double | ✅ | GPS, −90..90 |
| `longitude` | double | ✅ | GPS, −180..180 |
| `capacityKw` | double | ✅ | Solar generation capacity in kW (> 0) |
| `batterySlots` | int | ✅ | Number of battery storage places at the hub (≥ 1) — caps a slot's `totalSlots` (R8) |
| `openTime` | string | ✅ | Operating schedule start, `"HH:mm"` e.g. `"06:00"` |
| `closeTime` | string | ✅ | Operating schedule end, `"HH:mm"` e.g. `"18:00"` |
| `isActive` | bool | ✅ | `false` = deactivated (R6) |
| `createdAt`, `updatedAt` | date (UTC) | ✅ | |

```json
{
  "_id": { "$oid": "66f6a1c2e4b0a1b2c3d4e5f1" },
  "name": "Malabe Solar Hub",
  "address": "New Kandy Road, Malabe",
  "latitude": 6.9147, "longitude": 79.9730,
  "capacityKw": 250, "batterySlots": 10,
  "openTime": "06:00", "closeTime": "18:00",
  "isActive": true,
  "createdAt": { "$date": "2026-09-27T10:00:00Z" }, "updatedAt": { "$date": "2026-09-27T10:00:00Z" }
}
```

## 3. `EnergyBookingSlots` — time windows at a station

| Field | Type | Req | Notes |
|---|---|---|---|
| `_id` | ObjectId | ✅ | |
| `stationId` | ObjectId | ✅ | → `SolarStationInfo._id` |
| `startTime` | date (UTC) | ✅ | |
| `endTime` | date (UTC) | ✅ | must be after `startTime` (R8) |
| `totalSlots` | int | ✅ | places in this window, 1..station.batterySlots (R8) |
| `availableSlots` | int | ✅ | free places left; changed only by reservation create/cancel/move (R12) |
| `isActive` | bool | ✅ | operators can close a window |
| `createdAt`, `updatedAt` | date (UTC) | ✅ | |

```json
{
  "_id": { "$oid": "66f6a1c2e4b0a1b2c3d4e6a0" },
  "stationId": { "$oid": "66f6a1c2e4b0a1b2c3d4e5f1" },
  "startTime": { "$date": "2026-09-29T02:30:00Z" },
  "endTime":   { "$date": "2026-09-29T04:30:00Z" },
  "totalSlots": 4, "availableSlots": 3, "isActive": true,
  "createdAt": { "$date": "2026-09-27T10:00:00Z" }, "updatedAt": { "$date": "2026-09-27T10:00:00Z" }
}
```
(02:30 UTC = 08:00 Sri Lanka time.)

## 4. `EnergyReservations` — bookings

| Field | Type | Req | Notes |
|---|---|---|---|
| `_id` | ObjectId | ✅ | |
| `prosumerNic` | string | ✅ | → `Users._id` |
| `prosumerName` | string | ✅ | copy for display/search |
| `stationId` | ObjectId | ✅ | → `SolarStationInfo._id` |
| `stationName` | string | ✅ | copy for display/search |
| `slotId` | ObjectId | ✅ | → `EnergyBookingSlots._id` |
| `startTime` / `endTime` | date (UTC) | ✅ | copied from the slot; used for R9/R10 |
| `energyKwh` | double | ✅ | 0 < x ≤ 100 (R17) |
| `type` | string | ✅ | `Sell` (drop-off: prosumer stores energy in the grid battery) \| `Buy` (charging: prosumer draws energy) |
| `status` | string | ✅ | `Pending` \| `Approved` \| `Completed` \| `Cancelled` |
| `qrToken` | string | ➖ | random 32 hex chars, set on approval (R13), cleared if edited |
| `approvedBy`, `approvedAt` | string, date | ➖ | NIC of staff who approved |
| `completedBy`, `completedAt` | string, date | ➖ | NIC of operator who scanned (R14) |
| `cancelledBy`, `cancelledAt` | string, date | ➖ | |
| `createdAt`, `updatedAt` | date (UTC) | ✅ | |

```json
{
  "_id": { "$oid": "66f6a1c2e4b0a1b2c3d4e7b3" },
  "prosumerNic": "199712345678", "prosumerName": "Nimal Perera",
  "stationId": { "$oid": "66f6a1c2e4b0a1b2c3d4e5f1" }, "stationName": "Malabe Solar Hub",
  "slotId": { "$oid": "66f6a1c2e4b0a1b2c3d4e6a0" },
  "startTime": { "$date": "2026-09-29T02:30:00Z" }, "endTime": { "$date": "2026-09-29T04:30:00Z" },
  "energyKwh": 12.5, "type": "Sell",
  "status": "Approved",
  "qrToken": "9f1c2b7e4a5d4c3b8e2f1a0b9c8d7e6f",
  "approvedBy": "199845678912", "approvedAt": { "$date": "2026-09-27T11:00:00Z" },
  "completedBy": null, "completedAt": null, "cancelledBy": null, "cancelledAt": null,
  "createdAt": { "$date": "2026-09-27T10:30:00Z" }, "updatedAt": { "$date": "2026-09-27T11:00:00Z" }
}
```

---

## 5. Sample data (seeded automatically)
`DataSeeder` runs on API start **only if `Users` is empty** (so it never overwrites real data). The rubric wants sample data "added manually or through the application" — this is "through the application", and more gets added live during the demo.

### Test accounts (all fictional)
| Role | NIC | Password | Name | Status |
|---|---|---|---|---|
| Backoffice | `200012345678` | `Admin@123` | Dilani Fernando | Active |
| GridOperator | `199845678912` | `Operator@123` | Kasun Silva | Active |
| Prosumer | `199712345678` | `Prosumer@123` | Nimal Perera | Active |
| Prosumer | `200156789123` | `Prosumer@123` | Ayesha Jayasinghe | Active |
| Prosumer | `200198765432` | `Prosumer@123` | Tharindu Wickramasinghe | **Pending** (shows in Pending Activations) |
| Prosumer | `981234567V` | `Prosumer@123` | Sanduni Rathnayake | **Deactivated** (shows reactivation) |

### Stations (around SLIIT Malabe so the map looks right)
| Name | Lat, Lng | capacityKw | batterySlots | Active |
|---|---|---|---|---|
| Malabe Solar Hub | 6.9147, 79.9730 | 250 | 10 | ✅ |
| Kaduwela Grid Node | 6.9335, 79.9840 | 180 | 8 | ✅ |
| Battaramulla Microgrid | 6.9020, 79.9180 | 300 | 12 | ✅ |
| Kottawa Sun Park | 6.8410, 79.9650 | 150 | 6 | ✅ |
| Nugegoda Rooftop Node | 6.8649, 79.8997 | 90 | 4 | ❌ (shows deactivated state) |

### Slots
For every active station: **next 7 days × 3 windows** (08:00–10:00, 11:00–13:00, 14:00–16:00 Sri Lanka time), `totalSlots = 4`. Plus one **past** slot (2 days ago) so history has data.

### Reservations
Nimal: 1 **Approved** (tomorrow 11:00, has QR), 1 **Pending** (in 3 days), 1 **Completed** (past slot), 1 **Cancelled**. Ayesha: 1 **Pending** (in 2 days). Slot `availableSlots` values must match these bookings.

> **Before the viva:** seeded dates are relative to when seeding ran. Re-seed the day before: in Compass drop `SunShareDb` → recycle the IIS app pool (or restart the API) → seeder runs again. (Steps in `08-SETUP-AND-HOSTING.md`.)

## 6. Indexes (small, optional but nice)
- `EnergyBookingSlots`: `{ stationId: 1, startTime: 1 }`
- `EnergyReservations`: `{ prosumerNic: 1 }`, `{ status: 1, startTime: 1 }`

Created once at startup in `MongoDbContext` (`CreateOne` is safe to call repeatedly).
