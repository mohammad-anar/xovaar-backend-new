import { Server } from "http";
import app from "./app";
import config from "./config";
import prisma from "./config/prisma";
import { closeOrderQueue } from "./queues/order.queue";
import { seedAdmin } from "./helpers/seedHelper";

let server: Server;

async function bootstrap() {
  try {
    // Attempt database connection & auto-seed
    try {
      await prisma.$connect();
      console.log("✅ [XOVAAR] Connected to MongoDB database successfully via Prisma");

      // Auto seed admin on server start (skips if admin already exists)
      await seedAdmin();
    } catch (dbErr) {
      console.warn("⚠️ [XOVAAR] MongoDB not reachable at DATABASE_URL. Please set your real MongoDB URI in backend/.env when ready.");
    }

    server = app.listen(config.port, () => {
      console.log(`🚀 [XOVAAR] Server is running on port: http://localhost:${config.port}`);
      console.log(`📡 [XOVAAR] API Base Route: http://localhost:${config.port}/api/v1`);
    });
  } catch (err) {
    console.error("❌ [XOVAAR] Failed to start server:", err);
    process.exit(1);
  }

  const exitHandler = () => {
    if (server) {
      server.close(() => {
        console.log("⚠️ [XOVAAR] Server closed gracefully");
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  };

  const unexpectedErrorHandler = (error: unknown) => {
    console.error("💥 [XOVAAR] Unexpected Error:", error);
    exitHandler();
  };

  process.on("uncaughtException", unexpectedErrorHandler);
  process.on("unhandledRejection", unexpectedErrorHandler);

  process.on("SIGTERM", async () => {
    console.log("🛑 [XOVAAR] SIGTERM received. Shutting down gracefully...");
    await closeOrderQueue();
    if (server) {
      server.close();
    }
  });
}

bootstrap();
