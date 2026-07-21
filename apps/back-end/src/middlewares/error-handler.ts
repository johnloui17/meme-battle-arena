import type { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { ERROR_CODES } from "@meme-battle-arena/contracts";
import { ApiError } from "../lib/errors/api-error";
import { logger } from "../lib/logger";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    // ApiError.message defaults to its code when the throw site didn't pass one (`super(message || code)`);
    // omit it here rather than send the raw enum, so the frontend's friendly-message mapping isn't bypassed.
    const message = err.message === err.code ? undefined : err.message;
    return res.status(err.status).json({ error: err.code, message, details: err.details ?? {} });
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
