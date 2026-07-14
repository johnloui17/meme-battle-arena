import { pool } from "../../lib/db";

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  created_at: Date;
}

export const authRepository = {
  async findByEmail(email: string): Promise<UserRow | null> {
    const { rows } = await pool.query<UserRow>("SELECT * FROM users WHERE email = $1", [email]);
    return rows[0] ?? null;
  },

  async findById(id: string): Promise<UserRow | null> {
    const { rows } = await pool.query<UserRow>("SELECT * FROM users WHERE id = $1", [id]);
    return rows[0] ?? null;
  },

  async create(data: { email: string; passwordHash: string; displayName: string }): Promise<UserRow> {
    const { rows } = await pool.query<UserRow>(
      "INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING *",
      [data.email, data.passwordHash, data.displayName]
    );
    return rows[0];
  },
};
