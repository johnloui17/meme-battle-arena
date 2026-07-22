import { pool } from "../../lib/db";

export interface MemeRow {
  id: string;
  uploader_id: string;
  title: string;
  image_path: string;
  rating: number;
  wins: number;
  losses: number;
  status: string;
  created_at: Date;
  uploader_display_name: string;
  reaction_count: number;
  comment_count: number;
  reacted_by_me: boolean;
}

export interface ListMemesParams {
  uploaderId?: string;
  sort: "newest" | "rating" | "most_reacted" | "most_commented";
  offset: number;
  limit: number;
  /** all /memes routes are authenticated, so this is always known */
  viewerId: string;
}

export interface CommentRow {
  id: string;
  meme_id: string;
  user_id: string;
  body: string;
  created_at: Date;
  author_display_name: string;
}

/** viewerParamIdx = the bound-parameter index holding the current user's id, used for reacted_by_me. */
function baseSelect(viewerParamIdx: number): string {
  return `
    SELECT m.*, u.display_name AS uploader_display_name,
           COALESCE(rc.reaction_count, 0)::int AS reaction_count,
           COALESCE(cc.comment_count, 0)::int AS comment_count,
           EXISTS (
             SELECT 1 FROM meme_reactions r WHERE r.meme_id = m.id AND r.user_id = $${viewerParamIdx}
           ) AS reacted_by_me
    FROM memes m
    JOIN users u ON u.id = m.uploader_id
    LEFT JOIN (SELECT meme_id, COUNT(*) AS reaction_count FROM meme_reactions GROUP BY meme_id) rc
      ON rc.meme_id = m.id
    LEFT JOIN (SELECT meme_id, COUNT(*) AS comment_count FROM meme_comments GROUP BY meme_id) cc
      ON cc.meme_id = m.id
  `;
}

export const memeRepository = {
  async insert(data: { uploaderId: string; title: string; imagePath: string }): Promise<MemeRow> {
    const { rows } = await pool.query<{ id: string }>(
      "INSERT INTO memes (uploader_id, title, image_path) VALUES ($1, $2, $3) RETURNING id",
      [data.uploaderId, data.title, data.imagePath]
    );
    const inserted = await memeRepository.findById(rows[0].id, data.uploaderId);
    if (!inserted) throw new Error("Failed to load meme immediately after insert");
    return inserted;
  },

  async findById(id: string, viewerId: string): Promise<MemeRow | null> {
    const { rows } = await pool.query<MemeRow>(
      `${baseSelect(2)} WHERE m.id = $1 AND m.status = 'active'`,
      [id, viewerId]
    );
    return rows[0] ?? null;
  },

  async list(params: ListMemesParams): Promise<{ rows: MemeRow[]; total: number }> {
    // Independent parameter numbering per query — the COUNT query has no viewer param,
    // so it can't share placeholder positions with the list query (viewer is always $1 there).
    const countConditions = ["m.status = 'active'"];
    const countValues: unknown[] = [];
    if (params.uploaderId) {
      countValues.push(params.uploaderId);
      countConditions.push(`m.uploader_id = $${countValues.length}`);
    }
    const countResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM memes m WHERE ${countConditions.join(" AND ")}`,
      countValues
    );

    const listConditions = ["m.status = 'active'"];
    const listValues: unknown[] = [params.viewerId];
    if (params.uploaderId) {
      listValues.push(params.uploaderId);
      listConditions.push(`m.uploader_id = $${listValues.length}`);
    }
    const orderBy =
      params.sort === "rating"
        ? "m.rating DESC"
        : params.sort === "most_reacted"
          ? "reaction_count DESC, m.created_at DESC"
          : params.sort === "most_commented"
            ? "comment_count DESC, m.created_at DESC"
            : "m.created_at DESC";

    listValues.push(params.limit, params.offset);
    const { rows } = await pool.query<MemeRow>(
      `${baseSelect(1)} WHERE ${listConditions.join(" AND ")} ORDER BY ${orderBy} LIMIT $${listValues.length - 1} OFFSET $${listValues.length}`,
      listValues
    );

    return { rows, total: Number(countResult.rows[0].count) };
  },

  async softDelete(id: string): Promise<void> {
    await pool.query("UPDATE memes SET status = 'deleted' WHERE id = $1", [id]);
  },

  async addReaction(memeId: string, userId: string): Promise<void> {
    await pool.query(
      "INSERT INTO meme_reactions (meme_id, user_id) VALUES ($1, $2) ON CONFLICT (meme_id, user_id) DO NOTHING",
      [memeId, userId]
    );
  },

  async removeReaction(memeId: string, userId: string): Promise<void> {
    await pool.query("DELETE FROM meme_reactions WHERE meme_id = $1 AND user_id = $2", [memeId, userId]);
  },

  async reactionState(memeId: string, userId: string): Promise<{ reactionCount: number; reactedByMe: boolean }> {
    const { rows } = await pool.query<{ count: string; reacted: boolean | null }>(
      "SELECT COUNT(*) AS count, BOOL_OR(user_id = $2) AS reacted FROM meme_reactions WHERE meme_id = $1",
      [memeId, userId]
    );
    return { reactionCount: Number(rows[0].count), reactedByMe: rows[0].reacted ?? false };
  },

  async listComments(memeId: string, offset: number, limit: number): Promise<{ rows: CommentRow[]; total: number }> {
    const countResult = await pool.query<{ count: string }>(
      "SELECT COUNT(*) FROM meme_comments WHERE meme_id = $1",
      [memeId]
    );
    const { rows } = await pool.query<CommentRow>(
      `SELECT c.*, u.display_name AS author_display_name
       FROM meme_comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.meme_id = $1
       ORDER BY c.created_at ASC
       LIMIT $2 OFFSET $3`,
      [memeId, limit, offset]
    );
    return { rows, total: Number(countResult.rows[0].count) };
  },

  async insertComment(memeId: string, userId: string, body: string): Promise<CommentRow> {
    const { rows } = await pool.query<{ id: string }>(
      "INSERT INTO meme_comments (meme_id, user_id, body) VALUES ($1, $2, $3) RETURNING id",
      [memeId, userId, body]
    );
    const inserted = await memeRepository.findComment(rows[0].id);
    if (!inserted) throw new Error("Failed to load comment immediately after insert");
    return inserted;
  },

  async findComment(id: string): Promise<CommentRow | null> {
    const { rows } = await pool.query<CommentRow>(
      `SELECT c.*, u.display_name AS author_display_name
       FROM meme_comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.id = $1`,
      [id]
    );
    return rows[0] ?? null;
  },

  async deleteComment(id: string): Promise<void> {
    await pool.query("DELETE FROM meme_comments WHERE id = $1", [id]);
  },
};
