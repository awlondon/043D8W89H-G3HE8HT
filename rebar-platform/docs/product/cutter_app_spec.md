# Cutter App Specification

## 6.4 Scrap-Free Metric

**Definition**

```
scrapPercent = (Total scrap length / Total stock length) × 100
```

A run is marked scrap-free when `scrapPercent` is less than or equal to the shop-level
`scrapFreeThresholdPercent` (default: 2.0%). Shops can change this threshold in settings, and
the value used for each run is persisted alongside the result for auditing.

**System behavior**

- During run closeout, the backend computes `scrapPercent`, compares it to the configured
  threshold, and sets `isScrapFree` on the `ProductionRun` record (see the runs service for
  implementation; the comment there links back to this definition).
- Both fields are stored on `ProductionRun` for downstream analytics and UI.
- Run detail and list APIs expose `scrapPercent` and `isScrapFree` so the field app and dashboard
  can render badges/messages that mirror the threshold used.
- Operator- and shop-level scrap-free rates are exposed via `/analytics/operators/:operatorId/scrap-free`
  and `/analytics/shops/:shopId/scrap-free` for dashboard tiles.
