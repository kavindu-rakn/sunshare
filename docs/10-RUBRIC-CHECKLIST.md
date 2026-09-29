# 10 — Rubric Checklist (tick only after testing on the IIS-hosted build)

> **Walked 29 Sep (Phase 19).** Web on IIS `:8081` (Backoffice, Grid Operator, Prosumer refused; every call to `:8080`), rules R6/R7/R9/R10 against the IIS API, every Android screen against the IIS API (emulator) in Phases 13–18, and the QR scan + map on Kvn's real phone. Still open: screenshots, diagrams, report, contributions, zip, video (Phases 20–21).

## 🚨 "Will not be marked" traps
- [x] Every `.cs` file starts with the header block (`06-CONVENTIONS.md §1`)
- [x] Every method has a `//` comment directly above it (`§2`)
- [x] Borrowed code has `// Reference:` comments + is listed in `13-REFERENCES.md`
- [ ] Screenshots are unique (one per screen/state, real data)
- [ ] Zip named `IT22552860.zip`, contains code + report + main-screen screenshots
- [ ] README has the Git link, contributions and the video link (≤ 5 min)

## Table 1 — Group (35)

| Rubric line | Marks | Where | How to prove it | ✓ |
|---|---|---|---|---|
| API hosted on IIS | 4 | IIS site SunShareApi :8080 | IIS Manager screenshot + phone browser hitting `/api/health` | [x] |
| MongoDB connection | 4 | `MongoDbContext`, `/api/health` | Health says connected; Compass shows live changes after a demo action | [x] |
| FAT service (all logic in API) | (in above) | Services/*, `RULE Rx` tags | Show a rule in `ReservationService`; show client just displays the API message | [x] |
| Users collection | 1 | `Users` | Compass screenshot | [x] |
| SolarStationInfo | 1 | `SolarStationInfo` | Compass screenshot | [x] |
| EnergyBookingSlots | 1 | `EnergyBookingSlots` | Compass screenshot | [x] |
| Energy Reservation | 1 | `EnergyReservations` | Compass screenshot; references (ids) consistent | [x] |
| Pure native Android + SQLite | 6 | `android/` Java + `SunShareDbHelper` | Show Java/XML, no frameworks; show `session`/`stations_cache` rows (Database Inspector) | [x] |
| Web app is a UI layer | 6 | `web/src/api/*` | Web only calls the API (no DB code); errors shown nicely | [x] |
| Mobile UIs | 2 | M1–M11 | Consistent brand, cards, toolbar | [x] |
| Web UIs with Bootstrap 5 | 2 | W1–W14 | Bootstrap classes everywhere, responsive | [x] |
| Home (index) page | 1 | W1 | Polished landing page | [x] |
| Completeness of all pages | 1 | all | Every page works, no placeholders | [x] |
| UI screenshots | 1 | report | All screens, unique | [ ] |
| High-level, use case, DFD | 1 | `diagrams/` | Accurate + labelled | [x] |
| References | 1 | `13-REFERENCES.md` | IEEE style, complete | [x] |
| Individual contribution | 1 | report | Each member distinct (`09-TEAM.md`) | [ ] |
| Challenges | 1 | `12-CHALLENGES.md` | Genuine reflection | [x] |

## Table 2 — Individual (65)

| Rubric line | Marks | Part | Screen / endpoint | Demo step | ✓ |
|---|---|---|---|---|---|
| Web login & role-based access | 4 | A | W2, `POST /auth/login` | Log in as BO → admin menu; as GO → operator menu; PR → refused | [x] |
| User management | 4 | A | W4–W5 | Create a Grid Operator, edit, deactivate | [x] |
| Microgrid node management | 5 | B | W9–W12 | Create station + slots; edit schedule; deactivate blocked (R6); delete | [x] |
| Slot booking management (web) | 5 | C | W13–W14 | Create for a prosumer; 8 days → error (R9); edit/cancel < 12 h → error (R10) | [x] |
| Mobile login with role-based home | 2 | A | M1 | PR → M3, GO → M10 | [x] |
| Pending activation view (web) | 2 | A | W8 | Register on phone → appears on W8 → Activate → can log in | [x] |
| Create account (mobile) | 3 | A | M2 | NIC as key; bad NIC rejected | [x] |
| Modify own account | 1 | A | M4 | Edit phone number → saved | [x] |
| Deactivate account | 1 | A | M4 | Deactivate → logged out → W8 shows for reactivation | [x] |
| Create booking (mobile) | 3 | C | M6 → M7 | Book → summary | [x] |
| Update booking | 2 | C | M9 → M6 → M7 | Change slot → summary; < 12 h → error | [x] |
| Cancel booking | 2 | C | M9 → M7 | Cancel → summary; < 12 h → error | [x] |
| Summary page after each action | 2 | C | M7 | Shown after create, update, cancel, complete | [x] |
| Current / pending bookings | 2 | D | M8 tabs | Tabs show live API data | [x] |
| Booking history | 2 | D | M8 History | Completed + Cancelled + past | [x] |
| Filter criteria | 2 | D | M8 search, W13 filter bar | Search "Malabe"; filter by status/date | [x] |
| Pending reservations (dashboard) | 2 | D | W3, M3 | Pending list/count | [x] |
| Count of approved future reservations | 2 | D | W3, M3, M10 | Count matches Compass | [x] |
| Read QR & mark job done | 2 | D | M10 → M11 → M7 | Scan emulator QR with phone → Completed | [x] |
| Nearby stations on map | 5 | B | M5 | Markers from stored lat/lng; tap → details; nearest first | [x] |
| Web app → Web API | 2 | all | `web/src/api` | Network tab shows calls to :8080 | [x] |
| Mobile app → Web API | 2 | all | `ApiService` | Everything via Retrofit to :8080 | [x] |
| SQLite local persistence | 3 | A + B | `SunShareDbHelper` | Kill app → reopen → still logged in; offline map from cache | [x] |
| Google Maps API integration | 3 | B | M5 | Real Google map with key | [x] |
| QR code scanning | 2 | D | M10 | ZXing scanner, verified by server | [x] |

## Submission checklist (Wed 30 Sep)
- [ ] Final IIS deploy of API + web; re-seeded data
- [ ] All screenshots taken (`05-SCREENS.md` names) + `MAIN-SCREEN-web.png`, `MAIN-SCREEN-mobile.png`
- [x] Diagrams exported
- [ ] Report generated and opened in Word; code pasted as text; page numbers/TOC updated
- [ ] Video recorded (≤ 5:00), uploaded, link in README + report
- [ ] GitHub repo pushed; visibility set so the lecturer can open it
- [ ] `IT22552860.zip` built without `node_modules`/`bin`/`obj`/`build`/`.gradle`; opened once to check
- [ ] Submitted before 11:59 PM (target 10 PM)
