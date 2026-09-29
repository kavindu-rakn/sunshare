# 08 — Setup, Hosting & Demo Networking

Items marked **(YOU)** are manual — Claude Code can't click through Windows installers or the Google Cloud console for you.

## 1. Tools checklist

| Tool | Status | What / why |
|---|---|---|
| **Visual Studio 2026 Community** | Optional | visualstudio.microsoft.com → Community → workload **"ASP.NET and web development"**. Nice for opening/debugging the API; not needed to build (the `dotnet` CLI does that). |
| .NET 10 SDK | ✅ installed (10.0.401) | Installed on 27 Sep with Microsoft's `dotnet-install.ps1` into `C:\Users\User\.dotnet` (next to .NET 8). Check: `dotnet --list-sdks` shows `10.0.401`. See `12-CHALLENGES.md` C1. **PATH note:** the Hosting Bundle added a runtime-only `C:\Program Files\dotnet` to the *system* PATH, which comes before the user PATH, so new terminals say "No .NET SDKs were found". Fix once (admin PowerShell): `winget install --id Microsoft.DotNet.SDK.10 -e` (puts the SDK next to that runtime). See C4. |
| **IIS** (Windows web server) | ✅ turned on (28 Sep) | See §3. |
| **ASP.NET Core Hosting Bundle 10** | ✅ installed (runtime 10.0.12) | dotnet.microsoft.com/download/dotnet/10.0 → "ASP.NET Core Runtime 10.x" → Windows → **Hosting Bundle**. Lets IIS run .NET apps. |
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

**3.3 Deploy with the script (admin PowerShell, from `sunshare/`) — first time AND after every code change:**
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-api.ps1
```
It is safe to run again and again. What it does (this is also how to explain IIS hosting at the viva):
1. Checks it runs as **admin** and finds a `dotnet` that has an **SDK** (see the PATH note in §1).
2. Creates the **application pool** `SunShareApi` with **No Managed Code** (only the first time). *Why:* IIS must not load the old .NET Framework — ASP.NET Core brings its own runtime; IIS only forwards requests to it through the **ASP.NET Core Module** (from the Hosting Bundle).
3. **Stops** the app pool (a running app locks its own files), then `dotnet publish -c Release -o C:\inetpub\sunshare\api`.
4. Creates the **site** `SunShareApi` → port **8080** → that folder → that app pool (only the first time), and starts it.
5. Adds the **firewall rule** "SunShare API 8080" so the phone can connect (only the first time).
6. Calls `http://localhost:8080/api/health` and prints the phone address (`http://<laptop IPv4>:8080/api/health`).

The same by hand (fallback, or to show in IIS Manager at the viva): Win+R → `inetmgr` → *Application Pools* → Add → `SunShareApi`, .NET CLR version **No Managed Code** · *Sites* → Add Website → `SunShareApi`, physical path `C:\inetpub\sunshare\api`, port **8080**, app pool `SunShareApi`.

**3.4 Check it:** `http://localhost:8080/swagger` and `http://localhost:8080/api/health` → `"database": "connected"`.

**3.5 Let the phone reach it:** the script adds the firewall rule. Find the laptop's IP: `ipconfig` → *Wireless LAN adapter Wi-Fi* → **IPv4 Address** (e.g. `192.168.1.23`) — the script prints it too. Phone browser → `http://192.168.1.23:8080/api/health`.
Tip: set the Wi-Fi network to **Private** in Windows settings (Settings → Network & internet → Wi-Fi → your network → Network profile type).

## 4. Host the web app on IIS (Phase 12) — ✅ done 29 Sep
**Deploy (admin PowerShell, from `sunshare/`) — first time and after every web change:**
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-web.ps1
```
What it does:
1. `npm run build` in `web/` — Vite reads `web/.env.production` (`VITE_API_BASE_URL=http://localhost:8080`), so the built app calls the **IIS API**.
2. Creates the app pool `SunShareWeb` (No Managed Code — the site is only static files) if missing.
3. Mirrors `web/dist/` into `C:\inetpub\sunshare\web` with `robocopy /MIR` (old files removed).
4. Creates the site `SunShareWeb` on port **8081** if missing, starts it, and opens the home page to check.

`web/public/web.config` (copied into `dist/` on every build) sets `index.html` as the start page and declares the `.woff2` icon font type. Because we use **HashRouter** (`#/login`), IIS needs no URL Rewrite module.

**Check:** `http://localhost:8081` → log in as Backoffice → the Dashboard loads (web on IIS → API on IIS → MongoDB). The API allows the `http://localhost:8081` origin (CORS list in `appsettings.json`).

