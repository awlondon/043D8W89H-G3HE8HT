import { randomUUID } from 'crypto';
import {
  Pallet,
  PalletLayer,
  PalletPiece,
  PalletStatus,
  MachineConfig,
  PerceivedStretch,
  FeedDraw,
  PlannedPalletDto,
  ProductionRun,
  Project,
  ScrapFreeStats,
  Shape,
  ShopPalletConfig,
  ShopSettings,
} from './models';

const projects: Project[] = [
  { id: 'project-1', name: 'Highway Overpass Retrofit', shopId: 'shop-1' },
];

const shapes: Shape[] = [
  {
    id: 'shape-1',
    projectId: 'project-1',
    label: 'A21',
    barSize: '#6',
    finalLengthInches: 216,
    quantity: 12,
    maxLengthInches: 216,
    shapeType: 'straight',
  },
  {
    id: 'shape-2',
    projectId: 'project-1',
    label: 'B15',
    barSize: '#4',
    finalLengthInches: 144,
    quantity: 20,
    maxLengthInches: 144,
    shapeType: 'stirrup',
  },
  {
    id: 'shape-3',
    projectId: 'project-1',
    label: 'C05',
    barSize: '#8',
    finalLengthInches: 72,
    quantity: 30,
    maxLengthInches: 72,
    shapeType: 'hook',
  },
];

const shopConfigs: ShopPalletConfig[] = [
  {
    shopId: 'shop-1',
    defaultMaxPalletWeightLbs: 3200,
    palletLengthIn: 96,
    palletWidthIn: 48,
    allowOverhangIn: 12,
  },
];

const shopSettings: ShopSettings[] = [
  {
    shopId: 'shop-1',
    scrapFreeThresholdPercent: 2.0,
  },
];

const perceivedStretches: PerceivedStretch[] = [
  { id: 'stretch-4-90', barSize: '#4', angleDeg: 90, offsetIn: 1.5, isDefault: true },
  { id: 'stretch-4-135', barSize: '#4', angleDeg: 135, offsetIn: 0, isDefault: true },
  { id: 'stretch-4-180', barSize: '#4', angleDeg: 180, offsetIn: -1.5, isDefault: true },
  { id: 'stretch-5-90', barSize: '#5', angleDeg: 90, offsetIn: 2, isDefault: true },
  { id: 'stretch-5-135', barSize: '#5', angleDeg: 135, offsetIn: 0, isDefault: true },
  { id: 'stretch-5-180', barSize: '#5', angleDeg: 180, offsetIn: -2, isDefault: true },
  { id: 'stretch-6-90', barSize: '#6', angleDeg: 90, offsetIn: 2, isDefault: true },
  { id: 'stretch-6-135', barSize: '#6', angleDeg: 135, offsetIn: 0, isDefault: true },
  { id: 'stretch-6-180', barSize: '#6', angleDeg: 180, offsetIn: -2, isDefault: true },
];

const feedDraws: FeedDraw[] = [
  { id: 'feed-4-90', barSize: '#4', angleDeg: 90, drawIn: 0, isDefault: true, isProvisional: false },
  { id: 'feed-4-135', barSize: '#4', angleDeg: 135, drawIn: 1.5, isDefault: true, isProvisional: false },
  { id: 'feed-4-180', barSize: '#4', angleDeg: 180, drawIn: 3, isDefault: true, isProvisional: false },
  { id: 'feed-5-90', barSize: '#5', angleDeg: 90, drawIn: 0.5, isDefault: true, isProvisional: true },
  { id: 'feed-5-135', barSize: '#5', angleDeg: 135, drawIn: 2.5, isDefault: true, isProvisional: true },
  { id: 'feed-5-180', barSize: '#5', angleDeg: 180, drawIn: 4.5, isDefault: true, isProvisional: true },
  { id: 'feed-6-90', barSize: '#6', angleDeg: 90, drawIn: 0.5, isDefault: true, isProvisional: true },
  { id: 'feed-6-135', barSize: '#6', angleDeg: 135, drawIn: 2.5, isDefault: true, isProvisional: true },
  { id: 'feed-6-180', barSize: '#6', angleDeg: 180, drawIn: 4.5, isDefault: true, isProvisional: true },
];

const machineConfigs: MachineConfig[] = [
  {
    id: 'machine-123-base',
    machineId: 'machine-123',
    mode: 'BASE',
    offset4BarIn: 1.0,
    offset5BarIn: 0.0,
    offset6BarIn: 0.0,
    globalConfigOffsetIn: 0.0,
  },
  {
    id: 'machine-456-swapped',
    machineId: 'machine-456',
    mode: 'BOTH_SWAPPED',
    offset4BarIn: 1.0,
    offset5BarIn: 0.0,
    offset6BarIn: 0.0,
    globalConfigOffsetIn: 2.25,
  },
];

