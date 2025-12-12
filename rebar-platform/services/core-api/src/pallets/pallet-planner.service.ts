/**
 * Pallet Planning / Stacking Optimizer
 *
 * Algorithm overview and user stories:
 *   docs/product/pallet_planning.md
 */
import { Injectable } from '@nestjs/common';
import { computePieceWeightLbs } from '../common/rebar-weight';
import {
  Pallet,
  PalletLayer,
  PalletPiece,
  PalletPlanningInput,
  PalletStatus,
  PlannedPalletDto,
  Shape,
} from '../data/models';
import {
  clearPalletsForProject,
  createLayer,
  createPallet,
  createPiece,
  getPalletWithLayers,
  getProject,
  getShopConfigForProject,
  getShapesForProject,
  listPalletsForProject,
  updatePalletStatus,
} from '../data/data-store';

interface PlanningItem {
  shape: Shape;
  weightPerPieceLbs: number;
  maxLengthInches: number;
}

interface WorkingLayer extends Omit<PalletLayer, 'id' | 'palletId'> {
  pieces: PalletPiece[];
}

interface WorkingPallet extends Omit<Pallet, 'id' | 'createdAt' | 'updatedAt'> {
  layers: WorkingLayer[];
}

export function checkLengthMismatch(layer: WorkingLayer, item: PlanningItem) {
  if (!layer.maxLengthInches) return false;
  const ratio = item.maxLengthInches / layer.maxLengthInches;
  return ratio < 0.6;
}

@Injectable()
export class PalletPlannerService {
  private palletCounter = 1;

  generatePlan(input: PalletPlanningInput): PlannedPalletDto[] {
    const project = getProject(input.projectId);
    if (!project) {
      throw new Error(`Project ${input.projectId} not found`);
    }

    const shopConfig = getShopConfigForProject(project.id);
    const maxWeight = input.maxPalletWeightLbs ?? shopConfig?.defaultMaxPalletWeightLbs ?? 3000;
    const palletLengthIn = shopConfig?.palletLengthIn ?? 96;
    const allowOverhangIn = shopConfig?.allowOverhangIn ?? 12;

    const shapes = getShapesForProject(input.projectId, input.shapeIds);
    if (shapes.length === 0) {
      throw new Error('No shapes found for planning');
    }

    clearPalletsForProject(project.id);

    const items = this.buildPlanningItems(shapes);
    const pallets = this.buildPallets(items, maxWeight, palletLengthIn, allowOverhangIn, project.id);
    return pallets.map((pallet) => getPalletWithLayers(pallet.id) as PlannedPalletDto);
  }

  listProjectPlans(projectId: string) {
    return listPalletsForProject(projectId);
  }

  getPallet(palletId: string) {
    return getPalletWithLayers(palletId);
  }

  updatePalletStatus(palletId: string, status: PalletStatus) {
    return updatePalletStatus(palletId, status);
  }

  private buildPlanningItems(shapes: Shape[]): PlanningItem[] {
    return shapes
      .map((shape) => ({
        shape,
        weightPerPieceLbs: computePieceWeightLbs(shape.barSize, shape.finalLengthInches),
        maxLengthInches: shape.maxLengthInches ?? shape.finalLengthInches,
      }))
      .sort((a, b) => {
        if (b.weightPerPieceLbs !== a.weightPerPieceLbs) {
          return b.weightPerPieceLbs - a.weightPerPieceLbs;
        }
        return (b.maxLengthInches ?? 0) - (a.maxLengthInches ?? 0);
      });
  }

  private buildPallets(
    items: PlanningItem[],
    maxWeight: number,
    palletLengthIn: number,
    allowOverhangIn: number,
    projectId: string,
  ) {
    const created: Pallet[] = [];
    let current: WorkingPallet | undefined;
    let layerSequence: number[] = [];

    items.forEach((item) => {
      for (let i = 0; i < item.shape.quantity; i += 1) {
        const pieceWeight = item.weightPerPieceLbs;
        if (!current) {
          current = this.newWorkingPallet(projectId, maxWeight);
          layerSequence = [1];
        }

        const willExceed = current.totalWeightLbs + pieceWeight > maxWeight;
        if (willExceed) {
          created.push(this.persistWorkingPallet(current));
          current = this.newWorkingPallet(projectId, maxWeight);
          layerSequence = [1];
        }

        const layerLimit = maxWeight * 0.4;
        let layer = current.layers[current.layers.length - 1];
        const mismatch = checkLengthMismatch(layer, item);
        if (layer.weightLbs + pieceWeight > layerLimit || mismatch) {
          const nextIndex = (layerSequence[layerSequence.length - 1] || 0) + 1;
          layerSequence.push(nextIndex);
          layer = this.newLayer(nextIndex);
          current.layers.push(layer);
        }

        this.addPieceToLayer(layer, item.shape, pieceWeight);
        layer.maxLengthInches = Math.max(layer.maxLengthInches ?? 0, item.maxLengthInches);
        current.totalWeightLbs += pieceWeight;

        const maxAllowedLength = palletLengthIn + allowOverhangIn;
        if (item.maxLengthInches > maxAllowedLength) {
          current.overhangWarning = true;
          layer.overhangWarning = true;
        }
      }
    });

    if (current && current.layers.some((layer) => layer.pieces.length > 0)) {
      created.push(this.persistWorkingPallet(current));
    }

    return created;
  }

  private newWorkingPallet(projectId: string, maxWeightLbs: number): WorkingPallet {
    return {
      projectId,
      name: `Pallet ${this.palletCounter++}`,
      maxWeightLbs,
      totalWeightLbs: 0,
      status: 'planned',
      layers: [this.newLayer(1)],
      overhangWarning: false,
    };
  }

  private newLayer(layerIndex: number): WorkingLayer {
    return {
      layerIndex,
      weightLbs: 0,
      notes: undefined,
      maxLengthInches: undefined,
      pieces: [],
      overhangWarning: false,
    };
  }

  private addPieceToLayer(layer: WorkingLayer, shape: Shape, weightPerPieceLbs: number) {
    const existing = layer.pieces.find((piece) => piece.shapeId === shape.id);
    if (existing) {
      existing.quantity += 1;
      existing.totalWeightLbs += weightPerPieceLbs;
      layer.weightLbs += weightPerPieceLbs;
      return;
    }

    layer.pieces.push({
      id: 'pending',
      palletLayerId: 'pending',
      shapeId: shape.id,
      shapeLabel: shape.label,
      quantity: 1,
      weightPerPieceLbs,
      totalWeightLbs: weightPerPieceLbs,
    });
    layer.weightLbs += weightPerPieceLbs;
  }

  private persistWorkingPallet(pallet: WorkingPallet): Pallet {
    const created = createPallet({
      ...pallet,
      name: pallet.name,
    });

    pallet.layers.forEach((layer) => {
      const createdLayer = createLayer({
        palletId: created.id,
        layerIndex: layer.layerIndex,
        weightLbs: layer.pieces.reduce((sum, piece) => sum + piece.totalWeightLbs, 0),
        notes: layer.notes,
        maxLengthInches: layer.maxLengthInches,
        overhangWarning: layer.overhangWarning,
      });

      layer.pieces.forEach((piece) => {
        createPiece({
          palletLayerId: createdLayer.id,
          shapeId: piece.shapeId,
          quantity: piece.quantity,
          weightPerPieceLbs: piece.weightPerPieceLbs,
          totalWeightLbs: piece.totalWeightLbs,
          shapeLabel: piece.shapeLabel,
        });
      });
    });

    return created;
  }
}
