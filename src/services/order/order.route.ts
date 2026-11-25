import express from "express";
import { OrderController } from "./order.controller";
import { OrderValidation } from "./order.validation";
import validateRequest from "../../middlewares/validateRequest";
import { authGuard } from "../../middlewares/authGuard";
import { cacheMiddleware, invalidateCache } from "../../middlewares/cache";
import { UserRole } from "@prisma/client";

const router = express.Router();

// Allow guest checkout or authenticated checkout
const optionalAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authGuard(UserRole.CUSTOMER, UserRole.ADMIN)(req, res, next);
  }
  next();
};

router.post(
  "/",
  optionalAuth,
  invalidateCache(["order", "invoice", "analytic", "user"]),
  validateRequest(OrderValidation.createOrderZodSchema),
  OrderController.createOrder
);

router.get("/my-orders", authGuard(UserRole.CUSTOMER, UserRole.ADMIN), cacheMiddleware(60), OrderController.getMyOrders);

router.get("/", authGuard(UserRole.ADMIN), cacheMiddleware(60), OrderController.getAllOrders);

router.get("/:orderNumberOrId", cacheMiddleware(120), OrderController.getOrderByNumberOrId);

router.patch(
  "/:id/status",
  authGuard(UserRole.ADMIN),
  invalidateCache(["order", "invoice", "analytic"]),
  validateRequest(OrderValidation.updateOrderStatusZodSchema),
  OrderController.updateOrderStatus
);

export default router;
