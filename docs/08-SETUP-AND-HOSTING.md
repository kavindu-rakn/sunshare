# 08 — Setup, Hosting & Demo Networking

Items marked **(YOU)** are manual — Claude Code can't click through Windows installers or the Google Cloud console for you.

## 1. Tools checklist

| Tool | Status | What / why |
|---|---|---|
| **Visual Studio 2026 Community** | ⏳ **(YOU) install** | visualstudio.microsoft.com → Community → workload **"ASP.NET and web development"**. Brings the **.NET 10 SDK**. Used to open/debug the API (Claude Code can also build with `dotnet` CLI). |
| .NET 10 SDK | ⏳ comes with VS 2026 | Check: `dotnet --list-sdks` shows `10.x`. If not: dotnet.microsoft.com/download/dotnet/10.0 → SDK. |
| **IIS** (Windows web server) | ⏳ **(YOU) turn on** | See §3. |
| **ASP.NET Core Hosting Bundle 10** | ⏳ **(YOU) install AFTER IIS** | dotnet.microsoft.com/download/dotnet/10.0 → "ASP.NET Core Runtime 10.x" → Windows → **Hosting Bundle**. Lets IIS run .NET apps. |
| MongoDB Community + Compass | ✅ installed | Check the Windows service is running: PowerShell `Get-Service MongoDB` → Running. Compass → connect `mongodb://localhost:27017`. |
| Node.js | ✅ installed | Vite needs **Node 20.19+ or 22.12+**: `node -v`. If older → install Node 22 LTS. |
| Android Studio | ✅ installed | Update SDK; create an emulator with a **Google Play** system image (needed for Maps) — §5. |
| Git + GitHub account | ✅ Git installed | `git config --global user.name "Ranathunga R A K N"` and `user.email` = your GitHub email. **(YOU)** create repo `sunshare` (keep **private** until submission, add teammates; make it **public or add the lecturer** at submission so the link works). |
| Google Cloud (Maps key) | ⏳ **(YOU)** | §6. Needs a card for billing; Android map loads are free/unlimited; set a $1 budget alert. |
| Android phone | ✅ | USB debugging on (§7). Same Wi-Fi as the laptop. |
| OBS Studio (or Xbox Game Bar, Win+G) | ⏳ Wed | Screen-record the ≤ 5 min video. |
| Microsoft Word | ✅ probably | Open/finish the generated report. |

## 2. MongoDB quick check
1. `Get-Service MongoDB` → Running (if Stopped: `Start-Service MongoDB` in an admin PowerShell).
2. Compass → `mongodb://localhost:27017` → after the API's first run you'll see database **`SunShareDb`** with the 4 collections.

## 3. Host the API on IIS (Phase 6)

**3.1 Turn on IIS (YOU, once)**
1. Press Win+R → type `optionalfeatures` → Enter.
2. Tick **Internet Information Services** (defaults are fine). Expand it → *Web Management Tools* → make sure **IIS Management Console** is ticked. OK → wait → restart if asked.
3. Browse `http://localhost` → blue IIS welcome page = working.

**3.2 Install the Hosting Bundle (YOU, once, after 3.1)** → then in an **admin** terminal: `net stop was /y` then `net start w3svc`.

**3.3 Publish** (admin terminal, from `sunshare/`):
```powershell
dotnet publish api/SunShare.Api -c Release -o C:\inetpub\sunshare\api
```
**3.4 Create the IIS site (YOU, once)** — Win+R → `inetmgr`:
1. *Sites* → right-click → **Add Website** → Site name `SunShareApi` · Physical path `C:\inetpub\sunshare\api` · Port **8080** · Host name empty → OK.
2. *Application Pools* → `SunShareApi` → Basic Settings → .NET CLR version **No Managed Code** → OK.
3. Browse `http://localhost:8080/swagger` and `http://localhost:8080/api/health`.

**3.5 Let the phone reach it** (admin PowerShell, once):
```powershell
New-NetFirewallRule -DisplayName "SunShare API 8080" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow
```
Find the laptop's IP: `ipconfig` → *Wireless LAN adapter Wi-Fi* → **IPv4 Address** (e.g. `192.168.1.23`). Phone browser → `http://192.168.1.23:8080/api/health`.
Tip: set the Wi-Fi network to **Private** in Windows settings.

**3.6 Redeploy after code changes:** stop the app pool (files are locked while it runs), publish, start:
```powershell
& "$env:windir\system32\inetsrv\appcmd.exe" stop apppool /apppool.name:SunShareApi
dotnet publish api/SunShare.Api -c Release -o C:\inetpub\sunshare\api
& "$env:windir\system32\inetsrv\appcmd.exe" start apppool /apppool.name:SunShareApi
```
(Phase 6 saves this as `scripts/deploy-api.ps1`.)

