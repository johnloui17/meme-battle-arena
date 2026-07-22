import { ERROR_CODES, type Matchup, type VoteResult } from "@meme-battle-arena/contracts";
import { ApiError } from "../../lib/errors/api-error";
import { pool } from "../../lib/db";
import { memeService } from "../meme/meme.service";
import { battleRepository } from "./battle.repository";
import { applyElo, validateMatchupForVoting } from "./battle.logic";

const MATCHUP_TTL_MS = 5 * 60 * 1000;

export const battleService = {
  async getNext(userId: string): Promise<Matchup> {
    const totalActive = await battleRepository.countActiveMemes();
    if (totalActive < 2) throw new ApiError(ERROR_CODES.NOT_ENOUGH_MEMES, 409);

    const nonOwnCount = await battleRepository.countActiveMemesExcluding(userId);
    const excludeUserId = nonOwnCount >= 2 ? userId : undefined;

    const memeA = await battleRepository.pickMemeA(excludeUserId);
    const memeB = memeA ? await battleRepository.pickMemeB(memeA, excludeUserId) : null;
    if (!memeA || !memeB) throw new ApiError(ERROR_CODES.NOT_ENOUGH_MEMES, 409);

    const expiresAt = new Date(Date.now() + MATCHUP_TTL_MS);
    const matchup = await battleRepository.insertMatchup({
      memeAId: memeA.id,
      memeBId: memeB.id,
      issuedTo: userId,
      expiresAt,
    });

    // Reuse meme.service's existing Meme JOIN/shape rather than duplicating it here.
    const [fullMemeA, fullMemeB] = await Promise.all([
      memeService.get(matchup.meme_a_id, userId),
      memeService.get(matchup.meme_b_id, userId),
    ]);

    return {
      id: matchup.id,
      meme_a: fullMemeA,
      meme_b: fullMemeB,
      expires_at: matchup.expires_at.toISOString(),
    };
  },

  async castVote(userId: string, matchupId: string, winnerMemeId: string): Promise<VoteResult> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const matchup = await battleRepository.findMatchupForUpdate(client, matchupId);
      if (!matchup) throw new ApiError(ERROR_CODES.NOT_FOUND, 404);

      validateMatchupForVoting(matchup, userId, winnerMemeId);

      const loserMemeId = winnerMemeId === matchup.meme_a_id ? matchup.meme_b_id : matchup.meme_a_id;
      const lockedMemes = await battleRepository.lockMemesForUpdate(client, [matchup.meme_a_id, matchup.meme_b_id]);
      const winnerMeme = lockedMemes.find((meme) => meme.id === winnerMemeId)!;
      const loserMeme = lockedMemes.find((meme) => meme.id === loserMemeId)!;

      const elo = applyElo(winnerMeme.rating, loserMeme.rating);

      await battleRepository.applyVoteOutcome(client, {
        matchupId,
        voterId: userId,
        winnerMemeId,
        loserMemeId,
        winnerNewRating: elo.winnerRating,
        loserNewRating: elo.loserRating,
        delta: elo.delta,
      });

      await client.query("COMMIT");

      return {
        winner: { id: winnerMemeId, old_rating: winnerMeme.rating, new_rating: elo.winnerRating },
        loser: { id: loserMemeId, old_rating: loserMeme.rating, new_rating: elo.loserRating },
        rating_delta: elo.delta,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
};
