import { MachineConfig, PerceivedStretch, FeedDraw, Project, Shape, ProductionRun, ShopPalletConfig } from './models';

export const seedData: {
  shops: { shopId: string; name: string; scrapFreeThresholdPercent: number }[];
  shopConfigs: ShopPalletConfig[];
  projects: Project[];
  shapes: Shape[];
  perceivedStretches: Omit<PerceivedStretch, 'id'>[];
  feedDraws: Omit<FeedDraw, 'id'>[];
  machineConfigs: Omit<MachineConfig, 'id'>[];
  productionRuns: ProductionRun[];
} = {
  shops: [{ shopId: 'shop-1', name: 'Demo Shop', scrapFreeThresholdPercent: 2.0 }],
  shopConfigs: [
    {
      shopId: 'shop-1',
      defaultMaxPalletWeightLbs: 3200,
      palletLengthIn: 96,
      palletWidthIn: 48,
      allowOverhangIn: 12,
    },
  ],
  projects: [{ id: 'project-1', name: 'Highway Overpass Retrofit', shopId: 'shop-1' }],
  shapes: [
    {
      id: 'shape-1',
      projectId: 'project-1',
      label: 'A21',
      barSize: '#6',
      finalLengthInches: 216,
      quantity: 12,
      maxLengthInches: 216,
      shapeType: 'straight',
      jobSheetId: null,
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
      jobSheetId: null,
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
      jobSheetId: null,
    },
  ],
  perceivedStretches: [
    { barSize: '#4', angleDeg: 90, offsetIn: 1.5, isDefault: true },
    { barSize: '#4', angleDeg: 135, offsetIn: 0, isDefault: true },
    { barSize: '#4', angleDeg: 180, offsetIn: -1.5, isDefault: true },
    { barSize: '#5', angleDeg: 90, offsetIn: 2, isDefault: true },
    { barSize: '#5', angleDeg: 135, offsetIn: 0, isDefault: true },
    { barSize: '#5', angleDeg: 180, offsetIn: -2, isDefault: true },
    { barSize: '#6', angleDeg: 90, offsetIn: 2, isDefault: true },
    { barSize: '#6', angleDeg: 135, offsetIn: 0, isDefault: true },
    { barSize: '#6', angleDeg: 180, offsetIn: -2, isDefault: true },
  ],
  feedDraws: [
    { barSize: '#4', angleDeg: 90, drawIn: 0, isDefault: true, isProvisional: false },
    { barSize: '#4', angleDeg: 135, drawIn: 1.5, isDefault: true, isProvisional: false },
    { barSize: '#4', angleDeg: 180, drawIn: 3, isDefault: true, isProvisional: false },
    { barSize: '#5', angleDeg: 90, drawIn: 0.5, isDefault: true, isProvisional: true },
    { barSize: '#5', angleDeg: 135, drawIn: 2.5, isDefault: true, isProvisional: true },
    { barSize: '#5', angleDeg: 180, drawIn: 4.5, isDefault: true, isProvisional: true },
    { barSize: '#6', angleDeg: 90, drawIn: 0.5, isDefault: true, isProvisional: true },
    { barSize: '#6', angleDeg: 135, drawIn: 2.5, isDefault: true, isProvisional: true },
    { barSize: '#6', angleDeg: 180, drawIn: 4.5, isDefault: true, isProvisional: true },
  ],
  machineConfigs: [
    {
      machineId: 'machine-123',
      mode: 'BASE',
      offset4BarIn: 1.0,
      offset5BarIn: 0.0,
      offset6BarIn: 0.0,
      globalConfigOffsetIn: 0.0,
    },
    {
      machineId: 'machine-456',
      mode: 'BOTH_SWAPPED',
      offset4BarIn: 1.0,
      offset5BarIn: 0.0,
      offset6BarIn: 0.0,
      globalConfigOffsetIn: 2.25,
    },
  ],
  productionRuns: [
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
  ],
};