## 4. Host the web app on IIS (Phase 12)
1. `web/.env.production` → `VITE_API_BASE_URL=http://localhost:8080`
2. `cd web; npm run build` → copy everything inside `web/dist/` to `C:\inetpub\sunshare\web` (admin).
3. **(YOU, once)** IIS Manager → Add Website → `SunShareWeb` · `C:\inetpub\sunshare\web` · Port **8081**.
4. Open `http://localhost:8081`. Because we use **HashRouter** (`#/login`), IIS needs no URL Rewrite module.

## 5. Create the Android project (YOU, Phase 0 — 2 minutes)
1. Android Studio → **New Project** → Phone and Tablet → **Empty Views Activity** → Next.
2. Name `SunShare` · Package name `com.sunshare.app` · Save location `C:\Users\User\Documents\EAD\sunshare\android` · Language **Java** · Minimum SDK **API 26 (Android 8.0)** · Build configuration language: leave the default → **Finish**. Wait for Gradle sync.
3. **Emulator:** Device Manager → **+** → Pixel 7 → pick a system image that says **Google Play** (API 34 or 35) → Finish → ▶ run the app once.
4. Emulator location: emulator ⋯ (Extended controls) → **Location** → search "SLIIT Malabe" → **Set location**.

## 6. Google Maps API key (YOU, ~10 min)
1. console.cloud.google.com → new project **SunShare**.
2. **Billing** → link a billing account (card). Then **Budgets & alerts** → create a **$1** budget with email alerts (safety net).
3. **APIs & Services → Library** → enable **Maps SDK for Android**.
4. **Credentials → Create credentials → API key**. Edit it:
   - Application restriction: **Android apps** → Add → package `com.sunshare.app` + your **debug SHA-1** (Android Studio terminal in `android/`: `.\gradlew signingReport` → copy the `SHA1` of variant `debug`).
   - API restriction: **Maps SDK for Android** only.
5. Put it in `android/local.properties` (this file is **not** committed to Git):
   ```
   MAPS_API_KEY=AIza...your key...
   ```
   Tell Claude Code "key added" — Phase 13 wires it into the manifest.

## 7. Demo networking (emulator + phone)
- Everything points to the **IIS API on port 8080**.
- **Emulator** → server address `http://10.0.2.2:8080/` (10.0.2.2 = "the laptop" as seen from the emulator).
- **Phone** → `http://<laptop IPv4>:8080/` — laptop and phone on the **same Wi-Fi** (or connect the laptop to the phone's hotspot).
- Change it at runtime: Login screen ⚙ → Server address (saved in SQLite). **At the viva the Wi-Fi/IP will be different — just update it there, no rebuild.**
- Phone: Settings → About phone → tap **Build number** 7 times → Developer options → **USB debugging** ON → plug in → Allow.
- QR demo: prosumer booking open on the **emulator** (QR on the laptop screen) → operator logged in on the **phone** → Scan.

## 8. Fresh data before the viva
Seeded bookings are dated relative to the seeding day, so refresh the day before:
1. Compass → `SunShareDb` → 🗑 **Drop database**.
2. IIS Manager → Application Pools → `SunShareApi` → **Recycle**.
3. Open `http://localhost:8080/api/health` → the API starts and re-seeds.

## 9. Troubleshooting

| Symptom | Likely cause → fix |
|---|---|
| IIS shows **HTTP 500.19** | Hosting Bundle missing or installed before IIS → (re)install Hosting Bundle, `net stop was /y`, `net start w3svc` |
| **HTTP 500.30 / 500.31** | App crashed on start (e.g. Mongo not running, wrong .NET) → check `Get-Service MongoDB`; temporarily set `stdoutLogEnabled="true"` in `web.config` and read `logs\` |
| PUT/DELETE/PATCH return **405** on IIS only | WebDAV module intercepting → our `web.config` removes it; make sure it was published |
| Web shows "Failed to fetch" / **CORS** error | API not running, wrong `VITE_API_BASE_URL`, or origin missing in CORS list |
| Phone can't reach the API | Not same Wi-Fi · firewall rule missing · wrong IP · Wi-Fi network set to Public |
| Android "CLEARTEXT communication not permitted" | `network_security_config.xml` not applied in the manifest |
| Map is grey/blank | Key not in `local.properties`, wrong SHA-1/package restriction, billing not linked, or emulator image without Google Play |
| Login works on web, 401 on mobile later | Token expired (8 h) → app should clear the session and return to Login |
