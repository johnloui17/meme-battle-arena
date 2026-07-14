export type MbaTheme = "dark" | "light";

export const THEME_STORAGE_KEY = "mba_theme";
export const DEFAULT_THEME: MbaTheme = "dark";

export function getStoredTheme(): MbaTheme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function applyTheme(theme: MbaTheme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // storage unavailable (private mode) — theme still applies for the session
  }
}
