import express from "express";
import { BannerController } from "./banner.controller";
import { BannerValidation } from "./banner.validation";
import validateRequest from "../../middlewares/validateRequest";
import { authGuard } from "../../middlewares/authGuard";
import { uploadSingle } from "../../middlewares/multer";
import { cacheMiddleware, invalidateCache } from "../../middlewares/cache";
import { UserRole } from "@prisma/client";

const router = express.Router();

// Cached Banner GET Endpoints (10 min TTL for public, 2 min for admin)
router.get("/", cacheMiddleware(600), BannerController.getActiveBanners);
router.get("/admin/all", authGuard(UserRole.ADMIN), cacheMiddleware(120), BannerController.getAllBannersAdmin);
router.get("/:id", cacheMiddleware(600), BannerController.getBannerById);

router.post(
  "/upload-image",
  authGuard(UserRole.ADMIN),
  uploadSingle("image"),
  BannerController.uploadBannerImage
);

router.post(
  "/",
  authGuard(UserRole.ADMIN),
  invalidateCache(["banner"]),
  validateRequest(BannerValidation.createBannerZodSchema),
  BannerController.createBanner
);

router.patch(
  "/:id",
  authGuard(UserRole.ADMIN),
  invalidateCache(["banner"]),
  validateRequest(BannerValidation.updateBannerZodSchema),
  BannerController.updateBanner
);

router.delete(
  "/:id",
  authGuard(UserRole.ADMIN),
  invalidateCache(["banner"]),
  BannerController.deleteBanner
);

export default router;
