# Part A — Accounts & Access · Gimhan T P K

## In one sentence
You own **who can get in and what they can do**: login with role-based routing (web + mobile), creating staff users, managing prosumers, the **Pending Activations** page, and mobile register / edit profile / deactivate.

## Why it exists
Without accounts, anyone could book energy or approve bookings. Different people need different powers: **Backoffice** runs the system, **Grid Operators** run stations, **Prosumers** manage only their own bookings. New sign-ups must be checked by a human before they can trade.

## What users see
| Where | Screen | What happens |
|---|---|---|
| Web | **W2 Login** | NIC + password → Backoffice/Grid Operator go to the dashboard with their own menu; a Prosumer is told to use the mobile app |
| Web | **W4–W5 Web Users** | Backoffice creates/edits Backoffice & Grid Operator users, activates/deactivates them |
| Web | **W6–W7 Prosumers** | Backoffice creates/edits/deactivates/reactivates prosumers (NIC read-only when editing) |
| Web | **W8 Pending Activations** | New sign-ups (**Pending**) and **Deactivated** prosumers → one-click **Activate** |
| Mobile | **M1 Login** | Stays logged in (SQLite). Prosumer → Prosumer Home, Grid Operator → Operator Home |
| Mobile | **M2 Register** | Prosumer signs up with NIC → "waiting for activation" |
| Mobile | **M4 Profile** | Edit details / password; **Deactivate my account** |

## Rules you own (from `01-SPEC.md`)
| Rule | Plain words | Why |
|---|---|---|
| R1 | NIC is every user's `_id`; must be valid (9 digits + V/X, or 12 digits) and unique | Brief says NIC is the primary key; `_id` is automatically unique in MongoDB |
| R2 | Backoffice = admin, Grid Operator = operations, Prosumer = own data | Least privilege: people only get the power they need |
| R3 | Mobile sign-ups start **Pending** and can't log in until activated | Stops fake accounts |
| R4 | **Deactivated** users can't log in; only Backoffice reactivates; Backoffice can't deactivate itself | Brief rule + stops locking out the last admin |
| R5 | Prosumer can deactivate their own account | Brief: "request account deactivation" |
| R16 | Prosumers see/change only their own data (NIC from the token) | Privacy + security |

## Data you touch
`Users` collection: `_id` (NIC), `fullName`, `email`, `phone`, `address`, `role`, `status`, `passwordHash`, `createdAt`, `updatedAt`.
Phone SQLite: `session` table (NIC, name, role, token).

## Your endpoints
`POST /api/auth/login` · `POST /api/auth/register` · `GET /api/users` · `GET /api/users/pending-activations` · `GET /api/users/{nic}` · `POST /api/users` · `PUT /api/users/{nic}` · `PATCH /api/users/{nic}/activate` · `PATCH /api/users/{nic}/deactivate` · `GET /api/profile` · `PUT /api/profile` · `PATCH /api/profile/deactivate`

## How a login works (step by step)
1. User types NIC + password → app sends `POST /api/auth/login`.
2. `AuthController.Login` → `AuthService.LoginAsync` finds the user by `_id = NIC`.
3. `BCrypt.Verify(password, passwordHash)` — wrong → **401** "NIC or password is incorrect."
4. Status check: Pending → **403** (R3), Deactivated → **403** (R4).
5. `JwtTokenHelper` makes a signed token containing NIC + role, valid 8 hours.
6. API returns `{ token, nic, fullName, role }`.
7. **Web** saves it in `localStorage` → role decides the menu. **Mobile** saves it in SQLite `session` → role decides the home screen.
8. Every later request sends `Authorization: Bearer <token>`; `[Authorize(Roles = "...")]` blocks wrong roles with **403**.

## Files (planned — updated after the build)
- API ✅ (Phase 2): `Controllers/AuthController.cs`, `UsersController.cs`, `ProfileController.cs` · `Services/AuthService.cs`, `UserService.cs` · `Helpers/JwtTokenHelper.cs`, `NicValidator.cs` · `Dtos/LoginRequest.cs`, `LoginResponse.cs`, `RegisterRequest.cs`, `CreateUserRequest.cs`, `UpdateUserRequest.cs`, `UpdateProfileRequest.cs`, `UserResponse.cs`
- Web: `pages/Login.jsx`, `Users.jsx`, `UserForm.jsx`, `Prosumers.jsx`, `ProsumerForm.jsx`, `PendingActivations.jsx` · `api/authApi.js`, `usersApi.js`
- Android: `ui/auth/LoginActivity.java`, `RegisterActivity.java` · `ui/prosumer/ProfileActivity.java` · layouts `activity_login.xml`, `activity_register.xml`, `activity_profile.xml`

## How it works
_(Claude Code fills this in after Phases 2, 8 and 14.)_

### API (Phase 2) — ✅ built
**Files** (in `api/SunShare.Api/`): `Helpers/NicValidator.cs`, `Helpers/JwtTokenHelper.cs` · `Services/UserService.cs`, `Services/AuthService.cs` · `Controllers/UsersController.cs`, `AuthController.cs`, `ProfileController.cs` · `Dtos/LoginRequest.cs`, `LoginResponse.cs`, `RegisterRequest.cs`, `CreateUserRequest.cs`, `UpdateUserRequest.cs`, `UpdateProfileRequest.cs`, `UserResponse.cs`.

