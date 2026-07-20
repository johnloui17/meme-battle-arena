import { z } from "zod";

export const listLeaderboardSchema = z.object({
  period: z.enum(["all", "month", "week"]).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().optional(),
  page_size: z.coerce.number().optional(),
});

export const leaderboardMeSchema = z.object({
  period: z.enum(["all", "month", "week"]).optional(),
});
