import type { LeaderboardEntry, LeaderboardPeriod } from "@meme-battle-arena/contracts";
import { computeStreak, PERIOD_INTERVALS } from "./leaderboard.logic";
import { leaderboardRepository, type LeaderboardRowDb } from "./leaderboard.repository";

function toInterval(period: LeaderboardPeriod): string | undefined {
  return period === "all" ? undefined : PERIOD_INTERVALS[period];
}

function toEntry(row: LeaderboardRowDb, outcomes: Map<string, boolean[]>): LeaderboardEntry {
  return {
    rank: row.rank,
    id: row.id,
    title: row.title,
    image_url: `/uploads/${row.image_path}`,
    rating: row.rating,
    wins: row.wins,
    losses: row.losses,
    streak: computeStreak(outcomes.get(row.id) ?? []),
    uploader: { id: row.uploader_id, display_name: row.uploader_display_name },
  };
}

export interface ListLeaderboardOptions {
  period: LeaderboardPeriod;
  q?: string;
  offset: number;
  limit: number;
}

export const leaderboardService = {
  async list({ period, q, offset, limit }: ListLeaderboardOptions): Promise<{ rows: LeaderboardEntry[]; total: number }> {
    const { rows, total } = await leaderboardRepository.list({ interval: toInterval(period), q, offset, limit });
    const outcomes = await leaderboardRepository.recentOutcomes(rows.map((row) => row.id));
    return { rows: rows.map((row) => toEntry(row, outcomes)), total };
  },

  /** The caller's best-ranked meme on the requested board, or null if they have none on it. */
  async me(userId: string, period: LeaderboardPeriod): Promise<LeaderboardEntry | null> {
    const row = await leaderboardRepository.bestForUploader(userId, toInterval(period));
    if (!row) return null;
    const outcomes = await leaderboardRepository.recentOutcomes([row.id]);
    return toEntry(row, outcomes);
  },
};
