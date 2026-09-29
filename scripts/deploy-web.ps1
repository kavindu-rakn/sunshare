<#
 ============================================================================
  File        : deploy-web.ps1
  Project     : SunShare - Smart Solar Microgrid Trading System
  Module      : SE4040 Enterprise Application Development - Assignment 1
  Part        : B - Hosting
  Author      : Ranathunga R A K N (IT22552860)
  Created     : 2026-09-29
  Description : Builds the React web app and hosts it on IIS as the site
                "SunShareWeb" on port 8081 (docs/08-SETUP-AND-HOSTING.md
                section 4). The built app calls the IIS API on port 8080
                (web/.env.production). Safe to run again after every change.
  How to run  : in an ADMINISTRATOR PowerShell, from the repo folder:
                powershell -ExecutionPolicy Bypass -File .\scripts\deploy-web.ps1
 ============================================================================
#>

$SiteName  = 'SunShareWeb'
$Port      = 8081
$SiteDir   = 'C:\inetpub\sunshare\web'
$WebFolder = Join-Path $PSScriptRoot '..\web'
$AppCmd    = "$env:windir\system32\inetsrv\appcmd.exe"   # IIS's own command-line tool

# Stops the script with a clear message unless it runs as Administrator (IIS and C:\inetpub need it).
function Assert-Admin
{
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $isAdmin = ([Security.Principal.WindowsPrincipal]$identity).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    if (-not $isAdmin)
    {
        Write-Host 'Please run this in an ADMINISTRATOR PowerShell (right-click PowerShell > Run as administrator).' -ForegroundColor Red
        exit 1
    }
    if (-not (Test-Path $AppCmd))
    {
        Write-Host 'IIS is not installed (appcmd.exe not found). See docs/08-SETUP-AND-HOSTING.md section 3.1.' -ForegroundColor Red
        exit 1
    }
}

# Builds the web app with "npm run build" (Vite uses .env.production -> API at http://localhost:8080).
function Invoke-WebBuild
{
    Write-Host 'Building the web app (npm run build) ...'
    Push-Location $WebFolder
    npm run build
    $buildOk = ($LASTEXITCODE -eq 0)
    Pop-Location
    if (-not $buildOk)
    {
        Write-Host 'The web build failed - see the errors above.' -ForegroundColor Red
        exit 1
    }
}

# Copies web\dist into the IIS folder. /MIR makes the folder an exact mirror (old files are removed).
# robocopy exit codes 0-7 mean success; 8 or more means something could not be copied.
function Copy-WebFiles
{
    Write-Host "Copying the built files to $SiteDir ..."
    robocopy (Join-Path $WebFolder 'dist') $SiteDir /MIR /NFL /NDL /NJH /NJS /NP | Out-Null
    if ($LASTEXITCODE -ge 8)
    {
        Write-Host "Copying failed (robocopy exit code $LASTEXITCODE)." -ForegroundColor Red
        exit 1
    }
}

# Creates the application pool once. The site is only static files, so no .NET code runs in it.
function Initialize-AppPool
{
    & $AppCmd list apppool $SiteName | Out-Null
    if ($LASTEXITCODE -ne 0)
    {
        Write-Host "Creating application pool '$SiteName' (No Managed Code)..."
        & $AppCmd add apppool "/name:$SiteName" '/managedRuntimeVersion:' | Out-Host
    }
    else
    {
        Write-Host "Application pool '$SiteName' already exists."
    }
}

# Creates the IIS site once: port 8081, pointing at the copied files, using our app pool.
function Initialize-Site
{
    & $AppCmd list site $SiteName | Out-Null
    if ($LASTEXITCODE -ne 0)
    {
        Write-Host "Creating IIS site '$SiteName' on port $Port..."
        & $AppCmd add site "/name:$SiteName" "/bindings:http/*:${Port}:" "/physicalPath:$SiteDir" | Out-Host
        & $AppCmd set app "$SiteName/" "/applicationPool:$SiteName" | Out-Host
    }
    else
    {
        Write-Host "IIS site '$SiteName' already exists."
    }
}

# Opens the home page and the icon font on IIS to prove the site works.
function Show-Result
{
    try
    {
        $page = Invoke-WebRequest "http://localhost:$Port/" -UseBasicParsing -TimeoutSec 30
        $cssFile = ([regex]::Match($page.Content, 'assets/[^"]+\.css')).Value
        Write-Host "IIS web app is up: http://localhost:$Port/ (HTTP $($page.StatusCode))" -ForegroundColor Green
        if ($cssFile) { Write-Host "Styles file: $cssFile" }
    }
    catch
    {
        Write-Host "Could not open http://localhost:$Port/ : $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host "The web app calls the IIS API at http://localhost:8080 - check it with scripts\deploy-api.ps1 if login fails."
}

# ---------- Main steps ----------
Assert-Admin
Invoke-WebBuild
Initialize-AppPool
Copy-WebFiles
Initialize-Site
& $AppCmd start apppool "/apppool.name:$SiteName" 2>&1 | Out-Null
& $AppCmd start site "/site.name:$SiteName" 2>&1 | Out-Null
Show-Result
