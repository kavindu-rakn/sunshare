# 12 — Challenges Log

The report needs **"Challenges" discussed with genuine reflection** (1 mark, and good viva material).
Log **real** problems as they happen — don't invent them. Claude Code: whenever something breaks and takes more than a quick fix (build error, hosting issue, device/network issue, rule edge case), add a row.

| # | Date | Part | What went wrong | How we found / fixed it | What we learned |
|---|---|---|---|---|---|
| C1 | 2026-09-27 | B (setup) | The laptop only had the .NET 8 SDK, but the API targets .NET 10. Microsoft's `dotnet-install.ps1` downloaded .NET 10 fine but failed while unzipping: *"cannot access `dotnet.exe` because it is being used by another process"*. | Listed the running `dotnet.exe` processes (`Get-CimInstance Win32_Process`): two `dotnet run` servers from another project had been open since the night before and were locking the file. Rather than kill someone else's servers, we unzipped the downloaded SDK ourselves and skipped files that already existed (only the `dotnet.exe` launcher). `dotnet --list-sdks` then showed 8.0.425 and 10.0.401. | `dotnet.exe` is only a small launcher that hands over to the newest .NET version installed next to it, so several SDKs live side by side. Check tool versions on day one, and read the actual error before retrying. |

### Reflection prompts (for the report write-up)
- What was harder than expected, and why?
- What would we do differently with more time?
- Which trade-offs did we accept (e.g. HTTP on LAN, secret in config) and what would production need?
- How did using AI tools help or cause problems, and how did we check their output?
