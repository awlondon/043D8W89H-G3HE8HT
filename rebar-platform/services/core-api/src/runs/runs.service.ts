import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ProductionRun } from '../data/models';
import {
  getProductionRun,
  getProject,
  getShopSettings,
  listRunsForProject,
  upsertProductionRun,
} from '../data/data-store';

interface CloseoutInput {
  projectId: string;
  shopId: string;
  operatorId: string;
  scrapLengthIn: number;
  stockUsedIn: number;
}

const DEFAULT_SCRAP_THRESHOLD = 2.0;

@Injectable()
export class RunsService {
  closeoutRun(runId: string, input: CloseoutInput): ProductionRun {
    const project = getProject(input.projectId);
    if (!project) {
      throw new Error(`Project ${input.projectId} not found`);
    }
    if (project.shopId !== input.shopId) {
      throw new Error('Project does not belong to the given shop');
    }

    const shopSettings = getShopSettings(input.shopId);
    const scrapFreeThresholdPercent = shopSettings?.scrapFreeThresholdPercent ?? DEFAULT_SCRAP_THRESHOLD;
    const normalizedStockUsed = input.stockUsedIn <= 0 ? 0 : input.stockUsedIn;

    const scrapPercent = normalizedStockUsed === 0 ? 0 : (input.scrapLengthIn / normalizedStockUsed) * 100;
    // Scrap-free definition: see docs/product/cutter_app_spec.md (Scrap-Free Metric section)
    const isScrapFree = scrapPercent <= scrapFreeThresholdPercent;

    const toPersist: ProductionRun = {
      id: runId ?? randomUUID(),
      projectId: input.projectId,
      shopId: input.shopId,
      operatorId: input.operatorId,
      stockUsedIn: input.stockUsedIn,
      scrapLengthIn: input.scrapLengthIn,
      scrapPercent,
      isScrapFree,
      scrapFreeThresholdPercent,
      closedAt: new Date(),
    };

    return upsertProductionRun(toPersist);
  }

  getRun(runId: string): ProductionRun | undefined {
    return getProductionRun(runId);
  }

  listRuns(projectId: string): ProductionRun[] {
    return listRunsForProject(projectId);
  }
}
