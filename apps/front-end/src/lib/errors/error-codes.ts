import { ERROR_CODES } from "@meme-battle-arena/contracts";

export { ERROR_CODES };

const FRIENDLY_MESSAGES: Partial<Record<string, string>> = {
  [ERROR_CODES.VALIDATION_ERROR]: "Please check the highlighted fields and try again.",
  [ERROR_CODES.TOKEN_MISSING]: "Your session has expired. Please log in again.",
  [ERROR_CODES.TOKEN_EXPIRED]: "Your session has expired. Please log in again.",
  [ERROR_CODES.TOKEN_INVALID]: "Your session is invalid. Please log in again.",
  [ERROR_CODES.EMAIL_TAKEN]: "An account with this email already exists.",
  [ERROR_CODES.INVALID_CREDENTIALS]: "Incorrect email or password.",
  [ERROR_CODES.NOT_FOUND]: "We couldn't find what you were looking for.",
  [ERROR_CODES.INTERNAL_ERROR]: "Something went wrong. Please try again.",
};

export function getErrorMessage(code?: string, fallback?: string): string {
  if (code && FRIENDLY_MESSAGES[code]) return FRIENDLY_MESSAGES[code]!;
  return fallback || "Something went wrong. Please try again.";
}
