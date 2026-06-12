import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Readable } from "node:stream";
import { s3Client } from "../config/s3.ts";
import { env } from "../config/env.ts";
import {
  BadRequestException,
  NotFoundException,
} from "../exceptions/HttpException.ts";

const BUCKET = "resources";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

/** Fallback extension when the uploaded filename has none. */
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

/** Used by the local driver to set Content-Type when serving a file back. */
const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

interface StoredImage {
  stream: Readable;
  contentType: string;
}

interface StorageDriver {
  store(file: Express.Multer.File): Promise<{ slug: string }>;
  get(slug: string): Promise<StoredImage>;
}

const buildKey = (file: Express.Multer.File) => {
  const ext =
    path.extname(file.originalname) || EXT_BY_MIME[file.mimetype] || ".bin";
  return `${randomUUID()}${ext}`;
};

/** Production driver: a Supabase/S3 bucket reached via the AWS SDK. */
const s3Driver: StorageDriver = {
  async store(file) {
    const key = buildKey(file);
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: `images/${key}`,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );
    return { slug: key };
  },

  async get(slug) {
    const response = await s3Client.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: `images/${slug}` }),
    );
    return {
      stream: response.Body as Readable,
      contentType: response.ContentType ?? "application/octet-stream",
    };
  },
};

/**
 * Offline-dev driver: stores images on the local filesystem under
 * `${LOCAL_STORAGE_DIR}/images`. Lets the app run without any cloud storage.
 */
const localImagesDir = path.resolve(env.LOCAL_STORAGE_DIR, "images");

const localDriver: StorageDriver = {
  async store(file) {
    const key = buildKey(file);
    await mkdir(localImagesDir, { recursive: true });
    await writeFile(path.join(localImagesDir, key), file.buffer);
    return { slug: key };
  },

  async get(slug) {
    // `basename` strips any path separators, preventing traversal (e.g. "../").
    const safeName = path.basename(slug);
    const filePath = path.join(localImagesDir, safeName);
    try {
      await stat(filePath);
    } catch {
      throw new NotFoundException("Image not found");
    }
    const ext = path.extname(safeName).toLowerCase();
    return {
      stream: createReadStream(filePath),
      contentType: MIME_BY_EXT[ext] ?? "application/octet-stream",
    };
  },
};

const driver: StorageDriver =
  env.STORAGE_DRIVER === "local" ? localDriver : s3Driver;

export const ResourcesService = {
  getImage: (slug: string) => driver.get(slug),

  async storeImage(file: Express.Multer.File | undefined) {
    if (!file) throw new BadRequestException("File is required");
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException(`Unsupported mime type: ${file.mimetype}`);
    }
    return driver.store(file);
  },
};
