<#
 ============================================================================
  File        : update-toc.ps1
  Project     : SunShare - Smart Solar Microgrid Trading System
  Module      : SE4040 Enterprise Application Development - Assignment 1
  Part        : B - Report
  Author      : Ranathunga R A K N (IT22552860)
  Created     : 2026-09-29
  Description : Opens SunShare-Report.docx in Microsoft Word (in the
                background), fills in the table of contents and its page
                numbers, saves it and also saves a PDF copy
                (SunShare-Report.pdf). Takes about 1 minute.
  How to run  : in report\, after "npm run build":
                powershell -ExecutionPolicy Bypass -File .\update-toc.ps1
 ============================================================================
#>
# [string] matters: Join-Path returns a PowerShell-wrapped string, which Word receives as an object
# and keeps asking PowerShell about while it writes - the PDF export then took over 15 minutes
# instead of under a minute (docs/12-CHALLENGES.md C14). A plain string is passed as plain text.
[string]$docx = Join-Path $PSScriptRoot 'SunShare-Report.docx'
[string]$pdf = Join-Path $PSScriptRoot 'SunShare-Report.pdf'
if (-not (Test-Path $docx)) {
    Write-Host 'SunShare-Report.docx not found - run "npm run build" first.' -ForegroundColor Red
    exit 1
}

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
    $doc = $word.Documents.Open($docx)
    # Fill in the contents list, lay out all pages, then correct its page numbers
    # (the list itself may push the chapters one page further).
    foreach ($toc in $doc.TablesOfContents) { $toc.Update() }
    $doc.Repaginate()
    foreach ($toc in $doc.TablesOfContents) { $toc.UpdatePageNumbers() }
    $doc.Save()
    Write-Host 'Table of contents updated and saved.'

    $pages = $doc.ComputeStatistics(2)
    # ExportAsFixedFormat(file, 17 = PDF, open after = no, 0 = print quality, 3 = page range, from 1, to last,
    #   0 = content only, document properties, keep rights, 1 = bookmarks from headings, no structure tags,
    #   bitmap missing fonts, not PDF/A)
    $doc.ExportAsFixedFormat($pdf, 17, $false, 0, 3, 1, $pages, 0, $true, $true, 1, $false, $true, $false)
    $doc.Close($false)
    Write-Host "PDF saved: $pdf ($pages pages)" -ForegroundColor Green
}
finally {
    $word.Quit()
    [Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
}
