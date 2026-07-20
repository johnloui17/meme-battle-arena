-- Leaderboard period/streak queries scan votes by time and enter matchups by meme id.
CREATE INDEX idx_votes_created_at ON votes (created_at);
CREATE INDEX idx_matchups_meme_a ON matchups (meme_a_id);
CREATE INDEX idx_matchups_meme_b ON matchups (meme_b_id);