let pallets: Pallet[] = [];
let palletLayers: PalletLayer[] = [];
let palletPieces: PalletPiece[] = [];
let productionRuns: ProductionRun[] = [
  {
    id: 'run-1',
    projectId: 'project-1',
    shopId: 'shop-1',
    operatorId: 'op-1',
    stockUsedIn: 1200,
    scrapLengthIn: 18,
    scrapPercent: 1.5,
    isScrapFree: true,
    scrapFreeThresholdPercent: 2,
    closedAt: new Date(),
  },
  {
    id: 'run-2',
    projectId: 'project-1',
    shopId: 'shop-1',
    operatorId: 'op-2',
    stockUsedIn: 800,
    scrapLengthIn: 24,
    scrapPercent: 3,
    isScrapFree: false,
    scrapFreeThresholdPercent: 2,
    closedAt: new Date(),
  },
];

export function getProject(projectId: string): Project | undefined {
  return projects.find((project) => project.id === projectId);
}

export function getShopConfigForProject(projectId: string): ShopPalletConfig | undefined {
  const project = getProject(projectId);
  if (!project) return undefined;
  return shopConfigs.find((config) => config.shopId === project.shopId);
}

export function getShopSettings(shopId: string): ShopSettings | undefined {
  return shopSettings.find((settings) => settings.shopId === shopId);
}

export function listPerceivedStretch(): PerceivedStretch[] {
  return perceivedStretches;
}

export function findPerceivedStretch(barSize: string, angleDeg: number): PerceivedStretch | undefined {
  return perceivedStretches.find((entry) => entry.barSize === barSize && entry.angleDeg === angleDeg);
}

export function updatePerceivedStretch(
  id: string,
  input: Partial<Pick<PerceivedStretch, 'angleDeg' | 'barSize' | 'offsetIn' | 'isDefault'>>,
): PerceivedStretch | undefined {
  const existing = perceivedStretches.find((entry) => entry.id === id);
  if (!existing) return undefined;
  Object.assign(existing, input);
  return existing;
}

export function addPerceivedStretch(input: Omit<PerceivedStretch, 'id'>): PerceivedStretch {
  const record: PerceivedStretch = { ...input, id: randomUUID() };
  perceivedStretches.push(record);
  return record;
}

export function listFeedDraws(): FeedDraw[] {
  return feedDraws;
}

export function findFeedDraw(barSize: string, angleDeg: number): FeedDraw | undefined {
  return feedDraws.find((entry) => entry.barSize === barSize && entry.angleDeg === angleDeg);
}

export function updateFeedDraw(
  id: string,
  input: Partial<Pick<FeedDraw, 'angleDeg' | 'barSize' | 'drawIn' | 'isDefault' | 'isProvisional'>>,
): FeedDraw | undefined {
  const existing = feedDraws.find((entry) => entry.id === id);
  if (!existing) return undefined;
  Object.assign(existing, input);
  return existing;
}

export function addFeedDraw(input: Omit<FeedDraw, 'id'>): FeedDraw {
  const record: FeedDraw = { ...input, id: randomUUID() };
  feedDraws.push(record);
  return record;
}

export function listMachineConfigs(): MachineConfig[] {
  return machineConfigs;
}

export function getMachineConfig(machineId: string): MachineConfig | undefined {
  return machineConfigs.find((config) => config.machineId === machineId);
}

export function updateMachineConfig(
  machineId: string,
  input: Partial<Omit<MachineConfig, 'id' | 'machineId'>>,
): MachineConfig | undefined {
  const existing = getMachineConfig(machineId);
  if (!existing) return undefined;
  Object.assign(existing, input);
  return existing;
}

export function ensureMachineConfig(machineId: string, input: Omit<MachineConfig, 'id' | 'machineId'>): MachineConfig {
  const existing = getMachineConfig(machineId);
  if (existing) {
    return updateMachineConfig(machineId, input) ?? existing;
  }
  const created: MachineConfig = { ...input, machineId, id: randomUUID() };
  machineConfigs.push(created);
  return created;
}

export function getShapesForProject(projectId: string, shapeIds?: string[]): Shape[] {
  const scoped = shapes.filter((shape) => shape.projectId === projectId);
  if (!shapeIds || shapeIds.length === 0) return scoped;
  return scoped.filter((shape) => shapeIds.includes(shape.id));
}

