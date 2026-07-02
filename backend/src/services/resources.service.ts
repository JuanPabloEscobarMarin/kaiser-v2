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
  store(file: Express.Multer.File, detectedMime: string): Promise<{ slug: string }>;
  get(slug: string): Promise<StoredImage>;
}

/**
 * Detecta el tipo real por magic bytes. El mimetype del multipart lo declara
 * el cliente y no es confiable; aquí validamos el contenido en sí.
 */
const sniffImageType = (buf: Buffer): string | null => {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return "image/png";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP")
    return "image/webp";
  const gif = buf.subarray(0, 6).toString("ascii");
  if (gif === "GIF87a" || gif === "GIF89a") return "image/gif";
  return null;
};

// La extensión sale SIEMPRE del tipo detectado, nunca del nombre original
// (controlado por el cliente). Así no se almacenan .html/.svg disfrazados.
const buildKey = (detectedMime: string) =>
  `${randomUUID()}${EXT_BY_MIME[detectedMime] ?? ".bin"}`;

/** Production driver: a Supabase/S3 bucket reached via the AWS SDK. */
const s3Driver: StorageDriver = {
  async store(file, detectedMime) {
    const key = buildKey(detectedMime);
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: `images/${key}`,
        Body: file.buffer,
        ContentType: detectedMime,
      }),
    );
    return { slug: key };
  },

  async get(slug) {
    // basename: el slug viene de la URL; nunca debe poder salirse del prefijo.
    const response = await s3Client.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: `images/${path.basename(slug)}` }),
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
  async store(file, detectedMime) {
    const key = buildKey(detectedMime);
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
      throw new NotFoundException("Imagen no encontrada");
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
    if (!file) throw new BadRequestException("El archivo es obligatorio");
    const detected = sniffImageType(file.buffer);
    if (!detected || !ALLOWED_MIME.has(detected)) {
      throw new BadRequestException(
        "El archivo no es una imagen válida (se admite JPEG, PNG, WebP o GIF)",
      );
    }
    return driver.store(file, detected);
  },
};
