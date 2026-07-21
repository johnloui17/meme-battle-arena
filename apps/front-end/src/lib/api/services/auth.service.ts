import type { User } from "@/types/entities";
import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";

export interface RegisterRequest {
  email: string;
  password: string;
  display_name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export const authService = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, data);
    return response.data;
  },
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, data);
    return response.data;
  },
  googleLogin: async (data: { code: string }): Promise<AuthResponse> => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.GOOGLE, data);
    return response.data;
  },
  forgotPassword: async (data: { email: string }): Promise<{ sent: boolean }> => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.PASSWORD_FORGOT, data);
    return response.data;
  },
  resetPassword: async (data: { token: string; password: string }): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.AUTH.PASSWORD_RESET, data);
  },
  logout: async (): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
  },
};
