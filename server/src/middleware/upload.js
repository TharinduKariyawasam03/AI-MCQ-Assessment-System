import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { HttpError } from './error.js';

export const uploadsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../uploads');

const EXTENSIONS = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

function imageUploader(folder) {
  const dir = path.join(uploadsRoot, folder);
  fs.mkdirSync(dir, { recursive: true });

  return multer({
    storage: multer.diskStorage({
      destination: dir,
      filename: (_req, file, cb) => cb(null, crypto.randomUUID() + EXTENSIONS[file.mimetype]),
    }),
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (EXTENSIONS[file.mimetype]) return cb(null, true);
      cb(new HttpError(400, 'Upload a JPEG, PNG or WebP image'));
    },
  });
}

export const sheetUpload = imageUploader('sheets');
export const avatarUpload = imageUploader('avatars');

const SHEET_URL = /^\/uploads\/sheets\/[\w-]+\.(jpg|png|webp)$/;

// True when the URL points at a sheet image that was really uploaded here.
export function isStoredSheet(url) {
  if (typeof url !== 'string' || !SHEET_URL.test(url)) return false;
  return fs.existsSync(path.join(uploadsRoot, 'sheets', path.basename(url)));
}
