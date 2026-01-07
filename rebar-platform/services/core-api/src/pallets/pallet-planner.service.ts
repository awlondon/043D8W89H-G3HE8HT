/**
 * Pallet Planning / Stacking Optimizer
 *
 * Algorithm overview and user stories:
 *   docs/product/pallet_planning.md
 */
import { Injectable } from '@nestjs/common';
import { computePieceWeightLbs } from '../common/rebar-weight';
import { Pallet, PalletPlanningInput, PalletStatus, PlannedPalletDto, Shape } from '../data/models';
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
import { AlgorithmPallet, buildPalletPlan, PlanningItem } from './pallet-algorithm';

@Injectable()
export class PalletPlannerService {
  private palletCounter = 1;

  async generatePlan(input: PalletPlanningInput): Promise<PlannedPalletDto[]> {
    const project = await getProject(input.projectId);
    if (!project) {
      throw new Error(`Project ${input.projectId} not found`);
    }

    const shopConfig = await getShopConfigForProject(project.id);
    const maxWeight = input.maxPalletWeightLbs ?? shopConfig?.defaultMaxPalletWeightLbs ?? 3000;
    const palletLengthIn = shopConfig?.palletLengthIn ?? 96;
    const allowOverhangIn = shopConfig?.allowOverhangIn ?? 12;

    const shapes = await getShapesForProject(input.projectId, input.shapeIds);
    if (shapes.length === 0) {
      throw new Error('No shapes found for planning');
    }

    await clearPalletsForProject(project.id);

    const items = this.buildPlanningItems(shapes);
    const { pallets, nextPalletIndex } = buildPalletPlan({
      items,
      maxWeight,
      palletLengthIn,
      allowOverhangIn,
      startingPalletIndex: this.palletCounter,
    });
    this.palletCounter = nextPalletIndex;

    const persisted = await Promise.all(pallets.map((pallet) => this.persistWorkingPallet(pallet, project.id)));
    return Promise.all(persisted.map((pallet) => getPalletWithLayers(pallet.id) as Promise<PlannedPalletDto>));
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

  private async persistWorkingPallet(pallet: AlgorithmPallet, projectId: string): Promise<Pallet> {
    const created = await createPallet({
      projectId,
      name: pallet.name,
      maxWeightLbs: pallet.maxWeightLbs,
      totalWeightLbs: pallet.totalWeightLbs,
      status: pallet.status,
      overhangWarning: pallet.overhangWarning,
    });

    for (const layer of pallet.layers) {
      const createdLayer = await createLayer({
        palletId: created.id,
        layerIndex: layer.layerIndex,
        weightLbs: layer.weightLbs,
        notes: layer.notes,
        maxLengthInches: layer.maxLengthInches,
        overhangWarning: layer.overhangWarning,
      });

      for (const piece of layer.pieces) {
        await createPiece({
          palletLayerId: createdLayer.id,
          shapeId: piece.shapeId,
          quantity: piece.quantity,
          weightPerPieceLbs: piece.weightPerPieceLbs,
          totalWeightLbs: piece.totalWeightLbs,
          shapeLabel: piece.shapeLabel,
        });
      }
    }

    return created;
  }
}
