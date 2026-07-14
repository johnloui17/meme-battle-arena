import type { CookieOptions } from "express";
import { ERROR_CODES } from "@meme-battle-arena/contracts";
import { asyncHandler } from "../../lib/async-handler";
import { ApiError } from "../../lib/errors/api-error";
import { env } from "../../config/env";
import { authService } from "./auth.service";

const REFRESH_COOKIE = "refresh_token";

const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/api/v1/auth",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

export const authController = {
  register: asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.register(req.body);
    res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);
    res.status(201).json({ access_token: accessToken, user });
  }),

  login: asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.login(req.body.email, req.body.password);
    res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);
    res.json({ access_token: accessToken, user });
  }),

  refresh: asyncHandler(async (req, res) => {
    const token = req.cookies[REFRESH_COOKIE];
    if (!token) throw new ApiError(ERROR_CODES.TOKEN_MISSING, 401);
    const { accessToken, refreshToken } = await authService.refresh(token);
    res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);
    res.json({ access_token: accessToken });
  }),

  logout: asyncHandler(async (req, res) => {
    const token = req.cookies[REFRESH_COOKIE];
    if (token) await authService.logout(token);
    res.clearCookie(REFRESH_COOKIE, { path: refreshCookieOptions.path });
    res.status(204).end();
  }),
};
