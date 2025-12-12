import { PalletPlannerService, checkLengthMismatch } from '../src/pallets/pallet-planner.service';
import { getInventorySnapshot, resetAllPallets } from '../src/data/data-store';

describe('PalletPlannerService', () => {
  beforeEach(() => {
    resetAllPallets();
  });

  it('keeps pallets under the configured weight limit and persists records', () => {
    const service = new PalletPlannerService();
    const plan = service.generatePlan({ projectId: 'project-1', maxPalletWeightLbs: 900 });

    expect(plan.length).toBeGreaterThan(0);
    plan.forEach((pallet) => {
      expect(pallet.totalWeightLbs).toBeLessThanOrEqual(900);
      const totalLayerWeight = pallet.layers.reduce((sum, layer) => sum + layer.weightLbs, 0);
      expect(Math.round(totalLayerWeight)).toBe(Math.round(pallet.totalWeightLbs));
    });

    const snapshot = getInventorySnapshot();
    expect(snapshot.pallets.length).toBe(plan.length);
    expect(snapshot.palletLayers.length).toBeGreaterThan(0);
    expect(snapshot.palletPieces.length).toBeGreaterThan(0);
  });

  it('allows all shapes to live on a single pallet when the ceiling is high enough', () => {
    const service = new PalletPlannerService();
    const plan = service.generatePlan({ projectId: 'project-1', maxPalletWeightLbs: 20000 });

    expect(plan.length).toBe(1);
    expect(plan[0].layers.length).toBeGreaterThan(0);
  });

  it('splits many shapes into multiple pallets when the ceiling is low', () => {
    const service = new PalletPlannerService();
    const plan = service.generatePlan({ projectId: 'project-1', maxPalletWeightLbs: 500 });

    expect(plan.length).toBeGreaterThan(1);
    const nearLimit = plan.some((pallet) => pallet.totalWeightLbs > 0.9 * pallet.maxWeightLbs);
    expect(nearLimit).toBe(true);
  });
});

describe('checkLengthMismatch', () => {
  it('detects large jumps between layers', () => {
    const mismatch = checkLengthMismatch(
      { layerIndex: 1, weightLbs: 0, notes: undefined, maxLengthInches: 200, pieces: [] },
      { shape: undefined as any, weightPerPieceLbs: 10, maxLengthInches: 90 },
    );
    expect(mismatch).toBe(true);
  });

  it('ignores similar lengths', () => {
    const mismatch = checkLengthMismatch(
      { layerIndex: 1, weightLbs: 0, notes: undefined, maxLengthInches: 120, pieces: [] },
      { shape: undefined as any, weightPerPieceLbs: 10, maxLengthInches: 100 },
    );
    expect(mismatch).toBe(false);
  });
});
