import { Router } from "express";
import { requireAuth, toOwnProfile, toPublicProfile } from "../auth.js";
import { notFound } from "../errors.js";
import { updateProfileSchema } from "../schemas.js";
import { store } from "../store.js";

export const profileRoutes = Router();

profileRoutes.get("/me", requireAuth, (req, res) => {
  res.json(toOwnProfile(req.user!));
});

profileRoutes.patch("/me", requireAuth, async (req, res, next) => {
  try {
    const input = updateProfileSchema.parse(req.body);
    Object.assign(req.user!, input);
    await store.save();
    res.json(toOwnProfile(req.user!));
  } catch (error) {
    next(error);
  }
});

profileRoutes.get("/:username", async (req, res, next) => {
  try {
    const username = req.params.username.toLowerCase();
    const profile = (await store.profiles()).find((candidate) => candidate.username.toLowerCase() === username);

    if (!profile) {
      throw notFound("Profile not found");
    }

    res.json(toPublicProfile(profile));
  } catch (error) {
    next(error);
  }
});
