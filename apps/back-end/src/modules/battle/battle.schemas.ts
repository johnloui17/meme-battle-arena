import { z } from "zod";

export const castVoteSchema = z.object({
  winner_meme_id: z.string().uuid(),
});
