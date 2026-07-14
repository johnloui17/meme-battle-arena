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
}

export interface ListMemesParams {
  uploaderId?: string;
  sort: "newest" | "rating";
  offset: number;
  limit: number;
}

const BASE_SELECT = `
  SELECT m.*, u.display_name AS uploader_display_name
  FROM memes m
  JOIN users u ON u.id = m.uploader_id
`;

export const memeRepository = {
  async insert(data: { uploaderId: string; title: string; imagePath: string }): Promise<MemeRow> {
    const { rows } = await pool.query<{ id: string }>(
      "INSERT INTO memes (uploader_id, title, image_path) VALUES ($1, $2, $3) RETURNING id",
      [data.uploaderId, data.title, data.imagePath]
    );
    const inserted = await memeRepository.findById(rows[0].id);
    if (!inserted) throw new Error("Failed to load meme immediately after insert");
    return inserted;
  },

  async findById(id: string): Promise<MemeRow | null> {
    const { rows } = await pool.query<MemeRow>(`${BASE_SELECT} WHERE m.id = $1 AND m.status = 'active'`, [id]);
    return rows[0] ?? null;
  },

  async list(params: ListMemesParams): Promise<{ rows: MemeRow[]; total: number }> {
    const conditions = ["m.status = 'active'"];
    const values: unknown[] = [];
    if (params.uploaderId) {
      values.push(params.uploaderId);
      conditions.push(`m.uploader_id = $${values.length}`);
    }
    const where = conditions.join(" AND ");
    const orderBy = params.sort === "rating" ? "m.rating DESC" : "m.created_at DESC";

    const countResult = await pool.query<{ count: string }>(`SELECT COUNT(*) FROM memes m WHERE ${where}`, values);

    const listValues = [...values, params.limit, params.offset];
    const { rows } = await pool.query<MemeRow>(
      `${BASE_SELECT} WHERE ${where} ORDER BY ${orderBy} LIMIT $${listValues.length - 1} OFFSET $${listValues.length}`,
      listValues
    );

    return { rows, total: Number(countResult.rows[0].count) };
  },

  async softDelete(id: string): Promise<void> {
    await pool.query("UPDATE memes SET status = 'deleted' WHERE id = $1", [id]);
  },
};
