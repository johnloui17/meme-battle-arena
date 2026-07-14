"use client";

import Link from "next/link";
import { PageHeader, Button, StatPill } from "@ntrs/core";
import { BattleStage, type BattleMeme } from "@ntrs/meme";
import type { Meme } from "@meme-battle-arena/contracts";
import { AuthGuard } from "@/components/guards/auth-guard";
import { API } from "@/resources/constants";
import { useArena } from "./index.hook";

function mapMemeToBattleMeme(meme: Meme): BattleMeme {
  return {
    id: meme.id,
    title: meme.title,
    imageUrl: `${API.BASE_URL}${meme.image_url}`,
    rating: meme.rating,
    record: { wins: meme.wins, losses: meme.losses },
  };
}

function ArenaScreen() {
  const { matchup, status, optimisticWinnerId, voteResult, error, sessionStats, handleVote, handleNext } = useArena();

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <PageHeader
        title="The Arena"
        subtitle="Pick a winner — click a card or press ← / →."
        action={<StatPill label="Votes this session" value={sessionStats.votesCast} />}
      />

      {status === "loading" && <p className="mt-8 text-center text-sm text-muted-foreground">Dealing a matchup…</p>}

      {status === "empty" && (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Not enough memes in the arena yet.{" "}
          <Link href="/upload" className="underline">
            Upload one
          </Link>{" "}
          to start battling.
        </p>
      )}

      {status === "error" && (
        <div className="mt-8 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" onClick={handleNext}>
            Try again
          </Button>
        </div>
      )}

      {matchup && (status === "ready" || status === "voting" || status === "revealed") && (
        <div className="mt-8">
          <BattleStage
            memeA={mapMemeToBattleMeme(matchup.meme_a)}
            memeB={mapMemeToBattleMeme(matchup.meme_b)}
            phase={status}
            selectedId={optimisticWinnerId ?? undefined}
            result={
              voteResult ? { winnerId: voteResult.winner.id, delta: voteResult.rating_delta } : undefined
            }
            onVote={handleVote}
          />
        </div>
      )}
    </div>
  );
}

export default function ArenaLayout() {
  return (
    <AuthGuard>
      <ArenaScreen />
    </AuthGuard>
  );
}
