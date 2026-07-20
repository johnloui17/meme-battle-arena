import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { validate } from "../../middlewares/validate";
import { leaderboardController } from "./leaderboard.controller";
import { listLeaderboardSchema, leaderboardMeSchema } from "./leaderboard.schemas";

export const leaderboardRoutes = Router();
leaderboardRoutes.use(authenticate);

leaderboardRoutes.get("/", validate(listLeaderboardSchema, "query"), leaderboardController.list);
leaderboardRoutes.get("/me", validate(leaderboardMeSchema, "query"), leaderboardController.me);
