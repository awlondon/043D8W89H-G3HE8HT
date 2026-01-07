import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { BendCompensationService } from './bend-compensation.service';
import { BendSetpoints, FeedDraw, MachineConfig, PerceivedStretch } from '../data/models';

type ComputeBendSetpointsDto = {
  machineId: string;
  barSize: string;
  angleDeg: number;
  targetBendSideLengthIn: number;
};

type UpdatePerceivedStretchDto = Partial<Pick<PerceivedStretch, 'angleDeg' | 'barSize' | 'offsetIn' | 'isDefault'>>;

type UpdateFeedDrawDto = Partial<Pick<FeedDraw, 'angleDeg' | 'barSize' | 'drawIn' | 'isDefault' | 'isProvisional'>>;

type UpdateMachineConfigDto = Partial<Omit<MachineConfig, 'id' | 'machineId'>>;

type CreatePerceivedStretchDto = Omit<PerceivedStretch, 'id'>;

type CreateFeedDrawDto = Omit<FeedDraw, 'id'>;

@Controller()
export class BendCompensationController {
  constructor(private readonly bending: BendCompensationService) {}

  @Post('bend-compensation/compute')
  compute(@Body() body: ComputeBendSetpointsDto): Promise<BendSetpoints> {
    return this.bending.computeBendSetpoints(body);
  }

  @Get('admin/perceived-stretch')
  listPerceivedStretch(): Promise<PerceivedStretch[]> {
    return this.bending.listPerceivedStretch();
  }

  @Post('admin/perceived-stretch')
  addPerceivedStretch(@Body() body: CreatePerceivedStretchDto): Promise<PerceivedStretch> {
    return this.bending.addPerceivedStretch(body);
  }

  @Patch('admin/perceived-stretch/:id')
  updatePerceivedStretch(@Param('id') id: string, @Body() body: UpdatePerceivedStretchDto): Promise<PerceivedStretch> {
    return this.bending.updatePerceivedStretch(id, body);
  }

  @Get('admin/feed-draw')
  listFeedDraw(): Promise<FeedDraw[]> {
    return this.bending.listFeedDraws();
  }

  @Post('admin/feed-draw')
  addFeedDraw(@Body() body: CreateFeedDrawDto): Promise<FeedDraw> {
    return this.bending.addFeedDraw(body);
  }

  @Patch('admin/feed-draw/:id')
  updateFeedDraw(@Param('id') id: string, @Body() body: UpdateFeedDrawDto): Promise<FeedDraw> {
    return this.bending.updateFeedDraw(id, body);
  }

  @Get('admin/machines/:machineId/config')
  getMachineConfig(@Param('machineId') machineId: string): Promise<MachineConfig> {
    return this.bending.getMachineConfig(machineId);
  }

  @Patch('admin/machines/:machineId/config')
  updateMachineConfig(@Param('machineId') machineId: string, @Body() body: UpdateMachineConfigDto): Promise<MachineConfig> {
    return this.bending.updateMachineConfig(machineId, body);
  }
}
