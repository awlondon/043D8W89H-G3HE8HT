import { nanoid } from "nanoid";
import type { UpstreamVisionResponse } from "./upstreamVisionClient";
import type { RebarDetectResponse, RebarDetection } from "./types";

function normalizeSpecKey(raw: string): string {
  const s = raw.trim();

  if (s.startsWith("#")) return s.toUpperCase();

  const m = s.match(/rebar[_\s-]?(\d+)[_\s-]?(g60|gr60|gr75|g75)/i);
  if (m) {
    const size = m[1];
    const grade = m[2].toUpperCase();
    return `#${size}-${grade}`;
  }

  return s.toUpperCase();
}

export function normalizeVisionResult(params: {
  upstream: UpstreamVisionResponse;
  minConfidence: number;
  imageId: string;
  receivedAtIso: string;
  processingMs: number;
}): RebarDetectResponse {
  const detections: RebarDetection[] = params.upstream.detections
    .filter((d) => d.score >= params.minConfidence)
    .map((d) => ({
      id: nanoid(10),
      specKey: normalizeSpecKey(d.label),
      confidence: Number(d.score.toFixed(4)),
      bbox: {
        x: clamp01(d.bbox.x),
        y: clamp01(d.bbox.y),
        w: clamp01(d.bbox.w),
        h: clamp01(d.bbox.h),
      },
    }));

  const countBySpecKey: Record<string, number> = {};
  for (const d of detections) {
    countBySpecKey[d.specKey] = (countBySpecKey[d.specKey] ?? 0) + 1;
  }

  return {
    imageId: params.imageId,
    model: {
      provider: process.env.VISION_PROVIDER_NAME ?? "custom",
      name: process.env.VISION_MODEL_NAME ?? "rebar-detector-v1",
      version: process.env.VISION_MODEL_VERSION ?? "1.0.0",
    },
    meta: {
      receivedAt: params.receivedAtIso,
      processingMs: params.processingMs,
      imageWidthPx: params.upstream.imageWidthPx,
      imageHeightPx: params.upstream.imageHeightPx,
      minConfidence: params.minConfidence,
    },
    summary: {
      totalCount: detections.length,
      countBySpecKey,
    },
    detections,
  };
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}
