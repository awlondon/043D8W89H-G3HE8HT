import { Injectable } from '@nestjs/common';
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

@Injectable()
export class BendCompensationService {
  getPerceivedStretch(barSize: string, angleDeg: number): number {
    const record = findPerceivedStretch(barSize, angleDeg);
    return record?.offsetIn ?? 0;
  }

  getFeedDraw(barSize: string, angleDeg: number): FeedDrawLookup {
    const record = findFeedDraw(barSize, angleDeg);
    if (!record) {
      throw new Error(`Feed draw not found for ${barSize} at ${angleDeg}deg`);
    }
    return { drawIn: record.drawIn, provisional: record.isProvisional };
  }

  getMachineOffset(machineId: string, barSize: string): number {
    const config = getMachineConfigRecord(machineId);
    if (!config) {
      throw new Error(`Machine config not found for ${machineId}`);
    }

    const perBarOffset = this.resolveBarOffset(config, barSize);
    return perBarOffset + config.globalConfigOffsetIn;
  }

  computeBendSetpoints(params: BendSetpointInput): BendSetpoints {
    const stretch = this.getPerceivedStretch(params.barSize, params.angleDeg);
    const { drawIn, provisional } = this.getFeedDraw(params.barSize, params.angleDeg);
    const machineOffset = this.getMachineOffset(params.machineId, params.barSize);

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

  listPerceivedStretch(): PerceivedStretch[] {
    return listPerceivedStretch();
  }

  updatePerceivedStretch(id: string, input: Partial<PerceivedStretch>): PerceivedStretch {
    const updated = updatePerceivedStretch(id, input);
    if (!updated) {
      throw new Error('Perceived stretch entry not found');
    }
    return updated;
  }

  addPerceivedStretch(input: Omit<PerceivedStretch, 'id'>): PerceivedStretch {
    return addPerceivedStretch(input);
  }

  listFeedDraws(): FeedDraw[] {
    return listFeedDraws();
  }

  updateFeedDraw(id: string, input: Partial<FeedDraw>): FeedDraw {
    const updated = updateFeedDraw(id, input);
    if (!updated) {
      throw new Error('Feed draw entry not found');
    }
    return updated;
  }

  addFeedDraw(input: Omit<FeedDraw, 'id'>): FeedDraw {
    return addFeedDraw(input);
  }

  getMachineConfigs(): MachineConfig[] {
    return listMachineConfigs();
  }

  getMachineConfig(machineId: string): MachineConfig {
    const config = getMachineConfigRecord(machineId);
    if (!config) {
      throw new Error('Machine config not found');
    }
    return config;
  }

  updateMachineConfig(machineId: string, input: Partial<Omit<MachineConfig, 'id' | 'machineId'>>): MachineConfig {
    const updated = updateMachineConfigRecord(machineId, input);
    if (!updated) {
      throw new Error('Machine config not found');
    }
    return updated;
  }

  upsertMachineConfig(machineId: string, input: Omit<MachineConfig, 'id' | 'machineId'>): MachineConfig {
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
        throw new Error(`Unsupported bar size ${barSize}`);
    }
  }
}
