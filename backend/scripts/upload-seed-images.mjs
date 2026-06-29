// Sube las imágenes seed-* de uploads/images al bucket de Supabase Storage
// (resources/images/<archivo>), replicando la config de src/config/s3.ts.
//
// Uso:  node --env-file=.env.production scripts/upload-seed-images.mjs
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const DIR = path.resolve("uploads/images");
const MIME = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

const s3 = new S3Client({
  region: process.env.AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
  },
  endpoint: process.env.SUPABASE_STORAGE_URL,
  forcePathStyle: true,
});

const files = (await readdir(DIR)).filter((f) => f.startsWith("seed-"));
if (files.length === 0) {
  console.error("❌ No hay imágenes seed-* en uploads/images. Corre scripts/fetch-seed-images.sh primero.");
  process.exit(1);
}

let ok = 0;
for (const f of files) {
  const body = await readFile(path.join(DIR, f));
  const ext = path.extname(f).toLowerCase();
  await s3.send(
    new PutObjectCommand({
      Bucket: "resources",
      Key: `images/${f}`,
      Body: body,
      ContentType: MIME[ext] ?? "application/octet-stream",
    }),
  );
  ok++;
  console.log("  ↑", f);
}
console.log(`✅ Subidas ${ok} imágenes a resources/images/`);
