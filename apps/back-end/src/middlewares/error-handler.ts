import type { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { ERROR_CODES } from "@meme-battle-arena/contracts";
import { ApiError } from "../lib/errors/api-error";
import { logger } from "../lib/logger";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.code, message: err.message, details: err.details ?? {} });
  }

  if (err instanceof MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: ERROR_CODES.FILE_TOO_LARGE, message: "File exceeds the 5MB limit", details: {} });
  }

  logger.error({ err }, "unhandled error");
  return res.status(500).json({
    error: ERROR_CODES.INTERNAL_ERROR,
    message: "An unexpected error occurred",
    details: {},
  });
}
