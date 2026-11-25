import express from "express";
import { CategoryController } from "./category.controller";
import { CategoryValidation } from "./category.validation";
import validateRequest from "../../middlewares/validateRequest";
import { authGuard } from "../../middlewares/authGuard";
import { cacheMiddleware, invalidateCache } from "../../middlewares/cache";
import { UserRole } from "@prisma/client";

const router = express.Router();

// Cached Category GET Endpoints (10 min TTL)
router.get("/", cacheMiddleware(600), CategoryController.getAllCategories);
router.get("/:id", cacheMiddleware(600), CategoryController.getCategoryById);

router.post(
  "/",
  authGuard(UserRole.ADMIN),
  invalidateCache(["categor", "product"]),
  validateRequest(CategoryValidation.createCategoryZodSchema),
  CategoryController.createCategory
);

router.patch(
  "/:id",
  authGuard(UserRole.ADMIN),
  invalidateCache(["categor", "product"]),
  validateRequest(CategoryValidation.updateCategoryZodSchema),
  CategoryController.updateCategory
);

router.delete(
  "/:id",
  authGuard(UserRole.ADMIN),
  invalidateCache(["categor", "product"]),
  CategoryController.deleteCategory
);

export default router;
