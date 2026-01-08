import { describe, expect, it } from 'vitest';

import {
  InfeasiblePartError,
  InsufficientStockError,
  MIN_PART_LENGTH_IN,
  optimizeCutPlan,
} from '../../src/optimizer/index';
import type { PartRequirement, StockItem } from '../../src/domain';

type BaseInput = {
  stock: StockItem[];
  requirements: PartRequirement[];
  kerfIn: number;
  toleranceIn: number;
};

const buildInput = (): BaseInput => ({
  stock: [
    { stockId: 'stock-a', specKey: 'G60', lengthIn: 120, quantity: 1 },
    { stockId: 'stock-b', specKey: 'G60', lengthIn: 96, quantity: 1 },
  ],
  requirements: [
    { partId: 'part-1', specKey: 'G60', lengthIn: 36, quantity: 2 },
    { partId: 'part-2', specKey: 'G60', lengthIn: 24, quantity: 1 },
  ],
  kerfIn: 0.125,
  toleranceIn: 0.25,
});

describe('optimizeCutPlan', () => {
  it('ensures no PART segments are below the minimum length', () => {
    const input = buildInput();
    const plan = optimizeCutPlan(input);

    for (const allocation of plan.allocations) {
      for (const cut of allocation.cuts) {
        expect(cut.makeLengthIn).toBeGreaterThanOrEqual(MIN_PART_LENGTH_IN);
      }
    }
  });

  it('labels remainders below the minimum as WASTE', () => {
    const input: BaseInput = {
      stock: [
        {
          stockId: 'stock-1',
          specKey: 'G60',
          lengthIn: MIN_PART_LENGTH_IN + 10,
          quantity: 1,
        },
      ],
      requirements: [
        {
          partId: 'part-a',
          specKey: 'G60',
          lengthIn: MIN_PART_LENGTH_IN,
          quantity: 1,
        },
      ],
      kerfIn: 0,
      toleranceIn: 0,
    };

    const plan = optimizeCutPlan(input);
    const remainder = plan.allocations[0]?.remainder;

    expect(remainder).toBeDefined();
    expect(remainder?.lengthIn).toBeLessThan(MIN_PART_LENGTH_IN);
    expect(remainder?.kind).toBe('WASTE');
  });

  it('allows WASTE below the minimum length', () => {
    const input: BaseInput = {
      stock: [
        {
          stockId: 'stock-1',
          specKey: 'G60',
          lengthIn: MIN_PART_LENGTH_IN + 10,
          quantity: 1,
        },
      ],
      requirements: [
        {
          partId: 'part-a',
          specKey: 'G60',
          lengthIn: MIN_PART_LENGTH_IN,
          quantity: 1,
        },
      ],
      kerfIn: 0,
      toleranceIn: 0,
    };

    const plan = optimizeCutPlan(input);
    const remainder = plan.allocations[0]?.remainder;

    expect(remainder?.lengthIn).toBeLessThan(MIN_PART_LENGTH_IN);
    expect(remainder?.kind).toBe('WASTE');
  });

  it('applies kerf per cut and keeps minimum remainder', () => {
    const input: BaseInput = {
      stock: [{ stockId: 'stock-1', specKey: 'G60', lengthIn: 100, quantity: 1 }],
      requirements: [
        { partId: 'part-1', specKey: 'G60', lengthIn: 40, quantity: 2 },
      ],
      kerfIn: 1,
      toleranceIn: 0,
    };

    const plan = optimizeCutPlan(input);
    const remainder = plan.allocations[0]?.remainder;

    expect(remainder?.lengthIn).toBeCloseTo(MIN_PART_LENGTH_IN, 5);
    expect(remainder?.kind).toBe('KEEP_REMNANT');
  });

  it('matches output quantities to requested quantities', () => {
    const input = buildInput();
    const plan = optimizeCutPlan(input);
    const counts = new Map<string, number>();

    for (const allocation of plan.allocations) {
      for (const cut of allocation.cuts) {
        counts.set(cut.partId, (counts.get(cut.partId) ?? 0) + 1);
      }
    }

    for (const requirement of input.requirements) {
      expect(counts.get(requirement.partId)).toBe(requirement.quantity);
    }
  });

  it('groups allocations by specKey without mixing stock', () => {
    const input: BaseInput = {
      stock: [
        { stockId: 'stock-a', specKey: 'G60', lengthIn: 100, quantity: 1 },
        { stockId: 'stock-b', specKey: 'X10', lengthIn: 100, quantity: 1 },
      ],
      requirements: [
        { partId: 'part-a', specKey: 'G60', lengthIn: 40, quantity: 1 },
        { partId: 'part-b', specKey: 'X10', lengthIn: 30, quantity: 1 },
      ],
      kerfIn: 0,
      toleranceIn: 0,
    };

    const plan = optimizeCutPlan(input);
    const allocationSpecs = new Map<string, Set<string>>();

    for (const allocation of plan.allocations) {
      const cutSpecs = allocationSpecs.get(allocation.stockId) ?? new Set<string>();
      cutSpecs.add(allocation.specKey);
      allocationSpecs.set(allocation.stockId, cutSpecs);
    }

    for (const specs of allocationSpecs.values()) {
      expect(specs.size).toBe(1);
    }
  });

  it('throws when a part is infeasible', () => {
    const input: BaseInput = {
      stock: [{ stockId: 'stock-a', specKey: 'G60', lengthIn: 60, quantity: 1 }],
      requirements: [
        { partId: 'part-a', specKey: 'G60', lengthIn: 59, quantity: 1 },
      ],
      kerfIn: 2,
      toleranceIn: 0,
    };

    expect(() => optimizeCutPlan(input)).toThrow(InfeasiblePartError);
  });

  it('throws when stock quantity is insufficient', () => {
    const input: BaseInput = {
      stock: [{ stockId: 'stock-a', specKey: 'G60', lengthIn: 100, quantity: 1 }],
      requirements: [
        { partId: 'part-a', specKey: 'G60', lengthIn: 50, quantity: 3 },
      ],
      kerfIn: 0,
      toleranceIn: 0,
    };

    expect(() => optimizeCutPlan(input)).toThrow(InsufficientStockError);
  });
});
