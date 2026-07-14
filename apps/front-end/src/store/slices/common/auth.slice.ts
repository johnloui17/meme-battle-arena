import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@/types/entities";
import { authService, type LoginRequest, type RegisterRequest } from "@/lib/api/services/auth.service";
import { saveAuthData, clearAuthData } from "@/lib/storage/auth-storage";
import { extractApiError } from "@/lib/errors";

interface AuthState {
  accessToken: string | null;
  user: User | null;
  status: "idle" | "loading" | "error";
  error: string | null;
}

const initialState: AuthState = {
  accessToken: null,
  user: null,
  status: "idle",
  error: null,
};

export const registerUser = createAsyncThunk("auth/register", async (data: RegisterRequest, { rejectWithValue }) => {
  try {
    return await authService.register(data);
  } catch (error) {
    return rejectWithValue(extractApiError(error).errorMessage);
  }
});

export const loginUser = createAsyncThunk("auth/login", async (data: LoginRequest, { rejectWithValue }) => {
  try {
    return await authService.login(data);
  } catch (error) {
    return rejectWithValue(extractApiError(error).errorMessage);
  }
});

export const logoutUser = createAsyncThunk("auth/logout", async (_: void, { dispatch }) => {
  try {
    await authService.logout();
  } finally {
    dispatch(logout());
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth(state, action: PayloadAction<{ accessToken: string; user: User }>) {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
    },
    setTokens(state, action: PayloadAction<{ access: string }>) {
      state.accessToken = action.payload.access;
    },
    logout(state) {
      state.accessToken = null;
      state.user = null;
      clearAuthData();
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        (action): action is ReturnType<typeof registerUser.pending> | ReturnType<typeof loginUser.pending> =>
          action.type === registerUser.pending.type || action.type === loginUser.pending.type,
        (state) => {
          state.status = "loading";
          state.error = null;
        }
      )
      .addMatcher(
        (action): action is ReturnType<typeof registerUser.fulfilled> | ReturnType<typeof loginUser.fulfilled> =>
          action.type === registerUser.fulfilled.type || action.type === loginUser.fulfilled.type,
        (state, action) => {
          state.status = "idle";
          state.accessToken = action.payload.access_token;
          state.user = action.payload.user;
          saveAuthData({ accessToken: action.payload.access_token, user: action.payload.user });
        }
      )
      .addMatcher(
        (action): action is ReturnType<typeof registerUser.rejected> | ReturnType<typeof loginUser.rejected> =>
          action.type === registerUser.rejected.type || action.type === loginUser.rejected.type,
        (state, action) => {
          state.status = "error";
          state.error = (action.payload as string) || "Something went wrong. Please try again.";
        }
      );
  },
});

export const { setAuth, setTokens, logout } = authSlice.actions;
export default authSlice.reducer;
