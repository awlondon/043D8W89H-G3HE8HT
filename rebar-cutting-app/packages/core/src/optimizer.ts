import { MIN_PART_LENGTH_INCHES } from '@rebar/shared';

import type { CutPlan, CutSegment, CutStickPlan, Job } from './models';
import { expandParts, validateJob } from './validation';

type StickState = {
  stockId: string;
  stockLength: number;
  remainingLength: number;
  segments: CutSegment[];
  order: number;
};

const finalizeRemainder = (stick: StickState) => {
  if (stick.remainingLength <= 0) {
    return;
  }

  const label =
    stick.remainingLength >= MIN_PART_LENGTH_INCHES
      ? 'KEEP_REMNANT'
      : 'WASTE';

  stick.segments.push({
    label,
    length: stick.remainingLength,
  });
};

export const generateCutPlan = (job: Job): CutPlan => {
  validateJob(job);

  const parts = expandParts(job);
  const sticks: StickState[] = job.stocks.map((stock, index) => ({
    stockId: stock.id,
    stockLength: stock.length,
    remainingLength: stock.length,
    segments: [],
    order: index,
  }));

  for (const part of parts) {
    let bestStick: StickState | undefined;
    let bestRemaining = Number.POSITIVE_INFINITY;

    for (const stick of sticks) {
      const remaining = stick.remainingLength - part.requiredLength;
      if (remaining < 0) {
        continue;
      }
      if (
        remaining < bestRemaining ||
        (remaining === bestRemaining && stick.order < (bestStick?.order ?? 0))
      ) {
        bestRemaining = remaining;
        bestStick = stick;
      }
    }

    if (!bestStick) {
      throw new Error(
        `Unable to allocate part ${part.sourceId}; insufficient stock length.`,
      );
    }

    bestStick.segments.push({
      label: 'PART',
      length: part.length + job.tolerance,
      partId: part.sourceId,
    });
    bestStick.remainingLength -= part.requiredLength;
  }

  sticks.forEach(finalizeRemainder);

  const stickPlans: CutStickPlan[] = sticks.map((stick) => ({
    stockId: stick.stockId,
    stockLength: stick.stockLength,
    segments: stick.segments,
    remainingLength: stick.remainingLength,
  }));

  for (const stick of stickPlans) {
    for (const segment of stick.segments) {
      if (
        (segment.label === 'PART' || segment.label === 'KEEP_REMNANT') &&
        segment.length < MIN_PART_LENGTH_INCHES
      ) {
        throw new Error(
          'Optimizer produced a segment shorter than the minimum length constraint.',
        );
      }
    }
  }

  return {
    jobId: job.id,
    sticks: stickPlans,
  };
};
