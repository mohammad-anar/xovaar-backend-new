import express from "express";
import { AnalyticsController } from "./analytics.controller";
import { authGuard } from "../../middlewares/authGuard";
import { cacheMiddleware } from "../../middlewares/cache";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.get("/overview", authGuard(UserRole.ADMIN), cacheMiddleware(120), AnalyticsController.getDashboardOverview);
router.get("/sales", authGuard(UserRole.ADMIN), cacheMiddleware(120), AnalyticsController.getSalesAnalytics);

export default router;
