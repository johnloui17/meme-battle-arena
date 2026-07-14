import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { ERROR_CODES } from "@meme-battle-arena/contracts";
import { ApiError } from "../lib/errors/api-error";

export const validate =
  (schema: ZodSchema, source: "body" | "query" | "params" = "body") =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(
        new ApiError(ERROR_CODES.VALIDATION_ERROR, 400, "Invalid request", {
          fields: result.error.flatten().fieldErrors,
        })
      );
    }
    req[source] = result.data;
    next();
  };
