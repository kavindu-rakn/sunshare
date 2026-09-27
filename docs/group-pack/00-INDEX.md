# SunShare Group Pack — start here

**Who this is for:** all 4 members. Read this page first (15 min), then **your own Part sheet** (30–45 min). Each sheet ends with viva questions: cover the answers and try to say them out loud.

| Part | Sheet | Owner |
|---|---|---|
| A — Accounts & Access | [`PART-A-Gimhan.md`](PART-A-Gimhan.md) | Gimhan T P K |
| B — Nodes, Slots & Map (+ foundation & hosting) | [`PART-B-Ranathunga.md`](PART-B-Ranathunga.md) | Ranathunga R A K N |
| C — Reservations | [`PART-C-Malkith.md`](PART-C-Malkith.md) | Malkith G W L |
| D — Dashboards & QR | [`PART-D-Chamara.md`](PART-D-Chamara.md) | Chamara R M L K |

---

## 1. The problem (why this system exists)
Houses with solar panels often make more power than they use in the middle of the day, and need power at night. A **microgrid station** is a local solar hub with batteries. **SunShare** lets those homeowners (**prosumers**) **book a time slot** at a station to either **drop off** (sell) spare energy into the station's battery or **charge** (buy) from it. Staff need tools to run the stations, and the station operator needs a safe way to confirm "yes, this booking is real" on the spot — that's the **QR code**.

## 2. The system in 60 seconds
- **One server app (the API)** written in C#, running on **IIS** (the web server built into Windows). It stores everything in **MongoDB** and holds **every business rule**. This is called a **FAT service**: the brain is fat, the apps are thin.
- **Web app** (React + Bootstrap 5) for **Backoffice** (admins) and **Grid Operators** (station staff).
- **Android app** (Java) for **Prosumers** and **Grid Operators**. It keeps a small **SQLite** database on the phone for the saved login, a copy of the station list, and the server address.
- The apps talk to the API with **REST calls**: HTTP requests like `GET /api/stations` that send and receive **JSON** (text data like `{ "name": "Malabe Solar Hub" }`).

```
 Android (Java + SQLite) ──┐
                           ├──► SunShare API (C#, IIS) ──► MongoDB
 Web (React + Bootstrap) ──┘       all rules live here
```

## 3. Words to know (plain meanings)
| Word | Meaning |
|---|---|
| **API** | A program that other programs call to get or change data. Ours is at `http://<laptop>:8080/api/...` |
| **REST / endpoint** | A style of API: each URL + method is one action, e.g. `POST /api/reservations` = "create a reservation". Each such URL is an **endpoint** |
| **JSON** | The text format the apps and the API use to send data |
| **IIS** | Internet Information Services — Windows' own web server. It runs our API on port 8080 and the web app on 8081 |
| **MongoDB / collection / document** | A NoSQL database. A **collection** is like a table, a **document** is like a row, stored as JSON-like data |
| **FAT service** | All business logic sits in the API; clients only show screens and call the API |
| **Controller** | C# class that receives HTTP requests for one resource (e.g. `StationsController`) and passes the work to a Service |
| **Service** | C# class with the business rules (e.g. `ReservationService` checks the 12-hour rule) |
| **DTO** | "Data transfer object" — a small class describing the JSON coming in or going out |
| **JWT** | "JSON Web Token" — a signed login ticket. After login the app sends it with every request; the API reads the NIC and role from it |
| **BCrypt** | A way to scramble passwords so they're never stored as plain text |
| **SQLite** | A tiny database stored as a file on the phone |
| **Retrofit** | Android library that turns a Java interface into HTTP calls |
| **Swagger** | A web page (`/swagger`) that lists every endpoint and lets you test them by clicking |
| **CORS** | A browser safety rule: the API must allow the web app's address before the browser lets it call the API |
| **NIC** | Sri Lankan National Identity Card number — our primary key for users |

## 4. The 4 collections (everyone should know these)
`Users` (everyone, `_id` = NIC) · `SolarStationInfo` (stations) · `EnergyBookingSlots` (time windows at a station) · `EnergyReservations` (bookings). A reservation stores the ids of its prosumer, station and slot.

## 5. The booking life story (everyone should be able to tell it)
1. Prosumer **registers** on the phone → status **Pending**.
2. Backoffice **activates** them on the web (**Pending Activations** page).
3. Prosumer opens the **map**, sees nearby stations, then **books** a slot ≤ 7 days ahead → reservation **Pending**; the slot has one fewer free place.
4. A Grid Operator **approves** it on the web → **Approved** + a secret **QR token** is created.
5. Prosumer opens the booking → the phone shows the **QR code**.
6. At the station the operator **scans** the QR with the app → the API **verifies** it → operator taps **Finalize** → **Completed**.
7. Changes or cancellations need **≥ 12 hours' notice**; after each action the app shows a **summary page**.

## 6. Questions ANY member can be asked
1. **What is a FAT service and how did you follow it?** — All rules are in the API's Services (e.g. `ReservationService`). The web and Android apps only call the API and show its messages. Even the 12-hour check for showing Edit buttons comes from the API (`canModify`).
2. **Why MongoDB and not SQL?** — The brief requires a NoSQL database. Documents map directly to our C# classes and JSON, so no ORM is needed.
3. **How do the web and mobile apps talk to the server?** — REST calls over HTTP with JSON bodies and a JWT in the `Authorization` header.
4. **Where is the API hosted?** — IIS on the laptop, port 8080, using the ASP.NET Core Hosting Bundle.
5. **What does the Android app store in SQLite?** — Saved login (NIC, name, role, token), a cache of stations, and the server address.
6. **Why pure native Android?** — The brief forbids cross-platform frameworks. We used Java with XML layouts.
7. **What was your part, and show me one file you wrote.** — Use your sheet's "Files" list.
8. **How did you use AI, and how do you know the code is right?** — Answer honestly for yourself: which tool, what for, and what you checked (e.g. tested each rule in Swagger, read the service code, changed X).
9. **What would you improve with more time?** — HTTPS, password reset, push notifications, automated tests, real energy metering.
10. **Show a business rule in code.** — Search the API for `RULE R10` → `ReservationService`.

## 7. Video script (≤ 5:00, recorded by Kvn — each part's segment follows that member's demo script)
| Time | Segment | Shows |
|---|---|---|
| 0:00–0:20 | Intro | SunShare name, the problem (§1), architecture diagram |
| 0:20–0:40 | Hosting | IIS Manager with both sites, `/api/health` connected, Compass collections |
| 0:40–1:30 | **Part A** | Phone register → web Pending Activations → Activate → phone login lands on Prosumer home · web login as Backoffice vs Grid Operator menus |
| 1:30–2:10 | **Part B** | Web: create station + slots, deactivate blocked message · Phone: nearby map, tap marker for details |
| 2:10–3:10 | **Part C** | Phone: book → summary · edit → summary · cancel < 12 h → error · Web: approve |
| 3:10–4:30 | **Part D** | Phone: dashboard counts, bookings tabs + search, QR · Phone (operator) scans emulator QR → verified → finalize → summary · Web dashboard counts update |
| 4:30–5:00 | Wrap | Kill & reopen app (still logged in = SQLite), tech summary, thanks |
