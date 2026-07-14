import { ERROR_CODES } from "@meme-battle-arena/contracts";
import { asyncHandler } from "../../lib/async-handler";
import { ApiError } from "../../lib/errors/api-error";
import { parsePagination, buildPaginatedResponse } from "../../lib/pagination";
import { memeService } from "./meme.service";

export const memeController = {
  create: asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(ERROR_CODES.VALIDATION_ERROR, 400, "An image file is required");
    const meme = await memeService.create(req.user!.sub, req.body.title, req.file);
    res.status(201).json(meme);
  }),

  list: asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const uploaderId = req.query.uploader === "me" ? req.user!.sub : undefined;
    const sort = (req.query.sort as "newest" | "rating") || "newest";
    const { rows, total } = await memeService.list({
      uploaderId,
      sort,
      offset: pagination.offset,
      limit: pagination.limit,
    });
    res.json(buildPaginatedResponse(rows, total, pagination));
  }),

  get: asyncHandler(async (req, res) => {
    const meme = await memeService.get(req.params.id as string);
    res.json(meme);
  }),

  remove: asyncHandler(async (req, res) => {
    await memeService.remove(req.user!.sub, req.params.id as string);
    res.status(204).end();
  }),
};
