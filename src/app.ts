import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import router from "./routes";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import notFoundHandler from "./middlewares/notFoundHandler";
import rateLimiter from "./middlewares/rateLimiter";
import config from "./config";

const app: Application = express();

// Global Sliding Window Rate Limiter
app.use(rateLimiter);

// CORS configuration supporting cookie credentials
const allowedOrigins = [
  ...new Set([
    config.frontend_url,
    "https://xovaar.com",
    "https://www.xovaar.com",
    "http://localhost:3000",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3002",
    ...(config.cors_origins || []),
  ]),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes("*") ||
        /^https:\/\/([a-z0-9-]+\.)*xovaar\.com$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-refresh-token"],
  })
);

// Body parsers & cookies
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads (avatars, product images)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Root health check endpoint
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "XOVAAR Modular MVC API Server is running smoothly 🚀",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Central Application Routes
app.use("/api/v1", router);

// Error Handling Middlewares
app.use(globalErrorHandler);
app.use(notFoundHandler);

export default app;
