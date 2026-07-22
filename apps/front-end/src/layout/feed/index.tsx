"use client";

import type { MemeSort } from "@meme-battle-arena/contracts";
import { cn } from "@/lib/utils";
import { AuthGuard } from "@/components/guards/auth-guard";
import { SiteHeader } from "@/components/shell/site-header";
import { useFeed } from "./index.hook";
import { FeedCard } from "./feed-card";
import { MemeModal } from "./meme-modal";

const WRAP = "max-w-[1180px] mx-auto px-[28px]";

const SORT_TABS: { label: string; value: MemeSort }[] = [
  { label: "Newest", value: "newest" },
  { label: "Top Rated", value: "rating" },
  { label: "Most Reacted", value: "most_reacted" },
  { label: "Most Commented", value: "most_commented" },
];

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-[8px] border-[3px] border-mba-line bg-mba-stage-2 p-[14px]">
      <div className="mb-[10px] aspect-square w-full rounded-[6px] bg-[var(--mba-line-strong)]" />
      <div className="mb-2 h-4 w-3/4 rounded bg-[var(--mba-line-strong)]" />
      <div className="h-3 w-1/2 rounded bg-[var(--mba-line)]" />
    </div>
  );
}

function FeedScreen() {
  const {
    memes,
    isLoading,
    isLoadingMore,
    error,
    sort,
    setSort,
    hasMore,
    loadMore,
    withImageBase,
    react,
    openIndex,
    openMeme,
    closeMeme,
    nextMeme,
    prevMeme,
  } = useFeed();

  const showSkeleton = isLoading && memes.length === 0;
  const openMemeData = openIndex !== null ? memes[openIndex] : null;

  return (
    <div className="mba relative min-h-screen w-full overflow-x-hidden pb-[100px] font-mba-body leading-[normal] text-mba-text-hi [background:radial-gradient(ellipse_800px_500px_at_15%_0%,rgba(200,29,58,0.12),transparent_60%),radial-gradient(ellipse_800px_500px_at_85%_6%,rgba(14,124,116,0.14),transparent_60%),var(--mba-stage)]">
      <div className="mba-grain" aria-hidden />

      <SiteHeader active="feed" wrapClassName={WRAP} />

      <section className={cn(WRAP, "pb-8 pt-14 text-center")}>
        <div className="mb-4 inline-flex items-center gap-[10px] font-mba-mono text-[12px] uppercase tracking-[0.1em] text-mba-gold before:text-[10px] before:text-mba-text-dim before:content-['✦'] after:text-[10px] after:text-mba-text-dim after:content-['✦']">
          Every wave, one place
        </div>
        <h1 className="mb-[14px] font-mba-display text-[clamp(30px,5vw,46px)] font-extrabold tracking-[-0.01em]">
          Your{" "}
          <span className="bg-[linear-gradient(90deg,var(--mba-red),var(--mba-gold),var(--mba-teal))] bg-clip-text text-transparent">
            meme feed.
          </span>
        </h1>
        <p className="mx-auto max-w-[560px] text-[15px] leading-[1.6] text-mba-text-mid">
          Every format the arena has ever seen, in one place — tap a format to open it full screen.
        </p>
      </section>

      <div className={WRAP}>
        <div className="mb-8 flex flex-wrap gap-1 rounded-full border border-mba-line bg-mba-stage-2 p-1">
          {SORT_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSort(tab.value)}
              className={cn(
                "cursor-pointer rounded-full px-[16px] py-2 font-mba-display text-[13.5px] font-semibold transition-all duration-150",
                tab.value === sort
                  ? "bg-[linear-gradient(90deg,var(--mba-red),var(--mba-gold))] text-mba-ink"
                  : "text-mba-text-mid"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && <p className="mb-6 text-center font-mba-mono text-[13px] text-mba-red">{error}</p>}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {showSkeleton
            ? Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)
            : memes.map((meme, index) => (
                <FeedCard
                  key={meme.id}
                  meme={meme}
                  rank={index + 1}
                  imageSrc={withImageBase(meme)}
                  onOpen={() => openMeme(index)}
                  onToggleReaction={() => react(meme)}
                />
              ))}
        </div>

        {!showSkeleton && memes.length === 0 && (
          <p className="mt-10 text-center font-mba-mono text-[13px] text-mba-text-dim">
            No memes uploaded yet — be the first.
          </p>
        )}

        {hasMore && (
          <button
            onClick={loadMore}
            disabled={isLoadingMore}
            className="mx-auto mt-[30px] block cursor-pointer rounded-full border border-mba-line-strong bg-mba-stage-2 px-[30px] py-3 font-mba-display text-[14.5px] font-semibold text-mba-text-hi transition-colors duration-150 hover:border-mba-gold disabled:cursor-default disabled:opacity-60"
          >
            {isLoadingMore ? "Loading..." : "Show more formats"}
          </button>
        )}
      </div>

      {openMemeData && (
        <MemeModal
          key={openMemeData.id}
          meme={openMemeData}
          imageSrc={withImageBase(openMemeData)}
          onClose={closeMeme}
          onPrev={prevMeme}
          onNext={nextMeme}
          onToggleReaction={() => react(openMemeData)}
        />
      )}
    </div>
  );
}

export default function FeedLayout() {
  return (
    <AuthGuard>
      <FeedScreen />
    </AuthGuard>
  );
}
