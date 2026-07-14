import bcrypt from "bcrypt";
import { ERROR_CODES, type User } from "@meme-battle-arena/contracts";
import { ApiError } from "../../lib/errors/api-error";
import { authRepository, type UserRow } from "./auth.repository";
import { tokenService } from "./token.service";

const BCRYPT_ROUNDS = 12;

function toPublicUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    display_name: row.display_name,
    created_at: row.created_at.toISOString(),
  };
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

    const accessToken = tokenService.signAccessToken({ sub: row.id, display_name: row.display_name });
    const refreshToken = await tokenService.issueRefreshToken(row.id);
    return { user: toPublicUser(row), accessToken, refreshToken };
  },

  async login(email: string, password: string) {
    const row = await authRepository.findByEmail(email);
    if (!row) {
      throw new ApiError(ERROR_CODES.INVALID_CREDENTIALS, 401);
    }

    const passwordMatches = await bcrypt.compare(password, row.password_hash);
    if (!passwordMatches) {
      throw new ApiError(ERROR_CODES.INVALID_CREDENTIALS, 401);
    }

    const accessToken = tokenService.signAccessToken({ sub: row.id, display_name: row.display_name });
    const refreshToken = await tokenService.issueRefreshToken(row.id);
    return { user: toPublicUser(row), accessToken, refreshToken };
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
