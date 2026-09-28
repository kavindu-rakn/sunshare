# 06 — Coding Conventions (NON-NEGOTIABLE)

> The brief says: **code without a comment header block on each `.cs` file and inline comments at the beginning of each method will NOT be marked.** We apply the same style to Java and JS files too, so everything looks consistent and is easy to explain.

## 1. File header block — EVERY `.cs` file (also every `.java`, `.js`, `.jsx`)

**C# (`.cs`)** — mandatory, first thing in the file, before `using` lines:
```csharp
/*
 * ============================================================================
 *  File        : ReservationService.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : C - Reservations
 *  Author      : Malkith G W L (IT22630834)
 *  Created     : 2026-09-28
 *  Description : Business rules for creating, updating, cancelling and
 *                approving energy reservations (rules R9-R13, R15, R17).
 * ============================================================================
 */
```
- **Author** = the owner of that Part (see `09-TEAM.md`). Shared/foundation files → `Ranathunga R A K N (IT22552860)`.
- Also applies to `Program.cs` (it has no methods, but it still needs the header).

**Java (`.java`)** — same block, after the `package` line is also fine but put it **at the very top** for consistency.

**JavaScript/JSX** — same block using `/* ... */`.

**XML layouts** — optional short header: `<!-- File: activity_login.xml | Part A | Login screen layout -->`.

## 2. Method comments — EVERY method (C# mandatory, Java/JS too)

A `//` comment block **directly above every method**, including constructors, controller actions, private helpers, Android lifecycle methods (`onCreate`), React components and event handlers. Say **what** it does and, if it applies a rule, **which rule**.

```csharp
// Creates a new reservation for a prosumer.
// Checks R11 (active prosumer, active slot with a free place) and R9 (within 7 days),
// then lowers the slot's free places by one (R12). Returns the saved reservation.
public async Task<ReservationResponse> CreateAsync(CreateReservationRequest request, string callerNic, string callerRole)
{
    ...
}
```
```java
// Called when the screen opens: links the XML views, then loads the prosumer's counts from the API.
@Override
protected void onCreate(Bundle savedInstanceState) { ... }
```
```jsx
// Reservations page: shows the filter bar and the reservations table for staff users.
export default function Reservations() { ... }
```

## 3. Rule tags inside code
Where a business rule is enforced, add a tag so anyone can find it with search:
```csharp
// RULE R10: updates/cancellations need at least 12 hours' notice.
if (reservation.StartTime - DateTime.UtcNow < TimeSpan.FromHours(12))
    throw new ApiException(400, "Changes need at least 12 hours' notice before the booking starts.");
```
Keep rule checks as plain `if` statements with clear messages — no clever one-liners.

## 4. Referencing code that isn't ours
If a block follows a tutorial/official sample closely, say so **right above it** (the brief treats unreferenced code as plagiarism):
```csharp
// Reference: Microsoft Learn, "Create a web API with ASP.NET Core and MongoDB"
// https://learn.microsoft.com/en-us/aspnet/core/tutorials/first-mongo-app  (adapted: settings + collection setup)
```
Also add the source to `docs/13-REFERENCES.md` if it isn't there yet.

## 5. Keep it explainable (viva rule)
- Methods short (aim < 40 lines). One job per method. Clear names (`CancelAsync`, not `Process`).
- No patterns outside `02-ARCHITECTURE.md` (no generic repositories, no AutoMapper, no inheritance tricks).
- Prefer readable over short: `foreach` + `if` is fine; LINQ only when simple (`Where`, `OrderBy`, `Count`).
- Clients never enforce business rules. They may only check "field is empty" for UX; the API decides everything else and the client shows the API's message.
- No dead code, no commented-out code, no TODOs left in final commits.

## 6. Naming
| Where | Style | Example |
|---|---|---|
| C# classes/methods/properties | PascalCase, async methods end in `Async` | `ReservationService.CancelAsync` |
| C# locals/params | camelCase | `callerNic` |
| Mongo field names | camelCase via `[BsonElement("energyKwh")]` | |
| JSON | camelCase (ASP.NET default) | `availableSlots` |
| React components/pages | PascalCase `.jsx` | `PendingActivations.jsx` |
| JS api modules | camelCase `.js` | `reservationsApi.js` |
| Java classes | PascalCase; one Activity per screen | `ReservationSummaryActivity` |
| Android layouts/ids | snake_case | `activity_reservation_summary.xml`, `@+id/btn_cancel` |

## 7. Git commits (after EVERY increment)
Format: a short subject line, a blank line, then **hyphen bullets** saying what changed. **No AI co-author trailer.** Add a **`Co-authored-by:`** trailer for the Part owner when the commit belongs to a teammate's Part (names/emails in `09-TEAM.md`). Kvn's own Part B / shared commits get no trailer.

```
feat(api): add reservation cancel with 12-hour rule

- Add ReservationService.CancelAsync enforcing R10 and R15
- Return the freed place to the slot (R12)
- Add PATCH /api/reservations/{id}/cancel to ReservationsController

Co-authored-by: Malkith G W L <lithiramalkith@gmail.com>
```
Subject prefixes: `feat`, `fix`, `docs`, `style` (UI only), `refactor`, `chore` (setup/config), `test`. Scope: `api`, `web`, `android`, `docs`, `report`.
One increment = one commit (e.g. "stations API", "stations web page"). Never commit secrets (`local.properties`, keys).

### Branches and pull requests (one PR per phase)
- **Never commit on `main`.** Each phase gets its own branch from an up-to-date `main`: `phase-N-short-name` (e.g. `phase-1-api-foundation`).
- Commit every increment on that branch as above. When the phase's "Done when" checks pass: push the branch and open a PR into `main` titled `Phase N — <name>`, with a short summary, the commit list and what was tested.
- **Kvn reviews the PR** (the "critically evaluated" part of the CLEAR rules), then merges it himself or tells Claude Code to (`gh pr merge <n> --merge --delete-branch`).
- Always a **merge commit** — never squash or rebase — so every increment commit and its `Co-authored-by` trailer stay in the history as evidence of who did what.
- No AI co-author or "Generated with" line in PR titles or descriptions either.

## 8. After each phase, explain it (CLEAR / viva rule)
When a phase is done, give Kvn a short plain-language summary in chat: **what** was built, **why** it was done that way, **how** a request flows through it, and **one likely viva question + answer**. Then update the owner's sheet in `docs/group-pack/` (files owned + how it works).
