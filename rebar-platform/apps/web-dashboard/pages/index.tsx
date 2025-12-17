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

  const [perceivedStretch, setPerceivedStretch] = React.useState(
    () =>
      [
        { id: 'stretch-4-90', barSize: '#4', angleDeg: 90, offsetIn: 1.5, isDefault: true },
        { id: 'stretch-4-135', barSize: '#4', angleDeg: 135, offsetIn: 0, isDefault: true },
        { id: 'stretch-4-180', barSize: '#4', angleDeg: 180, offsetIn: -1.5, isDefault: true },
        { id: 'stretch-5-90', barSize: '#5', angleDeg: 90, offsetIn: 2, isDefault: true },
        { id: 'stretch-5-135', barSize: '#5', angleDeg: 135, offsetIn: 0, isDefault: true },
        { id: 'stretch-5-180', barSize: '#5', angleDeg: 180, offsetIn: -2, isDefault: true },
        { id: 'stretch-6-90', barSize: '#6', angleDeg: 90, offsetIn: 2, isDefault: true },
        { id: 'stretch-6-135', barSize: '#6', angleDeg: 135, offsetIn: 0, isDefault: true },
        { id: 'stretch-6-180', barSize: '#6', angleDeg: 180, offsetIn: -2, isDefault: true },
      ] as Array<{
        id: string;
        barSize: string;
        angleDeg: number;
        offsetIn: number;
        isDefault: boolean;
      }>,
  );

  const [feedDraws, setFeedDraws] = React.useState(
    () =>
      [
        { id: 'feed-4-90', barSize: '#4', angleDeg: 90, drawIn: 0, isDefault: true, isProvisional: false },
        { id: 'feed-4-135', barSize: '#4', angleDeg: 135, drawIn: 1.5, isDefault: true, isProvisional: false },
        { id: 'feed-4-180', barSize: '#4', angleDeg: 180, drawIn: 3, isDefault: true, isProvisional: false },
        { id: 'feed-5-90', barSize: '#5', angleDeg: 90, drawIn: 0.5, isDefault: true, isProvisional: true },
        { id: 'feed-5-135', barSize: '#5', angleDeg: 135, drawIn: 2.5, isDefault: true, isProvisional: true },
        { id: 'feed-5-180', barSize: '#5', angleDeg: 180, drawIn: 4.5, isDefault: true, isProvisional: true },
        { id: 'feed-6-90', barSize: '#6', angleDeg: 90, drawIn: 0.5, isDefault: true, isProvisional: true },
        { id: 'feed-6-135', barSize: '#6', angleDeg: 135, drawIn: 2.5, isDefault: true, isProvisional: true },
        { id: 'feed-6-180', barSize: '#6', angleDeg: 180, drawIn: 4.5, isDefault: true, isProvisional: true },
      ] as Array<{
        id: string;
        barSize: string;
        angleDeg: number;
        drawIn: number;
        isDefault: boolean;
        isProvisional: boolean;
      }>,
  );

  const [machineConfigs, setMachineConfigs] = React.useState(
    () =>
      [
        {
          machineId: 'machine-123',
          mode: 'BASE',
          offset4BarIn: 1.0,
          offset5BarIn: 0.0,
          offset6BarIn: 0.0,
          globalConfigOffsetIn: 0.0,
        },
        {
          machineId: 'machine-456',
          mode: 'BOTH_SWAPPED',
          offset4BarIn: 1.0,
          offset5BarIn: 0.0,
          offset6BarIn: 0.0,
          globalConfigOffsetIn: 2.25,
        },
      ] as Array<{
        machineId: string;
        mode: 'BASE' | 'ONE_BACKPLATE_REMOVED' | 'BOTH_SWAPPED';
        offset4BarIn: number;
        offset5BarIn: number;
        offset6BarIn: number;
        globalConfigOffsetIn: number;
      }>,
  );

  const updateStretchOffset = (id: string, value: number) => {
    setPerceivedStretch((entries) => entries.map((entry) => (entry.id === id ? { ...entry, offsetIn: value } : entry)));
  };

  const updateFeedDraw = (id: string, value: Partial<{ drawIn: number; isProvisional: boolean }>) => {
    setFeedDraws((entries) => entries.map((entry) => (entry.id === id ? { ...entry, ...value } : entry)));
  };

  const updateMachineConfig = (
    machineId: string,
    value: Partial<{
      mode: 'BASE' | 'ONE_BACKPLATE_REMOVED' | 'BOTH_SWAPPED';
      offset4BarIn: number;
      offset5BarIn: number;
      offset6BarIn: number;
      globalConfigOffsetIn: number;
    }>,
  ) => {
    setMachineConfigs((configs) => configs.map((config) => (config.machineId === machineId ? { ...config, ...value } : config)));
  };

  const effectiveOffset = (config: (typeof machineConfigs)[number], barSize: '#4' | '#5' | '#6') => {
    const perBar = barSize === '#4' ? config.offset4BarIn : barSize === '#5' ? config.offset5BarIn : config.offset6BarIn;
    return perBar + config.globalConfigOffsetIn;
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

      <section>
        <h2>3-Chart Bending Primitive Admin</h2>
        <p>
          Backed by <code>/admin/perceived-stretch</code>, <code>/admin/feed-draw</code>, and
          <code> /admin/machines/:machineId/config</code> on the core API.
        </p>

        <div style={{ marginBottom: 20 }}>
          <h3>Perceived Stretch (bend-side)</h3>
          <p style={{ marginTop: 0 }}>Inline edits mirror calibration updates to the table.</p>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Bar Size</th>
                <th style={{ textAlign: 'left' }}>Angle</th>
                <th style={{ textAlign: 'left' }}>Offset (in)</th>
                <th style={{ textAlign: 'left' }}>Default?</th>
              </tr>
            </thead>
            <tbody>
              {perceivedStretch.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.barSize}</td>
                  <td>{entry.angleDeg}°</td>
                  <td>
                    <input
                      type="number"
                      step="0.25"
                      value={entry.offsetIn}
                      onChange={(event) => updateStretchOffset(entry.id, Number(event.target.value))}
                    />
                  </td>
                  <td>{entry.isDefault ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ color: '#b45309' }}>Warning: keep #4/#6 symmetry aligned around zero for consistent spring-back.</p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <h3>Feed Datum (draw-through)</h3>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Bar Size</th>
                <th style={{ textAlign: 'left' }}>Angle</th>
                <th style={{ textAlign: 'left' }}>Draw (in)</th>
                <th style={{ textAlign: 'left' }}>Provisional?</th>
              </tr>
            </thead>
            <tbody>
              {feedDraws.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.barSize}</td>
                  <td>{entry.angleDeg}°</td>
                  <td>
                    <input
                      type="number"
                      step="0.25"
                      value={entry.drawIn}
                      onChange={(event) => updateFeedDraw(entry.id, { drawIn: Number(event.target.value) })}
                    />
                  </td>
                  <td>
                    <label>
                      <input
                        type="checkbox"
                        checked={entry.isProvisional}
                        onChange={(event) => updateFeedDraw(entry.id, { isProvisional: event.target.checked })}
                      />{' '}
                      Provisional
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h3>Machine Configuration</h3>
          {machineConfigs.map((config) => (
            <div key={config.machineId} style={{ marginBottom: 12, padding: 12, border: '1px solid #ccc', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{config.machineId}</strong>
                <select
                  value={config.mode}
                  onChange={(event) =>
                    updateMachineConfig(config.machineId, {
                      mode: event.target.value as typeof config.mode,
                      globalConfigOffsetIn: event.target.value === 'BOTH_SWAPPED' ? 2.25 : config.globalConfigOffsetIn,
                    })
                  }
                >
                  <option value="BASE">BASE</option>
                  <option value="ONE_BACKPLATE_REMOVED">ONE_BACKPLATE_REMOVED</option>
                  <option value="BOTH_SWAPPED">BOTH_SWAPPED</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginTop: 8 }}>
                <label>
                  4-bar offset
                  <input
                    type="number"
                    value={config.offset4BarIn}
                    onChange={(event) => updateMachineConfig(config.machineId, { offset4BarIn: Number(event.target.value) })}
                  />
                </label>
                <label>
                  5-bar offset
                  <input
                    type="number"
                    value={config.offset5BarIn}
                    onChange={(event) => updateMachineConfig(config.machineId, { offset5BarIn: Number(event.target.value) })}
                  />
                </label>
                <label>
                  6-bar offset
                  <input
                    type="number"
                    value={config.offset6BarIn}
                    onChange={(event) => updateMachineConfig(config.machineId, { offset6BarIn: Number(event.target.value) })}
                  />
                </label>
                <label>
                  Global config offset
                  <input
                    type="number"
                    value={config.globalConfigOffsetIn}
                    onChange={(event) => updateMachineConfig(config.machineId, { globalConfigOffsetIn: Number(event.target.value) })}
                  />
                </label>
              </div>
              <div style={{ marginTop: 8, fontSize: 14 }}>
                Effective offsets: #4 → {effectiveOffset(config, '#4').toFixed(2)}", #5 →
                {` ${effectiveOffset(config, '#5').toFixed(2)}"`}, #6 → {effectiveOffset(config, '#6').toFixed(2)}".
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
