# 00 — Assignment Brief (clean copy)

> Source: `Assignment.pdf` / `Assignment.docx` in the parent `EAD` folder (SE4040, Year 4 Sem 2, 2026, Assignment 1).
> This is a cleaned text copy so AI agents read the same thing. **If anything here conflicts with the PDF, the PDF wins.**
> Garbled characters in the PDF were decoded: `G` = 9 (e.g. "8–G" = 8–9), `C5` = 65, `11.5GPM` = 11:59 PM, "Reservation s QR" / "Dashboard s Maps" = "&".

## Key facts

| Item | Value |
|---|---|
| Module | SE4040 Enterprise Application Development |
| Title | Smart Solar Microgrid Trading System – Client-Server Application (Web, Mobile and Web Service) |
| Mode | Group of 4 |
| Marks | 100 = Group 35 (same for all) + Individual 65 (per student) |
| Weight | 20% of module (report 5% + code/demo/viva 15%) |
| Deadline | **Wed 30 September 2026, 11:59 PM** — late submissions not accepted |
| Submit | ONE zip: all project folders + detailed report + screenshot of the app's main opening screen. Zip name includes IT number → **`IT22552860.zip`** |
| Viva | Supervised, after submission. **Absent = not marked.** Date given ≥ 1 week before. |

## Project specification

End-to-end Smart Solar Microgrid Trading System, client-server architecture:
a **web app** for back-office admins and microgrid site operators, and a **mobile app** for solar prosumers (property owners with solar panels).

