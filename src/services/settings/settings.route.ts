import express from "express";
import { SettingsController } from "./settings.controller";
import { authGuard } from "../../middlewares/authGuard";
import { UserRole } from "@prisma/client";

const router = express.Router();

// Public can read general store settings (shipping rates, notice ticker)
router.get("/", SettingsController.getSettings);

// Admin can update store settings
router.patch("/", authGuard(UserRole.ADMIN), SettingsController.updateSettings);

// Admin can update their profile / credentials
router.patch(
  "/admin-profile",
  authGuard(UserRole.ADMIN),
  SettingsController.updateAdminProfile
);

export default router;
