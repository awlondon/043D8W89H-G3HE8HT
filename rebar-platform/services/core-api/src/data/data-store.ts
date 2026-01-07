import { Prisma, PrismaClient, PalletStatus as PrismaPalletStatus } from '@prisma/client';
import {
  FeedDraw,
  MachineConfig,
  Pallet,
  PalletLayer,
  PalletPiece,
  PalletStatus,
  PlannedPalletDto,
  ProductionRun,
  Project,
  ScrapFreeStats,
  Shape,
  ShopPalletConfig,
  ShopSettings,
  PerceivedStretch,
} from './models';

const prisma = new PrismaClient();

function mapPalletStatus(status: PrismaPalletStatus): PalletStatus {
  return status;
}

function toPalletDto(raw: Prisma.PalletGetPayload<{ include: { layers: { include: { pieces: true } } } }>): PlannedPalletDto {
  return {
    id: raw.id,
    projectId: raw.projectId,
    name: raw.name,
    maxWeightLbs: raw.maxWeightLbs,
    totalWeightLbs: raw.totalWeightLbs,
    status: mapPalletStatus(raw.status),
    overhangWarning: raw.overhangWarning ?? undefined,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    layers: raw.layers
      .sort((a, b) => a.layerIndex - b.layerIndex)
      .map((layer) => ({
        id: layer.id,
        palletId: layer.palletId,
        layerIndex: layer.layerIndex,
        weightLbs: layer.weightLbs,
        notes: layer.notes ?? undefined,
        maxLengthInches: layer.maxLengthInches ?? undefined,
        overhangWarning: layer.overhangWarning ?? undefined,
        pieces: layer.pieces,
      })),
  };
}

export async function getProject(projectId: string): Promise<Project | null> {
  return prisma.project.findUnique({ where: { id: projectId } });
}

export async function listProjects(): Promise<Project[]> {
  return prisma.project.findMany({ orderBy: { name: 'asc' } });
}

export async function getShopConfigForProject(projectId: string): Promise<ShopPalletConfig | undefined> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { shopId: true },
  });
  if (!project) return undefined;
  const config = await prisma.shopPalletConfig.findUnique({ where: { shopId: project.shopId } });
  if (!config) return undefined;
  return {
    shopId: config.shopId,
    defaultMaxPalletWeightLbs: config.defaultMaxPalletWeightLbs,
    palletLengthIn: config.palletLengthIn,
    palletWidthIn: config.palletWidthIn,
    allowOverhangIn: config.allowOverhangIn,
  };
}

export async function getShopSettings(shopId: string): Promise<ShopSettings | undefined> {
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) return undefined;
  return { shopId: shop.id, scrapFreeThresholdPercent: shop.scrapFreeThresholdPercent };
}

export async function listPerceivedStretch(): Promise<PerceivedStretch[]> {
  return prisma.perceivedStretch.findMany();
}

export async function findPerceivedStretch(barSize: string, angleDeg: number): Promise<PerceivedStretch | null> {
  return prisma.perceivedStretch.findFirst({ where: { barSize, angleDeg } });
}

export async function updatePerceivedStretch(
  id: string,
  input: Partial<Pick<PerceivedStretch, 'angleDeg' | 'barSize' | 'offsetIn' | 'isDefault'>>,
): Promise<PerceivedStretch | undefined> {
  try {
    return await prisma.perceivedStretch.update({ where: { id }, data: input });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return undefined;
    }
    throw error;
  }
}

export async function addPerceivedStretch(input: Omit<PerceivedStretch, 'id'>): Promise<PerceivedStretch> {
  return prisma.perceivedStretch.create({ data: input });
}

export async function listFeedDraws(): Promise<FeedDraw[]> {
  return prisma.feedDraw.findMany();
}

export async function findFeedDraw(barSize: string, angleDeg: number): Promise<FeedDraw | null> {
  return prisma.feedDraw.findFirst({ where: { barSize, angleDeg } });
}

