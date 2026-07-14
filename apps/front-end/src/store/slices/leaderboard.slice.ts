import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { LeaderboardEntry, PaginatedResponse } from "@meme-battle-arena/contracts";
import { leaderboardService, type ListLeaderboardFilters } from "@/lib/api/services/leaderboard.service";
import { extractApiError } from "@/lib/errors";
import { isCacheValid, listParamsMatch } from "@/lib/cache";

interface LeaderboardState {
  data: LeaderboardEntry[];
  pagination: PaginatedResponse<LeaderboardEntry>["pagination"] | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  lastListParams: ListLeaderboardFilters | null;
  cache: { ttl: number; enabled: boolean };
}

const initialState: LeaderboardState = {
  data: [],
  pagination: null,
  isLoading: false,
  error: null,
  lastFetched: null,
  lastListParams: null,
  cache: { ttl: 60 * 1000, enabled: true }, // 60s — ratings move fast (TECHSPEC §8.2)
};

export const fetchLeaderboard = createAsyncThunk(
  "leaderboard/fetchLeaderboard",
  async (filters: ListLeaderboardFilters | undefined, { getState, rejectWithValue }) => {
    try {
      const state = (getState() as { leaderboard: LeaderboardState }).leaderboard;

      if (
        state.cache.enabled &&
        isCacheValid(state.lastFetched, state.cache.ttl) &&
        state.data.length > 0 &&
        listParamsMatch(state.lastListParams, filters ?? null)
      ) {
        return { data: state.data, pagination: state.pagination, filters: filters ?? null };
      }

      const response = await leaderboardService.list(filters);
      return { data: response.data, pagination: response.pagination, filters: filters ?? null };
    } catch (error) {
      return rejectWithValue(extractApiError(error).errorMessage);
    }
  }
);

export const refreshLeaderboard = createAsyncThunk(
  "leaderboard/refreshLeaderboard",
  async (filters: ListLeaderboardFilters | undefined, { rejectWithValue }) => {
    try {
      const response = await leaderboardService.list(filters);
      return { data: response.data, pagination: response.pagination, filters: filters ?? null };
    } catch (error) {
      return rejectWithValue(extractApiError(error).errorMessage);
    }
  }
);

const leaderboardSlice = createSlice({
  name: "leaderboard",
  initialState,
  reducers: {
    clearLeaderboardData() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaderboard.pending, (state) => {
        if (!isCacheValid(state.lastFetched, state.cache.ttl)) state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload.data;
        state.pagination = action.payload.pagination;
        state.lastListParams = action.payload.filters;
        state.lastFetched = Date.now();
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || "Failed to load the leaderboard";
      })
      .addCase(refreshLeaderboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload.data;
        state.pagination = action.payload.pagination;
        state.lastListParams = action.payload.filters;
        state.lastFetched = Date.now();
      });
  },
});

export const { clearLeaderboardData } = leaderboardSlice.actions;
export default leaderboardSlice.reducer;
