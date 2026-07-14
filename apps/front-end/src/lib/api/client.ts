import axios from "axios";
import { API } from "@/resources/constants";
import { API_ENDPOINTS, RETRY_EXCLUDED_ENDPOINTS } from "./endpoints";
import { navigate } from "@/lib/utils/navigation";

// client.ts needs the Redux store, but slices import services which import
// client.ts — break the cycle with runtime lazy loading.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let storeInstance: any = null;
const getStore = () => {
  if (!storeInstance) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- runtime lazy load, breaks the store↔client cycle
    storeInstance = require("@/store").store;
  }
  return storeInstance;
};

export const apiClient = axios.create({
  baseURL: API.BASE_URL,
  timeout: API.TIMEOUT,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = getStore().getState().auth.accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshTokenPromise: Promise<string> | null = null;

const refreshToken = async (): Promise<string> => {
  if (refreshTokenPromise) return refreshTokenPromise;
  refreshTokenPromise = (async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- runtime lazy load, breaks the store↔client cycle
      const { setTokens } = require("@/store/slices/common/auth.slice");
      const res = await axios.post(
        `${API.BASE_URL}${API_ENDPOINTS.AUTH.TOKEN_REFRESH}`,
        {},
        { withCredentials: true, headers: { "Content-Type": "application/json" } }
      );
      const accessToken = res.data.access_token;
      if (!accessToken) throw new Error("No access token in refresh response");
      getStore().dispatch(setTokens({ access: accessToken }));
      return accessToken;
    } catch (refreshError) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- runtime lazy load, breaks the store↔client cycle
      const { clearAllState } = require("@/store/actions");
      getStore().dispatch(clearAllState());
      navigate("/login");
      throw refreshError;
    } finally {
      refreshTokenPromise = null;
    }
  })();
  return refreshTokenPromise;
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isExcluded = RETRY_EXCLUDED_ENDPOINTS.some((endpoint) => originalRequest?.url?.includes(endpoint));

    if (error.response?.status === 401 && !isExcluded && !originalRequest._retry) {
      originalRequest._retry = true;
      const accessToken = await refreshToken();
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(originalRequest);
    }

    return Promise.reject(error);
  }
);
