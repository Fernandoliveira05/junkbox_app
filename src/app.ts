import cors from "cors";
import express from "express";
import yaml from "js-yaml";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import swaggerUi from "swagger-ui-express";
import { authRoutes } from "./routes/auth.routes.js";
import { profileRoutes } from "./routes/profile.routes.js";
import { songRoutes } from "./routes/song.routes.js";
import { albumRoutes } from "./routes/album.routes.js";
import { reviewRoutes } from "./routes/review.routes.js";
import { recognitionRoutes } from "./routes/recognition.routes.js";
import { errorHandler, notFound } from "./errors.js";

export function createApp() {
  const app = express();
  const openApiDocument = yaml.load(readFileSync(join(process.cwd(), "openapi.yaml"), "utf8")) as object;

  app.use(cors());
  app.use(express.json({ limit: "2mb" }));
  app.use("/assets", express.static(join(process.cwd(), "public")));
  app.use("/app", express.static(join(process.cwd(), "public", "app")));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "junkbox-backend" });
  });

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
  app.get("/openapi.yaml", (_req, res) => {
    res.type("yaml").send(readFileSync(join(process.cwd(), "openapi.yaml"), "utf8"));
  });

  app.use("/auth", authRoutes);
  app.use("/profiles", profileRoutes);
  app.use("/songs", songRoutes);
  app.use("/albums", albumRoutes);
  app.use("/reviews", reviewRoutes);
  app.use("/recognition", recognitionRoutes);

  app.use((_req, _res, next) => next(notFound("Route not found")));
  app.use(errorHandler);

  return app;
}
