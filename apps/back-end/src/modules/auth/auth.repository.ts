import { pool } from "../../lib/db";

export interface UserRow {
  id: string;
  email: string;
  password_hash: string | null;
  google_id: string | null;
  display_name: string;
  created_at: Date;
}

export interface ResetTokenRow {
  id: string;
  user_id: string;
  expires_at: Date;
  used_at: Date | null;
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

  async findByGoogleId(googleId: string): Promise<UserRow | null> {
    const { rows } = await pool.query<UserRow>("SELECT * FROM users WHERE google_id = $1", [googleId]);
    return rows[0] ?? null;
  },

  async create(data: { email: string; passwordHash: string; displayName: string }): Promise<UserRow> {
    const { rows } = await pool.query<UserRow>(
      "INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING *",
      [data.email, data.passwordHash, data.displayName]
    );
    return rows[0];
  },

  async createGoogleUser(data: { email: string; displayName: string; googleId: string }): Promise<UserRow> {
    const { rows } = await pool.query<UserRow>(
      "INSERT INTO users (email, password_hash, display_name, google_id) VALUES ($1, NULL, $2, $3) RETURNING *",
      [data.email, data.displayName, data.googleId]
    );
    return rows[0];
  },

  async linkGoogleId(userId: string, googleId: string): Promise<UserRow> {
    const { rows } = await pool.query<UserRow>(
      "UPDATE users SET google_id = $2 WHERE id = $1 RETURNING *",
      [userId, googleId]
    );
    return rows[0];
  },

  async setPassword(userId: string, passwordHash: string): Promise<void> {
    await pool.query("UPDATE users SET password_hash = $2 WHERE id = $1", [userId, passwordHash]);
  },

  async insertResetToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await pool.query(
      "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
      [userId, tokenHash, expiresAt]
    );
  },

  async findResetToken(tokenHash: string): Promise<ResetTokenRow | null> {
    const { rows } = await pool.query<ResetTokenRow>(
      "SELECT id, user_id, expires_at, used_at FROM password_reset_tokens WHERE token_hash = $1",
      [tokenHash]
    );
    return rows[0] ?? null;
  },

  async markResetTokenUsed(id: string): Promise<void> {
    await pool.query("UPDATE password_reset_tokens SET used_at = now() WHERE id = $1", [id]);
  },

  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await pool.query(
      "UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL",
      [userId]
    );
  },
};