export function clearPalletsForProject(projectId: string) {
  pallets = pallets.filter((pallet) => pallet.projectId !== projectId);
  const palletIds = new Set(pallets.map((pallet) => pallet.id));
  palletLayers = palletLayers.filter((layer) => palletIds.has(layer.palletId));
  const layerIds = new Set(palletLayers.map((layer) => layer.id));
  palletPieces = palletPieces.filter((piece) => layerIds.has(piece.palletLayerId));
}

export function createPallet(input: Omit<Pallet, 'createdAt' | 'updatedAt' | 'id'>): Pallet {
  const now = new Date();
  const pallet: Pallet = { ...input, id: randomUUID(), createdAt: now, updatedAt: now };
  pallets.push(pallet);
  return pallet;
}

export function createLayer(input: Omit<PalletLayer, 'id'>): PalletLayer {
  const layer: PalletLayer = { ...input, id: randomUUID() };
  palletLayers.push(layer);
  return layer;
}

export function createPiece(input: Omit<PalletPiece, 'id'>): PalletPiece {
  const piece: PalletPiece = { ...input, id: randomUUID() };
  palletPieces.push(piece);
  return piece;
}

export function updatePalletStatus(palletId: string, status: PalletStatus): Pallet | undefined {
  const target = pallets.find((pallet) => pallet.id === palletId);
  if (!target) return undefined;
  target.status = status;
  target.updatedAt = new Date();
  return target;
}

export function listPalletsForProject(projectId: string): PlannedPalletDto[] {
  return pallets
    .filter((pallet) => pallet.projectId === projectId)
    .map((pallet) => {
      const layers = palletLayers
        .filter((layer) => layer.palletId === pallet.id)
        .sort((a, b) => a.layerIndex - b.layerIndex)
        .map((layer) => ({
          ...layer,
          pieces: palletPieces.filter((piece) => piece.palletLayerId === layer.id),
        }));
      return { ...pallet, layers };
    });
}

export function getPalletWithLayers(palletId: string): PlannedPalletDto | undefined {
  const pallet = pallets.find((p) => p.id === palletId);
  if (!pallet) return undefined;
  const layers = palletLayers
    .filter((layer) => layer.palletId === pallet.id)
    .sort((a, b) => a.layerIndex - b.layerIndex)
    .map((layer) => ({
      ...layer,
      pieces: palletPieces.filter((piece) => piece.palletLayerId === layer.id),
    }));
  return { ...pallet, layers };
}

export function resetAllPallets() {
  pallets = [];
  palletLayers = [];
  palletPieces = [];
}

export function getInventorySnapshot() {
  return {
    projects,
    shapes,
    pallets,
    palletLayers,
    palletPieces,
    shopConfigs,
    shopSettings,
    productionRuns,
    perceivedStretches,
    feedDraws,
    machineConfigs,
  };
}

export function upsertProductionRun(run: ProductionRun): ProductionRun {
  const existingIndex = productionRuns.findIndex((candidate) => candidate.id === run.id);
  if (existingIndex >= 0) {
    productionRuns[existingIndex] = run;
    return productionRuns[existingIndex];
  }
  productionRuns.push(run);
  return run;
}

export function getProductionRun(runId: string): ProductionRun | undefined {
  return productionRuns.find((run) => run.id === runId);
}

export function listRunsForProject(projectId: string): ProductionRun[] {
  return productionRuns.filter((run) => run.projectId === projectId);
}

export function listRunsForOperator(operatorId: string): ProductionRun[] {
  return productionRuns.filter((run) => run.operatorId === operatorId);
}

export function listRunsForShop(shopId: string): ProductionRun[] {
  return productionRuns.filter((run) => run.shopId === shopId);
}

export function computeScrapFreeStats(filter: { operatorId?: string; shopId?: string }): ScrapFreeStats {
  const scopedRuns = productionRuns.filter((run) => {
    if (filter.operatorId && run.operatorId !== filter.operatorId) return false;
    if (filter.shopId && run.shopId !== filter.shopId) return false;
    return true;
  });

  const totalRuns = scopedRuns.length;
  const scrapFreeRuns = scopedRuns.filter((run) => run.isScrapFree).length;
  const scrapFreeRatePercent = totalRuns === 0 ? 0 : (scrapFreeRuns / totalRuns) * 100;

  return {
    operatorId: filter.operatorId,
    shopId: filter.shopId,
    totalRuns,
    scrapFreeRuns,
    scrapFreeRatePercent,
  };
}
