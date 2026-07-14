import type { User } from "@/types/entities";

const ACCESS_TOKEN_KEY = "auth_access_token";
const USER_KEY = "auth_user";

export interface StoredAuthData {
  accessToken: string;
  user: User;
}

export function saveAuthData(data: StoredAuthData): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
}

export function loadAuthData(): StoredAuthData | null {
  if (typeof window === "undefined") return null;
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const rawUser = localStorage.getItem(USER_KEY);
  if (accessToken === null || rawUser === null) return null;
  try {
    return { accessToken, user: JSON.parse(rawUser) as User };
  } catch {
    return null;
  }
}

export function clearAuthData(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