**The layers** (same for every request): **Controller** = the door (URL + who may enter: `[Authorize(Roles = ...)]`) → **Service** = the rules (plain `if` checks, `throw new ApiException(code, "message")`) → **MongoDbContext** = the database. Controllers contain no rules.

**NIC (R1):** `NicValidator.Normalize` trims spaces and uppercases the letter (`981234567v` → `981234567V`), then a regex allows exactly `9 digits + V/X` or `12 digits`. Uniqueness: before inserting, `UserService` looks for that `_id`; if it exists → **409** "An account with this NIC already exists."

**Passwords:** at least 6 characters; stored only as a **BCrypt hash** (`BCrypt.HashPassword`). A hash can't be turned back into the password; login uses `BCrypt.Verify(typed, hash)`.

**Login** (`AuthService.LoginAsync`): empty → 400 · find user by NIC · no user **or** wrong password → **401** "NIC or password is incorrect." (the *same* message both times, so nobody can find out which NICs exist) · Pending → **403** (R3) · Deactivated → **403** (R4) · otherwise `JwtTokenHelper.CreateToken` → `{ token, nic, fullName, role, expiresAt }`.

**The token (JWT):** three parts `header.payload.signature`. The payload holds `nic`, `name`, `role`, `iss` (SunShare.Api), `aud` (SunShare.Clients) and `exp` (8 h). It is signed with HMAC-SHA256 using the secret in `appsettings.json`; if anyone changes one letter, the signature no longer matches and the API answers 401. Paste a token into jwt.io to show it at the viva.

**Register** (`AuthService.RegisterAsync`): always role **Prosumer**, status **Pending** (R3) — even if someone sneaks `"role":"Backoffice"` into the JSON, `RegisterRequest` has no role field so it is ignored. Then the same checks as "create user" (`UserService.AddUserAsync`).

**Users (Backoffice):** list with filters `role`, `status`, `search` (NIC/name/email, not case-sensitive; `Regex.Escape` makes symbols in the search count as plain text) · pending activations = Prosumers that are Pending **or** Deactivated, longest-waiting first · create (Active straight away; role must be one of the three) · edit (NIC and role can't change) · activate (Pending/Deactivated → Active) · deactivate (can't deactivate **yourself** — R4). Grid Operators may only **read** the list (to book for a prosumer); every other users endpoint is `Roles.Backoffice`.

**Profile (own account, R16):** the controller reads the caller's NIC from the token (`User.FindFirstValue("nic")`) — the request body has no NIC, so nobody can edit someone else. Edit = same checks + optional new password. **Deactivate me (R5)** → status Deactivated → can't log in (R4), and the old token can't edit the profile either; the account shows on Pending Activations for Backoffice to reactivate.

**Errors you can show in the demo (Swagger):** register `12345` → 400 · register an existing NIC → 409 · log in as `981234567V` → 403 deactivated · a Prosumer token on `GET /api/users` → 403 "You don't have permission to do that." · no token → 401 "Please log in to continue."

## Your demo (≈ 60 s)
1. Phone: **Register** a new prosumer → "waiting for activation". Try logging in → blocked (R3).
2. Web as Backoffice: **Pending Activations** → the new user is listed → **Activate**.
3. Phone: log in → lands on **Prosumer Home**. Close and reopen the app → still logged in (SQLite).
4. Phone: **Profile** → change phone number → saved.
5. Web: log in as Grid Operator → different menu (no Users/Prosumers).

## Viva questions (cover the answer, say it out loud)
1. **Why is NIC the `_id`?** — The brief makes NIC the primary key. In MongoDB `_id` is the primary key and is unique automatically, so a duplicate NIC is rejected (we return 409).
2. **How does login know where to send the user?** — The API returns the role (it's also inside the token). Web shows the menu for that role; Android opens Prosumer Home or Operator Home. Real security is still on the API: each endpoint has `[Authorize(Roles=...)]`.
3. **What is a JWT?** — A signed login ticket with the NIC, role and expiry. The API checks the signature with its secret key, so it can't be faked or edited, and the server doesn't need to store sessions.
4. **How are passwords stored?** — As BCrypt hashes (with salt). We can't turn them back into the password; login uses `BCrypt.Verify` to compare.
5. **Why can't a new prosumer log in straight away?** — R3: status is Pending until a Backoffice officer activates them on the Pending Activations page.
6. **Where is the login saved on the phone?** — In the SQLite `session` table (`SunShareDbHelper`). Logout, self-deactivate or a 401 from the API deletes it.
7. **What happens when a prosumer deactivates?** — `PATCH /api/profile/deactivate` sets status Deactivated; the app clears the SQLite session; they can't log in (R4) and they appear on Pending Activations for reactivation.
8. **Where is the NIC format checked, and why there?** — In the API (`NicValidator`, regex). FAT service: the phone only checks the field isn't empty.
9. **Why can a Grid Operator read the users list?** — Only to pick a prosumer when booking on their behalf. Creating/editing users is Backoffice only.
10. **What does `[Authorize(Roles = "Backoffice")]` do?** — ASP.NET checks the token's role before our method runs; wrong role → 403 automatically.
