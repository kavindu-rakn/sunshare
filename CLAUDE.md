# CLAUDE.md — SunShare (SE4040 EAD Assignment 1)

## What this is
**SunShare** — a Smart Solar Microgrid Trading System for the SLIIT SE4040 group assignment.
- **SunShare.Api** — C# ASP.NET Core Web API (.NET 10), hosted on **IIS**, data in **MongoDB**. Holds **all** business logic (FAT service).
- **web/** — React (Vite, JavaScript) + **Bootstrap 5** for Backoffice + Grid Operator. UI only.
- **android/** — **pure native Android, Java + XML**, SQLite, Retrofit, Google Maps, ZXing. For Prosumers + Grid Operators. UI only.
- **Deadline: Wed 30 Sep 2026, 11:59 PM.** Then a viva where each member must explain their code.

## Who you work for
**Kvn (Ranathunga R A K N, IT22552860)** — group lead who does all commits. Strong in web + UI/UX, **no Android background**, will be examined on everything.
- Explain in **plain, simple words** (caveman-simple is fine): **what** you did, **why**, and **how** it works. Explain any jargon before using it.
- If Kvn must do something by hand (install, click in IIS/Android Studio/Google Cloud, paste a key), say so **clearly at the END of your reply** under **"👉 You need to do:"**.
- Prefer one clear recommendation over a menu of options.

## Read first (every session)
1. `docs/07-BUILD-PLAN.md` — find the phase Kvn asked for (or the first unticked one).
2. Only the docs that phase needs:
   | Doc | Use it for |
   |---|---|
   | `docs/00-ASSIGNMENT-BRIEF.md` | The brief + full rubric (source of truth: `../Assignment.pdf`) |
   | `docs/01-SPEC.md` | Roles, statuses, **business rules R1–R18**, dashboard definitions |
   | `docs/02-ARCHITECTURE.md` | Stack, allowed/banned packages, folders, auth, errors, ports, SQLite tables |
   | `docs/03-DATABASE.md` | The 4 collections, fields, seed data, test accounts |
   | `docs/04-API.md` | Every endpoint, DTO shape, role, rule |
   | `docs/05-SCREENS.md` | Every web page + Android screen, design tokens, screenshot names |
   | `docs/06-CONVENTIONS.md` | **Mandatory comments**, naming, commit format |
   | `docs/08-SETUP-AND-HOSTING.md` | Tools, IIS hosting, Maps key, phone networking, troubleshooting |
   | `docs/09-TEAM.md` | Part owners → file header `Author` + `Co-authored-by` trailer |
   | `docs/10-RUBRIC-CHECKLIST.md` | Rubric line → where → how to prove it |
   | `docs/11-DECISIONS.md` · `12-CHALLENGES.md` · `13-REFERENCES.md` | Logs for the report |
   | `docs/group-pack/` | One viva sheet per member — keep updated |

## Golden rules (never break these)
1. **FAT service.** Every business rule lives in the API's **Services**. Web and Android only: show screens, check "field not empty", call the API, show the API's message. No rule maths in clients (use API fields like `canModify`). Clients never talk to MongoDB.
2. **Mandatory comments** (brief: missing = NOT MARKED): a **header block at the top of every `.cs` file** and a **`//` comment directly above every method**. Do the same for `.java`, `.js`, `.jsx`. Templates in `docs/06-CONVENTIONS.md`. Header `Author` = the Part owner.
3. **Rule tags:** write `// RULE Rx: ...` where each rule from `01-SPEC.md` is enforced. Plain `if` checks with human-friendly messages.
4. **Reference borrowed code** with `// Reference: <title> <url>` and add it to `13-REFERENCES.md`.
5. **Use the exact names** in the docs: collections `Users`, `SolarStationInfo`, `EnergyBookingSlots`, `EnergyReservations`; endpoints, DTO fields, statuses, screen names. If a doc is wrong or unclear, **ask Kvn, then fix the doc** — don't silently invent.
6. **Keep it explainable.** Simple code a student can explain line by line. Short methods. Only the **allowed packages** in `02-ARCHITECTURE.md`; everything in the **banned** list stays out (no TypeScript, Axios, react-bootstrap, Tailwind, AutoMapper, MediatR, repositories, EF, Kotlin, Compose, Room, DI frameworks, cross-platform frameworks).
7. **No scope creep.** Build only what `01-SPEC.md`, `04-API.md` and `05-SCREENS.md` list. Out-of-scope list is in `01-SPEC.md §7`.
8. **Test before you commit**: it builds, and the phase's "Done when" checks pass (Swagger / browser / emulator). Say honestly what you could and couldn't test.
9. **Commit after every increment** (one feature slice = one commit). Format: subject line, blank line, **hyphen bullets**. Add `Co-authored-by: <owner> <email>` when the work belongs to Part A, C or D (see `09-TEAM.md`). **Do NOT add any AI/Claude co-author or "Generated with" line.** Never commit secrets (`local.properties`, API keys) or build output.
   **Branch + PR per phase — never commit on `main`.** Start a phase with `git switch main; git pull; git switch -c phase-N-short-name`. When it's done: push the branch, `gh pr create --base main` (title `Phase N — <name>`), and give Kvn the link. Merge **only after Kvn says so** (`gh pr merge <n> --merge --delete-branch`) — a **merge commit**, never squash/rebase, so every commit and its `Co-authored-by` survive. The no-AI-line rule applies to PR text too.
10. **Log as you go:** real problems → `12-CHALLENGES.md`; any decision change → `11-DECISIONS.md`.
11. **Don't touch** `../Assignment.pdf` / `../Assignment.docx`.

## When a phase is finished
1. Tick its boxes in `docs/07-BUILD-PLAN.md`.
2. Update the owner's sheet in `docs/group-pack/` → "Files" and "How it works" (plain words).
3. Push the phase branch and open its PR (golden rule 9); wait for Kvn's OK before merging.
4. Tell Kvn in chat (short), including the **PR link**: **What** was built · **Why** this way · **How** a request flows · **1 likely viva question + answer** · then **"👉 You need to do:"** (or "nothing").

## Environment
- Windows 11, PowerShell. Repo root: `C:\Users\User\Documents\EAD\sunshare`.
- Visual Studio 2026 + **.NET 10 SDK**, Node.js, Android Studio (JDK bundled), MongoDB Community (Windows service `MongoDB`, `mongodb://localhost:27017`, db `SunShareDb`), IIS + ASP.NET Core Hosting Bundle 10.

## Commands
| Task | Command |
|---|---|
| Run API (dev) | `dotnet run --project api/SunShare.Api` → http://localhost:5080/swagger |
| Build API | `dotnet build api/SunShare.Api` |
| Deploy API to IIS | `scripts/deploy-api.ps1` (created in Phase 6, run in an **admin** terminal) → http://localhost:8080 |
| Run web (dev) | `cd web; npm run dev` → http://localhost:5173 |
| Build web | `cd web; npm run build` → copy `dist/` to `C:\inetpub\sunshare\web` (IIS :8081) |
| Build Android | `cd android; .\gradlew assembleDebug` (or Run ▶ in Android Studio) |

## Addresses
API dev `:5080` · API on IIS `:8080` · Web dev `:5173` · Web on IIS `:8081` · Emulator → `http://10.0.2.2:8080/` · Phone → `http://<laptop-LAN-IP>:8080/` (editable on the Android Login screen ⚙).

## Test accounts (seeded)
| Role | NIC | Password |
|---|---|---|
| Backoffice | `200012345678` | `Admin@123` |
| GridOperator | `199845678912` | `Operator@123` |
| Prosumer (Active) | `199712345678` | `Prosumer@123` |
| Prosumer (Pending) | `200198765432` | `Prosumer@123` |
| Prosumer (Deactivated) | `981234567V` | `Prosumer@123` |

## Part owners (for headers + trailers)
| Part | Owner | Covers |
|---|---|---|
| A | Gimhan T P K | Accounts & access (auth, users, prosumers, activations, mobile login/register/profile) |
| B | Ranathunga R A K N | Stations, slots, map + shared foundation, hosting, web/Android shells, report |
| C | Malkith G W L | Reservation create/update/cancel/approve, 7-day/12-hour rules, summary page |
| D | Chamara R M L K | Booking lists/filters, dashboards, QR display, operator scan/verify/finalize |
