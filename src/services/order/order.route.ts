import express from "express";
import { OrderController } from "./order.controller";
import { OrderValidation } from "./order.validation";
import validateRequest from "../../middlewares/validateRequest";
import { authGuard } from "../../middlewares/authGuard";
import { UserRole } from "@prisma/client";

const router = express.Router();

// Allow guest checkout or authenticated checkout
// Optional auth middleware
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
  validateRequest(OrderValidation.createOrderZodSchema),
  OrderController.createOrder
);

router.get("/my-orders", authGuard(UserRole.CUSTOMER, UserRole.ADMIN), OrderController.getMyOrders);

router.get("/", authGuard(UserRole.ADMIN), OrderController.getAllOrders);

router.get("/:orderNumberOrId", OrderController.getOrderByNumberOrId);

router.patch(
  "/:id/status",
  authGuard(UserRole.ADMIN),
  validateRequest(OrderValidation.updateOrderStatusZodSchema),
  OrderController.updateOrderStatus
);

export default router;
