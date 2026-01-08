export type Stock = {
  id: string;
  length: number;
};

export type PartRequirement = {
  id: string;
  length: number;
  quantity: number;
};

export type Job = {
  id: string;
  stocks: Stock[];
  parts: PartRequirement[];
  kerf: number;
  tolerance: number;
};

export type CutSegmentLabel = 'PART' | 'KEEP_REMNANT' | 'WASTE';

export type CutSegment = {
  label: CutSegmentLabel;
  length: number;
  partId?: string;
};

export type CutStickPlan = {
  stockId: string;
  stockLength: number;
  segments: CutSegment[];
  remainingLength: number;
};

export type CutPlan = {
  jobId: string;
  sticks: CutStickPlan[];
};
