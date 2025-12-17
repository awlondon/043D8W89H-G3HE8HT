# Bender App Spec

The bender experience runs on the field tablet and mirrors the cutter app's offline-first flows. Operators pull bend instructions from the core API and receive clear datum references for tape pulls, AR overlays, and QA snapshots.

## Core workflows
- Select a project/shape from the synced queue.
- Fetch bend instructions for the current machine and bar size.
- Display feed-datum measurements, bend-side effective lengths, and backplate mode indicators.
- Capture operator acknowledgements and optional QA photos after each bend sequence.

### 3-Chart Bending Primitive
The Bender app uses three independent data layers:

- Perceived Stretch (bend-side offset by bar size and angle)
- Feed Datum (feed-side draw-through)
- Bend Datum / Machine Geometry (backplate and fixture offsets)

See [Three-Chart Bending Primitive](./three_chart_bending_primitive.md) for the full tables and composition rules.
