import { MIN_PART_LENGTH_IN } from './constraints';
import { InfeasiblePartError, InsufficientStockError, ValidationError } from './errors';
import type { CutPlan, PartRequirement, StockAllocation, StockItem } from '../domain';

type CutPlanInput = {
  stock: StockItem[];
  requirements: PartRequirement[];
  kerfIn: number;
  toleranceIn: number;
  minPartLengthIn?: number;
};

type ExpandedPart = {
  partId: string;
  specKey: string;
  lengthIn: number;
  effectiveLenIn: number;
  sequence: number;
};

type StockUnit = {
  stockId: string;
  specKey: string;
  lengthIn: number;
  stockUnitIndex: number;
  allowKeepRemnants: boolean;
};

type Bin = {
  specKey: string;
  stockUnit: StockUnit;
  remainingIn: number;
  parts: ExpandedPart[];
  order: number;
};

const EPSILON = 1e-9;

const assertNonNegative = (value: number, label: string) => {
  if (!Number.isFinite(value) || value < 0) {
    throw new ValidationError(`${label} must be a non-negative number.`);
  }
};

const assertPositiveInteger = (value: number, label: string) => {
  if (!Number.isInteger(value) || value <= 0) {
    throw new ValidationError(`${label} must be a positive integer.`);
  }
};

const assertMinLength = (lengthIn: number, minLengthIn: number, partId: string, specKey: string) => {
  if (lengthIn + EPSILON < minLengthIn) {
    throw new ValidationError(
      `Part ${partId} length must be at least ${minLengthIn} inches.`,
      { partId, specKey, lengthIn },
    );
  }
};

const expandStock = (items: StockItem[]): StockUnit[] => {
  const units: StockUnit[] = [];
  for (const item of items) {
    assertPositiveInteger(item.quantity, `Stock ${item.stockId} quantity`);
    if (!Number.isFinite(item.lengthIn) || item.lengthIn <= 0) {
      throw new ValidationError(`Stock ${item.stockId} length must be a positive number.`, {
        specKey: item.specKey,
        lengthIn: item.lengthIn,
      });
    }
    const allowKeepRemnants = item.allowKeepRemnants !== false;
    for (let index = 1; index <= item.quantity; index += 1) {
      units.push({
        stockId: item.stockId,
        specKey: item.specKey,
        lengthIn: item.lengthIn,
        stockUnitIndex: index,
        allowKeepRemnants,
      });
    }
  }
  return units;
};

const expandRequirements = (
  requirements: PartRequirement[],
  toleranceIn: number,
  minLengthIn: number,
): ExpandedPart[] => {
  const expanded: ExpandedPart[] = [];
  let sequence = 0;
  for (const requirement of requirements) {
    assertPositiveInteger(
      requirement.quantity,
      `Part ${requirement.partId} quantity`,
    );
    if (!Number.isFinite(requirement.lengthIn) || requirement.lengthIn <= 0) {
      throw new ValidationError(`Part ${requirement.partId} length must be a positive number.`, {
        specKey: requirement.specKey,
        partId: requirement.partId,
        lengthIn: requirement.lengthIn,
      });
    }
    assertMinLength(requirement.lengthIn, minLengthIn, requirement.partId, requirement.specKey);
    const effectiveLenIn = requirement.lengthIn + toleranceIn;
    for (let index = 0; index < requirement.quantity; index += 1) {
      sequence += 1;
      expanded.push({
        partId: requirement.partId,
        specKey: requirement.specKey,
        lengthIn: requirement.lengthIn,
        effectiveLenIn,
        sequence,
      });
    }
  }

  expanded.sort((a, b) => {
    if (Math.abs(b.effectiveLenIn - a.effectiveLenIn) > EPSILON) {
      return b.effectiveLenIn - a.effectiveLenIn;
    }
    if (a.partId !== b.partId) {
      return a.partId.localeCompare(b.partId);
    }
    return a.sequence - b.sequence;
  });

  return expanded;
};

