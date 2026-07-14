import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { requestContext } from "./middlewares/request-context";
import { errorHandler } from "./middlewares/error-handler";
import { authRoutes } from "./modules/auth/auth.routes";
import { memeRoutes } from "./modules/meme/meme.routes";
import { UPLOADS_DIR } from "./modules/meme/upload";
import { battleRoutes } from "./modules/battle/battle.routes";
import { leaderboardRoutes } from "./modules/leaderboard/leaderboard.routes";

const BASE_PATH = "/api/v1";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(requestContext);
  app.use("/uploads", express.static(UPLOADS_DIR, { maxAge: "1y", immutable: true }));

  app.use(`${BASE_PATH}/auth`, authRoutes);
  app.use(`${BASE_PATH}/memes`, memeRoutes);
  app.use(`${BASE_PATH}/battles`, battleRoutes);
  app.use(`${BASE_PATH}/leaderboard`, leaderboardRoutes);

  app.get(`${BASE_PATH}/health`, (_req, res) => res.json({ status: "ok" }));

  app.use(errorHandler);
  return app;
}
