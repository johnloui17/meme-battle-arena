import { describe, it, expect } from "vitest";
import { ERROR_CODES } from "@meme-battle-arena/contracts";
import { ApiError } from "../../lib/errors/api-error";
import { applyElo, validateMatchupForVoting, type MatchupForVoting } from "./battle.logic";

describe("applyElo", () => {
  it("gives an even matchup a delta of exactly K/2 rounded", () => {
    const result = applyElo(1200, 1200);
    expect(result.delta).toBe(16); // round(32 * (1 - 0.5))
    expect(result.winnerRating).toBe(1216);
    expect(result.loserRating).toBe(1184);
  });

  it("gives the underdog winner a bigger delta than a favorite winner would get", () => {
    const underdogWins = applyElo(1000, 1400); // big rating gap, underdog (1000) wins
    const favoriteWins = applyElo(1400, 1000); // favorite (1400) wins as expected
    expect(underdogWins.delta).toBeGreaterThan(favoriteWins.delta);
  });

  it("floors the loser's rating at 100", () => {
    // Even matchup (delta=16) — an unfloored 105-16=89 must clamp to 100.
    const result = applyElo(105, 105);
    expect(result.loserRating).toBe(100);
  });

  it("respects a custom K factor", () => {
    const result = applyElo(1200, 1200, 16);
    expect(result.delta).toBe(8);
  });
});

describe("validateMatchupForVoting", () => {
  const baseMatchup: MatchupForVoting = {
    status: "pending",
    issued_to: "user-1",
    expires_at: new Date(Date.now() + 60_000),
    meme_a_id: "meme-a",
    meme_b_id: "meme-b",
  };

  it("passes silently for a valid pending, unexpired, owned matchup with a valid winner", () => {
    expect(() => validateMatchupForVoting(baseMatchup, "user-1", "meme-a")).not.toThrow();
  });

  it("throws MATCHUP_NOT_PENDING when the matchup isn't pending", () => {
    const matchup = { ...baseMatchup, status: "voted" };
    try {
      validateMatchupForVoting(matchup, "user-1", "meme-a");
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).code).toBe(ERROR_CODES.MATCHUP_NOT_PENDING);
    }
  });

  it("throws MATCHUP_NOT_PENDING when the matchup was issued to someone else", () => {
    const matchup = { ...baseMatchup, issued_to: "someone-else" };
    expect(() => validateMatchupForVoting(matchup, "user-1", "meme-a")).toThrow(
      expect.objectContaining({ code: ERROR_CODES.MATCHUP_NOT_PENDING })
    );
  });

  it("throws MATCHUP_NOT_PENDING when the matchup has expired", () => {
    const matchup = { ...baseMatchup, expires_at: new Date(Date.now() - 1000) };
    expect(() => validateMatchupForVoting(matchup, "user-1", "meme-a")).toThrow(
      expect.objectContaining({ code: ERROR_CODES.MATCHUP_NOT_PENDING })
    );
  });

  it("throws INVALID_WINNER when winnerMemeId isn't in the pair", () => {
    expect(() => validateMatchupForVoting(baseMatchup, "user-1", "some-other-meme")).toThrow(
      expect.objectContaining({ code: ERROR_CODES.INVALID_WINNER })
    );
  });
});
