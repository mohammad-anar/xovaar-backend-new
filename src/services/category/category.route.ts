import express from "express";
import { CategoryController } from "./category.controller";
import { CategoryValidation } from "./category.validation";
import validateRequest from "../../middlewares/validateRequest";
import { authGuard } from "../../middlewares/authGuard";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.get("/", CategoryController.getAllCategories);
router.get("/:id", CategoryController.getCategoryById);

router.post(
  "/",
  authGuard(UserRole.ADMIN),
  validateRequest(CategoryValidation.createCategoryZodSchema),
  CategoryController.createCategory
);

router.patch(
  "/:id",
  authGuard(UserRole.ADMIN),
  validateRequest(CategoryValidation.updateCategoryZodSchema),
  CategoryController.updateCategory
);

router.delete(
  "/:id",
  authGuard(UserRole.ADMIN),
  CategoryController.deleteCategory
);

export default router;
