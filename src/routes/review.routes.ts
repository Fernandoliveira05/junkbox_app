import { Router } from "express";
import { v4 as uuid } from "uuid";
import { requireAuth } from "../auth.js";
import { notFound } from "../errors.js";
import { createReviewSchema } from "../schemas.js";
import { store } from "../store.js";

export const reviewRoutes = Router();

reviewRoutes.post("/", requireAuth, async (req, res, next) => {
  try {
    const input = createReviewSchema.parse(req.body);
    const targetExists =
      input.targetType === "song"
        ? (await store.songs()).some((song) => song.id === input.targetId)
        : (await store.albums()).some((album) => album.id === input.targetId);

    if (!targetExists) {
      throw notFound(`${input.targetType} not found`);
    }

    const review = {
      ...input,
      id: uuid(),
      userId: req.user!.id,
      createdAt: new Date().toISOString()
    };

    (await store.reviews()).push(review);
    await store.save();
    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
});

reviewRoutes.get("/me", requireAuth, async (req, res, next) => {
  try {
    const reviews = (await store.reviews()).filter((review) => review.userId === req.user!.id);
    res.json(reviews);
  } catch (error) {
    next(error);
  }
});

reviewRoutes.get("/:targetType/:targetId", async (req, res, next) => {
  try {
    if (req.params.targetType !== "song" && req.params.targetType !== "album") {
      throw notFound("Review target not found");
    }

    const reviews = (await store.reviews()).filter(
      (review) => review.targetType === req.params.targetType && review.targetId === req.params.targetId
    );

    res.json(reviews);
  } catch (error) {
    next(error);
  }
});
