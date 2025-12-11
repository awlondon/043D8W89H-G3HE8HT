# Field Tablet App

React Native offline-first application for cutters and benders using Android tablets. The app is optimized for gloves-on operation with large, high-contrast controls.

## Planned Screens
- Authentication and shop selection.
- Project list with sync status.
- Job sheet review with OCR corrections.
- Cutter and bender execution views with counters and prompts.
- Settings and calibration overrides with audit trails.

## Offline-first Strategy
- Local queue for cut runs, bend runs, and corrections.
- Background sync to `services/core-api` when connectivity is detected.
- Conflict detection and annotations for supervisor review.
