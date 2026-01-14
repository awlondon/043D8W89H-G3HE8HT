import axios from "axios";

export type UpstreamDetection = {
  label: string;
  score: number;
  bbox: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
};

export type UpstreamVisionResponse = {
  detections: UpstreamDetection[];
  imageWidthPx?: number;
  imageHeightPx?: number;
};

export async function callUpstreamVisionApi(params: {
  imageBuffer: Buffer;
  mimeType: string;
}): Promise<UpstreamVisionResponse> {
  const providerUrl = process.env.VISION_PROVIDER_URL;
  const apiKey = process.env.VISION_PROVIDER_KEY;

  if (!providerUrl || !apiKey) {
    return {
      detections: [
        {
          label: "#5-G60",
          score: 0.92,
          bbox: { x: 0.12, y: 0.18, w: 0.1, h: 0.2 },
        },
        {
          label: "#5-G60",
          score: 0.88,
          bbox: { x: 0.25, y: 0.16, w: 0.1, h: 0.2 },
        },
        {
          label: "#4-G60",
          score: 0.81,
          bbox: { x: 0.42, y: 0.15, w: 0.09, h: 0.18 },
        },
      ],
      imageWidthPx: 1920,
      imageHeightPx: 1080,
    };
  }

  const resp = await axios.post(providerUrl, params.imageBuffer, {
    headers: {
      "Content-Type": params.mimeType,
      Authorization: `Bearer ${apiKey}`,
    },
    timeout: 15000,
    maxBodyLength: Infinity,
  });

  return resp.data as UpstreamVisionResponse;
}
