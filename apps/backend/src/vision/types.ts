export type RebarBBox = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type RebarDetection = {
  id: string;
  specKey: string;
  confidence: number;
  bbox: RebarBBox;
};

export type RebarDetectResponse = {
  imageId: string;
  model: {
    provider: string;
    name: string;
    version: string;
  };
  meta: {
    receivedAt: string;
    processingMs: number;
    imageWidthPx?: number;
    imageHeightPx?: number;
    minConfidence: number;
  };
  summary: {
    totalCount: number;
    countBySpecKey: Record<string, number>;
  };
  detections: RebarDetection[];
};
