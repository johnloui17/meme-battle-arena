"use client";

import type { LeaderboardEntry, LeaderboardStreak } from "@meme-battle-arena/contracts";
import { cn } from "@/lib/utils";

/** 🔥-red once a win streak is 3+ (mockup: 🔥 4W / 🔥 3W hot, 2W / 1L plain). */
function StreakCell({ streak }: { streak: LeaderboardStreak | null }) {
  if (!streak) {
    return <div className="whitespace-nowrap font-mba-mono text-[12px] text-mba-text-dim max-[760px]:hidden">—</div>;
  }
  const hot = streak.outcome === "W" && streak.count >= 3;
  return (
    <div
      className={cn(
        "flex items-center gap-1 whitespace-nowrap font-mba-mono text-[12px] max-[760px]:hidden",
        hot ? "text-mba-red" : "text-mba-text-dim"
      )}
    >
      {hot && <span aria-hidden>🔥</span>}
      {streak.count}
      {streak.outcome}
    </div>
  );
}

const ROW_GRID =
  "grid grid-cols-[52px_1fr_auto_auto_auto] items-center gap-4 border-b border-mba-line px-[22px] max-[760px]:grid-cols-[36px_1fr_auto]";

function BoardRow({
  entry,
  mine,
  imageSrc,
}: {
  entry: LeaderboardEntry;
  mine: boolean;
  imageSrc: string;
}) {
  return (
    <div
      className={cn(
        ROW_GRID,
        "py-[15px] transition-colors duration-150 last:border-b-0 hover:bg-[var(--mba-row-hover)]",
        mine && "border-l-[3px] border-l-mba-gold bg-[rgba(232,169,59,0.06)] pl-[19px]"
      )}
    >
      <div className="text-center font-mba-mono text-[15px] font-bold text-mba-text-mid">{entry.rank}</div>
      <div className="flex min-w-0 items-center gap-[14px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={entry.title}
          className="h-11 w-11 flex-none rounded-[8px] border-2 border-mba-ink object-cover"
        />
        <div className="min-w-0">
          <b className="block truncate font-mba-display text-[15px] font-bold">{entry.title}</b>
          <span className="font-mba-mono text-[11px] text-mba-text-dim">
            by {entry.uploader.display_name}
            {mine && " · you"}
          </span>
        </div>
      </div>
      <StreakCell streak={entry.streak} />
      <div className="whitespace-nowrap font-mba-mono text-[12.5px] text-mba-text-mid max-[760px]:hidden">
        {entry.wins}W – {entry.losses}L
      </div>
      <div className="text-right font-mba-mono text-[15.5px] font-bold text-mba-text-hi">{entry.rating}</div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className={cn(ROW_GRID, "py-[15px] last:border-b-0")}>
      <div className="mx-auto h-4 w-6 animate-pulse rounded bg-[var(--mba-line-strong)]" />
      <div className="flex items-center gap-[14px]">
        <div className="h-11 w-11 flex-none animate-pulse rounded-[8px] bg-[var(--mba-line-strong)]" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/2 animate-pulse rounded bg-[var(--mba-line-strong)]" />
          <div className="h-3 w-1/4 animate-pulse rounded bg-[var(--mba-line)]" />
        </div>
      </div>
      <div className="h-4 w-8 animate-pulse rounded bg-[var(--mba-line)] max-[760px]:hidden" />
      <div className="h-4 w-14 animate-pulse rounded bg-[var(--mba-line)] max-[760px]:hidden" />
      <div className="ml-auto h-4 w-10 animate-pulse rounded bg-[var(--mba-line-strong)]" />
    </div>
  );
}

export function BoardPanel({
  entries,
  showSkeleton,
  emptyMessage,
  isMine,
  imageSrc,
}: {
  entries: LeaderboardEntry[];
  showSkeleton: boolean;
  /** rendered inside the panel when there are no rows (and not loading) */
  emptyMessage: React.ReactNode;
  isMine: (entry: LeaderboardEntry) => boolean;
  imageSrc: (entry: LeaderboardEntry) => string;
}) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-mba-line bg-mba-stage-2">
      <div className={cn(ROW_GRID, "py-3 font-mba-mono text-[11px] uppercase tracking-[0.06em] text-mba-text-dim")}>
        <span className="text-center">#</span>
        <span>Meme</span>
        <span className="max-[760px]:hidden">Streak</span>
        <span className="max-[760px]:hidden">Record</span>
        <span className="text-right">Rating</span>
      </div>

      {showSkeleton
        ? Array.from({ length: 8 }, (_, i) => <SkeletonRow key={i} />)
        : entries.map((entry) => (
            <BoardRow key={entry.id} entry={entry} mine={isMine(entry)} imageSrc={imageSrc(entry)} />
          ))}

      {!showSkeleton && entries.length === 0 && emptyMessage != null && (
        <div className="px-[22px] py-10 text-center font-mba-mono text-[13px] text-mba-text-dim">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}
