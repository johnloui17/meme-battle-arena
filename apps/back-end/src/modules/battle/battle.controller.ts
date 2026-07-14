import { asyncHandler } from "../../lib/async-handler";
import { battleService } from "./battle.service";

export const battleController = {
  next: asyncHandler(async (req, res) => {
    const matchup = await battleService.getNext(req.user!.sub);
    res.json(matchup);
  }),

  vote: asyncHandler(async (req, res) => {
    const result = await battleService.castVote(req.user!.sub, req.params.matchupId as string, req.body.winner_meme_id);
    res.json(result);
  }),
};
