import { createAsyncThunk } from "@reduxjs/toolkit";
import { logout } from "./slices/common/auth.slice";
import { clearMemesData, clearMemeDetails } from "./slices/memes.slice";
import { resetArena } from "./slices/arena.slice";
import { clearLeaderboardData } from "./slices/leaderboard.slice";

/**
 * Register every new slice's clear action here, or logged-out users
 * will leak data into the next session.
 */
export const clearAllState = createAsyncThunk("app/clearAllState", async (_args: void, { dispatch }) => {
  dispatch(logout());
  dispatch(clearMemesData());
  dispatch(clearMemeDetails());
  dispatch(resetArena());
  dispatch(clearLeaderboardData());
});