### a) Web application
- **User Management:** create web users with two roles: **Backoffice** and **Grid Operator**. Only Backoffice can use system administration functions; Grid Operators use operational tools.
- **Prosumer Management:** create, update, deactivate prosumer profiles using **NIC as the primary key**. Deactivated accounts can only be reactivated by a Backoffice officer.
- **Microgrid Node Management:** manage solar grid hubs — create hubs with GPS location, capacity specs (kW/h), available battery storage slots. Update schedules and deactivate nodes (**deactivation blocked if active energy reservations exist**).
- **Energy Slot Reservation Management:** create, update, cancel power-trading reservations (**must be within 7 days; updates and cancellations need at least 12 hours' notice**).
- **UI:** Bootstrap 5, Tailwind CSS or React.js, responsive.

### b) Mobile application — pure Android with SQLite (no frameworks)
- For both **Solar Prosumers** and **Grid Operators**.
- **Native:** pure native Android, local SQLite DB for local user management. No cross-platform frameworks.
- **Prosumer Account Control:** register with NIC as primary key, edit profile, request account deactivation.
- **Reservation & QR Dispatch:** reserve, modify, cancel energy drop-off/charging slots. Once approved, the app generates a secure transaction QR code.
- **Dashboard & Maps:** show active/pending reservation counts, bookings, and nearby grid nodes via **Google Maps API**. Also: booking history, pending bookings, search bookings.
- **Operator Mode:** Grid Operators log in on mobile, scan the prosumer's QR, verify with server data, finalize the energy transfer.

### c) Web service
- **FAT service:** ALL business logic lives in the central API.
- **Stack:** **C# Web API deployed on Windows IIS** with a NoSQL DB (MongoDB).
- **Clients:** web + Android are UI only (SQLite local persistence on Android) and talk to the API **only via REST**.

High-level diagram in the brief: Android phone (with SQLite) ⇄ SERVICE ⇄ MongoDB, and Web browser ⇄ SERVICE.

### Scenario
Backoffice registers microgrid nodes and maintains their operating schedules. Grid operators (web + mobile) update battery slot availability and monitor bookings. Prosumers use mobile to reserve slots, modify them and view their energy transfer history. After a booking is confirmed the prosumer sees it on their dashboard. Cancellations can be done via the mobile app or with a grid operator's help.

## What to hand in
1. **Zip** (`IT22552860.zip`): all project directories/files + detailed report + screenshot of the main opening screen.
   **Code without these is NOT marked:**
   - a **comment header block on each `.cs` file**
   - **inline comments at the beginning of each method**
   - **unique screenshots** of the application
2. **Report** containing: screenshots of all UIs; high-level diagram, use case diagram, DFD; database design; **source code as text (not screenshots)**; all references; Git repository link; individual contribution; challenges.
3. **README** containing: Git repo link (individual contributions clearly mentioned); link to a **≤ 5 minute video** (YouTube or OneDrive) explaining how the app works.

## Rules
- Code not written by you (e.g. from a tutorial) must be **referenced in a code comment** — otherwise treated as plagiarism.
- Plagiarism → zero + escalation.
- **AI use (CLEAR framework):** AI output must be critically evaluated and refined by you. Work must reflect your own understanding. Develop under **GitHub with meaningful, descriptive commits**, document design/development decisions in the report. In the individual contribution section, **disclose AI tools used + a short reflection**. At the viva you'll be asked about your work, decisions and AI use. **Any code, diagram or document you cannot explain or modify may get reduced or zero individual marks.**

## Marking scheme

### Table 1 — Group (35 marks, same for every member)

| Criterion | Sub-marks | Excellent looks like |
|---|---|---|
| Service Architecture & API Design (8) | Hosting Web API on IIS 4 · MongoDB connection 4 | C# Web API hosted on IIS, reachable by both clients; stable MongoDB connection used by all endpoints; FAT service — all business logic in the API |
| Database Design & Data Modelling (4) | User's detail 1 · SolarStationInfo 1 · EnergyBookingSlots 1 · Energy Reservation 1 | All 4 collections with every required field; sample data added; references between collections consistent |
| Client Build & Architecture Compliance (12) | Pure native Android with SQLite 6 · Web app as UI layer 6 | No cross-platform framework; SQLite for local persistence; web app purely UI; both connect reliably and handle responses/errors gracefully |
| UI & UX Design (6) | Mobile UIs 2 · Web UIs with Tailwind/Bootstrap 5 2 · Home (index) page 1 · Completeness of all pages 1 | Polished, consistent, responsive; framework used throughout; home page well designed; every page works |
| Documentation & Deployment (5) | UI screenshots 1 · High-level/use case/DFD 1 · References 1 · Individual contribution 1 · Challenges 1 | All screenshots unique; diagrams accurate & labelled; references complete & consistent; every member's contribution clear; genuine challenges reflection; source code as text; reproducible hosting steps |

### Table 2 — Individual (65 marks, per student)

| Criterion | Sub-marks | Excellent looks like |
|---|---|---|
| Web App Features & Business Rules (18) | Login & role-based access 4 · User Management 4 · Microgrid Node Management 5 · Slot Booking Management 5 | All via Web API. Login verifies user type and redirects. Backoffice & Grid Operator users created. Stations and their slots created, updated, deleted. Reservations created/updated/cancelled with **7-day and 12-hour rules enforced** |
| Mobile Auth & Account Management (9) | Login with role-based home 2 · Pending activation view in web app 2 · Create account in mobile 3 · Modify own account 1 · Deactivate account 1 | Login routes each role to the correct home. Prosumers register with NIC as PK, edit profile, request deactivation. **Pending activations visible and actionable in the web app** |
| Reservation Workflow & Booking Mgmt (9) | Create 3 · Update 2 · Cancel 2 · **Summary page after each action** 2 | Create/update/cancel from mobile, 12-hour rule on update/cancel, summary page after each action |
| Booking Views & Operational Dashboards (10) | Current/pending bookings 2 · Booking history 2 · Filter criteria 2 · Pending reservations 2 · Count of approved future reservations 2 | Current + pending bookings, full history, working search filter, dashboard with pending reservations and count of approved future reservations — **all read live from the API** |
| Grid Operator Verification & Map (7) | Read QR & mark job done 2 · Nearby stations on map 5 | Operator scans QR, verifies with server, finalises job. Nearby nodes plotted from stored lat/long, **station details on selection** |
| Service Integration, Local Persistence & Device (12) | Web→API 2 · Mobile→API 2 · SQLite 3 · Google Maps 3 · QR scanning 2 | Both clients call the hosted API for every operation, **no direct DB access** from clients. **Login details and reference data persist in SQLite.** Google Maps integrated; QR scanned and verified against server |