const findBestFitBin = (bins: Bin[], part: ExpandedPart, kerfIn: number): Bin | undefined => {
  let bestBin: Bin | undefined;
  let bestRemaining = Number.POSITIVE_INFINITY;
  const required = part.effectiveLenIn + kerfIn;

  for (const bin of bins) {
    const remaining = bin.remainingIn - required;
    if (remaining < -EPSILON) {
      continue;
    }
    if (
      remaining < bestRemaining - EPSILON ||
      (Math.abs(remaining - bestRemaining) <= EPSILON && bin.order < (bestBin?.order ?? 0))
    ) {
      bestRemaining = remaining;
      bestBin = bin;
    }
  }

  return bestBin;
};

const chooseStockUnit = (units: StockUnit[], required: number): { unit?: StockUnit; index: number } => {
  let bestIndex = -1;
  let bestLength = Number.POSITIVE_INFINITY;
  for (let index = 0; index < units.length; index += 1) {
    const unit = units[index];
    if (unit.lengthIn + EPSILON < required) {
      continue;
    }
    if (unit.lengthIn < bestLength - EPSILON) {
      bestLength = unit.lengthIn;
      bestIndex = index;
    } else if (
      Math.abs(unit.lengthIn - bestLength) <= EPSILON &&
      bestIndex >= 0 &&
      (unit.stockId < units[bestIndex].stockId ||
        (unit.stockId === units[bestIndex].stockId &&
          unit.stockUnitIndex < units[bestIndex].stockUnitIndex))
    ) {
      bestIndex = index;
    }
  }

  if (bestIndex === -1) {
    return { index: -1 };
  }
  return { unit: units[bestIndex], index: bestIndex };
};

const finalizeAllocation = (
  bin: Bin,
  kerfIn: number,
  minLengthIn: number,
): StockAllocation => {
  const sortedParts = [...bin.parts].sort((a, b) => {
    if (Math.abs(b.effectiveLenIn - a.effectiveLenIn) > EPSILON) {
      return b.effectiveLenIn - a.effectiveLenIn;
    }
    if (a.partId !== b.partId) {
      return a.partId.localeCompare(b.partId);
    }
    return a.sequence - b.sequence;
  });

  const cuts = sortedParts.map((part, index) => ({
    cutIndex: index + 1,
    makeLengthIn: part.effectiveLenIn,
    partId: part.partId,
  }));

  const totalCutLength = cuts.reduce((total, cut) => total + cut.makeLengthIn, 0);
  const totalKerf = cuts.length * kerfIn;
  const computedRemainder = bin.stockUnit.lengthIn - totalCutLength - totalKerf;
  const remainderLengthIn = Math.max(0, computedRemainder);
  const remainderKind =
    remainderLengthIn + EPSILON >= minLengthIn && bin.stockUnit.allowKeepRemnants
      ? 'KEEP_REMNANT'
      : 'WASTE';

  if (remainderKind === 'KEEP_REMNANT' && remainderLengthIn + EPSILON < minLengthIn) {
    throw new Error('Optimizer produced an invalid KEEP_REMNANT segment.');
  }

  return {
    stockId: bin.stockUnit.stockId,
    stockUnitIndex: bin.stockUnit.stockUnitIndex,
    specKey: bin.specKey,
    originalLengthIn: bin.stockUnit.lengthIn,
    cuts,
    remainder: {
      lengthIn: remainderLengthIn,
      kind: remainderKind,
    },
  };
};

const ensureFeasible = (
  parts: ExpandedPart[],
  stockUnits: StockUnit[],
  kerfIn: number,
): void => {
  if (!stockUnits.length) {
    const firstPart = parts[0];
    if (firstPart) {
      throw new InfeasiblePartError(`No stock available for spec ${firstPart.specKey}.`, {
        specKey: firstPart.specKey,
        partId: firstPart.partId,
        lengthIn: firstPart.lengthIn,
      });
    }
    return;
  }

  const maxStockLen = Math.max(...stockUnits.map((unit) => unit.lengthIn));
  for (const part of parts) {
    const required = part.effectiveLenIn + kerfIn;
    if (required > maxStockLen + EPSILON) {
      throw new InfeasiblePartError(
        `Part ${part.partId} cannot fit within available stock for spec ${part.specKey}.`,
        { specKey: part.specKey, partId: part.partId, lengthIn: part.lengthIn },
      );
    }
  }
};

