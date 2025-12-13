# Cutter App Specification

## 6.4 Scrap-Free Metric

A run is considered "scrap-free" when:

```
scrapPercent = (Total scrap length / Total stock length) × 100
```

is less than or equal to a shop-configurable threshold (default 2%).

The system:

- Computes `scrapPercent` at run closeout.
- Sets `isScrapFree` accordingly.
- Tracks scrap-free run rate by operator and by shop.
- Surfaces the status in the field app run summary and dashboard analytics tiles.
