CREATE TABLE matchups (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meme_a_id    UUID NOT NULL REFERENCES memes(id),
  meme_b_id    UUID NOT NULL REFERENCES memes(id),
  issued_to    UUID NOT NULL REFERENCES users(id),
  status       TEXT NOT NULL DEFAULT 'pending',    -- 'pending' | 'voted' | 'expired'
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ NOT NULL               -- created_at + 5 minutes
);

CREATE TABLE votes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matchup_id      UUID NOT NULL UNIQUE REFERENCES matchups(id),  -- one vote per matchup, enforced by DB
  voter_id        UUID NOT NULL REFERENCES users(id),
  winner_meme_id  UUID NOT NULL REFERENCES memes(id),
  rating_delta    INTEGER NOT NULL,        -- points transferred, for history/debugging
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
