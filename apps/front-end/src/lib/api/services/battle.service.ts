import type { Matchup, VoteResult } from "@meme-battle-arena/contracts";
import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";

export const battleService = {
  getNext: async (): Promise<Matchup> => {
    const response = await apiClient.post(API_ENDPOINTS.BATTLES.NEXT);
    return response.data;
  },

  vote: async (matchupId: string, winnerMemeId: string): Promise<VoteResult> => {
    const response = await apiClient.post(API_ENDPOINTS.BATTLES.VOTE(matchupId), {
      winner_meme_id: winnerMemeId,
    });
    return response.data;
  },
};
