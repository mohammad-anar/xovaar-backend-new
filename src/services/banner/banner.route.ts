import express from "express";
import { BannerController } from "./banner.controller";
import { BannerValidation } from "./banner.validation";
import validateRequest from "../../middlewares/validateRequest";
import { authGuard } from "../../middlewares/authGuard";
import { uploadSingle } from "../../middlewares/multer";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.get("/", BannerController.getActiveBanners);
router.get("/admin/all", authGuard(UserRole.ADMIN), BannerController.getAllBannersAdmin);
router.get("/:id", BannerController.getBannerById);

router.post(
  "/upload-image",
  authGuard(UserRole.ADMIN),
  uploadSingle("image"),
  BannerController.uploadBannerImage
);

router.post(
  "/",
  authGuard(UserRole.ADMIN),
  validateRequest(BannerValidation.createBannerZodSchema),
  BannerController.createBanner
);

router.patch(
  "/:id",
  authGuard(UserRole.ADMIN),
  validateRequest(BannerValidation.updateBannerZodSchema),
  BannerController.updateBanner
);

router.delete(
  "/:id",
  authGuard(UserRole.ADMIN),
  BannerController.deleteBanner
);

export default router;
