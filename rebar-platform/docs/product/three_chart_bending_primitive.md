# Three-Chart Bending Primitive

Related:
- [Bender App Spec](./bender_app_spec.md)
- [Cutter App Spec](./cutter_app_spec.md)

## Overview
The three-chart bending primitive keeps bend instructions operator-neutral by composing three independent data layers:

1. **Perceived Stretch (bend-side)** – accounts for spring-back and perceived elongation by bar size and angle.
2. **Feed Datum (draw-through)** – inches drawn from the feed side before the bend, by bar size and angle.
3. **Bend Datum / Machine Geometry** – machine-specific offsets for backplates and fixtures.

## Canonical tables
### Perceived Stretch (inches)
| Bar size | 90° | 135° | 180° |
| --- | --- | --- | --- |
| #4 | +1.5 | 0.0 | −1.5 |
| #5 | +2.0 | 0.0 | −2.0 |
| #6 | +2.0 | 0.0 | −2.0 |

### Feed Datum (draw-through inches)
| Bar size | 90° | 135° | 180° | Provisional? |
| --- | --- | --- | --- | --- |
| #4 | 0.0 | 1.5 | 3.0 | No |
| #5 | 0.5 | 2.5 | 4.5 | Yes |
| #6 | 0.5 | 2.5 | 4.5 | Yes |

### Machine / Bend Datum configuration (inches)
| Machine mode | #4 offset | #5 offset | #6 offset | Global config offset |
| --- | --- | --- | --- | --- |
| BASE | 1.0 | 0.0 | 0.0 | 0.0 |
| ONE_BACKPLATE_REMOVED | 1.0 | 0.0 | 0.0 | 0.0 |
| BOTH_SWAPPED | 1.0 | 0.0 | 0.0 | 2.25 |

## Composition
Given a bend instruction input:
- machineId
- barSize
- angleDeg
- targetBendSideLengthIn (desired bend-side length)

The backend computes:

```
stretch = perceivedStretch(barSize, angleDeg)
feed = feedDraw(barSize, angleDeg)
machineOffset = offset(barSize) + globalConfigOffsetIn

effectiveBendSideLengthIn = targetBendSideLengthIn + stretch
measureFromFeedDatumIn = effectiveBendSideLengthIn + feed.drawIn + machineOffset
```

Return payload:
- effectiveBendSideLengthIn
- feedDrawIn
- machineOffsetIn
- measureFromFeedDatumIn
- provisionalFeed (true if the feed draw entry is provisional)

## Operator experience
- Tablet/web bender UI calls `POST /bend-compensation/compute` and displays both the primary measurement and the component inputs.
- Admins calibrate Perceived Stretch, Feed Draw, and Machine Config tables via `/admin` endpoints and web dashboard tables.
- AR overlays use **effectiveBendSideLengthIn** on the bend side and **measureFromFeedDatumIn** for feed-datum positioning.
