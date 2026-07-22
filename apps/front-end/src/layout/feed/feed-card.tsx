"use client";

import type { Meme } from "@meme-battle-arena/contracts";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format-relative-time";

interface FeedCardProps {
  meme: Meme;
  rank: number;
  imageSrc: string;
  onOpen: () => void;
  onToggleReaction: () => void;
}

export function FeedCard({ meme, rank, imageSrc, onOpen, onToggleReaction }: FeedCardProps) {
  return (
    <div
      onClick={onOpen}
      className="relative cursor-pointer rounded-[8px] border-[3px] border-mba-ink bg-mba-paper p-[14px] text-mba-ink transition-[transform,box-shadow] duration-150 hover:-translate-y-1 hover:shadow-[4px_4px_0_var(--mba-red-deep)]"
    >
      <div
        className={cn(
          "absolute -top-[10px] left-3 rounded-full px-[9px] py-[3px] font-mba-mono text-[10.5px] font-bold tracking-[0.04em]",
          rank <= 3 ? "bg-mba-gold-deep text-mba-ink" : "bg-mba-ink text-mba-paper"
        )}
      >
        #{rank}
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc}
        alt={meme.title}
        className="mb-[10px] aspect-square w-full rounded-[6px] border-2 border-mba-ink object-cover"
      />

      <div className="mb-[2px] truncate font-mba-display text-[14px] font-bold leading-[1.2]">{meme.title}</div>
      <div className="mb-2 truncate font-mba-mono text-[10.5px] opacity-55">
        by {meme.uploader.display_name} · {formatRelativeTime(meme.created_at)}
      </div>

      <div className="flex items-center justify-between font-mba-mono text-[11px] opacity-75">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleReaction();
          }}
          className={cn("flex items-center gap-1", meme.reacted_by_me && "opacity-100 text-mba-red")}
        >
          <span aria-hidden>{meme.reacted_by_me ? "❤️" : "🤍"}</span> {meme.reaction_count}
        </button>
        <span>💬 {meme.comment_count}</span>
        <span className="font-bold opacity-100">{meme.rating}</span>
      </div>
    </div>
  );
}
