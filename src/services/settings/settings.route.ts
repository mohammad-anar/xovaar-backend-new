import express from "express";
import { SettingsController } from "./settings.controller";
import { authGuard } from "../../middlewares/authGuard";
import { cacheMiddleware, invalidateCache } from "../../middlewares/cache";
import { UserRole } from "@prisma/client";

const router = express.Router();

// Public can read general store settings (shipping rates, notice ticker) - cached for 10 min
router.get("/", cacheMiddleware(600), SettingsController.getSettings);

// Admin can update store settings
router.patch(
  "/",
  authGuard(UserRole.ADMIN),
  invalidateCache(["setting"]),
  SettingsController.updateSettings
);

// Admin can update their profile / credentials
router.patch(
  "/admin-profile",
  authGuard(UserRole.ADMIN),
  invalidateCache(["setting", "user"]),
  SettingsController.updateAdminProfile
);

export default router;
