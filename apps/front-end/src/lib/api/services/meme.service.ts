import type { Meme, PaginatedResponse } from "@meme-battle-arena/contracts";
import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";

export interface ListMemesFilters {
  uploader?: "me";
  sort?: "newest" | "rating";
  page?: number;
  page_size?: number;
}

export interface UploadMemeData {
  title: string;
  file: File;
}

export const memeService = {
  list: async (filters?: ListMemesFilters): Promise<PaginatedResponse<Meme>> => {
    const response = await apiClient.get(API_ENDPOINTS.MEMES.LIST, { params: filters });
    return response.data;
  },

  get: async (id: string): Promise<Meme> => {
    const response = await apiClient.get(API_ENDPOINTS.MEMES.BY_ID(id));
    return response.data;
  },

  upload: async (data: UploadMemeData, onUploadProgress?: (percent: number) => void): Promise<Meme> => {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("image", data.file);

    const response = await apiClient.post(API_ENDPOINTS.MEMES.CREATE, formData, {
      onUploadProgress: (event) => {
        if (onUploadProgress && event.total) {
          onUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      },
    });
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.MEMES.BY_ID(id));
  },
};
