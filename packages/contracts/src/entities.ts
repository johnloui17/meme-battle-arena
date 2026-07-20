export interface User {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
}

export interface Meme {
  id: string;
  title: string;
  image_url: string;
  rating: number;
  wins: number;
  losses: number;
  uploader: { id: string; display_name: string };
  created_at: string;
}

export interface Matchup {
  id: string;
  meme_a: Meme;
  meme_b: Meme;
  expires_at: string;
}

export interface VoteResult {
  winner: { id: string; old_rating: number; new_rating: number };
  loser: { id: string; old_rating: number; new_rating: number };
  rating_delta: number;
}

export type LeaderboardPeriod = "all" | "month" | "week";

export interface LeaderboardStreak {
  outcome: "W" | "L";
  count: number;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  title: string;
  image_url: string;
  rating: number;
  /** record for the requested period (all-time when period=all) */
  wins: number;
  losses: number;
  /** consecutive most-recent same-outcome votes; null when the meme has no votes */
  streak: LeaderboardStreak | null;
  uploader: { id: string; display_name: string };
}
