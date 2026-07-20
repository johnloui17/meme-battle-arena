"use client";

import type { LeaderboardEntry } from "@meme-battle-arena/contracts";
import { cn } from "@/lib/utils";

type Tier = "gold" | "silver" | "bronze";

const TIER_STYLES: Record<
  Tier,
  { card: string; watermark: string; medal: string; medalEmoji: string; rating: string }
> = {
  gold: {
    card: "z-[2] pt-[26px]",
    watermark: "-top-[18px] text-[100px]",
    medal:
      "h-[54px] w-[54px] text-[24px] bg-[radial-gradient(circle,var(--mba-gold),var(--mba-gold-deep))]",
    medalEmoji: "🥇",
    rating: "text-[24px] text-mba-gold-deep",
  },
  silver: {
    card: "-rotate-2 mb-[26px] hover:rotate-0 max-[760px]:mb-0 max-[760px]:rotate-0",
    watermark: "-top-[8px] text-[76px]",
    medal: "h-11 w-11 text-[20px] bg-[radial-gradient(circle,#e4dcc6,var(--mba-silver))]",
    medalEmoji: "🥈",
    rating: "text-[20px] text-[#7a6f5a]",
  },
  bronze: {
    card: "rotate-2 mb-[44px] hover:rotate-0 max-[760px]:mb-0 max-[760px]:rotate-0",
    watermark: "-top-[8px] text-[76px]",
    medal: "h-11 w-11 text-[20px] bg-[radial-gradient(circle,#e8a984,var(--mba-bronze))]",
    medalEmoji: "🥉",
    rating: "text-[20px] text-mba-red-deep",
  },
};

function PodCard({
  entry,
  tier,
  imageSrc,
}: {
  entry: LeaderboardEntry;
  tier: Tier;
  imageSrc: string;
}) {
  const styles = TIER_STYLES[tier];
  const isGold = tier === "gold";

  return (
    <div
      className={cn(
        "relative rounded-[8px] border-[3px] border-mba-ink bg-mba-paper px-4 pb-[22px] pt-5 text-center text-mba-ink",
        "transition-transform duration-200 ease-out hover:-translate-y-1",
        styles.card,
        isGold && "max-[760px]:order-first"
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute left-1/2 z-0 -translate-x-1/2 font-mba-display font-extrabold leading-none text-[rgba(43,27,16,0.08)]",
          styles.watermark
        )}
        aria-hidden
      >
        {entry.rank}
      </div>
      <div
        className={cn(
          "relative z-[1] mx-auto mb-3 flex items-center justify-center rounded-full border-2 border-mba-ink",
          styles.medal
        )}
      >
        {styles.medalEmoji}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc}
        alt={entry.title}
        className="relative z-[1] mb-[14px] aspect-square w-full rounded-[6px] border-2 border-mba-ink object-cover"
      />
      <div className={cn("relative z-[1] font-mba-display font-bold", isGold ? "text-[19px]" : "text-[16px]")}>
        {entry.title}
      </div>
      <div className="relative z-[1] mt-[2px] font-mba-mono text-[11px] opacity-55">
        by {entry.uploader.display_name}
      </div>
      <div className={cn("relative z-[1] mt-3 font-mba-mono font-bold", styles.rating)}>{entry.rating}</div>
      <div className="relative z-[1] mt-[2px] font-mba-mono text-[11px] opacity-55">
        {entry.wins}W – {entry.losses}L
      </div>
    </div>
  );
}

const PLACEHOLDER_TIERS: Tier[] = ["silver", "gold", "bronze"];

export function PodiumSkeleton() {
  return (
    <div className="mb-[60px] grid grid-cols-[1fr_1.1fr_1fr] items-end gap-[18px] max-[760px]:grid-cols-1 max-[760px]:gap-[14px]">
      {PLACEHOLDER_TIERS.map((tier) => (
        <div
          key={tier}
          className={cn(
            "animate-pulse rounded-[8px] border-[3px] border-mba-line bg-mba-stage-2",
            tier === "gold" ? "h-[340px] max-[760px]:order-first" : "h-[300px]",
            tier === "silver" && "mb-[26px] max-[760px]:mb-0",
            tier === "bronze" && "mb-[44px] max-[760px]:mb-0"
          )}
        />
      ))}
    </div>
  );
}

/** entries = ranks 1–3 in rank order; rendered silver / gold / bronze like the mockup. */
export function Podium({
  entries,
  imageSrc,
}: {
  entries: LeaderboardEntry[];
  imageSrc: (entry: LeaderboardEntry) => string;
}) {
  const [gold, silver, bronze] = entries;
  if (!gold) return null;

  return (
    <div className="mb-[60px] grid grid-cols-[1fr_1.1fr_1fr] items-end gap-[18px] max-[760px]:grid-cols-1 max-[760px]:gap-[14px]">
      {silver ? <PodCard entry={silver} tier="silver" imageSrc={imageSrc(silver)} /> : <div />}
      <PodCard entry={gold} tier="gold" imageSrc={imageSrc(gold)} />
      {bronze ? <PodCard entry={bronze} tier="bronze" imageSrc={imageSrc(bronze)} /> : <div />}
    </div>
  );
}