## 5. Create the Android project (YOU, Phase 0 — 2 minutes)
1. Android Studio → **New Project** → Phone and Tablet → **Empty Views Activity** → Next.
2. Name `SunShare` · Package name `com.sunshare.app` · Save location `C:\Users\User\Documents\EAD\sunshare\android` · Language **Java** · Minimum SDK **API 26 (Android 8.0)** · Build configuration language: leave the default (**Kotlin DSL**, see `11-DECISIONS.md` D21) → **Finish**. Wait for Gradle sync.
   - If Android Studio pops up **"Add Files to Git"**: tick *Don't ask again* → **Cancel**. Claude Code adds the files itself, on the phase branch, with the right ignore rules.
   - ✅ Done 28 Sep (Android Studio made AGP 9.4.1, Gradle 9.6.0, compile/target SDK 37).
3. **Emulator:** the existing AVD **`Medium_Phone`** already uses an **Android 15 (API 35) Google Play** image, which Maps needs, so there's no need to make a new one. (For a new one: Device Manager → **+** → pick a system image that says **Google Play** → Finish.) ▶ run the app once.
4. Emulator location: emulator ⋯ (Extended controls) → **Location** → search "SLIIT Malabe" → **Set location**.

## 6. Google Maps API key (YOU, ~10 min)
> **Plan from 29 Sep (D51): Maps Demo Key — no credit card.** ✅ Key added by Kvn on 29 Sep. **Test result (D53):** the native Maps SDK for Android shows a blank map ("Authorization failure"); the **Maps JavaScript API in a WebView works** (tiles, marker, info window) — Phase 15 uses that.
> 1. Signed in with your Google account, open **https://mapsplatform.google.com/maps-demo-key/** → **Get a Demo Key** → accept the terms → copy the key.
> 2. Paste it into `android/local.properties` (never committed, never pasted in chat): `MAPS_API_KEY=...your demo key...`
> 3. Tell Claude Code "demo key added". Phase 15 first tries the **native Maps SDK for Android** with it; if Google refuses the demo key there, the map screen shows Google's **Maps JavaScript API** in a WebView with the same key (D51). The demo key has a **daily limit** — when it is hit the map pauses until the next day (no charge).
>
> The steps below (a billing-enabled Cloud project) are only needed if someone with a card makes a normal key instead.
> **Status 29 Sep:** blocked — Google Cloud needs a card for billing (Kvn's card can't cover the authorization hold). Anyone with a card can create the key for us: it is locked to package `com.sunshare.app` + Kvn's debug SHA-1 `95:23:58:43:F0:62:F5:F3:F1:97:09:60:0B:3B:D7:73:B9:FB:03:39`, Android map loads are free, and a $1 budget alert is a safety net. A Google **AI Studio** (Gemini) key does **not** work for maps. Fallback: D47.

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
- **Phone, over Wi-Fi** → `http://<laptop IPv4>:8080/` — laptop and phone must get addresses in the **same range** (e.g. both `192.168.1.x`). The same Wi-Fi *name* is not enough: a router with two bands or a repeater can hand out different ranges (C12). Check: laptop `ipconfig` → IPv4; phone → Settings → Wi-Fi → the network → IP address. **Most reliable at the viva:** turn on the **Android phone's own hotspot** and connect the laptop to it (campus Wi-Fi often blocks device-to-device traffic).
- **Phone, over the USB cable** (no Wi-Fi needed): with the phone plugged in and USB debugging on, run once per connection in a terminal:
  ```powershell
  & "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" -d reverse tcp:8080 tcp:8080
  ```
  then in the app: ⚙ Server → `http://localhost:8080/`. The phone's port 8080 is carried through the cable to the laptop's IIS API. Unplugging the cable ends it.
- Change it at runtime: Login screen ⚙ → Server address (saved in SQLite). **At the viva the Wi-Fi/IP will be different — just update it there, no rebuild.**
- Phone: Settings → About phone → tap **Build number** 7 times → Developer options → **USB debugging** ON → plug in → Allow.
- QR demo: prosumer booking open on the **emulator** (QR on the laptop screen) → operator logged in on the **phone** → Scan.
- **Map on the emulator:** the emulator has no real GPS. Give it a position near SLIIT before opening *Nearby stations*: emulator **⋯ (Extended controls) → Location** → search "SLIIT Malabe" → **Set location** (or `adb -s emulator-5554 emu geo fix 79.9729 6.9147` — longitude first). Without a position the app waits 10 s and then uses SLIIT Malabe anyway.
- **Emulator memory:** the `Medium_Phone` AVD has only **2 GB** — with Google Play + Chrome's WebView it can freeze ("isn't responding") or restart (C13). For demos give it more: Device Manager → ✏ Edit → Show Advanced Settings → **RAM 3072 MB** (or start it with `-memory 3072`), and close apps you don't need on the laptop.

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
| `dotnet build` / `dotnet run`: **"No .NET SDKs were found"** | The runtime-only `C:\Program Files\dotnet` (from the Hosting Bundle) comes first on the PATH → install the SDK there: `winget install --id Microsoft.DotNet.SDK.10 -e` (admin), then open a new terminal. The deploy script works either way |
| Login works on web, 401 on mobile later | Token expired (8 h) → app should clear the session and return to Login |
