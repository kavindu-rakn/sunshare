<#
 ============================================================================
  File        : deploy-api.ps1
  Project     : SunShare - Smart Solar Microgrid Trading System
  Module      : SE4040 Enterprise Application Development - Assignment 1
  Part        : B - Hosting
  Author      : Ranathunga R A K N (IT22552860)
  Created     : 2026-09-28
  Description : Publishes SunShare.Api and hosts it on IIS as the site
                "SunShareApi" on port 8080 (docs/08-SETUP-AND-HOSTING.md section 3).
                Safe to run again after every code change: it only creates
                the app pool, site and firewall rule when they are missing.
  How to run  : in an ADMINISTRATOR PowerShell, from the repo folder:
                powershell -ExecutionPolicy Bypass -File .\scripts\deploy-api.ps1
  Reference   : Microsoft Learn, "Host ASP.NET Core on Windows with IIS"
                https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/iis/
 ============================================================================
#>

$SiteName   = 'SunShareApi'
$Port       = 8080
$PublishDir = 'C:\inetpub\sunshare\api'
$Project    = Join-Path $PSScriptRoot '..\api\SunShare.Api'
$AppCmd     = "$env:windir\system32\inetsrv\appcmd.exe"   # IIS's own command-line tool

# Stops the script with a clear message unless it runs as Administrator
# (creating IIS sites and writing to C:\inetpub need admin rights).
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

# Finds a dotnet.exe that has an SDK (needed for "publish"). The Hosting Bundle adds a runtime-only
# dotnet in Program Files to the PATH, which can hide the SDK, so the user's own SDK folder is tried too.
function Get-DotnetWithSdk
{
    $candidates = @("$env:ProgramFiles\dotnet\dotnet.exe", "$env:USERPROFILE\.dotnet\dotnet.exe")
    foreach ($candidate in $candidates)
    {
        if (Test-Path $candidate)
        {
            $sdks = & $candidate --list-sdks
            if ($sdks) { return $candidate }
        }
    }
    Write-Host 'No .NET SDK found. Install the .NET 10 SDK (docs/08-SETUP-AND-HOSTING.md section 1).' -ForegroundColor Red
    exit 1
}

# Creates the application pool once. "No Managed Code" = IIS must not load the old .NET Framework;
# ASP.NET Core brings its own runtime and IIS only forwards requests to it.
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

# Creates the IIS site once: port 8080, pointing at the published folder, using our app pool.
function Initialize-Site
{
    & $AppCmd list site $SiteName | Out-Null
    if ($LASTEXITCODE -ne 0)
    {
        Write-Host "Creating IIS site '$SiteName' on port $Port..."
        & $AppCmd add site "/name:$SiteName" "/bindings:http/*:${Port}:" "/physicalPath:$PublishDir" | Out-Host
        & $AppCmd set app "$SiteName/" "/applicationPool:$SiteName" | Out-Host
    }
    else
    {
        Write-Host "IIS site '$SiteName' already exists."
    }
}

# Lets other devices on the network (the phone) reach port 8080 through Windows Firewall. Created once.
function Initialize-FirewallRule
{
    $ruleName = "SunShare API $Port"
    if (-not (Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue))
    {
        Write-Host "Adding firewall rule '$ruleName'..."
        New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Protocol TCP -LocalPort $Port -Action Allow | Out-Null
    }
    else
    {
        Write-Host "Firewall rule '$ruleName' already exists."
    }
}

# Calls GET /api/health on IIS (the first call also starts the app) and shows the result,
# plus the address the phone should use.
function Show-Health
{
    try
    {
        $health = Invoke-RestMethod "http://localhost:$Port/api/health" -TimeoutSec 60
        Write-Host "IIS API is up: api=$($health.api), database=$($health.database)" -ForegroundColor Green
    }
    catch
    {
        Write-Host "Health check failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host 'Tips: is MongoDB running (Get-Service MongoDB)? See the troubleshooting table in docs/08.' -ForegroundColor Yellow
    }
    $wifi = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object { $_.InterfaceAlias -match 'Wi-Fi|Wireless|Ethernet' -and $_.IPAddress -notlike '169.*' } |
        Select-Object -First 1
    Write-Host "Swagger: http://localhost:$Port/swagger"
    if ($wifi) { Write-Host "Phone:   http://$($wifi.IPAddress):$Port/api/health  (same Wi-Fi)" }
}

# ---------- Main steps ----------
Assert-Admin
$dotnet = Get-DotnetWithSdk
Initialize-AppPool

# The running app locks its files, so stop the app pool before copying new ones in.
& $AppCmd stop apppool "/apppool.name:$SiteName" 2>&1 | Out-Null
Start-Sleep -Seconds 2

Write-Host "Publishing the API to $PublishDir ..."
& $dotnet publish $Project -c Release -o $PublishDir
if ($LASTEXITCODE -ne 0)
{
    Write-Host 'Publish failed - see the errors above.' -ForegroundColor Red
    exit 1
}

Initialize-Site
& $AppCmd start apppool "/apppool.name:$SiteName" 2>&1 | Out-Null
& $AppCmd start site "/site.name:$SiteName" 2>&1 | Out-Null
Initialize-FirewallRule
Show-Health
