import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import routes from "./routes/index.ts";
import { errorMiddleware } from "./middlewares/error.middleware.ts";
import { env } from "./config/env.ts";

export const app = express();

// Detrás de un reverse proxy, sin esto express-rate-limit vería la IP del
// proxy para todos los clientes (o ninguna real). Configurable por entorno.
if (env.TRUST_PROXY > 0) app.set("trust proxy", env.TRUST_PROXY);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
    credentials: true,
  }),
);
// Capturamos el cuerpo crudo para poder validar la firma del webhook de WhatsApp
// (Meta firma el body exacto; si lo re-serializamos, la firma no coincidiría).
app.use(
  express.json({
    limit: "1mb",
    verify: (req, _res, buf) => {
      (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
    },
  }),
);
app.use(cookieParser());

// Defensa CSRF explícita: para métodos que mutan estado, si el navegador
// envía un header Origin debe estar en la allowlist de CORS. Las requests
// sin Origin (curl, server-to-server) pasan — la cookie sameSite=lax ya
// impide que un navegador las genere cross-site.
const allowedOrigins = new Set(env.CORS_ORIGIN.split(",").map((s) => s.trim()));
app.use((req, res, next) => {
  const mutating = !["GET", "HEAD", "OPTIONS"].includes(req.method);
  const origin = req.headers.origin;
  if (mutating && origin && !allowedOrigins.has(origin)) {
    return res.status(403).json({ error: "Origin not allowed" });
  }
  next();
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/auth/login", authLimiter);

// The public booking endpoint creates appointments + customer records with no
// authentication, so it's a spam/abuse vector. Cap it well below the global
// limit. (Admin booking lives at /admin-book and is not affected.)
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many booking attempts. Please try again later." },
});
app.use("/api/appointments/book", bookingLimiter);

app.use("/api", routes);

app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use(errorMiddleware);
