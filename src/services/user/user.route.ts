import express from "express";
import authGuard from "../../middlewares/authGuard";
import validateRequest from "../../middlewares/validateRequest";
import upload from "../../middlewares/multer";
import UserValidation from "./user.validation";
import UserController from "./user.controller";
import { UserRole } from "@prisma/client";

const router = express.Router();

// Current user endpoints
router.get("/get-me", authGuard(), UserController.getMe);

router.patch(
  "/update-profile",
  authGuard(),
  upload.single("profileImage"),
  validateRequest(UserValidation.updateProfileZodSchema),
  UserController.updateProfile
);

// Admin-only user management endpoints
router.get("/", authGuard(UserRole.ADMIN), UserController.getAllUsers);
router.get("/:id", authGuard(UserRole.ADMIN), UserController.getUserById);

router.patch(
  "/:id/status",
  authGuard(UserRole.ADMIN),
  validateRequest(UserValidation.updateUserStatusZodSchema),
  UserController.updateUserStatus
);

router.delete("/:id", authGuard(UserRole.ADMIN), UserController.softDeleteUser);
router.patch("/:id/restore", authGuard(UserRole.ADMIN), UserController.restoreUser);

export const UserRoutes = router;
export default UserRoutes;
