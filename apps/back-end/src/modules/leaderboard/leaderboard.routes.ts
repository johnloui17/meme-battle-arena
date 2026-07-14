import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { leaderboardController } from "./leaderboard.controller";

export const leaderboardRoutes = Router();
leaderboardRoutes.use(authenticate);

leaderboardRoutes.get("/", leaderboardController.list);
