import multer from 'multer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

fs.mkdirSync(env.uploads.dir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.uploads.dir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const id = crypto.randomBytes(12).toString('hex');
    cb(null, `${Date.now()}-${id}${ext}`);
  },
});

const ALLOWED = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/wav',
  'audio/x-wav',
  'audio/webm',
  'audio/m4a',
  'audio/x-m4a',
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

function fileFilter(_req, file, cb) {
  if (ALLOWED.has(file.mimetype)) return cb(null, true);
  cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`));
}

export const uploadMedia = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.uploads.maxBytes },
}).single('media');
