/**
 * API surface for pallet planning and stacking updates.
 * See docs/product/pallet_planning.md for user stories and request/response intent.
 */
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { PalletPlanningInput, PalletStatus } from '../data/models';
import { PalletPlannerService } from './pallet-planner.service';

interface PlanRequestDto {
  shapeIds?: string[];
  maxPalletWeightLbsOverride?: number;
}

interface UpdatePalletStatusDto {
  status: PalletStatus;
}

@Controller()
export class PalletsController {
  constructor(private readonly planner: PalletPlannerService) {}

  @Post('projects/:projectId/pallet-plans')
  generatePalletPlan(@Param('projectId') projectId: string, @Body() body: PlanRequestDto) {
    const planInput: PalletPlanningInput = {
      projectId,
      shapeIds: body.shapeIds,
      maxPalletWeightLbs: body.maxPalletWeightLbsOverride,
    };
    return this.planner.generatePlan(planInput);
  }

  @Get('projects/:projectId/pallet-plans')
  listPlans(@Param('projectId') projectId: string) {
    return this.planner.listProjectPlans(projectId);
  }

  @Get('pallets/:palletId')
  async getPallet(@Param('palletId') palletId: string) {
    const pallet = await this.planner.getPallet(palletId);
    if (!pallet) {
      throw new Error('Pallet not found');
    }
    return pallet;
  }

  @Patch('pallets/:palletId')
  async updateStatus(@Param('palletId') palletId: string, @Body() body: UpdatePalletStatusDto) {
    this.validateStatus(body.status);
    const pallet = await this.planner.updatePalletStatus(palletId, body.status);
    if (!pallet) {
      throw new Error('Pallet not found');
    }
    return pallet;
  }

  private validateStatus(status: PalletStatus) {
    const allowed: PalletStatus[] = ['planned', 'stacking', 'stacked', 'loaded'];
    if (!allowed.includes(status)) {
      throw new Error(`Invalid status ${status}`);
    }
  }
}
