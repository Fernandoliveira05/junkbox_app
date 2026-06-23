import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_.-]+$/),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8),
  displayName: z.string().trim().min(1).max(80)
});

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1)
});

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(80).optional(),
  bio: z.string().trim().max(500).optional(),
  avatarUrl: z.string().trim().url().optional()
});

export const externalIdsSchema = z.record(z.string().min(1), z.string().min(1)).optional();

export const createSongSchema = z.object({
  title: z.string().trim().min(1).max(160),
  artist: z.string().trim().min(1).max(160),
  albumId: z.string().uuid().optional(),
  durationSeconds: z.number().int().positive().optional(),
  releaseDate: z.string().trim().min(4).max(30).optional(),
  coverUrl: z.string().trim().url().optional(),
  externalIds: externalIdsSchema
});

export const updateSongSchema = createSongSchema.partial();

export const createAlbumSchema = z.object({
  title: z.string().trim().min(1).max(160),
  artist: z.string().trim().min(1).max(160),
  releaseDate: z.string().trim().min(4).max(30).optional(),
  coverUrl: z.string().trim().url().optional(),
  songIds: z.array(z.string().uuid()).default([]),
  externalIds: externalIdsSchema
});

export const updateAlbumSchema = createAlbumSchema.partial();

export const createReviewSchema = z.object({
  targetType: z.enum(["song", "album"]),
  targetId: z.string().uuid(),
  rating: z.number().min(0.5).max(5),
  text: z.string().trim().max(2000).optional(),
  vibeTags: z.array(z.string().trim().min(1).max(32)).max(6).default([])
});

export const auddUrlRecognitionSchema = z.object({
  audioUrl: z.string().trim().url(),
  return: z.string().trim().optional()
});
