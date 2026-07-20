"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { cn } from "@/lib/utils";
import { applyTheme, getStoredTheme, DEFAULT_THEME, type MbaTheme } from "@/lib/theme";

export type SiteHeaderNavItem = "arena" | "upload" | "leaderboard" | "my-memes";

const NAV_LINKS: { label: string; href: string; item: SiteHeaderNavItem }[] = [
  { label: "Arena", href: "/arena", item: "arena" },
  { label: "Upload", href: "/upload", item: "upload" },
  { label: "Leaderboard", href: "/leaderboard", item: "leaderboard" },
  { label: "My Memes", href: "/my-memes", item: "my-memes" },
];

interface SiteHeaderProps {
  active?: SiteHeaderNavItem;
  /** page wrap override — landing uses 1180px, the leaderboard mockup 1080px */
  wrapClassName?: string;
}

export function SiteHeader({ active, wrapClassName = "max-w-[1180px] mx-auto px-[28px]" }: SiteHeaderProps) {
  const userName = useSelector((state: RootState) => state.auth.user?.display_name ?? null);

  const [theme, setThemeState] = useState<MbaTheme>(DEFAULT_THEME);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // theme only highlights the active dropdown option, so it's synced from
  // storage when the menu opens — avoids a setState-in-effect on mount and
  // any SSR/client hydration mismatch.
  const toggleSettings = useCallback(() => {
    setSettingsOpen((open) => {
      if (!open) setThemeState(getStoredTheme());
      return !open;
    });
  }, []);

  const setTheme = useCallback((next: MbaTheme) => {
    applyTheme(next);
    setThemeState(next);
  }, []);

  return (
    <header className="sticky top-0 z-[100] border-b border-mba-line bg-[var(--mba-hud-bg)] backdrop-blur-[10px]">
      <div className={cn(wrapClassName, "flex h-[66px] items-center justify-between")}>
        <div className="flex flex-none items-center gap-[10px] whitespace-nowrap font-mba-display text-[21px] font-extrabold tracking-[0.01em]">
          🎬 Meme Battle Arena
        </div>
        <nav className="flex items-center gap-1 max-[820px]:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.item}
              href={link.href}
              className={cn(
                "relative rounded-[6px] px-4 py-2 font-mba-display text-[16px] font-semibold transition-colors duration-150",
                link.item === active
                  ? "text-mba-gold after:absolute after:bottom-[2px] after:left-4 after:right-4 after:h-[2px] after:bg-[linear-gradient(90deg,var(--mba-red),var(--mba-teal))] after:content-['']"
                  : "text-mba-text-mid hover:text-mba-text-hi"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {userName ? (
            <div className="flex items-center gap-2 rounded-full border border-mba-line-strong bg-mba-stage-2 py-[5px] pl-[6px] pr-[14px]">
              <span className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--mba-red),var(--mba-teal))] text-[11px]">
                🥭
              </span>
              <span className="font-mba-mono text-[12px] text-mba-text-mid">{userName.toUpperCase()}</span>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-full border border-mba-line-strong bg-mba-stage-2 py-[5px] pl-[6px] pr-[14px]"
            >
              <span className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--mba-red),var(--mba-teal))] text-[11px]">
                🥭
              </span>
              <span className="font-mba-mono text-[12px] text-mba-text-mid">LOGIN</span>
            </Link>
          )}
          {/* settings: theme switch (hidden on mobile — the 66px HUD can't fit it) */}
          <div className="relative max-[820px]:hidden">
            <button
              aria-label="Settings"
              onClick={toggleSettings}
              className="rounded-[6px] px-2 py-2 text-[16px] text-mba-text-mid transition-colors duration-150 hover:text-mba-text-hi"
            >
              ⚙
            </button>
            {settingsOpen && (
              <div className="absolute right-0 top-full z-[110] mt-2 flex w-[140px] flex-col gap-1 rounded-[8px] border border-mba-line-strong bg-mba-stage-2 p-2">
                <div className="px-3 py-1 font-mba-mono text-[10px] uppercase tracking-[0.06em] text-mba-text-dim">
                  Theme
                </div>
                {(["dark", "light"] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setTheme(option);
                      setSettingsOpen(false);
                    }}
                    className={cn(
                      "rounded-[6px] px-3 py-1.5 text-left font-mba-mono text-[12px] capitalize transition-colors duration-150 hover:bg-[var(--mba-row-hover)]",
                      theme === option ? "text-mba-gold" : "text-mba-text-mid"
                    )}
                  >
                    {option === "dark" ? "🌙 Dark" : "☀️ Light"}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="hidden text-[22px] text-mba-text-hi max-[820px]:block" aria-label="Menu">
            ☰
          </button>
        </div>
      </div>
    </header>
  );
}
