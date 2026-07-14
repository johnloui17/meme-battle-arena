import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Meme, PaginatedResponse } from "@meme-battle-arena/contracts";
import { memeService, type ListMemesFilters, type UploadMemeData } from "@/lib/api/services/meme.service";
import { extractApiError } from "@/lib/errors";
import { isCacheValid, listParamsMatch } from "@/lib/cache";

interface MemesFilters {
  uploaderMe: boolean;
  sort: "newest" | "rating";
  page: number;
  pageSize: number;
}

interface MemesState {
  list: {
    data: Meme[];
    pagination: PaginatedResponse<Meme>["pagination"] | null;
    isLoading: boolean;
    error: string | null;
    lastFetched: number | null;
    lastListParams: ListMemesFilters | null;
    filters: MemesFilters;
  };
  details: {
    data: Meme | null;
    isLoading: boolean;
    error: string | null;
    lastFetched: number | null;
  };
  cache: { ttl: number; enabled: boolean };
}

const initialState: MemesState = {
  list: {
    data: [],
    pagination: null,
    isLoading: false,
    error: null,
    lastFetched: null,
    lastListParams: null,
    filters: { uploaderMe: false, sort: "newest", page: 1, pageSize: 25 },
  },
  details: { data: null, isLoading: false, error: null, lastFetched: null },
  cache: { ttl: 5 * 60 * 1000, enabled: true }, // 5 min — memes don't change as fast as ratings
};

function toFilters(filters: MemesFilters): ListMemesFilters {
  return {
    uploader: filters.uploaderMe ? "me" : undefined,
    sort: filters.sort,
    page: filters.page,
    page_size: filters.pageSize,
  };
}

export const fetchMemes = createAsyncThunk(
  "memes/fetchMemes",
  async (_: void, { getState, rejectWithValue }) => {
    try {
      const { list, cache } = (getState() as { memes: MemesState }).memes;
      const filters = toFilters(list.filters);

      if (
        cache.enabled &&
        isCacheValid(list.lastFetched, cache.ttl) &&
        list.data.length > 0 &&
        listParamsMatch(list.lastListParams, filters)
      ) {
        return { data: list.data, pagination: list.pagination, filters };
      }

      const response = await memeService.list(filters);
      return { data: response.data, pagination: response.pagination, filters };
    } catch (error) {
      return rejectWithValue(extractApiError(error).errorMessage);
    }
  }
);

export const refreshMemes = createAsyncThunk(
  "memes/refreshMemes",
  async (_: void, { getState, rejectWithValue }) => {
    try {
      const { list } = (getState() as { memes: MemesState }).memes;
      const filters = toFilters(list.filters);
      const response = await memeService.list(filters);
      return { data: response.data, pagination: response.pagination, filters };
    } catch (error) {
      return rejectWithValue(extractApiError(error).errorMessage);
    }
  }
);

export const uploadMeme = createAsyncThunk(
  "memes/uploadMeme",
  async (
    { data, onUploadProgress }: { data: UploadMemeData; onUploadProgress?: (percent: number) => void },
    { rejectWithValue }
  ) => {
    try {
      return await memeService.upload(data, onUploadProgress);
    } catch (error) {
      return rejectWithValue(extractApiError(error).errorMessage);
    }
  }
);

export const deleteMeme = createAsyncThunk("memes/deleteMeme", async (id: string, { rejectWithValue }) => {
  try {
    await memeService.remove(id);
    return id;
  } catch (error) {
    return rejectWithValue(extractApiError(error).errorMessage);
  }
});

const memesSlice = createSlice({
  name: "memes",
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<Partial<Omit<MemesFilters, "page">>>) {
      state.list.filters = { ...state.list.filters, ...action.payload, page: 1 };
    },
    setPage(state, action: PayloadAction<number>) {
      state.list.filters.page = action.payload;
    },
    clearMemesData(state) {
      state.list = initialState.list;
    },
    clearMemeDetails(state) {
      state.details = initialState.details;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMemes.pending, (state) => {
        if (!isCacheValid(state.list.lastFetched, state.cache.ttl)) state.list.isLoading = true;
        state.list.error = null;
      })
      .addCase(fetchMemes.fulfilled, (state, action) => {
        state.list.isLoading = false;
        state.list.data = action.payload.data;
        state.list.pagination = action.payload.pagination;
        state.list.lastListParams = action.payload.filters;
        state.list.lastFetched = Date.now();
      })
      .addCase(fetchMemes.rejected, (state, action) => {
        state.list.isLoading = false;
        state.list.error = (action.payload as string) || "Failed to load memes";
      })
      .addCase(refreshMemes.fulfilled, (state, action) => {
        state.list.isLoading = false;
        state.list.data = action.payload.data;
        state.list.pagination = action.payload.pagination;
        state.list.lastListParams = action.payload.filters;
        state.list.lastFetched = Date.now();
      })
      .addCase(deleteMeme.fulfilled, (state, action) => {
        state.list.data = state.list.data.filter((meme) => meme.id !== action.payload);
      });
  },
});

export const { setFilters, setPage, clearMemesData, clearMemeDetails } = memesSlice.actions;
export default memesSlice.reducer;
