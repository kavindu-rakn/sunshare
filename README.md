# ☀️ SunShare — Smart Solar Microgrid Trading System

*Trade your sunshine.* SE4040 Enterprise Application Development — Assignment 1 (Year 4, Semester 2, 2026), SLIIT.

A client-server system where **prosumers** (homes with solar panels) book energy drop-off/charging slots at microgrid **stations**, and **Backoffice** and **Grid Operator** staff manage stations, slots, accounts and bookings.

- 🔗 **Git repository:** _TODO: https://github.com/<user>/sunshare_
- 🎬 **Video walkthrough (≤ 5 min):** _TODO: YouTube / OneDrive link_

## Architecture
| Part | Tech |
|---|---|
| Web service (all business logic) | C# ASP.NET Core Web API (.NET 10) on **IIS**, **MongoDB** |
| Web app (Backoffice, Grid Operator) | React (Vite) + **Bootstrap 5** |
| Mobile app (Prosumer, Grid Operator) | **Pure native Android (Java)** + **SQLite**, Retrofit, Google Maps, ZXing QR |

Both clients talk to the API only through REST calls. Details: [`docs/02-ARCHITECTURE.md`](docs/02-ARCHITECTURE.md).

## Team & individual contributions
| Member | IT number | Part | Contribution |
|---|---|---|---|
| Ranathunga R A K N | IT22552860 | B — Nodes, Slots & Map | Solar station & slot management (API + web), nearby-stations Google Map with SQLite cache (Android), shared API foundation, IIS hosting, web & Android app shells, Home page, report |
| Gimhan T P K | IT________ | A — Accounts & Access | Login & role-based access (web + mobile), web user management, prosumer management, pending activations, mobile registration / profile / deactivation |
| Malkith G W L | IT________ | C — Reservations | Reservation create / update / cancel / approve with 7-day and 12-hour rules (API, web, mobile), summary page after each action |
| Chamara R M L K | IT________ | D — Dashboards & QR | Booking views (current / pending / history + search), web & mobile dashboards, QR generation, operator QR scan → verify → finalize |

Full breakdown: [`docs/09-TEAM.md`](docs/09-TEAM.md).

## Run it
See [`docs/08-SETUP-AND-HOSTING.md`](docs/08-SETUP-AND-HOSTING.md) for installing the tools, hosting on IIS and connecting the phone.

| What | Where |
|---|---|
| API + Swagger (IIS) | http://localhost:8080/swagger |
| Web app (IIS) | http://localhost:8081 |
| Android | open `android/` in Android Studio → Run. Set the server address on the Login screen ⚙ |

## Test accounts
| Role | NIC | Password |
|---|---|---|
| Backoffice | 200012345678 | Admin@123 |
| Grid Operator | 199845678912 | Operator@123 |
| Prosumer | 199712345678 | Prosumer@123 |
