# 11 — Design & Development Decisions (log)

The brief asks us to **document design and development decisions** in the report, and the viva asks us to **justify** them. Add a row whenever something is decided or changed (newest at the bottom). Keep "Why" to one or two plain sentences.

| # | Date | Decision | Alternatives considered | Why |
|---|---|---|---|---|
| D1 | 2026-09-27 | Brand name **SunShare**, repo `sunshare` | HelioGrid, VoltSwap, solar-micro | Friendly and prosumer-focused: neighbours "sharing sunshine" |
| D2 | 2026-09-27 | API: **ASP.NET Core Web API on .NET 10 (LTS)**, controller style | .NET 8 (installed), minimal APIs | Brief requires C# Web API; .NET 10 is the current long-term-support version; controllers map cleanly to "one controller per resource" and are easy to explain |
| D3 | 2026-09-27 | Layers: **Controller → Service → MongoDbContext** (no repository layer) | Repository + Unit of Work | Services hold all business rules (FAT service); an extra repository layer adds files without adding understanding |
| D4 | 2026-09-27 | **MongoDB Community on the laptop** | MongoDB Atlas (cloud) | Demo/viva works without internet; campus Wi-Fi may block Atlas |
| D5 | 2026-09-27 | 4 collections named exactly like the rubric; **NIC as `_id`** for all users with a `role` field | Separate Prosumers collection | Rubric lists exactly four collections; brief makes NIC the primary key |
| D6 | 2026-09-27 | **JWT** login tokens + **BCrypt** password hashes | Sessions/cookies, plain passwords | Stateless tokens work the same for web and Android; never store plain passwords |
| D7 | 2026-09-27 | Web: **React (Vite) + JavaScript + Bootstrap 5**, HashRouter, `fetch` | React + Tailwind, Razor Pages, plain HTML | React is named in the brief and familiar; Bootstrap gives admin tables/forms fast and is marked in the rubric; HashRouter needs no IIS rewrite module |
| D8 | 2026-09-27 | Android: **Java + XML views**, minSdk 26 | Kotlin, Jetpack Compose | Java is closest to C#, so one coding style to explain; XML views are unmistakably "pure native" |
| D9 | 2026-09-27 | Android HTTP: **Retrofit + Gson** | Volley, HttpURLConnection | Industry standard, one line per endpoint, still native Android |
| D10 | 2026-09-27 | SQLite via **SQLiteOpenHelper** (no Room): tables `session`, `stations_cache`, `app_settings` | Room | Most literal match to "SQLite"; stores login details + reference data as the rubric asks |
| D11 | 2026-09-27 | **Reservations need staff approval** (Pending → Approved) before a QR exists | Auto-approve | Gives real "pending" data for the dashboards the rubric marks, and matches "once approved, the app generates a QR" |
| D12 | 2026-09-27 | QR contains `SUNSHARE|<reservationId>|<randomToken>`; token lives on the server | Signed JWT inside the QR | Simple and secure enough: nobody can fake a QR without the random token; easy to explain |
| D13 | 2026-09-27 | **"Nearby" distance is calculated in the API** (Haversine) | Calculate on the phone | FAT service: even this logic stays on the server; the phone only plots results |
| D14 | 2026-09-27 | API computes **`canModify`** for each reservation | Clients check the 12-hour rule themselves | Keeps the 12-hour rule in one place (API); clients just hide/show buttons |
| D15 | 2026-09-27 | Demo on **HTTP over LAN**; Android server address editable at runtime | HTTPS with a certificate; hard-coded IP | Certificates on IIS + Android add setup risk; editable address avoids rebuilding at the viva when the IP changes |
| D16 | 2026-09-27 | Work split **by feature** (Parts A–D), each end-to-end (API + web + mobile) | Split by layer | Matches how individual marks are given; each member explains one complete story |
| D17 | 2026-09-27 | AI coding assistants used (Claude Code, possibly Codex/Antigravity) under strict docs (`CLAUDE.md`), with rule tags and mandatory comments | No AI / unguided AI | Speed under a 3.5-day deadline while keeping code simple and explainable; disclosed in the report as the brief requires |
