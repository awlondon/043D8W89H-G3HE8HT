import { MIN_PART_LENGTH_IN } from './optimizer/constraints';

import type { Job, PartRequirement, Stock } from './models';

type ExpandedPart = {
  id: string;
  sourceId: string;
  length: number;
  requiredLength: number;
};

const assertPositiveNumber = (value: number, label: string) => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive number.`);
  }
};

const assertNonNegativeNumber = (value: number, label: string) => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative number.`);
  }
};

const validateStock = (stock: Stock) => {
  assertPositiveNumber(stock.length, `Stock ${stock.id} length`);
};

const validatePart = (part: PartRequirement) => {
  assertPositiveNumber(part.length, `Part ${part.id} length`);
  if (part.length < MIN_PART_LENGTH_IN) {
    throw new Error(
      `Part ${part.id} length must be at least ${MIN_PART_LENGTH_IN} inches.`,
    );
  }
  if (!Number.isInteger(part.quantity) || part.quantity <= 0) {
    throw new Error(`Part ${part.id} quantity must be a positive integer.`);
  }
};

export const expandParts = (job: Job): ExpandedPart[] => {
  const parts: ExpandedPart[] = [];
  for (const part of job.parts) {
    for (let index = 0; index < part.quantity; index += 1) {
      const suffix = String(index + 1).padStart(2, '0');
      parts.push({
        id: `${part.id}-${suffix}`,
        sourceId: part.id,
        length: part.length,
        requiredLength: part.length + job.tolerance + job.kerf,
      });
    }
  }

  parts.sort((a, b) => {
    if (b.requiredLength !== a.requiredLength) {
      return b.requiredLength - a.requiredLength;
    }
    return a.id.localeCompare(b.id);
  });

  return parts;
};

export const validateJob = (job: Job) => {
  if (!job.stocks.length) {
    throw new Error('At least one stock length is required.');
  }
  if (!job.parts.length) {
    throw new Error('At least one part requirement is required.');
  }

  assertNonNegativeNumber(job.kerf, 'Kerf');
  assertNonNegativeNumber(job.tolerance, 'Tolerance');

  job.stocks.forEach(validateStock);
  job.parts.forEach(validatePart);

  const maxStockLength = Math.max(...job.stocks.map((stock) => stock.length));
  for (const part of job.parts) {
    const requiredLength = part.length + job.tolerance + job.kerf;
    if (requiredLength > maxStockLength) {
      throw new Error(
        `Part ${part.id} cannot fit in available stock lengths with kerf and tolerance.`,
      );
    }
  }

  const totalRequired = job.parts.reduce(
    (total, part) =>
      total + (part.length + job.tolerance + job.kerf) * part.quantity,
    0,
  );
  const totalStock = job.stocks.reduce(
    (total, stock) => total + stock.length,
    0,
  );

  if (totalRequired > totalStock) {
    throw new Error('Total required length exceeds available stock.');
  }
};
