export const MOCK_MEME_A = {
  id: "meme-a-001",
  title: "Distracted Boyfriend",
  image_url: "/uploads/meme-a-001.jpg",
  rating: 1200,
  wins: 10,
  losses: 5,
  uploader: {
    id: "user-001",
    display_name: "MemeKing",
    email: "king@test.com",
  },
  created_at: "2025-01-15T10:00:00Z",
};

export const MOCK_MEME_B = {
  id: "meme-b-001",
  title: "Surprised Pikachu",
  image_url: "/uploads/meme-b-001.jpg",
  rating: 1150,
  wins: 8,
  losses: 7,
  uploader: {
    id: "user-002",
    display_name: "PikaFan",
    email: "pika@test.com",
  },
  created_at: "2025-01-16T12:00:00Z",
};

export const MOCK_MEME_C = {
  id: "meme-c-001",
  title: "This Is Fine",
  image_url: "/uploads/meme-c-001.jpg",
  rating: 1100,
  wins: 6,
  losses: 9,
  uploader: {
    id: "user-003",
    display_name: "DogOwner",
    email: "dog@test.com",
  },
  created_at: "2025-01-17T08:00:00Z",
};

export const MOCK_MATCHUP = {
  id: "matchup-001",
  meme_a: MOCK_MEME_A,
  meme_b: MOCK_MEME_B,
  expires_at: new Date(Date.now() + 300_000).toISOString(),
};

export const MOCK_VOTE_RESULT = {
  winner: { id: "meme-a-001", display_name: "MemeKing" },
  rating_delta: { meme_a: 16, meme_b: -16 },
};

export const MOCK_LEADERBOARD_ENTRIES = [
  { rank: 1, meme: MOCK_MEME_A, uploader: MOCK_MEME_A.uploader },
  { rank: 2, meme: MOCK_MEME_B, uploader: MOCK_MEME_B.uploader },
  { rank: 3, meme: MOCK_MEME_C, uploader: MOCK_MEME_C.uploader },
];

export const MOCK_MY_MEMES = [
  {
    id: "meme-a-001",
    title: "Distracted Boyfriend",
    image_url: "/uploads/meme-a-001.jpg",
    rating: 1200,
    wins: 10,
    losses: 5,
    created_at: "2025-01-15T10:00:00Z",
  },
  {
    id: "meme-b-001",
    title: "Surprised Pikachu",
    image_url: "/uploads/meme-b-001.jpg",
    rating: 1150,
    wins: 8,
    losses: 7,
    created_at: "2025-01-16T12:00:00Z",
  },
];

export const API_ROUTES = {
  NEXT_MATCHUP: "**/api/v1/battles/next",
  VOTE: "**/api/v1/battles/*/vote",
  MEMES: "**/api/v1/memes*",
  LEADERBOARD: "**/api/v1/leaderboard*",
};
