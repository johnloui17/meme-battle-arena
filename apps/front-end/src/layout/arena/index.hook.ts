import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store";
import { fetchNextMatchup, castVote } from "@/store/slices/arena.slice";
import { useAsyncAction } from "@/hooks/use-async-action";

const AUTO_ADVANCE_DELAY_MS = 1500;

export function useArena() {
  const dispatch = useDispatch<AppDispatch>();
  const { matchup, status, optimisticWinnerId, voteResult, error, sessionStats } = useSelector(
    (state: RootState) => state.arena
  );

  // Fetch once per mount only — not on every transition back to "idle". `resetArena`
  // (dispatched on logout/session-expiry via clearAllState) also sets status back to
  // "idle", and reacting to that here would re-fetch with a now-missing token, 401,
  // trigger another failed refresh + clearAllState, and loop indefinitely.
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (status !== "idle" || hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    dispatch(fetchNextMatchup());
  }, [status, dispatch]);

  // Auto-advance to a new matchup a beat after the reveal.
  useEffect(() => {
    if (status !== "revealed") return;
    const timer = setTimeout(() => dispatch(fetchNextMatchup()), AUTO_ADVANCE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [status, dispatch]);

  // Primary double-vote guard is `status !== "ready"`; useAsyncAction's re-entry
  // lock is the backup, per TECHSPEC §8.3.
  const [executeVote] = useAsyncAction(async (memeId: string) => {
    if (status !== "ready" || !matchup) return;
    await dispatch(castVote({ matchupId: matchup.id, winnerMemeId: memeId }));
  });

  const handleVote = useCallback((memeId: string) => executeVote(memeId), [executeVote]);

  // Keyboard voting: ← memeA, → memeB, only while a matchup is ready.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (status !== "ready" || !matchup) return;
      if (e.key === "ArrowLeft") handleVote(matchup.meme_a.id);
      else if (e.key === "ArrowRight") handleVote(matchup.meme_b.id);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status, matchup, handleVote]);

  const handleNext = useCallback(() => dispatch(fetchNextMatchup()), [dispatch]);

  return { matchup, status, optimisticWinnerId, voteResult, error, sessionStats, handleVote, handleNext };
}
