import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { applyTheme, getStoredTheme, DEFAULT_THEME, type MbaTheme } from "@/lib/theme";

export type FighterSide = "p1" | "p2";

export function useLanding() {
  const userName = useSelector((state: RootState) => state.auth.user?.display_name ?? null);

  const [selected, setSelected] = useState<FighterSide | null>(null);
  // key bumps on every vote so the flash element remounts and its animation replays
  const [flash, setFlash] = useState<{ side: FighterSide; key: number } | null>(null);
  // false on first paint so the rating bars transition from 0 to their target width
  const [barsFilled, setBarsFilled] = useState(false);

  const [theme, setThemeState] = useState<MbaTheme>(DEFAULT_THEME);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const vote = useCallback((side: FighterSide) => {
    setSelected(side);
    setFlash((prev) => ({ side, key: (prev?.key ?? 0) + 1 }));
  }, []);

  useEffect(() => {
    const fill = setTimeout(() => setBarsFilled(true), 60);
    setThemeState(getStoredTheme());

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") vote("p1");
      if (event.key === "ArrowRight") vote("p2");
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(fill);
      window.removeEventListener("keydown", onKey);
    };
  }, [vote]);

  const setTheme = useCallback((next: MbaTheme) => {
    applyTheme(next);
    setThemeState(next);
  }, []);

  return {
    userName,
    selected,
    flash,
    barsFilled,
    vote,
    theme,
    setTheme,
    settingsOpen,
    setSettingsOpen,
  };
}
