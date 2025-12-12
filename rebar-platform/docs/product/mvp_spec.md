# MVP Spec

## Goals
- Offline-first field tablet for cutters and benders with job sheet intake and execution tracking.
- Core API for projects, job sheets, shapes, cut/bend plans, and stock tracking.
- OCR microservice for job sheet parsing with manual correction flows.
- Web dashboard for uploads, optimization runs, and shop/seat management.

## Scope Highlights
- Authentication and seat licensing per shop.
- Project + job sheet creation with photo upload.
- Bending rule calibration per bar size.
- Cutter and bender workflows with counters and completion logging.
- Scrap capture and future stock ledger entries.

### Pallet Planning (v1.2+)

The platform will include a pallet stacking optimizer that uses piece size, weight, and quantity to suggest pallet groupings
and layer order that stay within forklift limits and reduce restacking. See [Pallet Planning Spec](./pallet_planning.md) for
details.
