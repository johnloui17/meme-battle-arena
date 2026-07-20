"use client";

import type { LeaderboardPeriod } from "@meme-battle-arena/contracts";
import { cn } from "@/lib/utils";
import { AuthGuard } from "@/components/guards/auth-guard";
import { SiteHeader } from "@/components/shell/site-header";
import { useLeaderboard } from "./index.hook";
import { Podium, PodiumSkeleton } from "./podium";
import { BoardPanel } from "./board";
import { YourRankBar } from "./your-rank-bar";

const WRAP = "max-w-[1080px] mx-auto px-[28px]";

const PERIOD_TABS: { label: string; value: LeaderboardPeriod }[] = [
  { label: "All Time", value: "all" },
  { label: "This Month", value: "month" },
  { label: "This Week", value: "week" },
];

const EMPTY_PERIOD_MESSAGES: Record<LeaderboardPeriod, string> = {
  all: "No memes on the board yet — be the first to upload one.",
  month: "No battles fought this month yet.",
  week: "No battles fought this week yet.",
};

function LeaderboardScreen() {
  const {
    period,
    setPeriod,
    searchInput,
    setSearchInput,
    q,
    showPodium,
    podium,
    boardRows,
    meEntry,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    isMine,
    withImageBase,
  } = useLeaderboard();

  const showSkeleton = isLoading && podium.length === 0 && boardRows.length === 0;

  return (
    <div className="mba relative min-h-screen w-full overflow-x-hidden pb-[100px] font-mba-body leading-[normal] text-mba-text-hi [background:radial-gradient(ellipse_800px_500px_at_15%_0%,rgba(200,29,58,0.12),transparent_60%),radial-gradient(ellipse_800px_500px_at_85%_6%,rgba(14,124,116,0.14),transparent_60%),var(--mba-stage)]">
      <div className="mba-grain" aria-hidden />

      <SiteHeader active="leaderboard" wrapClassName={WRAP} />

      {/* ---------- PAGE HERO ---------- */}
      <section className={cn(WRAP, "pb-10 pt-14 text-center")}>
        <div className="mb-4 inline-flex items-center gap-[10px] font-mba-mono text-[12px] uppercase tracking-[0.1em] text-mba-gold before:text-[10px] before:text-mba-text-dim before:content-['✦'] after:text-[10px] after:text-mba-text-dim after:content-['✦']">
          Hall of fame
        </div>
        <h1 className="mb-[14px] font-mba-display text-[clamp(32px,5.5vw,52px)] font-extrabold tracking-[-0.01em]">
          Who&apos;s{" "}
          <span className="bg-[linear-gradient(90deg,var(--mba-red),var(--mba-gold),var(--mba-teal))] bg-clip-text text-transparent">
            mass
          </span>{" "}
          this week?
        </h1>
        <p className="mx-auto max-w-[520px] text-[15px] leading-[1.6] text-mba-text-mid">
          Every format on this board earned its rank one face-off at a time. No mokka survives to the top.
        </p>
      </section>

      <div className={WRAP}>
        {/* ---------- FILTER BAR ---------- */}
        <div className="mb-[30px] mt-9 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-1 rounded-full border border-mba-line bg-mba-stage-2 p-1">
            {PERIOD_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setPeriod(tab.value)}
                className={cn(
                  "cursor-pointer rounded-full px-[18px] py-2 font-mba-display text-[14px] font-semibold transition-all duration-150",
                  tab.value === period
                    ? "bg-[linear-gradient(90deg,var(--mba-red),var(--mba-gold))] text-mba-ink"
                    : "text-mba-text-mid"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative min-w-[180px] max-w-[260px] flex-1">
            <span className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[13px] opacity-50" aria-hidden>
              🔍
            </span>
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search a meme..."
              className="w-full rounded-full border border-mba-line-strong bg-mba-stage-2 py-[10px] pl-9 pr-[14px] text-[13.5px] text-mba-text-hi placeholder:text-mba-text-dim focus:border-mba-gold focus:outline-none"
            />
          </div>
        </div>

        {error && <p className="mb-6 text-center font-mba-mono text-[13px] text-mba-red">{error}</p>}

        {/* ---------- PODIUM ---------- */}
        {showPodium && (showSkeleton ? <PodiumSkeleton /> : <Podium entries={podium} imageSrc={withImageBase} />)}

        {/* ---------- LIST ---------- */}
        <BoardPanel
          entries={boardRows}
          showSkeleton={showSkeleton}
          emptyMessage={
            q ? (
              <>
                No memes match &ldquo;{q}&rdquo;.{" "}
                <button onClick={() => setSearchInput("")} className="cursor-pointer text-mba-gold underline">
                  Clear search
                </button>
              </>
            ) : showPodium && podium.length > 0 ? null : (
              EMPTY_PERIOD_MESSAGES[period]
            )
          }
          isMine={isMine}
          imageSrc={withImageBase}
        />

        {hasMore && (
          <button
            onClick={loadMore}
            disabled={isLoadingMore}
            className="mx-auto mt-[26px] block cursor-pointer rounded-full border border-mba-line-strong bg-mba-stage-2 px-[30px] py-3 font-mba-display text-[14.5px] font-semibold text-mba-text-hi transition-colors duration-150 hover:border-mba-gold disabled:cursor-default disabled:opacity-60"
          >
            {isLoadingMore ? "Loading..." : "Show more formats"}
          </button>
        )}
      </div>

      {/* ---------- YOUR RANK STICKY ---------- */}
      {meEntry && <YourRankBar entry={meEntry} imageSrc={withImageBase(meEntry)} />}
    </div>
  );
}

export default function LeaderboardLayout() {
  return (
    <AuthGuard>
      <LeaderboardScreen />
    </AuthGuard>
  );
}
