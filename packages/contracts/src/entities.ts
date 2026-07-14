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

export interface LeaderboardEntry {
  rank: number;
  id: string;
  title: string;
  image_url: string;
  rating: number;
  wins: number;
  losses: number;
  uploader: { id: string; display_name: string };
}
