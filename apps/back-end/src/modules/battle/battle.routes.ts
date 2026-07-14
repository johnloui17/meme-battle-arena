import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { validate } from "../../middlewares/validate";
import { battleController } from "./battle.controller";
import { castVoteSchema } from "./battle.schemas";

export const battleRoutes = Router();
battleRoutes.use(authenticate);

battleRoutes.post("/next", battleController.next);
battleRoutes.post("/:matchupId/vote", validate(castVoteSchema), battleController.vote);
