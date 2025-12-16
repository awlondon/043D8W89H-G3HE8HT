import React from 'react';

export default function HomePage() {
  const operatorScrapFree = {
    operatorId: 'op-1',
    totalRuns: 12,
    scrapFreeRuns: 10,
    scrapFreeRatePercent: 83.3,
  };

  const shopScrapFree = {
    shopId: 'shop-1',
    totalRuns: 24,
    scrapFreeRuns: 18,
    scrapFreeRatePercent: 75,
  };

  return (
    <main>
      <h1>Rebar Web Dashboard</h1>
      <p>Manage shops, seats, projects, AI sales workflows, and optimization analytics.</p>

      <section>
        <h2>Operator Scrap-Free Metrics</h2>
        <p>
          Data source: <code>GET /analytics/operators/:operatorId/scrap-free</code>
        </p>
        <ul>
          <li>
            Scrap-Free Runs: {operatorScrapFree.scrapFreeRuns} / {operatorScrapFree.totalRuns}
          </li>
          <li>Scrap-Free Run Rate: {operatorScrapFree.scrapFreeRatePercent}%</li>
        </ul>
      </section>

      <section>
        <h2>Shop Scrap-Free Overview</h2>
        <p>
          Data source: <code>GET /analytics/shops/:shopId/scrap-free</code>
        </p>
        <div>
          <strong>Scrap-Free Run Rate (Last 30 Days):</strong> {shopScrapFree.scrapFreeRatePercent}%
        </div>
        <div>
          <small>
            {shopScrapFree.scrapFreeRuns} of {shopScrapFree.totalRuns} runs
          </small>
        </div>
        <div style={{ marginTop: 12, padding: 12, border: '1px solid #ccc', borderRadius: 8 }}>
          <div style={{ fontWeight: 600 }}>Scrap-Free Run Rate (Last 30 Days)</div>
          <div style={{ fontSize: 18 }}>
            {shopScrapFree.scrapFreeRatePercent}% ({shopScrapFree.scrapFreeRuns} of
            {` ${shopScrapFree.totalRuns} runs`})
          </div>
          <a href="/runs" style={{ color: '#1e3a8a', textDecoration: 'underline' }}>
            View underlying run list
          </a>
        </div>
      </section>
    </main>
  );
}
