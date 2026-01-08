import { describe, expect, it } from 'vitest';

import { MIN_PART_LENGTH_INCHES } from '@rebar/shared';

import { generateCutPlan, type Job } from '../src';

const baseJob = (): Job => ({
  id: 'job-001',
  kerf: 0.125,
  tolerance: 0.25,
  stocks: [
    { id: 'stock-1', length: 120 },
    { id: 'stock-2', length: 96 },
  ],
  parts: [
    { id: 'part-a', length: 36, quantity: 2 },
    { id: 'part-b', length: 24, quantity: 1 },
  ],
});

describe('generateCutPlan', () => {
  it('ensures all PART segments respect the minimum length', () => {
    const plan = generateCutPlan(baseJob());
    const parts = plan.sticks.flatMap((stick) =>
      stick.segments.filter((segment) => segment.label === 'PART'),
    );

    for (const segment of parts) {
      expect(segment.length).toBeGreaterThanOrEqual(MIN_PART_LENGTH_INCHES);
    }
  });

  it('labels remainders below the minimum as WASTE', () => {
    const job: Job = {
      id: 'job-002',
      kerf: 0.125,
      tolerance: 0,
      stocks: [{ id: 'stock-1', length: 40 }],
      parts: [{ id: 'part-a', length: 18, quantity: 1 }],
    };

    const plan = generateCutPlan(job);
    const remainder = plan.sticks[0]?.segments.find(
      (segment) => segment.label === 'WASTE',
    );

    expect(remainder).toBeDefined();
    expect(remainder?.length).toBeLessThan(MIN_PART_LENGTH_INCHES);
  });

  it('labels remainders above the minimum as KEEP_REMNANT', () => {
    const job: Job = {
      id: 'job-003',
      kerf: 0.125,
      tolerance: 0,
      stocks: [{ id: 'stock-1', length: 80 }],
      parts: [{ id: 'part-a', length: 18, quantity: 1 }],
    };

    const plan = generateCutPlan(job);
    const remainder = plan.sticks[0]?.segments.find(
      (segment) => segment.label === 'KEEP_REMNANT',
    );

    expect(remainder).toBeDefined();
    expect(remainder?.length).toBeGreaterThanOrEqual(MIN_PART_LENGTH_INCHES);
  });

  it('applies kerf for every cut', () => {
    const job = baseJob();
    const plan = generateCutPlan(job);
    const totalParts = job.parts.reduce(
      (total, part) => total + part.quantity,
      0,
    );
    const totalStock = job.stocks.reduce(
      (total, stock) => total + stock.length,
      0,
    );
    const totalPlanned = plan.sticks.reduce(
      (total, stick) =>
        total + stick.segments.reduce((sum, segment) => sum + segment.length, 0),
      0,
    );

    const expectedKerf = totalParts * job.kerf;
    const expectedMaterialUsage = totalPlanned + expectedKerf;

    expect(expectedMaterialUsage).toBeCloseTo(totalStock, 5);
  });

  it('matches output quantities to requested quantities', () => {
    const job = baseJob();
    const plan = generateCutPlan(job);
    const counts = plan.sticks
      .flatMap((stick) => stick.segments)
      .filter((segment) => segment.label === 'PART')
      .reduce<Record<string, number>>((acc, segment) => {
        const key = segment.partId ?? 'unknown';
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {});

    for (const part of job.parts) {
      expect(counts[part.id]).toBe(part.quantity);
    }
  });
});
