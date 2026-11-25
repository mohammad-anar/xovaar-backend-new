import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { WishlistService } from "./wishlist.service";
import ApiError from "../../utils/ApiError";

const toggleWishlist = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new ApiError(401, "Authentication required to use wishlist");
  }

  const { productId } = req.body;
  if (!productId) {
    throw new ApiError(400, "Product ID is required");
  }

  const result = await WishlistService.toggleWishlist(userId, productId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: result,
  });
});

const getMyWishlist = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new ApiError(401, "Authentication required to view wishlist");
  }

  const result = await WishlistService.getMyWishlist(userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Wishlist retrieved successfully",
    data: result,
  });
});

const checkWishlistStatus = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Status checked",
      data: { isWishlisted: false },
    });
  }

  const result = await WishlistService.checkWishlistStatus(userId, req.params.productId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Wishlist status checked",
    data: result,
  });
});

export const WishlistController = {
  toggleWishlist,
  getMyWishlist,
  checkWishlistStatus,
};
