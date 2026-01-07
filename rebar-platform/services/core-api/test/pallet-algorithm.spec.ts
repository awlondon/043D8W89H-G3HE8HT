import { buildPalletPlan } from '../src/pallets/pallet-algorithm';
import { Shape } from '../src/data/models';

describe('buildPalletPlan', () => {
  const makeShape = (overrides: Partial<Shape>): Shape => ({
    id: 'shape-1',
    projectId: 'project-1',
    label: 'A1',
    barSize: '#4',
    finalLengthInches: 120,
    quantity: 1,
    maxLengthInches: 120,
    shapeType: 'straight',
    jobSheetId: null,
    ...overrides,
  });

  it('splits overweight pallets', () => {
    const heavy = makeShape({ id: 'heavy', quantity: 3, finalLengthInches: 120, maxLengthInches: 120 });
    const { pallets } = buildPalletPlan({
      items: [
        {
          shape: heavy,
          weightPerPieceLbs: 600,
          maxLengthInches: heavy.maxLengthInches ?? heavy.finalLengthInches,
        },
      ],
      maxWeight: 1000,
      palletLengthIn: 96,
      allowOverhangIn: 12,
    });

    expect(pallets.length).toBeGreaterThan(1);
    pallets.forEach((pallet) => expect(pallet.totalWeightLbs).toBeLessThanOrEqual(1000));
  });

  it('starts a new layer on length mismatch', () => {
    const long = makeShape({ id: 'long', label: 'LONG', quantity: 1, finalLengthInches: 200, maxLengthInches: 200 });
    const short = makeShape({ id: 'short', label: 'SHORT', quantity: 1, finalLengthInches: 90, maxLengthInches: 90 });

    const { pallets } = buildPalletPlan({
      items: [
        { shape: long, weightPerPieceLbs: 100, maxLengthInches: long.maxLengthInches ?? long.finalLengthInches },
        { shape: short, weightPerPieceLbs: 100, maxLengthInches: short.maxLengthInches ?? short.finalLengthInches },
      ],
      maxWeight: 1000,
      palletLengthIn: 96,
      allowOverhangIn: 12,
    });

    expect(pallets[0].layers.length).toBeGreaterThanOrEqual(2);
  });

  it('flags overhang warnings', () => {
    const overhang = makeShape({ id: 'overhang', quantity: 1, finalLengthInches: 140, maxLengthInches: 140 });
    const { pallets } = buildPalletPlan({
      items: [
        {
          shape: overhang,
          weightPerPieceLbs: 50,
          maxLengthInches: overhang.maxLengthInches ?? overhang.finalLengthInches,
        },
      ],
      maxWeight: 500,
      palletLengthIn: 96,
      allowOverhangIn: 12,
    });

    expect(pallets[0].overhangWarning).toBe(true);
    expect(pallets[0].layers[0].overhangWarning).toBe(true);
  });

  it('keeps mixed bar sizes in the same pallet output', () => {
    const shapeA = makeShape({ id: 'shape-a', label: 'A1', barSize: '#4', quantity: 2 });
    const shapeB = makeShape({ id: 'shape-b', label: 'B2', barSize: '#6', quantity: 1 });

    const { pallets } = buildPalletPlan({
      items: [
        {
          shape: shapeA,
          weightPerPieceLbs: 40,
          maxLengthInches: shapeA.maxLengthInches ?? shapeA.finalLengthInches,
        },
        {
          shape: shapeB,
          weightPerPieceLbs: 80,
          maxLengthInches: shapeB.maxLengthInches ?? shapeB.finalLengthInches,
        },
      ],
      maxWeight: 1000,
      palletLengthIn: 96,
      allowOverhangIn: 12,
    });

    const allPieces = pallets[0].layers.flatMap((layer) => layer.pieces);
    const ids = allPieces.map((piece) => piece.shapeId);
    expect(ids).toEqual(expect.arrayContaining([shapeA.id, shapeB.id]));
  });
});
