import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { OrderService } from "./order.service";
import config from "../../config";

const createOrder = catchAsync(async (req: Request, res: Response) => {
  // If user is logged in, attach their userId
  const userId = req.user?.userId;
  const payload = {
    ...req.body,
    userId: userId || undefined,
  };

  const result = await OrderService.createOrder(payload);

  if (result.auth?.refreshToken) {
    res.cookie("refreshToken", result.auth.refreshToken, {
      secure: config.env === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Order placed successfully",
    data: result,
  });
});

const getAllOrders = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderService.getAllOrders(req.query as any);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Orders retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getOrderByNumberOrId = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderService.getOrderByNumberOrId(req.params.orderNumberOrId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Order retrieved successfully",
    data: result,
  });
});

const getMyOrders = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "No orders for unauthenticated user",
      data: [],
    });
  }

  const result = await OrderService.getMyOrders(userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User orders retrieved successfully",
    data: result,
  });
});

const updateOrderStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderService.updateOrderStatus(req.params.id, req.body.status);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Order status updated successfully",
    data: result,
  });
});

export const OrderController = {
  createOrder,
  getAllOrders,
  getOrderByNumberOrId,
  getMyOrders,
  updateOrderStatus,
};
