import { ERROR_CODES } from "@meme-battle-arena/contracts";
import { ApiError } from "../../lib/errors/api-error";

const RATING_FLOOR = 100;
const K_FACTOR = 32;

export interface EloResult {
  winnerRating: number;
  loserRating: number;
  delta: number;
}

export function applyElo(winnerRating: number, loserRating: number, k = K_FACTOR): EloResult {
  const expectedWinner = 1 / (1 + 10 ** ((loserRating - winnerRating) / 400));
  const delta = Math.round(k * (1 - expectedWinner));
  return {
    winnerRating: Math.max(RATING_FLOOR, winnerRating + delta),
    loserRating: Math.max(RATING_FLOOR, loserRating - delta),
    delta,
  };
}

export interface MatchupForVoting {
  status: string;
  issued_to: string;
  expires_at: Date;
  meme_a_id: string;
  meme_b_id: string;
}

/** The four guards from TECHSPEC §7.2, kept DB-free so they're unit-testable in isolation. */
export function validateMatchupForVoting(
  matchup: MatchupForVoting,
  userId: string,
  winnerMemeId: string
): void {
  const isPending = matchup.status === "pending";
  const isOwnedByVoter = matchup.issued_to === userId;
  const isExpired = matchup.expires_at.getTime() <= Date.now();

  if (!isPending || !isOwnedByVoter || isExpired) {
    throw new ApiError(ERROR_CODES.MATCHUP_NOT_PENDING, 409);
  }

  if (winnerMemeId !== matchup.meme_a_id && winnerMemeId !== matchup.meme_b_id) {
    throw new ApiError(ERROR_CODES.INVALID_WINNER, 400);
  }
}
