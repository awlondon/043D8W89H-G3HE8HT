export type PalletStatus = 'planned' | 'stacking' | 'stacked' | 'loaded';

export interface Project {
  id: string;
  name: string;
  shopId: string;
}

export interface Shape {
  id: string;
  projectId: string;
  label: string;
  barSize: string;
  finalLengthInches: number;
  quantity: number;
  maxLengthInches?: number;
  shapeType?: string;
}

export interface ShopPalletConfig {
  shopId: string;
  defaultMaxPalletWeightLbs: number;
  palletLengthIn: number;
  palletWidthIn: number;
  allowOverhangIn: number;
}

export interface ShopSettings {
  shopId: string;
  scrapFreeThresholdPercent: number;
}

export interface Pallet {
  id: string;
  projectId: string;
  name: string;
  maxWeightLbs: number;
  totalWeightLbs: number;
  status: PalletStatus;
  overhangWarning?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PalletLayer {
  id: string;
  palletId: string;
  layerIndex: number;
  weightLbs: number;
  notes?: string;
  maxLengthInches?: number;
  overhangWarning?: boolean;
}

export interface PalletPiece {
  id: string;
  palletLayerId: string;
  shapeId: string;
  quantity: number;
  weightPerPieceLbs: number;
  totalWeightLbs: number;
  shapeLabel?: string;
}

export interface PlannedLayerDto {
  layerIndex: number;
  weightLbs: number;
  notes?: string;
  maxLengthInches?: number;
  pieces: PalletPiece[];
}

export interface PlannedPalletDto extends Pallet {
  layers: PlannedLayerDto[];
}

export type MachineMode = 'BASE' | 'ONE_BACKPLATE_REMOVED' | 'BOTH_SWAPPED';

export interface PerceivedStretch {
  id: string;
  barSize: string;
  angleDeg: number;
  offsetIn: number;
  isDefault: boolean;
}

export interface FeedDraw {
  id: string;
  barSize: string;
  angleDeg: number;
  drawIn: number;
  isDefault: boolean;
  isProvisional: boolean;
}

export interface MachineConfig {
  id: string;
  machineId: string;
  mode: MachineMode;
  offset4BarIn: number;
  offset5BarIn: number;
  offset6BarIn: number;
  globalConfigOffsetIn: number;
}

export interface BendSetpoints {
  effectiveBendSideLengthIn: number;
  feedDrawIn: number;
  machineOffsetIn: number;
  measureFromFeedDatumIn: number;
  provisionalFeed: boolean;
}

export interface PalletPlanningInput {
  projectId: string;
  shapeIds?: string[];
  maxPalletWeightLbs?: number;
}

export interface ProductionRun {
  id: string;
  projectId: string;
  shopId: string;
  operatorId: string;
  stockUsedIn: number;
  scrapLengthIn: number;
  scrapPercent?: number;
  isScrapFree: boolean;
  scrapFreeThresholdPercent?: number;
  closedAt: Date;
}

export interface ScrapFreeStats {
  operatorId?: string;
  shopId?: string;
  totalRuns: number;
  scrapFreeRuns: number;
  scrapFreeRatePercent: number;
}
