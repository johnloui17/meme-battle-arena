import type { LeaderboardPeriod } from "@meme-battle-arena/contracts";
import { asyncHandler } from "../../lib/async-handler";
import { parsePagination, buildPaginatedResponse } from "../../lib/pagination";
import { leaderboardService } from "./leaderboard.service";

export const leaderboardController = {
  list: asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const period = (req.query.period as LeaderboardPeriod | undefined) ?? "all";
    const q = (req.query.q as string | undefined) || undefined;
    const { rows, total } = await leaderboardService.list({
      period,
      q,
      offset: pagination.offset,
      limit: pagination.limit,
    });
    res.json(buildPaginatedResponse(rows, total, pagination));
  }),

  me: asyncHandler(async (req, res) => {
    const period = (req.query.period as LeaderboardPeriod | undefined) ?? "all";
    const entry = await leaderboardService.me(req.user!.sub, period);
    res.json({ data: entry });
  }),
};
