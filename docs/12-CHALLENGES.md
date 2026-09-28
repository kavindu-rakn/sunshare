# 12 — Challenges Log

The report needs **"Challenges" discussed with genuine reflection** (1 mark, and good viva material).
Log **real** problems as they happen — don't invent them. Claude Code: whenever something breaks and takes more than a quick fix (build error, hosting issue, device/network issue, rule edge case), add a row.

| # | Date | Part | What went wrong | How we found / fixed it | What we learned |
|---|---|---|---|---|---|
| C1 | 2026-09-27 | B (setup) | The laptop only had the .NET 8 SDK, but the API targets .NET 10. Microsoft's `dotnet-install.ps1` downloaded .NET 10 fine but failed while unzipping: *"cannot access `dotnet.exe` because it is being used by another process"*. | Listed the running `dotnet.exe` processes (`Get-CimInstance Win32_Process`): two `dotnet run` servers from another project had been open since the night before and were locking the file. Rather than kill someone else's servers, we unzipped the downloaded SDK ourselves and skipped files that already existed (only the `dotnet.exe` launcher). `dotnet --list-sdks` then showed 8.0.425 and 10.0.401. | `dotnet.exe` is only a small launcher that hands over to the newest .NET version installed next to it, so several SDKs live side by side. Check tool versions on day one, and read the actual error before retrying. |
| C2 | 2026-09-28 | Shared (API) | While testing login with a broken request body, the API answered with raw .NET parser text: *"The JSON value could not be converted to System.String. Path: $.nic…"* — not the human-friendly message our rules promise. | Found by deliberately sending wrong/missing JSON during Phase 2 testing (not just the happy path). Fixed the 400 handler in `Program.cs` to name the bad field in plain words ("The value of 'nic' is not in the right format."). | Test the error paths, not only the success paths — framework defaults can leak technical text to users. |
| C3 | 2026-09-28 | B (API) | A build during Phase 3 reported "2 errors", yet the commit went ahead: the check only looked for the word "Error(s)", not for **0** errors. The errors were `MSB3027: file is locked by SunShare.Api` — Kvn's own `dotnet run` (from trying Swagger) was still running and holding `bin\SunShare.Api.exe`. | Read the full build output; found the running process with `Get-CimInstance Win32_Process` (it was Kvn's, so it was left alone). Built into a separate output folder (`-p:OutDir=...`) to prove the code itself compiled (0 errors, 0 warnings), and tested on a second port (5081). Replaced the loose check with a strict one that stops unless both counts are 0. | A running app locks its own files on Windows — stop it (Ctrl+C) before building. And a check must test for success, not just for the presence of a summary line. |

### Reflection prompts (for the report write-up)
- What was harder than expected, and why?
- What would we do differently with more time?
- Which trade-offs did we accept (e.g. HTTP on LAN, secret in config) and what would production need?
- How did using AI tools help or cause problems, and how did we check their output?
