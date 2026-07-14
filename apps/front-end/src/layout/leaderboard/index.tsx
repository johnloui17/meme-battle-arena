"use client";

import { PageHeader } from "@ntrs/core";
import { LeaderboardTable } from "@ntrs/meme";
import { AuthGuard } from "@/components/guards/auth-guard";
import { useLeaderboard } from "./index.hook";

function LeaderboardScreen() {
  const { rows, isLoading, error, highlightIds } = useLeaderboard();

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <PageHeader title="Leaderboard" subtitle="Ranked by rating — your own memes are highlighted." />

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <div className="mt-6">
        <LeaderboardTable rows={rows} isLoading={isLoading} highlightIds={highlightIds} />
      </div>
    </div>
  );
}

export default function LeaderboardLayout() {
  return (
    <AuthGuard>
      <LeaderboardScreen />
    </AuthGuard>
  );
}
