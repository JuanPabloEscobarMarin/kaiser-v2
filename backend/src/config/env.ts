import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const schema = z.object({
  PORT: z.string().default("3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 chars"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  AWS_S3_REGION: z.string().default(""),
  AWS_S3_ACCESS_KEY_ID: z.string().default(""),
  AWS_S3_SECRET_ACCESS_KEY: z.string().default(""),
  SUPABASE_STORAGE_URL: z.string().default(""),
  // Where uploaded images live. "s3" → Supabase/S3 bucket (prod);
  // "local" → local filesystem under LOCAL_STORAGE_DIR (offline dev).
  STORAGE_DRIVER: z.enum(["s3", "local"]).default("s3"),
  LOCAL_STORAGE_DIR: z.string().default("uploads"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
