# ☀️ SunShare — Smart Solar Microgrid Trading System

*Trade your sunshine.* SE4040 Enterprise Application Development — Assignment 1 (Year 4, Semester 2, 2026), SLIIT.

A client-server system where **prosumers** (homes with solar panels) book energy drop-off (**Sell**) or charging (**Buy**) slots at microgrid **stations**, and **Backoffice** and **Grid Operator** staff manage stations, slots, accounts and bookings. At the station, the Grid Operator scans the prosumer's QR code to confirm the energy transfer.

- 🔗 **Git repository:** https://github.com/kavindu-rakn/sunshare
- 🎬 **Video walkthrough (≤ 5 min):** _link added after recording_
- 📄 **Report:** [`report/SunShare-Report.docx`](report/SunShare-Report.docx) (PDF copy: `report/SunShare-Report.pdf`)
- 🖼️ **Main opening screens:** [`screenshots/web/MAIN-SCREEN-web.png`](screenshots/web/MAIN-SCREEN-web.png) · [`screenshots/mobile/MAIN-SCREEN-mobile.png`](screenshots/mobile/MAIN-SCREEN-mobile.png)

## Architecture
| Part | Tech |
|---|---|
| Web service (**all** business logic) | C# ASP.NET Core Web API (.NET 10) on **IIS**, **MongoDB** |
| Web app (Backoffice, Grid Operator) | React (Vite, JavaScript) + **Bootstrap 5** |
| Mobile app (Prosumer, Grid Operator) | **Pure native Android (Java + XML)** + **SQLite**, Retrofit, Google Maps (JavaScript API in a WebView), ZXing QR |

Both clients talk to the API only through REST calls; the business rules R1–R18 live in the API's Services (a "FAT" service). Details: [`docs/02-ARCHITECTURE.md`](docs/02-ARCHITECTURE.md) · diagrams: [`diagrams/`](diagrams/).

## Team & individual contributions
| Member | IT number | Part | Contribution |
|---|---|---|---|
| Ranathunga R A K N (group lead) | IT22552860 | B — Nodes, Slots & Map | Solar station & slot management (API + web), nearby-stations Google Map with SQLite cache (Android), shared API foundation, IIS hosting, web & Android app shells, Home page, diagrams, report |
| Gimhan T P K | IT22266996 | A — Accounts & Access | Login & role-based access (web + mobile), web user management, prosumer management, pending activations, mobile registration / profile / deactivation |
| Malkith G W L | IT22630834 | C — Reservations | Reservation create / update / cancel / approve with 7-day and 12-hour rules (API, web, mobile), summary page after each action |
| Chamara R M L K | IT22076816 | D — Dashboards & QR | Booking views (current / pending / history + search), web & mobile dashboards, QR generation, operator QR scan → verify → finalize |

Commits for Parts A, C and D carry a `Co-authored-by:` line for that member. Full breakdown: [`docs/09-TEAM.md`](docs/09-TEAM.md) · each member's viva sheet: [`docs/group-pack/`](docs/group-pack/).

## Run it
Needs: Windows with **IIS** + **ASP.NET Core Hosting Bundle 10**, **MongoDB Community Server** (service `MongoDB`), **.NET 10 SDK**, **Node.js**, **Android Studio**. Full steps and troubleshooting: [`docs/08-SETUP-AND-HOSTING.md`](docs/08-SETUP-AND-HOSTING.md).

**Hosted on IIS** (run in an **administrator** PowerShell from the repository folder; safe to repeat):
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-api.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-web.ps1
```

| What | Where |
|---|---|
| API + Swagger (IIS) | http://localhost:8080/swagger |
| Web app (IIS) | http://localhost:8081 |
| Android | open `android/` in Android Studio → Run ▶. On the Login screen tap ⚙ to set the server: emulator `http://10.0.2.2:8080/`, phone `http://<laptop-LAN-IP>:8080/` |

**For development** (no IIS): `dotnet run --project api/SunShare.Api` → http://localhost:5080/swagger, and `cd web; npm install; npm run dev` → http://localhost:5173.

The API creates the sample data (users, 5 stations, slots, bookings) the first time it starts with an empty `SunShareDb` database. The Android map needs a Google Maps key in `android/local.properties` (`MAPS_API_KEY=...`, never committed).

## Test accounts
| Role | NIC | Password |
|---|---|---|
| Backoffice | 200012345678 | Admin@123 |
| Grid Operator | 199845678912 | Operator@123 |
| Prosumer (Active) | 199712345678 | Prosumer@123 |
| Prosumer (Pending — waits for activation) | 200198765432 | Prosumer@123 |
| Prosumer (Deactivated) | 981234567V | Prosumer@123 |

## Folders
| Folder | What is inside |
|---|---|
| `api/` | ASP.NET Core Web API (Controllers → Services → MongoDB) |
| `web/` | React + Bootstrap 5 web app |
| `android/` | Native Android app (Java + XML) |
| `scripts/` | IIS deployment scripts |
| `docs/` | Specification, architecture, database, API, screens, decisions, challenges, references, team |
| `diagrams/` | PlantUML sources + PNGs (architecture, use case, DFD 0/1, database) |
| `screenshots/` | Every web page (W01–W14) and Android screen (M01–M11) |
| `report/` | Report generator (`npm run build`) and the generated report |
