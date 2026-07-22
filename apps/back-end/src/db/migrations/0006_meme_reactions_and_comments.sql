CREATE TABLE meme_reactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meme_id     UUID NOT NULL REFERENCES memes(id),
  user_id     UUID NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (meme_id, user_id)
);

CREATE INDEX idx_meme_reactions_meme_id ON meme_reactions (meme_id);

CREATE TABLE meme_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meme_id     UUID NOT NULL REFERENCES memes(id),
  user_id     UUID NOT NULL REFERENCES users(id),
  body        TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_meme_comments_meme_id_created_at ON meme_comments (meme_id, created_at);
