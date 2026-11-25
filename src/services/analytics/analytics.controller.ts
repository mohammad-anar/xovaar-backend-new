import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AnalyticsService } from "./analytics.service";

const getDashboardOverview = catchAsync(async (req: Request, res: Response) => {
  const result = await AnalyticsService.getDashboardOverview();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Dashboard overview metrics retrieved successfully",
    data: result,
  });
});

const getSalesAnalytics = catchAsync(async (req: Request, res: Response) => {
  const result = await AnalyticsService.getSalesAnalytics();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Sales analytics data retrieved successfully",
    data: result,
  });
});

export const AnalyticsController = {
  getDashboardOverview,
  getSalesAnalytics,
};
