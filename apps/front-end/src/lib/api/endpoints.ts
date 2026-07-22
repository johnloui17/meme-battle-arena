const API_VERSION = "v1";
const BASE_PATH = `/api/${API_VERSION}`;

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: `${BASE_PATH}/auth/register`,
    LOGIN: `${BASE_PATH}/auth/login`,
    GOOGLE: `${BASE_PATH}/auth/google`,
    PASSWORD_FORGOT: `${BASE_PATH}/auth/password/forgot`,
    PASSWORD_RESET: `${BASE_PATH}/auth/password/reset`,
    TOKEN_REFRESH: `${BASE_PATH}/auth/token/refresh`,
    LOGOUT: `${BASE_PATH}/auth/logout`,
  },
  MEMES: {
    LIST: `${BASE_PATH}/memes`,
    CREATE: `${BASE_PATH}/memes`,
    BY_ID: (id: string) => `${BASE_PATH}/memes/${id}`,
    REACTIONS: (id: string) => `${BASE_PATH}/memes/${id}/reactions`,
    COMMENTS: (id: string) => `${BASE_PATH}/memes/${id}/comments`,
    COMMENT_BY_ID: (id: string, commentId: string) => `${BASE_PATH}/memes/${id}/comments/${commentId}`,
  },
  BATTLES: {
    NEXT: `${BASE_PATH}/battles/next`,
    VOTE: (matchupId: string) => `${BASE_PATH}/battles/${matchupId}/vote`,
  },
  LEADERBOARD: {
    LIST: `${BASE_PATH}/leaderboard`,
    ME: `${BASE_PATH}/leaderboard/me`,
  },
} as const;

export const RETRY_EXCLUDED_ENDPOINTS: string[] = [
  API_ENDPOINTS.AUTH.LOGIN,
  API_ENDPOINTS.AUTH.REGISTER,
  API_ENDPOINTS.AUTH.GOOGLE,
  API_ENDPOINTS.AUTH.PASSWORD_FORGOT,
  API_ENDPOINTS.AUTH.PASSWORD_RESET,
  API_ENDPOINTS.AUTH.TOKEN_REFRESH,
];
