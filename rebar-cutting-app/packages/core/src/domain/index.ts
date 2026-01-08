export type PartRequirement = {
  partId: string;
  specKey: string;
  lengthIn: number;
  quantity: number;
};

export type StockItem = {
  stockId: string;
  specKey: string;
  lengthIn: number;
  quantity: number;
  allowKeepRemnants?: boolean;
};

export type CutSegment = {
  kind: 'PART' | 'KEEP_REMNANT' | 'WASTE';
  lengthIn: number;
  partId?: string;
};

export type StockAllocation = {
  stockId: string;
  stockUnitIndex: number;
  specKey: string;
  originalLengthIn: number;
  cuts: Array<{ cutIndex: number; makeLengthIn: number; partId: string }>;
  remainder: { lengthIn: number; kind: 'KEEP_REMNANT' | 'WASTE' };
};

export type CutPlan = {
  allocations: StockAllocation[];
  summary: {
    utilizationPct: number;
    wasteIn: number;
    keptRemnantIn: number;
  };
};
