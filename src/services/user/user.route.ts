import express from "express";
import authGuard from "../../middlewares/authGuard";
import validateRequest from "../../middlewares/validateRequest";
import upload from "../../middlewares/multer";
import { cacheMiddleware, invalidateCache } from "../../middlewares/cache";
import UserValidation from "./user.validation";
import UserController from "./user.controller";
import { UserRole } from "@prisma/client";

const router = express.Router();

// Current user endpoints (cached per user for 60s)
router.get("/get-me", authGuard(), cacheMiddleware(60), UserController.getMe);

router.patch(
  "/update-profile",
  authGuard(),
  upload.single("profileImage"),
  invalidateCache(["user"]),
  validateRequest(UserValidation.updateProfileZodSchema),
  UserController.updateProfile
);

// Admin-only user management endpoints
router.get("/", authGuard(UserRole.ADMIN), cacheMiddleware(60), UserController.getAllUsers);
router.get("/:id", authGuard(UserRole.ADMIN), cacheMiddleware(60), UserController.getUserById);

router.patch(
  "/:id/status",
  authGuard(UserRole.ADMIN),
  invalidateCache(["user"]),
  validateRequest(UserValidation.updateUserStatusZodSchema),
  UserController.updateUserStatus
);

router.delete("/:id", authGuard(UserRole.ADMIN), invalidateCache(["user"]), UserController.softDeleteUser);
router.patch("/:id/restore", authGuard(UserRole.ADMIN), invalidateCache(["user"]), UserController.restoreUser);

export const UserRoutes = router;
export default UserRoutes;
