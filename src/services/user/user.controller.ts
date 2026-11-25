import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import UserService from "./user.service";
import pick from "../../utils/pick";
import ApiError from "../../utils/ApiError";

const getMe = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new ApiError(401, "Unauthorized user");
  }

  const result = await UserService.getMe(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User profile retrieved successfully!",
    data: result,
  });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new ApiError(401, "Unauthorized user");
  }

  const payload = { ...req.body };
  if (req.file) {
    payload.profileImage = `/uploads/${req.file.filename}`;
  }

  const result = await UserService.updateProfile(userId, payload);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User profile updated successfully!",
    data: result,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "status", "role", "isDeleted"]);
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

  const result = await UserService.getAllUsers(filters as any, paginationOptions as any);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Users retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserService.getUserById(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User fetched successfully!",
    data: result,
  });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const result = await UserService.updateUserStatus(id, status);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User status updated successfully!",
    data: result,
  });
});

const softDeleteUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserService.softDeleteUser(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User soft deleted successfully!",
    data: result,
  });
});

const restoreUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserService.restoreUser(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User restored successfully!",
    data: result,
  });
});

export const UserController = {
  getMe,
  updateProfile,
  getAllUsers,
  getUserById,
  updateUserStatus,
  softDeleteUser,
  restoreUser,
};

export default UserController;
