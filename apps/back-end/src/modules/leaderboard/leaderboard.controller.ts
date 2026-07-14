import { asyncHandler } from "../../lib/async-handler";
import { parsePagination, buildPaginatedResponse } from "../../lib/pagination";
import { leaderboardService } from "./leaderboard.service";

export const leaderboardController = {
  list: asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const { rows, total } = await leaderboardService.list(pagination.offset, pagination.limit);
    res.json(buildPaginatedResponse(rows, total, pagination));
  }),
};
