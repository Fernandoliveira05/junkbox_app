import { Router } from "express";
import { v4 as uuid } from "uuid";
import { requireAuth } from "../auth.js";
import { forbidden, notFound } from "../errors.js";
import { createSongSchema, updateSongSchema } from "../schemas.js";
import { store } from "../store.js";

export const songRoutes = Router();

songRoutes.get("/", async (req, res) => {
  const query = String(req.query.q ?? "").toLowerCase();
  const artist = String(req.query.artist ?? "").toLowerCase();
  const songs = await store.songs();

  res.json(
    songs.filter((song) => {
      const matchesQuery = !query || song.title.toLowerCase().includes(query) || song.artist.toLowerCase().includes(query);
      const matchesArtist = !artist || song.artist.toLowerCase().includes(artist);
      return matchesQuery && matchesArtist;
    })
  );
});

songRoutes.post("/", requireAuth, async (req, res, next) => {
  try {
    const input = createSongSchema.parse(req.body);
    const song = {
      ...input,
      id: uuid(),
      createdBy: req.user!.id,
      createdAt: new Date().toISOString()
    };

    (await store.songs()).push(song);
    await store.save();
    res.status(201).json(song);
  } catch (error) {
    next(error);
  }
});

songRoutes.get("/:songId", async (req, res, next) => {
  try {
    const song = (await store.songs()).find((candidate) => candidate.id === req.params.songId);
    if (!song) {
      throw notFound("Song not found");
    }

    res.json(song);
  } catch (error) {
    next(error);
  }
});

songRoutes.patch("/:songId", requireAuth, async (req, res, next) => {
  try {
    const input = updateSongSchema.parse(req.body);
    const song = (await store.songs()).find((candidate) => candidate.id === req.params.songId);
    if (!song) {
      throw notFound("Song not found");
    }
    if (song.createdBy !== req.user!.id) {
      throw forbidden("Only the creator can update this song");
    }

    Object.assign(song, input);
    await store.save();
    res.json(song);
  } catch (error) {
    next(error);
  }
});

songRoutes.delete("/:songId", requireAuth, async (req, res, next) => {
  try {
    const songs = await store.songs();
    const index = songs.findIndex((candidate) => candidate.id === req.params.songId);
    if (index === -1) {
      throw notFound("Song not found");
    }
    if (songs[index].createdBy !== req.user!.id) {
      throw forbidden("Only the creator can delete this song");
    }

    songs.splice(index, 1);
    await store.save();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
