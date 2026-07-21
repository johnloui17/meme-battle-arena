import { randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import { ERROR_CODES, type User } from "@meme-battle-arena/contracts";
import { env } from "../../config/env";
import { ApiError } from "../../lib/errors/api-error";
import { mailer } from "../../lib/mailer";
import { authRepository, type UserRow } from "./auth.repository";
import { tokenService } from "./token.service";
import { hashToken, isResetTokenUsable, googleClaimsToProfile } from "./auth.logic";
import { exchangeGoogleCode } from "./google.service";
import { buildResetEmail } from "./reset-email";

const BCRYPT_ROUNDS = 12;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 60 minutes

function toPublicUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    display_name: row.display_name,
    created_at: row.created_at.toISOString(),
  };
}

async function issueSession(row: UserRow) {
  const accessToken = tokenService.signAccessToken({ sub: row.id, display_name: row.display_name });
  const refreshToken = await tokenService.issueRefreshToken(row.id);
  return { user: toPublicUser(row), accessToken, refreshToken };
}

export const authService = {
  async register(input: { email: string; password: string; display_name: string }) {
    const existing = await authRepository.findByEmail(input.email);
    if (existing) {
      throw new ApiError(ERROR_CODES.EMAIL_TAKEN, 409, "A user with this email already exists");
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const row = await authRepository.create({
      email: input.email,
      passwordHash,
      displayName: input.display_name,
    });

    return issueSession(row);
  },

  async login(email: string, password: string) {
    const row = await authRepository.findByEmail(email);
    if (!row || !row.password_hash) {
      // No row, or a Google-only account that has never set a password.
      throw new ApiError(ERROR_CODES.INVALID_CREDENTIALS, 401);
    }

    const passwordMatches = await bcrypt.compare(password, row.password_hash);
    if (!passwordMatches) {
      throw new ApiError(ERROR_CODES.INVALID_CREDENTIALS, 401);
    }

    return issueSession(row);
  },

  async googleLogin(code: string) {
    const claims = await exchangeGoogleCode(code);
    const profile = googleClaimsToProfile(claims);
    if (!profile) throw new ApiError(ERROR_CODES.OAUTH_FAILED, 401);

    const existingByGoogleId = await authRepository.findByGoogleId(profile.googleId);
    if (existingByGoogleId) return issueSession(existingByGoogleId);

    if (profile.emailVerified) {
      const existingByEmail = await authRepository.findByEmail(profile.email);
      if (existingByEmail) {
        const linked = await authRepository.linkGoogleId(existingByEmail.id, profile.googleId);
        return issueSession(linked);
      }
    }

    if (!profile.emailVerified) {
      // Unverified email with no existing Google-linked account — refuse rather
      // than risk creating/linking an account the caller doesn't actually own.
      throw new ApiError(ERROR_CODES.OAUTH_FAILED, 401);
    }

    const created = await authRepository.createGoogleUser({
      email: profile.email,
      displayName: profile.displayName,
      googleId: profile.googleId,
    });
    return issueSession(created);
  },

  /** Always resolves without revealing whether the email has an account (no user enumeration). */
  async forgotPassword(email: string): Promise<void> {
    const row = await authRepository.findByEmail(email);
    if (!row) return;

    const rawToken = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await authRepository.insertResetToken(row.id, hashToken(rawToken), expiresAt);

    const resetUrl = `${env.WEB_ORIGIN}/reset-password?token=${rawToken}`;
    await mailer.send({ to: row.email, ...buildResetEmail(resetUrl) });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    const record = await authRepository.findResetToken(hashToken(token));
    if (!record || !isResetTokenUsable(record, new Date())) {
      throw new ApiError(ERROR_CODES.RESET_TOKEN_INVALID, 400);
    }

    await authRepository.markResetTokenUsed(record.id);
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await authRepository.setPassword(record.user_id, passwordHash);
    // A password reset likely means the account was compromised or the owner
    // lost access — revoke every other session rather than just this one.
    await authRepository.revokeAllRefreshTokens(record.user_id);
  },

  async refresh(refreshTokenCookie: string) {
    const { userId, refreshToken } = await tokenService.rotateRefreshToken(refreshTokenCookie);
    const row = await authRepository.findById(userId);
    if (!row) {
      throw new ApiError(ERROR_CODES.TOKEN_INVALID, 401);
    }
    const accessToken = tokenService.signAccessToken({ sub: row.id, display_name: row.display_name });
    return { accessToken, refreshToken };
  },

  async logout(refreshTokenCookie: string) {
    await tokenService.revokeRefreshToken(refreshTokenCookie);
  },
};
