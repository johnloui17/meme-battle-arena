import fs from "node:fs/promises";
import path from "node:path";
import { fromFile } from "file-type";
import { ERROR_CODES, type Meme, type MemeComment } from "@meme-battle-arena/contracts";
import { ApiError } from "../../lib/errors/api-error";
import { memeRepository, type MemeRow, type CommentRow, type ListMemesParams } from "./meme.repository";
import { UPLOADS_DIR } from "./upload";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const COMMENTS_PAGE_SIZE = 20;

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
    reaction_count: row.reaction_count,
    reacted_by_me: row.reacted_by_me,
    comment_count: row.comment_count,
  };
}

function toPublicComment(row: CommentRow): MemeComment {
  return {
    id: row.id,
    meme_id: row.meme_id,
    body: row.body,
    author: { id: row.user_id, display_name: row.author_display_name },
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

  async get(id: string, viewerId: string): Promise<Meme> {
    const row = await memeRepository.findById(id, viewerId);
    if (!row) throw new ApiError(ERROR_CODES.NOT_FOUND, 404);
    return toPublicMeme(row);
  },

  async remove(userId: string, id: string): Promise<void> {
    const row = await memeRepository.findById(id, userId);
    if (!row) throw new ApiError(ERROR_CODES.NOT_FOUND, 404);
    if (row.uploader_id !== userId) {
      throw new ApiError(ERROR_CODES.FORBIDDEN, 403, "You can only delete your own memes");
    }
    await memeRepository.softDelete(id);
  },

  async react(memeId: string, userId: string): Promise<{ reaction_count: number; reacted_by_me: boolean }> {
    const meme = await memeRepository.findById(memeId, userId);
    if (!meme) throw new ApiError(ERROR_CODES.NOT_FOUND, 404);
    await memeRepository.addReaction(memeId, userId);
    const { reactionCount, reactedByMe } = await memeRepository.reactionState(memeId, userId);
    return { reaction_count: reactionCount, reacted_by_me: reactedByMe };
  },

  async unreact(memeId: string, userId: string): Promise<{ reaction_count: number; reacted_by_me: boolean }> {
    const meme = await memeRepository.findById(memeId, userId);
    if (!meme) throw new ApiError(ERROR_CODES.NOT_FOUND, 404);
    await memeRepository.removeReaction(memeId, userId);
    const { reactionCount, reactedByMe } = await memeRepository.reactionState(memeId, userId);
    return { reaction_count: reactionCount, reacted_by_me: reactedByMe };
  },

  async listComments(memeId: string, viewerId: string, page: number, pageSize: number) {
    const meme = await memeRepository.findById(memeId, viewerId);
    if (!meme) throw new ApiError(ERROR_CODES.NOT_FOUND, 404);
    const limit = pageSize || COMMENTS_PAGE_SIZE;
    const offset = (page - 1) * limit;
    const { rows, total } = await memeRepository.listComments(memeId, offset, limit);
    return { rows: rows.map(toPublicComment), total, page, pageSize: limit };
  },

  async postComment(memeId: string, userId: string, body: string): Promise<MemeComment> {
    const meme = await memeRepository.findById(memeId, userId);
    if (!meme) throw new ApiError(ERROR_CODES.NOT_FOUND, 404);
    const row = await memeRepository.insertComment(memeId, userId, body);
    return toPublicComment(row);
  },

  async deleteComment(userId: string, commentId: string): Promise<void> {
    const comment = await memeRepository.findComment(commentId);
    if (!comment) throw new ApiError(ERROR_CODES.NOT_FOUND, 404);
    if (comment.user_id !== userId) {
      throw new ApiError(ERROR_CODES.FORBIDDEN, 403, "You can only delete your own comments");
    }
    await memeRepository.deleteComment(commentId);
  },
};
