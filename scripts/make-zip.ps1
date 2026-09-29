<#
 ============================================================================
  File        : make-zip.ps1
  Project     : SunShare - Smart Solar Microgrid Trading System
  Module      : SE4040 Enterprise Application Development - Assignment 1
  Part        : B - Submission
  Author      : Ranathunga R A K N (IT22552860)
  Created     : 2026-09-29
  Description : Builds the submission file IT22552860.zip (next to the repo
                folder) with "git archive": every file Git tracks goes in
                (so node_modules, bin, obj, build, .gradle and
                local.properties with the Maps key can never slip in), plus
                the report and the two main-screen screenshots at the top of
                the zip so the marker finds them at once.
  How to run  : from the repo folder, after the last commit:
                powershell -ExecutionPolicy Bypass -File .\scripts\make-zip.ps1
 ============================================================================
#>

$RepoFolder = Resolve-Path (Join-Path $PSScriptRoot '..')
$ZipPath    = Join-Path (Split-Path $RepoFolder -Parent) 'IT22552860.zip'
$TopFiles   = @('report/SunShare-Report.docx', 'report/SunShare-Report.pdf',
                'screenshots/web/MAIN-SCREEN-web.png', 'screenshots/mobile/MAIN-SCREEN-mobile.png')

# Stops with a message if something is not committed yet (git archive only packs the last commit).
function Assert-AllCommitted
{
    $changes = git -C $RepoFolder status --porcelain
    if ($changes)
    {
        Write-Host 'These changes are not committed, so they would be missing from the zip:' -ForegroundColor Red
        $changes | Out-Host
        Write-Host 'Commit (or undo) them first, then run this again.' -ForegroundColor Red
        exit 1
    }
}

# Stops with a message if the report or a main-screen picture is missing.
function Assert-TopFilesExist
{
    foreach ($file in $TopFiles)
    {
        if (-not (Test-Path (Join-Path $RepoFolder $file)))
        {
            Write-Host "Missing $file - build the report first (report\: npm run build, then update-toc.ps1)." -ForegroundColor Red
            exit 1
        }
    }
}

# Packs the zip: the top files first (at the root of the zip), then the whole repo inside "sunshare/".
function New-SubmissionZip
{
    $addFiles = $TopFiles | ForEach-Object { "--add-file=$_" }
    Push-Location $RepoFolder
    git archive --format=zip '--prefix=IT22552860/' @addFiles '--prefix=IT22552860/sunshare/' -o $ZipPath HEAD
    $archiveOk = ($LASTEXITCODE -eq 0)
    Pop-Location
    if (-not $archiveOk)
    {
        Write-Host 'git archive failed - see the error above.' -ForegroundColor Red
        exit 1
    }
}

# Lists what the zip holds at the top and checks that no build folders got in.
function Show-Result
{
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::OpenRead($ZipPath)
    try
    {
        $names = $zip.Entries | ForEach-Object { $_.FullName }
        $unwanted = $names | Where-Object { $_ -match '/(node_modules|bin|obj|build|\.gradle|\.vs)/|local\.properties' }
        Write-Host "Created $ZipPath ($([math]::Round((Get-Item $ZipPath).Length / 1MB, 1)) MB, $($zip.Entries.Count) entries)" -ForegroundColor Green
        $names | Where-Object { $_ -match '^IT22552860/[^/]+/?$' } | ForEach-Object { Write-Host "  $_" }
        if ($unwanted)
        {
            Write-Host 'Warning - unexpected build files inside:' -ForegroundColor Yellow
            $unwanted | Out-Host
        }
    }
    finally
    {
        $zip.Dispose()
    }
}

# ---------- Main steps ----------
Assert-AllCommitted
Assert-TopFilesExist
New-SubmissionZip
Show-Result
