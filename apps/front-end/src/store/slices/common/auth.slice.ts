import { createAsyncThunk, createSlice, isAnyOf, type PayloadAction } from "@reduxjs/toolkit";
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

/** true (persist to localStorage) unless the caller unchecked "keep me logged in". */
type Remembered = { remember?: boolean };

export const registerUser = createAsyncThunk(
  "auth/register",
  async ({ email, password, display_name }: RegisterRequest & Remembered, { rejectWithValue }) => {
    try {
      return await authService.register({ email, password, display_name });
    } catch (error) {
      return rejectWithValue(extractApiError(error).errorMessage);
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, password }: LoginRequest & Remembered, { rejectWithValue }) => {
    try {
      return await authService.login({ email, password });
    } catch (error) {
      return rejectWithValue(extractApiError(error).errorMessage);
    }
  }
);

export const googleLoginUser = createAsyncThunk(
  "auth/google",
  async ({ code }: { code: string } & Remembered, { rejectWithValue }) => {
    try {
      return await authService.googleLogin({ code });
    } catch (error) {
      return rejectWithValue(extractApiError(error).errorMessage);
    }
  }
);

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
      .addMatcher(isAnyOf(registerUser.pending, loginUser.pending, googleLoginUser.pending), (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addMatcher(
        isAnyOf(registerUser.fulfilled, loginUser.fulfilled, googleLoginUser.fulfilled),
        (state, action) => {
          state.status = "idle";
          state.accessToken = action.payload.access_token;
          state.user = action.payload.user;

          const remember = action.meta.arg.remember ?? true;
          if (remember) {
            saveAuthData({ accessToken: action.payload.access_token, user: action.payload.user });
          } else {
            clearAuthData();
          }
        }
      )
      .addMatcher(
        isAnyOf(registerUser.rejected, loginUser.rejected, googleLoginUser.rejected),
        (state, action) => {
          state.status = "error";
          state.error = (action.payload as string) || "Something went wrong. Please try again.";
        }
      );
  },
});

export const { setAuth, setTokens, logout } = authSlice.actions;
export default authSlice.reducer;
