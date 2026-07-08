import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const schema = z.object({
  PORT: z.string().default("3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 chars"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  // Zona horaria del negocio (IANA). Las horas de citas se guardan como
  // "hora de pared" en UTC literal (ver lib/business-hours.ts); esta zona
  // define qué significa "ahora" al comparar contra esas horas, sin importar
  // la zona del servidor (Vercel corre en UTC real).
  BUSINESS_TIMEZONE: z.string().default("America/Bogota"),
  // Saltos de proxy confiables delante de la app (p. ej. "1" detrás de un
  // reverse proxy). Vacío = sin proxy. Necesario para que el rate limit vea
  // la IP real del cliente y no la del proxy.
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  AWS_S3_REGION: z.string().default(""),
  AWS_S3_ACCESS_KEY_ID: z.string().default(""),
  AWS_S3_SECRET_ACCESS_KEY: z.string().default(""),
  SUPABASE_STORAGE_URL: z.string().default(""),
  // Where uploaded images live. "s3" → Supabase/S3 bucket (prod);
  // "local" → local filesystem under LOCAL_STORAGE_DIR (offline dev).
  STORAGE_DRIVER: z.enum(["s3", "local"]).default("s3"),
  LOCAL_STORAGE_DIR: z.string().default("uploads"),
  // WhatsApp vía Twilio. Todas opcionales: si no están, la integración queda
  // inactiva (no-op) y la app funciona igual.
  TWILIO_ACCOUNT_SID: z.string().default(""),
  TWILIO_AUTH_TOKEN: z.string().default(""),
  // Remitente con prefijo "whatsapp:", ej: "whatsapp:+14155238886".
  TWILIO_WHATSAPP_FROM: z.string().default(""),
  // URL pública del frontend, para los enlaces de reagenda.
  APP_PUBLIC_URL: z.string().default(""),
  // Correo transaccional/marketing (Resend). Opcionales: si no están, el envío
  // de correos queda inactivo (no-op) y la app funciona igual.
  RESEND_API_KEY: z.string().default(""),
  RESEND_FROM: z.string().default("Kaiser <onboarding@resend.dev>"),
  // Secreto para proteger el endpoint de cron de recordatorios (Vercel Cron).
  CRON_SECRET: z.string().default(""),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
