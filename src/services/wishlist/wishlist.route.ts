import express from "express";
import { WishlistController } from "./wishlist.controller";
import { authGuard } from "../../middlewares/authGuard";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.get("/", authGuard(UserRole.CUSTOMER, UserRole.ADMIN), WishlistController.getMyWishlist);
router.post("/toggle", authGuard(UserRole.CUSTOMER, UserRole.ADMIN), WishlistController.toggleWishlist);
router.get("/check/:productId", authGuard(UserRole.CUSTOMER, UserRole.ADMIN), WishlistController.checkWishlistStatus);

export default router;
