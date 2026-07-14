import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { logger } from "../lib/logger";

export function requestContext(req: Request, res: Response, next: NextFunction) {
  const requestId = randomUUID();
  req.log = logger.child({ requestId });
  res.setHeader("X-Request-Id", requestId);
  next();
}
