"use client";

import type { LeaderboardEntry } from "@meme-battle-arena/contracts";

export function YourRankBar({ entry, imageSrc }: { entry: LeaderboardEntry; imageSrc: string }) {
  return (
    <div className="fixed bottom-5 left-1/2 z-[90] flex max-w-[calc(100%-40px)] -translate-x-1/2 items-center gap-4 rounded-[12px] border-[3px] border-mba-ink bg-mba-paper px-[18px] py-3 text-mba-ink shadow-[6px_6px_0_var(--mba-red-deep)] max-[760px]:gap-[10px] max-[760px]:px-[14px] max-[760px]:py-[10px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc}
        alt={entry.title}
        className="h-[34px] w-[34px] flex-none rounded-[7px] border-2 border-mba-ink object-cover"
      />
      <div className="min-w-0">
        <div className="font-mba-mono text-[10px] uppercase tracking-[0.06em] opacity-55 max-[760px]:hidden">
          Your best format
        </div>
        <div className="truncate font-mba-display text-[14px] font-bold">{entry.title}</div>
      </div>
      <div className="font-mba-display text-[20px] font-extrabold text-mba-red-deep">#{entry.rank}</div>
      <div className="ml-auto font-mba-mono text-[14px] font-bold">{entry.rating}</div>
    </div>
  );
}
