import express from "express";
import multer from "multer";
import { z } from "zod";
import { nanoid } from "nanoid";
import { callUpstreamVisionApi } from "../vision/upstreamVisionClient";
import { normalizeVisionResult } from "../vision/normalizeVision";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 12 * 1024 * 1024,
  },
});

const querySchema = z.object({
  minConfidence: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 0.55)),
});

router.post("/vision/rebar-detect", upload.single("image"), async (req, res) => {
  const start = Date.now();

  try {
    if (!req.file) {
      return res.status(400).json({
        error: {
          code: "MISSING_IMAGE",
          message: "Field 'image' is required.",
        },
      });
    }

    const mimeType = req.file.mimetype;
    if (!["image/jpeg", "image/png"].includes(mimeType)) {
      return res.status(415).json({
        error: {
          code: "UNSUPPORTED_IMAGE_FORMAT",
          message: "Only JPEG/PNG images are supported.",
        },
      });
    }

    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        error: {
          code: "INVALID_QUERY",
          message: "Invalid query parameters.",
          details: parsed.error.flatten(),
        },
      });
    }

    const minConfidence = parsed.data.minConfidence;
    if (Number.isNaN(minConfidence) || minConfidence < 0 || minConfidence > 1) {
      return res.status(400).json({
        error: {
          code: "INVALID_MIN_CONFIDENCE",
          message: "minConfidence must be between 0 and 1.",
        },
      });
    }

    const upstream = await callUpstreamVisionApi({
      imageBuffer: req.file.buffer,
      mimeType,
    });

    const imageId = `img_${new Date().toISOString().replaceAll(":", "-")}_${nanoid(6)}`;
    const receivedAtIso = new Date().toISOString();
    const processingMs = Date.now() - start;

    const result = normalizeVisionResult({
      upstream,
      minConfidence,
      imageId,
      receivedAtIso,
      processingMs,
    });

    return res.status(200).json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("VISION ERROR:", message);

    return res.status(502).json({
      error: {
        code: "UPSTREAM_PROVIDER_ERROR",
        message: "Vision provider failed.",
      },
    });
  }
});

export default router;