export async function updateFeedDraw(
  id: string,
  input: Partial<Pick<FeedDraw, 'angleDeg' | 'barSize' | 'drawIn' | 'isDefault' | 'isProvisional'>>,
): Promise<FeedDraw | undefined> {
  try {
    return await prisma.feedDraw.update({ where: { id }, data: input });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return undefined;
    }
    throw error;
  }
}

export async function addFeedDraw(input: Omit<FeedDraw, 'id'>): Promise<FeedDraw> {
  return prisma.feedDraw.create({ data: input });
}

export async function listMachineConfigs(): Promise<MachineConfig[]> {
  return prisma.machineConfig.findMany();
}

export async function getMachineConfig(machineId: string): Promise<MachineConfig | null> {
  return prisma.machineConfig.findUnique({ where: { machineId } });
}

export async function updateMachineConfig(
  machineId: string,
  input: Partial<Omit<MachineConfig, 'id' | 'machineId'>>,
): Promise<MachineConfig | undefined> {
  try {
    return await prisma.machineConfig.update({ where: { machineId }, data: input });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return undefined;
    }
    throw error;
  }
}

export async function ensureMachineConfig(
  machineId: string,
  input: Omit<MachineConfig, 'id' | 'machineId'>,
): Promise<MachineConfig> {
  return prisma.machineConfig.upsert({
    where: { machineId },
    update: input,
    create: { ...input, machineId },
  });
}

export async function getShapesForProject(projectId: string, shapeIds?: string[]): Promise<Shape[]> {
  return prisma.shape.findMany({
    where: {
      projectId,
      ...(shapeIds && shapeIds.length > 0 ? { id: { in: shapeIds } } : {}),
    },
    orderBy: { label: 'asc' },
  });
}

export async function clearPalletsForProject(projectId: string) {
  const pallets = await prisma.pallet.findMany({ where: { projectId } });
  if (pallets.length === 0) return;
  const palletIds = pallets.map((pallet) => pallet.id);
  await prisma.$transaction([
    prisma.palletPiece.deleteMany({ where: { layer: { palletId: { in: palletIds } } } }),
    prisma.palletLayer.deleteMany({ where: { palletId: { in: palletIds } } }),
    prisma.pallet.deleteMany({ where: { id: { in: palletIds } } }),
  ]);
}

export async function createPallet(input: Omit<Pallet, 'createdAt' | 'updatedAt' | 'id'>): Promise<Pallet> {
  const created = await prisma.pallet.create({
    data: {
      projectId: input.projectId,
      name: input.name,
      maxWeightLbs: input.maxWeightLbs,
      totalWeightLbs: input.totalWeightLbs,
      status: input.status as PrismaPalletStatus,
      overhangWarning: input.overhangWarning,
    },
  });
  return { ...created, status: mapPalletStatus(created.status) };
}

export async function createLayer(input: Omit<PalletLayer, 'id'>): Promise<PalletLayer> {
  return prisma.palletLayer.create({ data: input });
}

export async function createPiece(input: Omit<PalletPiece, 'id'>): Promise<PalletPiece> {
  return prisma.palletPiece.create({ data: input });
}

export async function updatePalletStatus(palletId: string, status: PalletStatus): Promise<Pallet | undefined> {
  try {
    const updated = await prisma.pallet.update({ where: { id: palletId }, data: { status: status as PrismaPalletStatus } });
    return { ...updated, status };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return undefined;
    }
    throw error;
  }
}

export async function listPalletsForProject(projectId: string): Promise<PlannedPalletDto[]> {
  const pallets = await prisma.pallet.findMany({
    where: { projectId },
    include: { layers: { include: { pieces: true } } },
    orderBy: { createdAt: 'asc' },
  });
  return pallets.map(toPalletDto);
}

export async function getPalletWithLayers(palletId: string): Promise<PlannedPalletDto | undefined> {
  const pallet = await prisma.pallet.findUnique({
    where: { id: palletId },
    include: { layers: { include: { pieces: true } } },
  });
  if (!pallet) return undefined;
  return toPalletDto(pallet);
}

export async function resetAllPallets() {
  await prisma.$transaction([
    prisma.palletPiece.deleteMany(),
    prisma.palletLayer.deleteMany(),
    prisma.pallet.deleteMany(),
  ]);
}

