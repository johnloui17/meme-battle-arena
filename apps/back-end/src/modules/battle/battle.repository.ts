import type { PoolClient } from "pg";
import { pool } from "../../lib/db";

const RATING_RANGE = 200;

export interface MatchupRow {
  id: string;
  meme_a_id: string;
  meme_b_id: string;
  issued_to: string;
  status: string;
  created_at: Date;
  expires_at: Date;
}

interface MemeCandidate {
  id: string;
  rating: number;
}

export const battleRepository = {
  async countActiveMemes(): Promise<number> {
    const { rows } = await pool.query<{ count: string }>("SELECT COUNT(*) FROM memes WHERE status = 'active'");
    return Number(rows[0].count);
  },

  async countActiveMemesExcluding(userId: string): Promise<number> {
    const { rows } = await pool.query<{ count: string }>(
      "SELECT COUNT(*) FROM memes WHERE status = 'active' AND uploader_id != $1",
      [userId]
    );
    return Number(rows[0].count);
  },

  /** ORDER BY total matches ASC, random() — favors under-exposed uploads (TECHSPEC §4). */
  async pickMemeA(excludeUserId?: string): Promise<MemeCandidate | null> {
    const conditions = ["status = 'active'"];
    const values: unknown[] = [];
    if (excludeUserId) {
      values.push(excludeUserId);
      conditions.push(`uploader_id != $${values.length}`);
    }
    const { rows } = await pool.query<MemeCandidate>(
      `SELECT id, rating FROM memes WHERE ${conditions.join(" AND ")} ORDER BY (wins + losses) ASC, random() LIMIT 1`,
      values
    );
    return rows[0] ?? null;
  },

  /** Random active meme within ±200 rating of memeA, falling back to any other active meme. */
  async pickMemeB(memeA: MemeCandidate, excludeUserId?: string): Promise<MemeCandidate | null> {
    const baseConditions = ["status = 'active'", "id != $1"];
    const baseValues: unknown[] = [memeA.id];
    if (excludeUserId) {
      baseValues.push(excludeUserId);
      baseConditions.push(`uploader_id != $${baseValues.length}`);
    }

    const rangeValues = [...baseValues, memeA.rating - RATING_RANGE, memeA.rating + RATING_RANGE];
    const { rows: withinRange } = await pool.query<MemeCandidate>(
      `SELECT id, rating FROM memes
       WHERE ${baseConditions.join(" AND ")} AND rating BETWEEN $${rangeValues.length - 1} AND $${rangeValues.length}
       ORDER BY random() LIMIT 1`,
      rangeValues
    );
    if (withinRange[0]) return withinRange[0];

    const { rows: anyOther } = await pool.query<MemeCandidate>(
      `SELECT id, rating FROM memes WHERE ${baseConditions.join(" AND ")} ORDER BY random() LIMIT 1`,
      baseValues
    );
    return anyOther[0] ?? null;
  },

  async insertMatchup(data: { memeAId: string; memeBId: string; issuedTo: string; expiresAt: Date }): Promise<MatchupRow> {
    const { rows } = await pool.query<MatchupRow>(
      "INSERT INTO matchups (meme_a_id, meme_b_id, issued_to, expires_at) VALUES ($1, $2, $3, $4) RETURNING *",
      [data.memeAId, data.memeBId, data.issuedTo, data.expiresAt]
    );
    return rows[0];
  },

  async findMatchupForUpdate(client: PoolClient, matchupId: string): Promise<MatchupRow | null> {
    const { rows } = await client.query<MatchupRow>("SELECT * FROM matchups WHERE id = $1 FOR UPDATE", [matchupId]);
    return rows[0] ?? null;
  },

  /** Locks both memes in a consistent (sorted) id order to avoid deadlocking against a concurrent vote on the reverse pair. */
  async lockMemesForUpdate(
    client: PoolClient,
    ids: [string, string]
  ): Promise<Array<{ id: string; rating: number; wins: number; losses: number }>> {
    const sortedIds = [...ids].sort();
    const { rows } = await client.query<{ id: string; rating: number; wins: number; losses: number }>(
      "SELECT id, rating, wins, losses FROM memes WHERE id = ANY($1::uuid[]) ORDER BY id FOR UPDATE",
      [sortedIds]
    );
    return rows;
  },

  async applyVoteOutcome(
    client: PoolClient,
    data: {
      matchupId: string;
      voterId: string;
      winnerMemeId: string;
      loserMemeId: string;
      winnerNewRating: number;
      loserNewRating: number;
      delta: number;
    }
  ): Promise<void> {
    await client.query("UPDATE memes SET rating = $1, wins = wins + 1 WHERE id = $2", [
      data.winnerNewRating,
      data.winnerMemeId,
    ]);
    await client.query("UPDATE memes SET rating = $1, losses = losses + 1 WHERE id = $2", [
      data.loserNewRating,
      data.loserMemeId,
    ]);
    await client.query(
      "INSERT INTO votes (matchup_id, voter_id, winner_meme_id, rating_delta) VALUES ($1, $2, $3, $4)",
      [data.matchupId, data.voterId, data.winnerMemeId, data.delta]
    );
    await client.query("UPDATE matchups SET status = 'voted' WHERE id = $1", [data.matchupId]);
  },
};
