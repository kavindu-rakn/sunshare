# 09 — Team, Ownership & Contributions

## Members and Parts

| Part | Feature area | Owner | IT number | Email for `Co-authored-by` |
|---|---|---|---|---|
| **A** | Accounts & Access | **Gimhan T P K** | IT________ | ________ (ask Gimhan for the email on his GitHub account) |
| **B** | Nodes, Slots & Map + shared foundation, hosting, integration | **Ranathunga R A K N** (Kvn) — group lead | **IT22552860** | — (Kvn commits as himself; no trailer) |
| **C** | Reservations | **Malkith G W L** | IT________ | ________ |
| **D** | Dashboards & QR | **Chamara R M L K** | IT________ | ________ |

> **TODO (Kvn):** fill in the three IT numbers and GitHub emails. GitHub only credits a co-author if the email matches one on their GitHub account (their `...@users.noreply.github.com` address also works). Until then Claude Code uses the placeholder and Kvn can amend before pushing.

Trailer format (last lines of the commit message):
```
Co-authored-by: Gimhan T P K <email>
```

## What each Part covers (and the rubric lines it answers)

| Part | Features | Rules | Table 2 rubric lines |
|---|---|---|---|
| **A — Gimhan** | Web login + role redirect; web users (Backoffice/Grid Operator); prosumer management; **Pending Activations** page; mobile login with role-based home, register, edit profile, deactivate; session saved in SQLite | R1–R5, R16 | Web: Login & role-based access (4), User Management (4) · Mobile Auth & Account Mgmt (9) · SQLite login persistence (part of 3) |
| **B — Kvn** | Stations create/update/deactivate/delete; slot schedules; nearby-stations API; **Google Map** with station details; stations cached in SQLite; shared foundation (Mongo, JWT, errors, seeding), IIS hosting, web shell + Home page, Android shell | R6–R8, R18 | Web: Microgrid Node Management (5) · Nearby stations on map (5) · Google Maps (3) · SQLite reference data (part of 3) · IIS hosting & MongoDB connection (Table 1) |
| **C — Malkith** | Reservation create / update / cancel (web + mobile), approve (web), 7-day & 12-hour rules, slot availability counter, **summary page after each action** | R9–R13, R15, R17 | Web: Slot Booking Management (5) · Reservation Workflow & Booking Mgmt (9) |
| **D — Chamara** | Reservation lists (current / pending / history) + **search filter**; web dashboard + mobile dashboards (**pending**, **approved future count**); QR shown on mobile; operator **scan → verify → finalize** | R14 + dashboard definitions | Booking Views & Dashboards (10) · Read QR & mark job done (2) · QR scanning (2) |
| **Everyone** | Web→API and Mobile→API integration (shared clients), UI consistency, report sections | — | Web→API (2), Mobile→API (2), Table 1 (group) |

**Remember:** Table 2 marks are **per student** and the viva asks each person about **their own work and decisions**. Every member must also know the basics of the whole system (see `group-pack/00-INDEX.md`).

## Individual contribution section (report template — one per member)
1. **Part & responsibilities** — the row above in your own words.
2. **What I built** — features, API endpoints, web pages, Android screens (from your group-pack sheet).
3. **Files** — list from your group-pack sheet.
4. **Commits** — link: `https://github.com/<user>/sunshare/commits?author=...` or a list of commit subjects.
5. **AI tools used + short reflection** (required by the brief; no marks for it, but asked at the viva): which tools (e.g. Claude Code, ChatGPT/Codex, Gemini/Antigravity), what they were used for, what **you** checked, changed or rejected, and what you learned. **It must be true for you personally.**

## Honesty note
Commits and co-author trailers count as **evidence** of who did what. The brief says anyone who can't explain or modify "their" code, diagram or document can get reduced or **zero** individual marks. So each owner must actually study their Part before the viva (use their group-pack sheet), and ideally make at least one change themselves.
