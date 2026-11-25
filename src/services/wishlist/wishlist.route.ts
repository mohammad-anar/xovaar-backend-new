import express from "express";
import { WishlistController } from "./wishlist.controller";
import { authGuard } from "../../middlewares/authGuard";
import { cacheMiddleware, invalidateCache } from "../../middlewares/cache";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.get("/", authGuard(UserRole.CUSTOMER, UserRole.ADMIN), cacheMiddleware(60), WishlistController.getMyWishlist);
router.post(
  "/toggle",
  authGuard(UserRole.CUSTOMER, UserRole.ADMIN),
  invalidateCache(["wishlist"]),
  WishlistController.toggleWishlist
);
router.get("/check/:productId", authGuard(UserRole.CUSTOMER, UserRole.ADMIN), cacheMiddleware(60), WishlistController.checkWishlistStatus);

export default router;
