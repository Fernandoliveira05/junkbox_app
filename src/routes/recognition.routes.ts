import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../auth.js";
import { badRequest, HttpError } from "../errors.js";
import { auddUrlRecognitionSchema } from "../schemas.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 12 * 1024 * 1024
  }
});

export const recognitionRoutes = Router();

recognitionRoutes.post("/audd", requireAuth, upload.single("audio"), async (req, res, next) => {
  try {
    const token = process.env.AUDD_API_TOKEN;
    if (!token) {
      throw new HttpError(502, "AUDD_API_TOKEN is not configured");
    }

    const formData = new FormData();
    formData.set("api_token", token);
    formData.set("return", String(req.body.return ?? "apple_music,spotify"));

    if (req.file) {
      const audio = new Blob([new Uint8Array(req.file.buffer)], { type: req.file.mimetype });
      formData.set("file", audio, req.file.originalname);
    } else {
      const input = auddUrlRecognitionSchema.parse(req.body);
      formData.set("url", input.audioUrl);
      if (input.return) {
        formData.set("return", input.return);
      }
    }

    const response = await fetch("https://api.audd.io/", {
      method: "POST",
      body: formData
    });

    const raw = (await response.json()) as Record<string, unknown>;
    if (!response.ok || raw.status === "error") {
      throw new HttpError(502, typeof raw.error === "string" ? raw.error : "AudD recognition failed");
    }

    res.json({
      provider: "AudD",
      raw,
      song: normalizeAuddResult(raw.result)
    });
  } catch (error) {
    if (error instanceof multer.MulterError) {
      next(badRequest(error.message));
      return;
    }

    next(error);
  }
});

function normalizeAuddResult(result: unknown) {
  if (!result || typeof result !== "object") {
    return null;
  }

  const value = result as Record<string, unknown>;
  const spotify = objectAt(value.spotify);
  const appleMusic = objectAt(value.apple_music);

  return {
    title: stringAt(value.title),
    artist: stringAt(value.artist),
    album: stringAt(value.album),
    releaseDate: stringAt(value.release_date),
    label: stringAt(value.label),
    timecode: stringAt(value.timecode),
    externalIds: {
      spotify: stringAt(spotify?.external_urls, "spotify"),
      appleMusic: stringAt(appleMusic, "url")
    }
  };
}

function objectAt(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : undefined;
}

function stringAt(value: unknown, key?: string): string | undefined {
  const candidate = key ? objectAt(value)?.[key] : value;
  return typeof candidate === "string" && candidate.length > 0 ? candidate : undefined;
}
