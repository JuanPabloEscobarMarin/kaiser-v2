import { S3Client } from "@aws-sdk/client-s3";
import { env } from "./env.ts";

export const s3Client = new S3Client({
  region: env.AWS_S3_REGION,
  credentials: {
    accessKeyId: env.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_S3_SECRET_ACCESS_KEY,
  },
  endpoint: env.SUPABASE_STORAGE_URL,
  forcePathStyle: true,
});
