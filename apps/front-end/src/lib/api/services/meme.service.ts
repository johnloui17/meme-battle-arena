import type { Meme, MemeComment, MemeSort, PaginatedResponse } from "@meme-battle-arena/contracts";
import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";

export interface ListMemesFilters {
  uploader?: "me";
  sort?: MemeSort;
  page?: number;
  page_size?: number;
}

export interface UploadMemeData {
  title: string;
  file: File;
}

export interface ReactionState {
  reaction_count: number;
  reacted_by_me: boolean;
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

  react: async (id: string): Promise<ReactionState> => {
    const response = await apiClient.post(API_ENDPOINTS.MEMES.REACTIONS(id));
    return response.data;
  },

  unreact: async (id: string): Promise<ReactionState> => {
    const response = await apiClient.delete(API_ENDPOINTS.MEMES.REACTIONS(id));
    return response.data;
  },

  listComments: async (id: string, params?: { page?: number; page_size?: number }): Promise<PaginatedResponse<MemeComment>> => {
    const response = await apiClient.get(API_ENDPOINTS.MEMES.COMMENTS(id), { params });
    return response.data;
  },

  postComment: async (id: string, body: string): Promise<MemeComment> => {
    const response = await apiClient.post(API_ENDPOINTS.MEMES.COMMENTS(id), { body });
    return response.data;
  },

  deleteComment: async (id: string, commentId: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.MEMES.COMMENT_BY_ID(id, commentId));
  },
};
