import express from "express";
import { ProductController } from "./product?.controller";
import { ProductValidation } from "./product?.validation";
import validateRequest from "../../middlewares/validateRequest";
import { authGuard } from "../../middlewares/authGuard";
import { uploadSingle } from "../../middlewares/multer";
import { cacheMiddleware, invalidateCache } from "../../middlewares/cache";
import { UserRole } from "@prisma/client";

const router = express.Router();

// Cached GET Endpoints (5 to 10 min TTL)
router.get("/new-arrivals", cacheMiddleware(300), ProductController.getNewArrivals);
router.get("/", cacheMiddleware(300), ProductController.getAllProducts);
router.get("/:slugOrId", cacheMiddleware(600), ProductController.getProductBySlugOrId);

router.post(
  "/upload-image",
  authGuard(UserRole.ADMIN),
  uploadSingle("image"),
  ProductController.uploadProductImage
);

router.post(
  "/",
  authGuard(UserRole.ADMIN),
  invalidateCache(["product", "analytic"]),
  validateRequest(ProductValidation.createProductZodSchema),
  ProductController.createProduct
);

router.patch(
  "/:id",
  authGuard(UserRole.ADMIN),
  invalidateCache(["product", "analytic"]),
  validateRequest(ProductValidation.updateProductZodSchema),
  ProductController.updateProduct
);

router.delete(
  "/:id",
  authGuard(UserRole.ADMIN),
  invalidateCache(["product", "analytic"]),
  ProductController.deleteProduct
);

export default router;
