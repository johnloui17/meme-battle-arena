import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/common/auth.slice";
import memesReducer from "./slices/memes.slice";
import arenaReducer from "./slices/arena.slice";
import leaderboardReducer from "./slices/leaderboard.slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    memes: memesReducer,
    arena: arenaReducer,
    leaderboard: leaderboardReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
