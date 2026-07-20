import { pool } from "../../lib/db";
import { escapeLike, STREAK_LOOKBACK } from "./leaderboard.logic";

export interface LeaderboardRowDb {
  id: string;
  title: string;
  image_path: string;
  rating: number;
  wins: number;
  losses: number;
  uploader_id: string;
  uploader_display_name: string;
  rank: number;
  total?: number;
}

/**
 * Ranks are computed over the FULL board (before the optional title filter),
 * so a search result keeps its true position on the leaderboard.
 */
const ALL_TIME_BOARD = `
  board AS (
    SELECT m.id, m.title, m.image_path, m.rating, m.wins, m.losses, m.uploader_id,
           (ROW_NUMBER() OVER (ORDER BY m.rating DESC, m.id))::int AS rank
    FROM memes m
    WHERE m.status = 'active'
  )
`;

/**
 * Period boards rank by net rating change inside the trailing window ($1::interval);
 * only memes with at least one vote in the window appear. The loser of each vote is
 * derived through matchups since votes only store the winner.
 */
const PERIOD_BOARD = `
  period_votes AS (
    SELECT v.winner_meme_id,
           CASE WHEN v.winner_meme_id = mu.meme_a_id THEN mu.meme_b_id ELSE mu.meme_a_id END AS loser_meme_id,
           v.rating_delta
    FROM votes v
    JOIN matchups mu ON mu.id = v.matchup_id
    WHERE v.created_at >= now() - $1::interval
  ),
  period_stats AS (
    SELECT meme_id,
           (COUNT(*) FILTER (WHERE won))::int AS wins,
           (COUNT(*) FILTER (WHERE NOT won))::int AS losses,
           SUM(CASE WHEN won THEN rating_delta ELSE -rating_delta END) AS net_delta
    FROM (
      SELECT winner_meme_id AS meme_id, TRUE AS won, rating_delta FROM period_votes
      UNION ALL
      SELECT loser_meme_id, FALSE, rating_delta FROM period_votes
    ) outcomes
    GROUP BY meme_id
  ),
  board AS (
    SELECT m.id, m.title, m.image_path, m.rating, ps.wins, ps.losses, m.uploader_id,
           (ROW_NUMBER() OVER (ORDER BY ps.net_delta DESC, m.rating DESC, m.id))::int AS rank
    FROM period_stats ps
    JOIN memes m ON m.id = ps.meme_id AND m.status = 'active'
  )
`;

function listTail(qIdx: number, limitIdx: number, offsetIdx: number): string {
  return `
    SELECT b.*, u.display_name AS uploader_display_name, (COUNT(*) OVER ())::int AS total
    FROM board b
    JOIN users u ON u.id = b.uploader_id
    WHERE ($${qIdx}::text IS NULL OR b.title ILIKE '%' || $${qIdx} || '%' ESCAPE '\\')
    ORDER BY b.rank
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;
}

function bestTail(uploaderIdx: number): string {
  return `
    SELECT b.*, u.display_name AS uploader_display_name
    FROM board b
    JOIN users u ON u.id = b.uploader_id
    WHERE b.uploader_id = $${uploaderIdx}
    ORDER BY b.rank
    LIMIT 1
  `;
}

export interface ListLeaderboardParams {
  /** e.g. "7 days" — omit for the all-time board */
  interval?: string;
  q?: string;
  offset: number;
  limit: number;
}

export const leaderboardRepository = {
  async list({ interval, q, offset, limit }: ListLeaderboardParams): Promise<{ rows: LeaderboardRowDb[]; total: number }> {
    const pattern = q ? escapeLike(q) : null;
    const { text, values } = interval
      ? { text: `WITH ${PERIOD_BOARD} ${listTail(2, 3, 4)}`, values: [interval, pattern, limit, offset] }
      : { text: `WITH ${ALL_TIME_BOARD} ${listTail(1, 2, 3)}`, values: [pattern, limit, offset] };

    const { rows } = await pool.query<LeaderboardRowDb>(text, values);
    return { rows, total: rows[0]?.total ?? 0 };
  },

  async bestForUploader(uploaderId: string, interval?: string): Promise<LeaderboardRowDb | null> {
    const { text, values } = interval
      ? { text: `WITH ${PERIOD_BOARD} ${bestTail(2)}`, values: [interval, uploaderId] }
      : { text: `WITH ${ALL_TIME_BOARD} ${bestTail(1)}`, values: [uploaderId] };

    const { rows } = await pool.query<LeaderboardRowDb>(text, values);
    return rows[0] ?? null;
  },

  /** Recent outcomes per meme, most-recent-first (true = won), capped at STREAK_LOOKBACK. */
  async recentOutcomes(memeIds: string[]): Promise<Map<string, boolean[]>> {
    const outcomes = new Map<string, boolean[]>();
    if (memeIds.length === 0) return outcomes;

    const { rows } = await pool.query<{ meme_id: string; won: boolean }>(
      `
      SELECT meme_id, won FROM (
        SELECT o.meme_id, o.won,
               ROW_NUMBER() OVER (PARTITION BY o.meme_id ORDER BY o.created_at DESC, o.vote_id DESC) AS rn
        FROM (
          SELECT mu.meme_a_id AS meme_id, (v.winner_meme_id = mu.meme_a_id) AS won, v.created_at, v.id AS vote_id
          FROM votes v
          JOIN matchups mu ON mu.id = v.matchup_id
          WHERE mu.meme_a_id = ANY($1)
          UNION ALL
          SELECT mu.meme_b_id, (v.winner_meme_id = mu.meme_b_id), v.created_at, v.id
          FROM votes v
          JOIN matchups mu ON mu.id = v.matchup_id
          WHERE mu.meme_b_id = ANY($1)
        ) o
      ) t
      WHERE rn <= $2
      ORDER BY meme_id, rn
      `,
      [memeIds, STREAK_LOOKBACK]
    );

    for (const row of rows) {
      const list = outcomes.get(row.meme_id) ?? [];
      list.push(row.won);
      outcomes.set(row.meme_id, list);
    }
    return outcomes;
  },
};
