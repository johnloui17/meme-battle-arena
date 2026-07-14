import { z } from "zod";

export const createMemeSchema = z.object({
  title: z.string().min(1).max(100),
});

export const listMemesSchema = z.object({
  uploader: z.enum(["me"]).optional(),
  sort: z.enum(["newest", "rating"]).optional(),
  page: z.coerce.number().optional(),
  page_size: z.coerce.number().optional(),
});
