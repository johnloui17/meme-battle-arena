import { ERROR_CODES, type MemeSort } from "@meme-battle-arena/contracts";
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
    const sort = (req.query.sort as MemeSort) || "newest";
    const { rows, total } = await memeService.list({
      uploaderId,
      sort,
      offset: pagination.offset,
      limit: pagination.limit,
      viewerId: req.user!.sub,
    });
    res.json(buildPaginatedResponse(rows, total, pagination));
  }),

  get: asyncHandler(async (req, res) => {
    const meme = await memeService.get(req.params.id as string, req.user!.sub);
    res.json(meme);
  }),

  remove: asyncHandler(async (req, res) => {
    await memeService.remove(req.user!.sub, req.params.id as string);
    res.status(204).end();
  }),

  react: asyncHandler(async (req, res) => {
    const result = await memeService.react(req.params.id as string, req.user!.sub);
    res.json(result);
  }),

  unreact: asyncHandler(async (req, res) => {
    const result = await memeService.unreact(req.params.id as string, req.user!.sub);
    res.json(result);
  }),

  listComments: asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const { rows, total } = await memeService.listComments(
      req.params.id as string,
      req.user!.sub,
      pagination.page,
      pagination.pageSize
    );
    res.json(buildPaginatedResponse(rows, total, pagination));
  }),

  postComment: asyncHandler(async (req, res) => {
    const comment = await memeService.postComment(req.params.id as string, req.user!.sub, req.body.body);
    res.status(201).json(comment);
  }),

  deleteComment: asyncHandler(async (req, res) => {
    await memeService.deleteComment(req.user!.sub, req.params.commentId as string);
    res.status(204).end();
  }),
};
