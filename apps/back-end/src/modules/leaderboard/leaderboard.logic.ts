import type { LeaderboardPeriod, LeaderboardStreak } from "@meme-battle-arena/contracts";

/** Passed to SQL as `$n::interval` — never interpolated into the query text. */
export const PERIOD_INTERVALS: Record<Exclude<LeaderboardPeriod, "all">, string> = {
  week: "7 days",
  month: "30 days",
};

/** A streak longer than this reads as "20+" territory; capping bounds the per-meme vote scan. */
export const STREAK_LOOKBACK = 20;

/**
 * outcomes = a meme's votes ordered most-recent-first, true = won.
 * The streak is the leading run of identical outcomes.
 */
export function computeStreak(outcomes: boolean[]): LeaderboardStreak | null {
  if (outcomes.length === 0) return null;
  const latest = outcomes[0];
  let count = 1;
  while (count < outcomes.length && outcomes[count] === latest) count++;
  return { outcome: latest ? "W" : "L", count };
}

/** Escape LIKE wildcards so user input matches literally (query must use ESCAPE '\'). */
export function escapeLike(q: string): string {
  return q.replace(/[\\%_]/g, "\\$&");
}
