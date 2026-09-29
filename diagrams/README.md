# SunShare diagrams

Each diagram is written as **PlantUML text** (`.puml`, easy to read and change) and exported as a **PNG** for the report.

| # | Diagram | Source | Picture | What it shows |
|---|---|---|---|---|
| 1 | High-level architecture | `01-high-level-architecture.puml` | `01-high-level-architecture.png` | Users → Android app (SQLite) / web app → **SunShare.Api on IIS** (all rules in Services) → MongoDB; Google Maps for the map |
| 2 | Use case | `02-use-case.puml` | `02-use-case.png` | Actors Prosumer, Grid Operator, Backoffice officer (both staff roles share the *Staff* use cases); system boundary **SunShare**; (A)–(D) = the Part that built it |
| 3 | DFD level 0 (context) | `03-dfd-level-0.puml` | `03-dfd-level-0.png` | The whole system as one process and the data going in and out |
| 4 | DFD level 1 | `04-dfd-level-1.puml` | `04-dfd-level-1.png` | Processes 1.0–6.0 (they match the API's Services) and data stores D1–D4 (MongoDB collections) + D5 (phone SQLite) |
| 5 | Database design | `05-database-collections.puml` | `05-database-collections.png` | The 4 collections, their fields and the id references between them (one-to-many) |

DFD notation: rectangle = external entity, circle = process, cylinder = data store.

## Re-drawing the pictures after a change
PlantUML is a free Java program (`plantuml.jar`, [plantuml.com](https://plantuml.com)); it runs with the Java that comes with Android Studio. The diagrams use PlantUML's built-in layout (`!pragma layout smetana`), so Graphviz is **not** needed.

```powershell
& "C:\Program Files\Android\Android Studio\jbr\bin\java.exe" -jar plantuml.jar -tpng -charset UTF-8 diagrams\*.puml
```
