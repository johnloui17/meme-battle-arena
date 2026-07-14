import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { validate } from "../../middlewares/validate";
import { uploadMemeImage } from "./upload";
import { memeController } from "./meme.controller";
import { createMemeSchema, listMemesSchema } from "./meme.schemas";

export const memeRoutes = Router();
memeRoutes.use(authenticate);

memeRoutes.post("/", uploadMemeImage, validate(createMemeSchema), memeController.create);
memeRoutes.get("/", validate(listMemesSchema, "query"), memeController.list);
memeRoutes.get("/:id", memeController.get);
memeRoutes.delete("/:id", memeController.remove);
