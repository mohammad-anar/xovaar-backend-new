import express from "express";
import { ProductController } from "./product.controller";
import { ProductValidation } from "./product.validation";
import validateRequest from "../../middlewares/validateRequest";
import { authGuard } from "../../middlewares/authGuard";
import { uploadSingle } from "../../middlewares/multer";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.get("/new-arrivals", ProductController.getNewArrivals);
router.get("/", ProductController.getAllProducts);
router.get("/:slugOrId", ProductController.getProductBySlugOrId);

router.post(
  "/upload-image",
  authGuard(UserRole.ADMIN),
  uploadSingle("image"),
  ProductController.uploadProductImage
);

router.post(
  "/",
  authGuard(UserRole.ADMIN),
  validateRequest(ProductValidation.createProductZodSchema),
  ProductController.createProduct
);

router.patch(
  "/:id",
  authGuard(UserRole.ADMIN),
  validateRequest(ProductValidation.updateProductZodSchema),
  ProductController.updateProduct
);

router.delete(
  "/:id",
  authGuard(UserRole.ADMIN),
  ProductController.deleteProduct
);

export default router;
