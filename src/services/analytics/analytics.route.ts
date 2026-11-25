import express from "express";
import { AnalyticsController } from "./analytics.controller";
import { authGuard } from "../../middlewares/authGuard";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.get("/overview", authGuard(UserRole.ADMIN), AnalyticsController.getDashboardOverview);
router.get("/sales", authGuard(UserRole.ADMIN), AnalyticsController.getSalesAnalytics);

export default router;
