import secureLocalStorage from "react-secure-storage";
import type { User } from "@/types/entities";

const ACCESS_TOKEN_KEY = "auth_access_token";
const USER_KEY = "auth_user";

export interface StoredAuthData {
  accessToken: string;
  user: User;
}

export function saveAuthData(data: StoredAuthData): void {
  secureLocalStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
  secureLocalStorage.setItem(USER_KEY, JSON.stringify(data.user));
}

export function loadAuthData(): StoredAuthData | null {
  const accessToken = secureLocalStorage.getItem(ACCESS_TOKEN_KEY);
  const rawUser = secureLocalStorage.getItem(USER_KEY);
  if (typeof accessToken !== "string" || typeof rawUser !== "string") return null;
  try {
    return { accessToken, user: JSON.parse(rawUser) as User };
  } catch {
    return null;
  }
}

export function clearAuthData(): void {
  secureLocalStorage.removeItem(ACCESS_TOKEN_KEY);
  secureLocalStorage.removeItem(USER_KEY);
}
