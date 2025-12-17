# Data Model Overview

Core entities include shops (with scrap-free thresholds), seats, projects, job sheets, shapes, bend rules, cut/bend plans, production runs with scrap-free status, scrap records, future stock pieces, leads, deals, commissions, marketing fund ledger entries, and call logs.

See `services/core-api/prisma/schema.prisma` for the authoritative schema used by Prisma/PostgreSQL.

## Bend compensation data

The bend workflow is driven by three independent tables surfaced via the core API and mirrored in memory for demos:

- **PerceivedStretch**: `{ id, barSize, angleDeg, offsetIn, isDefault }` canonical offsets for #4/#5/#6 at 90/135/180 degrees.
- **FeedDraw**: `{ id, barSize, angleDeg, drawIn, isDefault, isProvisional }` feed-side draw-through allowances; #5/#6 values are provisional.
- **MachineConfig**: `{ id, machineId, mode, offset4BarIn, offset5BarIn, offset6BarIn, globalConfigOffsetIn }` describing backplate geometry per machine and mode.

`BendCompensationService` composes these layers with `computeBendSetpoints()` to return bend-side effective length, feed draw, machine offset, and the final feed-datum measurement. The service is exposed via `POST /bend-compensation/compute` and admin CRUD endpoints for calibration.
