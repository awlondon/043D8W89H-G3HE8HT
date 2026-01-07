import {
  Bar,
  CutPlan,
  CutRequest,
  Job,
  MachineConfig,
  PerceivedStretch,
  FeedDraw,
  Project,
  RebarInventory,
  Shape,
  ProductionRun,
  ShopPalletConfig,
} from './models';

export const seedData: {
  shops: { shopId: string; name: string; scrapFreeThresholdPercent: number }[];
  shopConfigs: ShopPalletConfig[];
  projects: Project[];
  shapes: Shape[];
  inventory: RebarInventory[];
  cutRequests: CutRequest[];
  jobs: Job[];
  bars: Bar[];
  cutPlans: CutPlan[];
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
  inventory: [
    {
      id: 'inv-1',
      barDiameter: '#4',
      barLength: 240,
      quantityAvailable: 40,
      notes: 'Mill delivery batch A',
    },
    {
      id: 'inv-2',
      barDiameter: '#5',
      barLength: 360,
      quantityAvailable: 20,
      notes: 'Priority stock for Job Alpha',
    },
  ],
  cutRequests: [
    {
      id: 'cut-req-1',
      requestedLength: 96,
      diameter: '#4',
      quantity: 10,
      status: 'Pending',
      inventoryBarId: 'inv-1',
      inventoryCheck: true,
      totalCutLength: 960,
    },
    {
      id: 'cut-req-2',
      requestedLength: 120,
      diameter: '#5',
      quantity: 5,
      status: 'Pending',
      inventoryBarId: 'inv-2',
      inventoryCheck: false,
      totalCutLength: 600,
    },
  ],
  jobs: [
    {
      id: 'job-1',
      jobName: 'Pier Reinforcement Phase 1',
      priority: 1,
      status: 'Planned',
      totalBars: 2,
      totalScrap: 8,
    },
  ],
  bars: [
    {
      id: 'bar-1',
      jobId: 'job-1',
      diameter: '#4',
      length: 240,
      bends: 2,
      bendAngles: [90, 90],
      stretchAllowance: 3,
      cutLength: 200,
      remainingLength: 40,
      scrapFlag: false,
      operatorPrompt: 'Bar-1: Bend 90° twice',
    },
    {
      id: 'bar-2',
      jobId: 'job-1',
      diameter: '#4',
      length: 240,
      bends: 1,
      bendAngles: [135],
      stretchAllowance: 0,
      cutLength: 232,
      remainingLength: 8,
      scrapFlag: true,
      operatorPrompt: 'Bar-2: Finish with 135° bend',
    },
  ],
  cutPlans: [
    {
      id: 'cut-plan-1',
      barId: 'bar-1',
      nextBarId: 'bar-2',
    },
    {
      id: 'cut-plan-2',
      barId: 'bar-2',
      nextBarId: null,
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
