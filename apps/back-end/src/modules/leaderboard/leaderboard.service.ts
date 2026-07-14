import type { LeaderboardEntry } from "@meme-battle-arena/contracts";
import { memeRepository } from "../meme/meme.repository";

export const leaderboardService = {
  async list(offset: number, limit: number): Promise<{ rows: LeaderboardEntry[]; total: number }> {
    const { rows, total } = await memeRepository.list({ sort: "rating", offset, limit });

    const entries: LeaderboardEntry[] = rows.map((row, index) => ({
      rank: offset + index + 1,
      id: row.id,
      title: row.title,
      image_url: `/uploads/${row.image_path}`,
      rating: row.rating,
      wins: row.wins,
      losses: row.losses,
      uploader: { id: row.uploader_id, display_name: row.uploader_display_name },
    }));

    return { rows: entries, total };
  },
};
