import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import routes from "./routes/index.ts";
import { errorMiddleware } from "./middlewares/error.middleware.ts";
import { env } from "./config/env.ts";

export const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

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
app.use("/api/auth/register", authLimiter);

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
