# AppSheet Rebar Cutting App Blueprint

A ready-to-ingest AppSheet definition that ties the near-term cutting app to the broader bench roadmap. Copy these tables, columns, actions, and workflows into AppSheet (or use them as the basis for an exportable JSON definition) to get Alex running quickly.

## Core Tables

### RebarInventory
| Column | Type | Details |
| --- | --- | --- |
| ID | Number (key) | `UNIQUEID()` initial value |
| BarDiameter | Number |  |
| BarLength | Number |  |
| QuantityAvailable | Number |  |
| Notes | LongText |  |

### CutRequests
| Column | Type | Details |
| --- | --- | --- |
| ID | Number (key) | `UNIQUEID()` initial value |
| RequestedLength | Number |  |
| Diameter | Number |  |
| Quantity | Number |  |
| DateRequested | DateTime | `NOW()` initial value |
| Status | Enum | Pending / Cut / Rejected (default Pending) |
| InventoryBarID | Ref | Points to **RebarInventory** |
| Notes | LongText |  |
| InventoryCheck | Virtual | `IF(LOOKUP([Diameter],"RebarInventory","BarDiameter","QuantityAvailable") >= [Quantity], "Enough stock", "Insufficient stock")` |
| TotalCutLength | Virtual | `[RequestedLength]*[Quantity]` |

## Actions and Workflows
- **Actions**
  - `MarkAsCut` (CutRequests): Set `Status` → `Cut`.
  - `DeductInventory` (RebarInventory): Set `QuantityAvailable` → `[QuantityAvailable]-[Related CutRequests].[Quantity]`, only if related request `Status` = `Cut`.
- **Workflows/Bots**
  - `NotifyOnNewRequest` (CutRequests): Trigger when `Status = Pending`; send notification "New rebar cut request received."
  - `UpdateInventoryOnCut` (CutRequests): Trigger when `Status = Cut`; run `DeductInventory` action.
- **Views**
  - `InventoryTable` (Table on RebarInventory)
  - `AddCutRequestForm` (Form on CutRequests)
  - `Dashboard` (Dashboard with InventoryTable + AddCutRequestForm)

## Bars / Cut Plan Extensions (Scrap-Aware)

### Bars Sheet
| Column | Type | Formula / Expression | Notes |
| --- | --- | --- | --- |
| BarID | Number | — | Unique ID |
| JobID | Ref | — | Links to **Jobs** |
| Diameter | Number | — | mm |
| Length | Number | — | Original bar length |
| Bends | Number | — | Count of bends |
| BendAngles | EnumList | — | 90, 135, … |
| StretchAllowance | Number | `SUM(SELECT(BendAngles[_THISROW], IF([_THISROW]=90,1.5,IF([_THISROW]=135,0,0))))` | Added length from bends |
| CutLength | Number | `[Length] + [StretchAllowance]` | Final bar cut length |
| RemainingLength | Number | `[Length] - [CutLength]` | Updated via workflow |
| ScrapFlag | Yes/No | `IF([RemainingLength] < MinimumUseableLength, TRUE, FALSE)` | Flags leftover scrap |
| OperatorPrompt | Text | `CONCATENATE("Cut bar ", [BarID], ", bend sequence: ", [BendAngles])` | Operator guidance |

### CutPlan Sheet
| Column | Type | Formula / Expression |
| --- | --- | --- |
| CutID | Number | — |
| BarID | Ref | Links to **Bars** |
| CutLength | Number | `[BarID].[CutLength]` |
| RemainingLength | Number | `[BarID].[RemainingLength]` |
| ScrapFlag | Yes/No | `[BarID].[ScrapFlag]` |
| OperatorPrompt | Text | `[BarID].[OperatorPrompt]` |
| NextBarID | Ref | `MINROW("Bars","RemainingLength")` (shortest leftover that fits next cut) |

### Jobs Sheet
| Column | Type | Formula |
| --- | --- | --- |
| JobID | Number | — |
| JobName | Text | — |
| Priority | Enum | High / Medium / Low |
| Status | Enum | Active / Complete |
| TotalBars | Number | `COUNT(SELECT(Bars[BarID],[JobID]=[_THISROW]))` |
| TotalScrap | Number | `SUM(SELECT(Bars[RemainingLength],[JobID]=[_THISROW] AND [ScrapFlag]=TRUE))` |

## Behavior: Minimizing Scrap and Guiding Operators
- **Action:** Mark Cut Complete — updates `RemainingLength` after a cut and triggers recalculation of `NextBarID`.
- **Slice:** Next Cut — only bars where `RemainingLength > MinimumUseableLength`, sorted by `Job.Priority` to process high-priority work first.
- **View:** Operator Dashboard — shows `NextBarID`, `CutLength`, `BendAngles`, and `OperatorPrompt` with a button to mark the cut done.
- **Virtual Columns:** Keep `CutLength` + `StretchAllowance` and `ScrapFlag` current so operators avoid wasteful picks.

## Sample Bend Allowance Formula
```appsheets
SUM(
  SELECT(
    [BendAngles][_THISROW],
    IF([_THISROW] = 90, 1.5, IF([_THISROW] = 135, 0, 0))
  )
)
```

## Starter Dataset (CSV/JSON Friendly)
- **jobs.csv** (example rows):
  - `JobID,JobName,Priority,TotalBars,Status`
  - `1,Foundation A,High,5,Active`
  - `2,Foundation B,Medium,4,Active`
  - ...
- **bars.csv** (example columns):
  - `BarID,JobID,Diameter,Length,Bends,BendAngles,StretchAllowance,CutLength,RemainingLength,ScrapFlag,OperatorPrompt`
  - Sample row: `1,1,4,240,4,"90,90,135,135",3.0,243,0,FALSE,"Cut Bar 1, bend sequence: 90,90,135,135"`
- **cutplan.csv** (example columns):
  - `CutID,BarID,CutLength,RemainingLength,ScrapFlag,OperatorPrompt,NextBarID`
  - Sample row: `1,1,243,0,FALSE,"Cut Bar 1, bend sequence: 90,90,135,135",2`
- **Simulation parameters (JSON):** `{ "num_operators": 2, "hours_per_week": 40, "bend_allowances": {"90": 1.5, "135": 0}, "min_usable_length": 12, "bar_length": 240, "weeks_per_year": 52 }`

## Scheduling Logic (Pseudo-Code)
```python
for week in range(weeks_per_year):
    for operator in operators:
        while operator.hours_left > 0 and bars_remaining(bars):
            bar_id = pick_next_bar_min_scrap(bars)
            bar = bars[bar_id]
            if requires_die_change(operator, bar):
                operator.pause(die_change_time)
            cut_length = bar.length + sum_bend_allowances(bar.bends)
            if cut_length > bar.remaining_length:
                mark_as_scrap(bar)
                continue
            process_cut(bar, cut_length)
            bar.remaining_length -= cut_length
            operator.hours_left -= time_per_cut(bar)
    record_weekly_metrics(week)
```
- **Outputs to track:** total cuts completed, scrap length & cost, total cost savings (~$238k/year target), operator efficiency, die changes.

## Usage Steps in AppSheet
1. Copy **RebarInventory** and **CutRequests** into Google Sheets and start an AppSheet app from that data.
2. Configure columns, actions, workflows, and views per the tables above (or import as JSON from an export).
3. Layer in **Bars**, **CutPlan**, and **Jobs** for scrap-minimized planning and operator guidance.
4. Run the simulation logic to validate savings and throughput before field rollout.
