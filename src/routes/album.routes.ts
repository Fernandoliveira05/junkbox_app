import { Router } from "express";
import { v4 as uuid } from "uuid";
import { requireAuth } from "../auth.js";
import { forbidden, notFound } from "../errors.js";
import { createAlbumSchema, updateAlbumSchema } from "../schemas.js";
import { store } from "../store.js";

export const albumRoutes = Router();

albumRoutes.get("/", async (req, res) => {
  const query = String(req.query.q ?? "").toLowerCase();
  const artist = String(req.query.artist ?? "").toLowerCase();
  const albums = await store.albums();

  res.json(
    albums.filter((album) => {
      const matchesQuery = !query || album.title.toLowerCase().includes(query) || album.artist.toLowerCase().includes(query);
      const matchesArtist = !artist || album.artist.toLowerCase().includes(artist);
      return matchesQuery && matchesArtist;
    })
  );
});

albumRoutes.post("/", requireAuth, async (req, res, next) => {
  try {
    const input = createAlbumSchema.parse(req.body);
    const album = {
      ...input,
      songIds: input.songIds ?? [],
      id: uuid(),
      createdBy: req.user!.id,
      createdAt: new Date().toISOString()
    };

    (await store.albums()).push(album);
    await store.save();
    res.status(201).json(album);
  } catch (error) {
    next(error);
  }
});

albumRoutes.get("/:albumId", async (req, res, next) => {
  try {
    const album = (await store.albums()).find((candidate) => candidate.id === req.params.albumId);
    if (!album) {
      throw notFound("Album not found");
    }

    res.json(album);
  } catch (error) {
    next(error);
  }
});

albumRoutes.patch("/:albumId", requireAuth, async (req, res, next) => {
  try {
    const input = updateAlbumSchema.parse(req.body);
    const album = (await store.albums()).find((candidate) => candidate.id === req.params.albumId);
    if (!album) {
      throw notFound("Album not found");
    }
    if (album.createdBy !== req.user!.id) {
      throw forbidden("Only the creator can update this album");
    }

    Object.assign(album, input);
    await store.save();
    res.json(album);
  } catch (error) {
    next(error);
  }
});

albumRoutes.delete("/:albumId", requireAuth, async (req, res, next) => {
  try {
    const albums = await store.albums();
    const index = albums.findIndex((candidate) => candidate.id === req.params.albumId);
    if (index === -1) {
      throw notFound("Album not found");
    }
    if (albums[index].createdBy !== req.user!.id) {
      throw forbidden("Only the creator can delete this album");
    }

    albums.splice(index, 1);
    await store.save();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
