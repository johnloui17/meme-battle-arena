import type { LeaderboardEntry, PaginatedResponse } from "@meme-battle-arena/contracts";
import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";

export interface ListLeaderboardFilters {
  page?: number;
  page_size?: number;
}

export const leaderboardService = {
  list: async (filters?: ListLeaderboardFilters): Promise<PaginatedResponse<LeaderboardEntry>> => {
    const response = await apiClient.get(API_ENDPOINTS.LEADERBOARD.LIST, { params: filters });
    return response.data;
  },
};
