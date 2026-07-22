"use client";

import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import type { Meme, MemeComment } from "@meme-battle-arena/contracts";
import type { AppDispatch } from "@/store";
import { commentPosted } from "@/store/slices/memes.slice";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { memeService } from "@/lib/api/services/meme.service";

const NAV_BUTTON_CLASS =
  "absolute top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border-2 border-mba-ink bg-[radial-gradient(circle,var(--mba-gold),var(--mba-gold-deep))] font-mba-display text-[20px] font-bold text-mba-ink sm:flex";

interface MemeModalProps {
  meme: Meme;
  imageSrc: string;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleReaction: () => void;
}

export function MemeModal({ meme, imageSrc, onClose, onPrev, onNext, onToggleReaction }: MemeModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [comments, setComments] = useState<MemeComment[]>([]);
  // Starts true (we're about to fetch on mount); the parent remounts this
  // component via `key={meme.id}` when navigating prev/next, so this never
  // needs to be reset to true from inside the effect itself.
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [commentInput, setCommentInput] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    memeService
      .listComments(meme.id)
      .then((response) => {
        if (!cancelled) setComments(response.data);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingComments(false);
      });
    return () => {
      cancelled = true;
    };
  }, [meme.id]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onPrev();
      if (event.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, onPrev, onNext]);

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = event.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) (dx > 0 ? onPrev : onNext)();
    touchStartX.current = null;
  };

  const handlePostComment = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = commentInput.trim();
    if (!body || isPosting) return;
    setIsPosting(true);
    try {
      const comment = await memeService.postComment(meme.id, body);
      setComments((prev) => [...prev, comment]);
      dispatch(commentPosted(meme.id));
      setCommentInput("");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(10,6,3,0.82)] p-5 backdrop-blur-[6px]"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="relative w-full max-w-[420px] rounded-[10px] border-[3px] border-mba-ink bg-mba-paper text-mba-ink shadow-[10px_10px_0_var(--mba-red-deep)]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 text-[20px] text-mba-ink opacity-60 hover:opacity-100"
        >
          ✕
        </button>

        <button onClick={onPrev} aria-label="Previous" className={cn(NAV_BUTTON_CLASS, "left-[-56px]")}>
          ‹
        </button>
        <button onClick={onNext} aria-label="Next" className={cn(NAV_BUTTON_CLASS, "right-[-56px]")}>
          ›
        </button>

        <div className="max-h-[85vh] overflow-y-auto p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt={meme.title}
            className="mb-4 aspect-square w-full rounded-[6px] border-2 border-mba-ink object-cover"
          />
          <div className="mb-1 font-mba-display text-[24px] font-bold">{meme.title}</div>
          <div className="mb-4 font-mba-mono text-[12px] text-mba-ink opacity-55">
            by {meme.uploader.display_name} · {formatRelativeTime(meme.created_at)}
          </div>

          <div className="mb-4 flex items-center justify-between font-mba-mono text-[13px]">
            <button
              onClick={onToggleReaction}
              className={cn("flex items-center gap-1", meme.reacted_by_me ? "text-mba-red" : "opacity-70")}
            >
              <span aria-hidden>{meme.reacted_by_me ? "❤️" : "🤍"}</span> {meme.reaction_count}
            </button>
            <span className="opacity-70">💬 {meme.comment_count}</span>
            <span className="font-bold text-mba-red-deep">{meme.rating}</span>
          </div>

          <div className="border-t border-[rgba(43,27,16,0.15)] pt-4">
            <div className="mb-2 font-mba-mono text-[11px] uppercase tracking-[0.06em] opacity-60">Comments</div>
            <div className="mb-3 max-h-[180px] space-y-2 overflow-y-auto">
              {isLoadingComments ? (
                <div className="font-mba-mono text-[12px] opacity-50">Loading…</div>
              ) : comments.length === 0 ? (
                <div className="font-mba-mono text-[12px] opacity-50">No comments yet.</div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="text-[13px]">
                    <span className="font-semibold">{comment.author.display_name}</span>{" "}
                    <span className="font-mba-mono text-[10px] opacity-50">
                      {formatRelativeTime(comment.created_at)}
                    </span>
                    <div className="opacity-85">{comment.body}</div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handlePostComment} className="flex gap-2">
              <input
                value={commentInput}
                onChange={(event) => setCommentInput(event.target.value)}
                placeholder="Add a comment…"
                maxLength={500}
                className="flex-1 rounded-[7px] border-2 border-[rgba(43,27,16,0.22)] bg-white/50 px-3 py-2 text-[13px] text-mba-ink outline-none focus:border-mba-red focus:bg-white/85"
              />
              <button
                type="submit"
                disabled={isPosting || !commentInput.trim()}
                className="rounded-[7px] border-2 border-mba-ink bg-[linear-gradient(90deg,var(--mba-red),var(--mba-gold))] px-4 py-2 font-mba-display text-[13px] font-bold text-mba-ink disabled:opacity-50"
              >
                Post
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
