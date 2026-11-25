import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { SettingsService } from "./settings.service";
import ApiError from "../../utils/ApiError";

const getSettings = catchAsync(async (req: Request, res: Response) => {
  const result = await SettingsService.getSettings();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Store settings retrieved successfully",
    data: result,
  });
});

const updateSettings = catchAsync(async (req: Request, res: Response) => {
  const result = await SettingsService.updateSettings(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Store settings updated successfully",
    data: result,
  });
});

const updateAdminProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const result = await SettingsService.updateAdminProfile(userId, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Admin profile updated successfully",
    data: result,
  });
});

export const SettingsController = {
  getSettings,
  updateSettings,
  updateAdminProfile,
};
