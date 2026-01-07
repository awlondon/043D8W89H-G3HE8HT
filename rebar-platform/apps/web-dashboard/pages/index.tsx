import React, { useEffect, useState } from 'react';

type Project = {
  id: string;
  name: string;
  shopId: string;
};

type PalletPiece = {
  shapeId: string;
  shapeLabel?: string | null;
  quantity: number;
  weightPerPieceLbs: number;
  totalWeightLbs: number;
};

type PalletLayer = {
  id: string;
  layerIndex: number;
  weightLbs: number;
  overhangWarning?: boolean | null;
  pieces: PalletPiece[];
};

type PalletPlan = {
  id: string;
  projectId: string;
  name: string;
  maxWeightLbs: number;
  totalWeightLbs: number;
  status: string;
  overhangWarning?: boolean | null;
  layers: PalletLayer[];
};

type ProductionRun = {
  id: string;
  operatorId: string;
  stockUsedIn: number;
  scrapLengthIn: number;
  scrapPercent: number | null;
  isScrapFree: boolean;
  closedAt: string;
};

const CORE_API_BASE_URL = process.env.NEXT_PUBLIC_CORE_API_URL ?? 'http://localhost:3001';

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [palletPlans, setPalletPlans] = useState<PalletPlan[]>([]);
  const [runs, setRuns] = useState<ProductionRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadProjects = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${CORE_API_BASE_URL}/projects`);
        if (!response.ok) {
          throw new Error(`Failed to load projects (${response.status})`);
        }
        const data = (await response.json()) as Project[];
        if (!active) return;
        setProjects(data);
        setSelectedProjectId((prev) => prev ?? data[0]?.id ?? null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load projects');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProjects();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedProjectId) {
      setPalletPlans([]);
      setRuns([]);
      return;
    }

    let active = true;
    const loadProjectData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [palletsResponse, runsResponse] = await Promise.all([
          fetch(`${CORE_API_BASE_URL}/projects/${selectedProjectId}/pallet-plans`),
          fetch(`${CORE_API_BASE_URL}/projects/${selectedProjectId}/runs`),
        ]);
        if (!palletsResponse.ok) {
          throw new Error(`Failed to load pallet plans (${palletsResponse.status})`);
        }
        if (!runsResponse.ok) {
          throw new Error(`Failed to load production runs (${runsResponse.status})`);
        }
        const palletsData = (await palletsResponse.json()) as PalletPlan[];
        const runsData = (await runsResponse.json()) as ProductionRun[];
        if (!active) return;
        setPalletPlans(palletsData);
        setRuns(runsData);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load project data');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProjectData();
    return () => {
      active = false;
    };
  }, [selectedProjectId]);

  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null;

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Core API Dashboard</h1>
      <p style={{ marginBottom: '1.5rem', color: '#4b5563' }}>
        Live operational data sourced from core-api.
      </p>

      {loading && <p>Loading data…</p>}
      {error && (
        <div style={{ background: '#fee2e2', padding: '0.75rem', borderRadius: 6, marginBottom: '1rem' }}>
          <strong style={{ color: '#991b1b' }}>Error:</strong> {error}
        </div>
      )}

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Projects</h2>
        {projects.length === 0 && !loading && <p>No projects available.</p>}
        {projects.length > 0 && (
          <select
            value={selectedProjectId ?? ''}
            onChange={(event) => setSelectedProjectId(event.target.value)}
            style={{ padding: '0.5rem', minWidth: 260 }}
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        )}
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
          Pallet plans {selectedProject ? `· ${selectedProject.name}` : ''}
        </h2>
        {palletPlans.length === 0 && !loading && <p>No pallet plans found.</p>}
        {palletPlans.map((pallet) => (
          <div
            key={pallet.id}
            style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '1rem', marginBottom: '1rem' }}
          >
            <strong>{pallet.name}</strong>
            <p>
              {pallet.totalWeightLbs.toFixed(0)} lbs / {pallet.maxWeightLbs.toFixed(0)} lbs · Status: {pallet.status}
            </p>
            {pallet.overhangWarning && <p style={{ color: '#b45309' }}>Overhang warning</p>}
            {pallet.layers.map((layer) => (
              <div key={layer.id} style={{ marginLeft: '1rem', marginTop: '0.5rem' }}>
                <strong>Layer {layer.layerIndex}</strong> · {layer.weightLbs.toFixed(0)} lbs
                {layer.overhangWarning && <span style={{ color: '#b45309' }}> · Overhang</span>}
                <ul>
                  {layer.pieces.map((piece) => (
                    <li key={piece.shapeId}>
                      {piece.quantity} × {piece.shapeLabel ?? piece.shapeId} ({piece.totalWeightLbs.toFixed(0)} lbs)
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </section>

      <section>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Production runs</h2>
        {runs.length === 0 && !loading && <p>No production runs found.</p>}
        {runs.map((run) => (
          <div
            key={run.id}
            style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.75rem', marginBottom: '0.75rem' }}
          >
            <strong>Run {run.id}</strong>
            <p>Operator: {run.operatorId}</p>
            <p>
              Scrap: {run.scrapLengthIn.toFixed(1)} in · Stock used: {run.stockUsedIn.toFixed(0)} in · Scrap-free:{' '}
              {run.isScrapFree ? 'Yes' : 'No'}
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}
