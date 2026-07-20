import { useCallback, useEffect, useState } from "react";

export type FighterSide = "p1" | "p2";

export function useLanding() {
  const [selected, setSelected] = useState<FighterSide | null>(null);
  // key bumps on every vote so the flash element remounts and its animation replays
  const [flash, setFlash] = useState<{ side: FighterSide; key: number } | null>(null);
  // false on first paint so the rating bars transition from 0 to their target width
  const [barsFilled, setBarsFilled] = useState(false);

  const vote = useCallback((side: FighterSide) => {
    setSelected(side);
    setFlash((prev) => ({ side, key: (prev?.key ?? 0) + 1 }));
  }, []);

  useEffect(() => {
    const fill = setTimeout(() => setBarsFilled(true), 60);

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

  return { selected, flash, barsFilled, vote };
}
