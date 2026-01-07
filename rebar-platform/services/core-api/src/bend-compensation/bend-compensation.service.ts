import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  addFeedDraw,
  addPerceivedStretch,
  ensureMachineConfig,
  findFeedDraw,
  findPerceivedStretch,
  getMachineConfig as getMachineConfigRecord,
  listFeedDraws,
  listMachineConfigs,
  listPerceivedStretch,
  updateFeedDraw,
  updateMachineConfig as updateMachineConfigRecord,
  updatePerceivedStretch,
} from '../data/data-store';
import { BendSetpoints, FeedDraw, MachineConfig, PerceivedStretch } from '../data/models';

type BendSetpointInput = {
  machineId: string;
  barSize: string;
  angleDeg: number;
  targetBendSideLengthIn: number;
};

type FeedDrawLookup = { drawIn: number; provisional: boolean };

const ALLOWED_ANGLES = new Set([90, 135, 180]);

@Injectable()
export class BendCompensationService {
  async getPerceivedStretch(barSize: string, angleDeg: number): Promise<number> {
    const record = await findPerceivedStretch(barSize, angleDeg);
    return record?.offsetIn ?? 0;
  }

  async getFeedDraw(barSize: string, angleDeg: number): Promise<FeedDrawLookup> {
    const record = await findFeedDraw(barSize, angleDeg);
    if (!record) {
      throw new NotFoundException(`Feed draw not found for ${barSize} at ${angleDeg}deg`);
    }
    return { drawIn: record.drawIn, provisional: record.isProvisional };
  }

  async getMachineOffset(machineId: string, barSize: string): Promise<number> {
    const config = await getMachineConfigRecord(machineId);
    if (!config) {
      throw new NotFoundException(`Machine config not found for ${machineId}`);
    }

    const perBarOffset = this.resolveBarOffset(config, barSize);
    return perBarOffset + config.globalConfigOffsetIn;
  }

  async computeBendSetpoints(params: BendSetpointInput): Promise<BendSetpoints> {
    this.validateInput(params);

    const stretch = await this.getPerceivedStretch(params.barSize, params.angleDeg);
    const { drawIn, provisional } = await this.getFeedDraw(params.barSize, params.angleDeg);
    const machineOffset = await this.getMachineOffset(params.machineId, params.barSize);

    // Three-chart model: stretch (material behavior), feed draw (machine feed datum), and machine datum offset (hardware calibration)
    // are combined to determine the tape-measure distance from the feed datum to the bend location.
    const effectiveBendSideLengthIn = params.targetBendSideLengthIn + stretch;
    const measureFromFeedDatumIn = effectiveBendSideLengthIn + drawIn + machineOffset;

    return {
      effectiveBendSideLengthIn,
      feedDrawIn: drawIn,
      machineOffsetIn: machineOffset,
      measureFromFeedDatumIn,
      provisionalFeed: provisional,
    };
  }

  listPerceivedStretch(): Promise<PerceivedStretch[]> {
    return listPerceivedStretch();
  }

  async updatePerceivedStretch(id: string, input: Partial<PerceivedStretch>): Promise<PerceivedStretch> {
    const updated = await updatePerceivedStretch(id, input);
    if (!updated) {
      throw new NotFoundException('Perceived stretch entry not found');
    }
    return updated;
  }

  addPerceivedStretch(input: Omit<PerceivedStretch, 'id'>): Promise<PerceivedStretch> {
    return addPerceivedStretch(input);
  }

  listFeedDraws(): Promise<FeedDraw[]> {
    return listFeedDraws();
  }

  async updateFeedDraw(id: string, input: Partial<FeedDraw>): Promise<FeedDraw> {
    const updated = await updateFeedDraw(id, input);
    if (!updated) {
      throw new NotFoundException('Feed draw entry not found');
    }
    return updated;
  }

  addFeedDraw(input: Omit<FeedDraw, 'id'>): Promise<FeedDraw> {
    return addFeedDraw(input);
  }

  getMachineConfigs(): Promise<MachineConfig[]> {
    return listMachineConfigs();
  }

  async getMachineConfig(machineId: string): Promise<MachineConfig> {
    const config = await getMachineConfigRecord(machineId);
    if (!config) {
      throw new NotFoundException('Machine config not found');
    }
    return config;
  }

  async updateMachineConfig(
    machineId: string,
    input: Partial<Omit<MachineConfig, 'id' | 'machineId'>>,
  ): Promise<MachineConfig> {
    const updated = await updateMachineConfigRecord(machineId, input);
    if (!updated) {
      throw new NotFoundException('Machine config not found');
    }
    return updated;
  }

  upsertMachineConfig(machineId: string, input: Omit<MachineConfig, 'id' | 'machineId'>): Promise<MachineConfig> {
    return ensureMachineConfig(machineId, input);
  }

  private resolveBarOffset(config: MachineConfig, barSize: string): number {
    switch (barSize) {
      case '#4':
        return config.offset4BarIn;
      case '#5':
        return config.offset5BarIn;
      case '#6':
        return config.offset6BarIn;
      default:
        throw new BadRequestException(`Unsupported bar size ${barSize}`);
    }
  }

  private validateInput(params: BendSetpointInput) {
    if (!ALLOWED_ANGLES.has(params.angleDeg)) {
      throw new BadRequestException('angleDeg must be 90, 135, or 180');
    }
    if (params.targetBendSideLengthIn <= 0) {
      throw new BadRequestException('targetBendSideLengthIn must be greater than 0');
    }
  }
}
