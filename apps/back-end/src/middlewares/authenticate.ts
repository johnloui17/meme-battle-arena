import { ERROR_CODES } from "@meme-battle-arena/contracts";
import { asyncHandler } from "../lib/async-handler";
import { ApiError } from "../lib/errors/api-error";
import { tokenService } from "../modules/auth/token.service";

export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) throw new ApiError(ERROR_CODES.TOKEN_MISSING, 401);

  const payload = tokenService.verifyAccess(header.slice(7));
  req.user = { sub: payload.sub, display_name: payload.display_name };
  next();
});
