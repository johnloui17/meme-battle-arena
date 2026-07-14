import fs from "node:fs/promises";
import path from "node:path";
import { fromFile } from "file-type";
import { ERROR_CODES, type Meme } from "@meme-battle-arena/contracts";
import { ApiError } from "../../lib/errors/api-error";
import { memeRepository, type MemeRow, type ListMemesParams } from "./meme.repository";
import { UPLOADS_DIR } from "./upload";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function toPublicMeme(row: MemeRow): Meme {
  return {
    id: row.id,
    title: row.title,
    image_url: `/uploads/${row.image_path}`,
    rating: row.rating,
    wins: row.wins,
    losses: row.losses,
    uploader: { id: row.uploader_id, display_name: row.uploader_display_name },
    created_at: row.created_at.toISOString(),
  };
}

export const memeService = {
  async create(uploaderId: string, title: string, file: Express.Multer.File): Promise<Meme> {
    const savedPath = path.join(UPLOADS_DIR, file.filename);

    const sniffed = await fromFile(savedPath);
    if (!sniffed || !ALLOWED_MIME_TYPES.has(sniffed.mime)) {
      await fs.unlink(savedPath);
      throw new ApiError(ERROR_CODES.UNSUPPORTED_FILE_TYPE, 415, "File content doesn't match an accepted image type");
    }

    try {
      const row = await memeRepository.insert({ uploaderId, title, imagePath: file.filename });
      return toPublicMeme(row);
    } catch (error) {
      await fs.unlink(savedPath).catch(() => {});
      throw error;
    }
  },

  async list(params: ListMemesParams): Promise<{ rows: Meme[]; total: number }> {
    const { rows, total } = await memeRepository.list(params);
    return { rows: rows.map(toPublicMeme), total };
  },

  async get(id: string): Promise<Meme> {
    const row = await memeRepository.findById(id);
    if (!row) throw new ApiError(ERROR_CODES.NOT_FOUND, 404);
    return toPublicMeme(row);
  },

  async remove(userId: string, id: string): Promise<void> {
    const row = await memeRepository.findById(id);
    if (!row) throw new ApiError(ERROR_CODES.NOT_FOUND, 404);
    if (row.uploader_id !== userId) {
      throw new ApiError(ERROR_CODES.FORBIDDEN, 403, "You can only delete your own memes");
    }
    await memeRepository.softDelete(id);
  },
};
