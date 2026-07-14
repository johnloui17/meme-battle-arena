import { AppShell, PageHeader, StatPill, Button } from "@ntrs/core";
import { BattleStage, LeaderboardTable, type LeaderboardRow } from "@ntrs/meme";
import { AuthStatus } from "@/components/common/auth-status";

// Temporary demo content proving @ntrs/core + @ntrs/meme render end-to-end.
// Real memes/ratings will come from the Express API once that module exists (TECHSPEC.md §7).
function placeholder(seed: string, emoji: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
    <rect width="640" height="480" fill="#4f46e5"/>
    <text x="320" y="265" font-size="160" text-anchor="middle">${emoji}</text>
    <text x="320" y="420" font-size="28" font-family="system-ui, sans-serif" fill="rgba(255,255,255,0.85)" text-anchor="middle">${seed}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const memeA = {
  id: "a",
  title: "Distracted Boyfriend",
  imageUrl: placeholder("distracted-boyfriend", "😹"),
  rating: 1240,
  record: { wins: 18, losses: 7 },
};
const memeB = {
  id: "b",
  title: "Surprised Pikachu",
  imageUrl: placeholder("surprised-pikachu", "⚡"),
  rating: 1198,
  record: { wins: 11, losses: 9 },
};

const leaderboardRows: LeaderboardRow[] = [
  { rank: 1, id: "a", title: memeA.title, imageUrl: memeA.imageUrl, rating: memeA.rating, wins: 18, losses: 7, uploader: "loui" },
  { rank: 2, id: "b", title: memeB.title, imageUrl: memeB.imageUrl, rating: memeB.rating, wins: 11, losses: 9, uploader: "sam" },
];

export default function Home() {
  return (
    <AppShell active="arena" userName="loui">
      <PageHeader
        title="The Arena"
        subtitle="@ntrs/core + @ntrs/meme rendering live in Next.js"
        action={<StatPill label="Packages installed" value={2} />}
      />

      <div className="mb-6">
        <AuthStatus />
      </div>

      <BattleStage memeA={memeA} memeB={memeB} phase="ready" />

      <div className="mt-6 flex justify-center">
        <Button variant="outline">This button is from @ntrs/core</Button>
      </div>

      <h2 className="mt-12 mb-4 text-lg font-semibold">Leaderboard preview (@ntrs/meme)</h2>
      <LeaderboardTable rows={leaderboardRows} />
    </AppShell>
  );
}
