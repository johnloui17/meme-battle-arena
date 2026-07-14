import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { ERROR_CODES, type Matchup, type VoteResult } from "@meme-battle-arena/contracts";
import { battleService } from "@/lib/api/services/battle.service";
import { extractApiError, type ApiErrorShape } from "@/lib/errors";

type ArenaStatus = "idle" | "loading" | "ready" | "voting" | "revealed" | "empty" | "error";

interface ArenaState {
  matchup: Matchup | null;
  status: ArenaStatus;
  optimisticWinnerId: string | null;
  voteResult: VoteResult | null;
  error: string | null;
  sessionStats: { votesCast: number };
}

const initialState: ArenaState = {
  matchup: null,
  status: "idle",
  optimisticWinnerId: null,
  voteResult: null,
  error: null,
  sessionStats: { votesCast: 0 },
};

export const fetchNextMatchup = createAsyncThunk("arena/fetchNextMatchup", async (_: void, { rejectWithValue }) => {
  try {
    return await battleService.getNext();
  } catch (error) {
    return rejectWithValue(extractApiError(error));
  }
});

export const castVote = createAsyncThunk(
  "arena/castVote",
  async (
    { matchupId, winnerMemeId }: { matchupId: string; winnerMemeId: string },
    { dispatch, rejectWithValue }
  ) => {
    try {
      return await battleService.vote(matchupId, winnerMemeId);
    } catch (error) {
      const apiError = extractApiError(error);
      // The matchup died server-side (voted/expired) — deal a fresh one instead of stranding the user.
      if (apiError.errorCode === ERROR_CODES.MATCHUP_NOT_PENDING) {
        dispatch(fetchNextMatchup());
      }
      return rejectWithValue(apiError);
    }
  }
);

const arenaSlice = createSlice({
  name: "arena",
  initialState,
  reducers: {
    resetArena() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNextMatchup.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.optimisticWinnerId = null;
        state.voteResult = null;
      })
      .addCase(fetchNextMatchup.fulfilled, (state, action) => {
        state.matchup = action.payload;
        state.status = "ready";
      })
      .addCase(fetchNextMatchup.rejected, (state, action) => {
        const payload = action.payload as ApiErrorShape | undefined;
        if (payload?.errorCode === ERROR_CODES.NOT_ENOUGH_MEMES) {
          state.status = "empty";
        } else {
          state.status = "error";
          state.error = payload?.errorMessage || "Failed to load a matchup";
        }
      })
      .addCase(castVote.pending, (state, action) => {
        state.status = "voting";
        state.optimisticWinnerId = action.meta.arg.winnerMemeId;
      })
      .addCase(castVote.fulfilled, (state, action) => {
        state.status = "revealed";
        state.voteResult = action.payload;
        state.sessionStats.votesCast += 1;
      })
      .addCase(castVote.rejected, (state, action) => {
        const payload = action.payload as ApiErrorShape | undefined;
        state.optimisticWinnerId = null;
        state.error = payload?.errorMessage || "Failed to cast vote";
        // On MATCHUP_NOT_PENDING a fresh fetchNextMatchup is already dispatched (see the thunk),
        // whose 'pending' case will immediately override this with 'loading'.
        if (payload?.errorCode !== ERROR_CODES.MATCHUP_NOT_PENDING) {
          state.status = "ready";
        }
      });
  },
});

export const { resetArena } = arenaSlice.actions;
export default arenaSlice.reducer;