export const optimizeCutPlan = (input: CutPlanInput): CutPlan => {
  assertNonNegative(input.kerfIn, 'Kerf');
  assertNonNegative(input.toleranceIn, 'Tolerance');

  const minLengthIn = input.minPartLengthIn ?? MIN_PART_LENGTH_IN;
  if (!Number.isFinite(minLengthIn) || minLengthIn <= 0) {
    throw new ValidationError('Minimum part length must be a positive number.');
  }

  const stockUnits = expandStock(input.stock);
  const parts = expandRequirements(input.requirements, input.toleranceIn, minLengthIn);

  const stockBySpec = new Map<string, StockUnit[]>();
  for (const unit of stockUnits) {
    const list = stockBySpec.get(unit.specKey) ?? [];
    list.push(unit);
    stockBySpec.set(unit.specKey, list);
  }

  for (const [specKey, units] of stockBySpec.entries()) {
    units.sort((a, b) => {
      if (Math.abs(a.lengthIn - b.lengthIn) > EPSILON) {
        return a.lengthIn - b.lengthIn;
      }
      if (a.stockId !== b.stockId) {
        return a.stockId.localeCompare(b.stockId);
      }
      return a.stockUnitIndex - b.stockUnitIndex;
    });
    stockBySpec.set(specKey, units);
  }

  const partsBySpec = new Map<string, ExpandedPart[]>();
  for (const part of parts) {
    const list = partsBySpec.get(part.specKey) ?? [];
    list.push(part);
    partsBySpec.set(part.specKey, list);
  }

  const allocations: StockAllocation[] = [];
  let binOrder = 0;

  for (const [specKey, specParts] of partsBySpec.entries()) {
    const specUnits = stockBySpec.get(specKey) ?? [];
    ensureFeasible(specParts, specUnits, input.kerfIn);

    const bins: Bin[] = [];

    for (const part of specParts) {
      const bestBin = findBestFitBin(bins, part, input.kerfIn);
      const required = part.effectiveLenIn + input.kerfIn;

      if (bestBin) {
        bestBin.remainingIn -= required;
        bestBin.parts.push(part);
        continue;
      }

      const { unit, index } = chooseStockUnit(specUnits, required);
      if (!unit || index < 0) {
        throw new InsufficientStockError(
          `Insufficient stock to allocate part ${part.partId} for spec ${specKey}.`,
          { specKey, partId: part.partId, lengthIn: part.lengthIn },
        );
      }
      specUnits.splice(index, 1);
      binOrder += 1;
      bins.push({
        specKey,
        stockUnit: unit,
        remainingIn: unit.lengthIn - required,
        parts: [part],
        order: binOrder,
      });
    }

    for (const bin of bins) {
      allocations.push(finalizeAllocation(bin, input.kerfIn, minLengthIn));
    }
  }

  const totalStockIn = allocations.reduce(
    (total, allocation) => total + allocation.originalLengthIn,
    0,
  );
  const totalCuts = allocations.reduce((total, allocation) => total + allocation.cuts.length, 0);
  const totalPartIn = allocations.reduce(
    (total, allocation) =>
      total + allocation.cuts.reduce((sum, cut) => sum + cut.makeLengthIn, 0),
    0,
  );
  const wasteIn = allocations.reduce(
    (total, allocation) =>
      allocation.remainder.kind === 'WASTE' ? total + allocation.remainder.lengthIn : total,
    0,
  );
  const keptRemnantIn = allocations.reduce(
    (total, allocation) =>
      allocation.remainder.kind === 'KEEP_REMNANT'
        ? total + allocation.remainder.lengthIn
        : total,
    0,
  );
  const utilizationPct = totalStockIn > 0 ? totalPartIn / totalStockIn : 0;

  const totalKerf = totalCuts * input.kerfIn;
  const totalRemainderIn = allocations.reduce(
    (total, allocation) => total + allocation.remainder.lengthIn,
    0,
  );
  const totalPlanned = totalPartIn + totalKerf + totalRemainderIn;
  if (totalStockIn > 0 && Math.abs(totalPlanned - totalStockIn) > EPSILON * allocations.length) {
    throw new Error('Optimizer produced inconsistent stock usage totals.');
  }

  return {
    allocations,
    summary: {
      utilizationPct,
      wasteIn,
      keptRemnantIn,
    },
  };
};

export type { CutPlanInput };
