import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import multer from "multer";
import { ERROR_CODES } from "@meme-battle-arena/contracts";
import { env } from "../../config/env";
import { ApiError } from "../../lib/errors/api-error";

export const UPLOADS_DIR = path.resolve(process.cwd(), env.UPLOADS_DIR);
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Provisional only — trusts the client's declared Content-Type just enough to
// pick a filename extension and reject obviously wrong uploads early. The
// real check happens after save, sniffing magic bytes (see meme.service.ts).
const ALLOWED_MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = ALLOWED_MIME_EXTENSIONS[file.mimetype] ?? path.extname(file.originalname);
    cb(null, `${randomUUID()}${ext}`);
  },
});

export const uploadMemeImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_EXTENSIONS[file.mimetype]) {
      return cb(new ApiError(ERROR_CODES.UNSUPPORTED_FILE_TYPE, 415, "Unsupported file type"));
    }
    cb(null, true);
  },
}).single("image");
