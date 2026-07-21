import { randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import { ERROR_CODES } from "@meme-battle-arena/contracts";
import { env } from "../../config/env";
import { ApiError } from "../../lib/errors/api-error";
import { pool } from "../../lib/db";
import { hashToken } from "./auth.logic";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface AccessTokenPayload {
  sub: string;
  display_name: string;
}

export const tokenService = {
  signAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
  },

  verifyAccess(token: string): AccessTokenPayload {
    try {
      return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload & jwt.JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new ApiError(ERROR_CODES.TOKEN_EXPIRED, 401);
      }
      throw new ApiError(ERROR_CODES.TOKEN_INVALID, 401);
    }
  },

  async issueRefreshToken(userId: string): Promise<string> {
    const rawToken = randomBytes(48).toString("hex");
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
    await pool.query(
      "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
      [userId, hashToken(rawToken), expiresAt]
    );
    return rawToken;
  },

  /** Verifies + revokes the presented refresh token, and issues a brand new one (rotation). */
  async rotateRefreshToken(rawToken: string): Promise<{ userId: string; refreshToken: string }> {
    const tokenHash = hashToken(rawToken);
    const { rows } = await pool.query<{
      id: string;
      user_id: string;
      expires_at: Date;
      revoked_at: Date | null;
    }>("SELECT id, user_id, expires_at, revoked_at FROM refresh_tokens WHERE token_hash = $1", [tokenHash]);

    const record = rows[0];
    if (!record || record.revoked_at || record.expires_at < new Date()) {
      throw new ApiError(ERROR_CODES.TOKEN_INVALID, 401);
    }

    await pool.query("UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1", [record.id]);
    const refreshToken = await tokenService.issueRefreshToken(record.user_id);
    return { userId: record.user_id, refreshToken };
  },

  async revokeRefreshToken(rawToken: string): Promise<void> {
    await pool.query("UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL", [
      hashToken(rawToken),
    ]);
  },
};
