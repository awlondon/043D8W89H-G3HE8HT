import { PalletStatus, Shape } from '../data/models';

export interface PlanningItem {
  shape: Shape;
  weightPerPieceLbs: number;
  maxLengthInches: number;
}

export interface AlgorithmPiece {
  shapeId: string;
  shapeLabel?: string;
  quantity: number;
  weightPerPieceLbs: number;
  totalWeightLbs: number;
}

export interface AlgorithmLayer {
  layerIndex: number;
  weightLbs: number;
  notes?: string;
  maxLengthInches?: number;
  overhangWarning?: boolean;
  pieces: AlgorithmPiece[];
}

export interface AlgorithmPallet {
  name: string;
  maxWeightLbs: number;
  totalWeightLbs: number;
  status: PalletStatus;
  overhangWarning?: boolean;
  layers: AlgorithmLayer[];
}

export interface PalletAlgorithmInput {
  items: PlanningItem[];
  maxWeight: number;
  palletLengthIn: number;
  allowOverhangIn: number;
  startingPalletIndex?: number;
  namePrefix?: string;
}

export interface PalletAlgorithmOutput {
  pallets: AlgorithmPallet[];
  nextPalletIndex: number;
}

export function checkLengthMismatch(layer: AlgorithmLayer, item: PlanningItem) {
  if (!layer.maxLengthInches) return false;
  const ratio = item.maxLengthInches / layer.maxLengthInches;
  return ratio < 0.6;
}

export function buildPalletPlan({
  items,
  maxWeight,
  palletLengthIn,
  allowOverhangIn,
  startingPalletIndex = 1,
  namePrefix = 'Pallet',
}: PalletAlgorithmInput): PalletAlgorithmOutput {
  const created: AlgorithmPallet[] = [];
  let current: AlgorithmPallet | undefined;
  let layerSequence: number[] = [];
  let palletIndex = startingPalletIndex;

  const newLayer = (layerIndex: number): AlgorithmLayer => ({
    layerIndex,
    weightLbs: 0,
    notes: undefined,
    maxLengthInches: undefined,
    pieces: [],
    overhangWarning: false,
  });

  const newWorkingPallet = (): AlgorithmPallet => {
    const pallet: AlgorithmPallet = {
      name: `${namePrefix} ${palletIndex}`,
      maxWeightLbs: maxWeight,
      totalWeightLbs: 0,
      status: 'planned',
      layers: [newLayer(1)],
      overhangWarning: false,
    };
    palletIndex += 1;
    return pallet;
  };

  const addPieceToLayer = (layer: AlgorithmLayer, item: PlanningItem) => {
    const existing = layer.pieces.find((piece) => piece.shapeId === item.shape.id);
    if (existing) {
      existing.quantity += 1;
      existing.totalWeightLbs += item.weightPerPieceLbs;
      layer.weightLbs += item.weightPerPieceLbs;
      return;
    }

    layer.pieces.push({
      shapeId: item.shape.id,
      shapeLabel: item.shape.label,
      quantity: 1,
      weightPerPieceLbs: item.weightPerPieceLbs,
      totalWeightLbs: item.weightPerPieceLbs,
    });
    layer.weightLbs += item.weightPerPieceLbs;
  };

  for (const item of items) {
    for (let i = 0; i < item.shape.quantity; i += 1) {
      if (!current) {
        current = newWorkingPallet();
        layerSequence = [1];
      }

      const willExceed = current.totalWeightLbs + item.weightPerPieceLbs > maxWeight;
      if (willExceed) {
        created.push(current);
        current = newWorkingPallet();
        layerSequence = [1];
      }

      const layerLimit = maxWeight * 0.4;
      let layer = current.layers[current.layers.length - 1];
      const mismatch = checkLengthMismatch(layer, item);
      if (layer.weightLbs + item.weightPerPieceLbs > layerLimit || mismatch) {
        const nextIndex = (layerSequence[layerSequence.length - 1] || 0) + 1;
        layerSequence.push(nextIndex);
        layer = newLayer(nextIndex);
        current.layers.push(layer);
      }

      addPieceToLayer(layer, item);
      layer.maxLengthInches = Math.max(layer.maxLengthInches ?? 0, item.maxLengthInches);
      current.totalWeightLbs += item.weightPerPieceLbs;

      const maxAllowedLength = palletLengthIn + allowOverhangIn;
      if (item.maxLengthInches > maxAllowedLength) {
        current.overhangWarning = true;
        layer.overhangWarning = true;
      }
    }
  }

  if (current && current.layers.some((layer) => layer.pieces.length > 0)) {
    created.push(current);
  }

  return { pallets: created, nextPalletIndex: palletIndex };
}
