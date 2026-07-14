CREATE TABLE memes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id    UUID NOT NULL REFERENCES users(id),
  title          TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  image_path     TEXT NOT NULL,            -- relative path under the uploads volume
  rating         INTEGER NOT NULL DEFAULT 1200,
  wins           INTEGER NOT NULL DEFAULT 0,
  losses         INTEGER NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'active',   -- 'active' | 'deleted'
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_memes_rating ON memes (rating DESC) WHERE status = 'active';
