import type { Logger } from "pino";

declare global {
  namespace Express {
    interface Request {
      log?: Logger;
      user?: {
        sub: string;
        display_name: string;
      };
    }
  }
}

export {};