export async function getInventorySnapshot() {
  const [projects, shapes, pallets, palletLayers, palletPieces, shopConfigs, shops, productionRuns, perceivedStretches, feedDraws, machineConfigs] =
    await Promise.all([
      prisma.project.findMany(),
      prisma.shape.findMany(),
      prisma.pallet.findMany(),
      prisma.palletLayer.findMany(),
      prisma.palletPiece.findMany(),
      prisma.shopPalletConfig.findMany(),
      prisma.shop.findMany(),
      prisma.productionRun.findMany(),
      prisma.perceivedStretch.findMany(),
      prisma.feedDraw.findMany(),
      prisma.machineConfig.findMany(),
    ]);

  return {
    projects,
    shapes,
    pallets,
    palletLayers,
    palletPieces,
    shopConfigs,
    shopSettings: shops.map((shop) => ({ shopId: shop.id, scrapFreeThresholdPercent: shop.scrapFreeThresholdPercent })),
    productionRuns,
    perceivedStretches,
    feedDraws,
    machineConfigs,
  };
}

export async function upsertProductionRun(run: ProductionRun): Promise<ProductionRun> {
  return prisma.productionRun.upsert({
    where: { id: run.id },
    update: run,
    create: run,
  });
}

export async function getProductionRun(runId: string): Promise<ProductionRun | null> {
  return prisma.productionRun.findUnique({ where: { id: runId } });
}

export async function listRunsForProject(projectId: string): Promise<ProductionRun[]> {
  return prisma.productionRun.findMany({ where: { projectId } });
}

export async function listRunsForOperator(operatorId: string): Promise<ProductionRun[]> {
  return prisma.productionRun.findMany({ where: { operatorId } });
}

export async function listRunsForShop(shopId: string): Promise<ProductionRun[]> {
  return prisma.productionRun.findMany({ where: { shopId } });
}

export async function computeScrapFreeStats(filter: { operatorId?: string; shopId?: string }): Promise<ScrapFreeStats> {
  const scopedRuns = await prisma.productionRun.findMany({
    where: {
      ...(filter.operatorId ? { operatorId: filter.operatorId } : {}),
      ...(filter.shopId ? { shopId: filter.shopId } : {}),
    },
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

export async function ensureSeedData(seed: {
  shops: { shopId: string; name: string; scrapFreeThresholdPercent: number }[];
  shopConfigs: ShopPalletConfig[];
  projects: Project[];
  shapes: Shape[];
  perceivedStretches: Omit<PerceivedStretch, 'id'>[];
  feedDraws: Omit<FeedDraw, 'id'>[];
  machineConfigs: Omit<MachineConfig, 'id'>[];
  productionRuns: ProductionRun[];
}) {
  await prisma.$transaction([
    prisma.productionRun.deleteMany(),
    prisma.machineConfig.deleteMany(),
    prisma.feedDraw.deleteMany(),
    prisma.perceivedStretch.deleteMany(),
    prisma.palletPiece.deleteMany(),
    prisma.palletLayer.deleteMany(),
    prisma.pallet.deleteMany(),
    prisma.shape.deleteMany(),
    prisma.project.deleteMany(),
    prisma.shopPalletConfig.deleteMany(),
    prisma.shop.deleteMany(),
  ]);

  await prisma.shop.createMany({
    data: seed.shops.map((shop) => ({ id: shop.shopId, name: shop.name, scrapFreeThresholdPercent: shop.scrapFreeThresholdPercent })),
  });

  await prisma.shopPalletConfig.createMany({ data: seed.shopConfigs });
  await prisma.project.createMany({ data: seed.projects });
  await prisma.shape.createMany({ data: seed.shapes });
  await prisma.perceivedStretch.createMany({ data: seed.perceivedStretches });
  await prisma.feedDraw.createMany({ data: seed.feedDraws });
  await prisma.machineConfig.createMany({ data: seed.machineConfigs });
  await prisma.productionRun.createMany({ data: seed.productionRuns });
}
