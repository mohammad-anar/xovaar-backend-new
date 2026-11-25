import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { BannerService } from "./banner.service";

const createBanner = catchAsync(async (req: Request, res: Response) => {
  const result = await BannerService.createBanner(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Hero banner created successfully",
    data: result,
  });
});

const getActiveBanners = catchAsync(async (req: Request, res: Response) => {
  const result = await BannerService.getActiveBanners();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Active hero banners retrieved successfully",
    data: result,
  });
});

const getAllBannersAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await BannerService.getAllBannersAdmin();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "All hero banners retrieved successfully",
    data: result,
  });
});

const getBannerById = catchAsync(async (req: Request, res: Response) => {
  const result = await BannerService.getBannerById(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Banner retrieved successfully",
    data: result,
  });
});

const updateBanner = catchAsync(async (req: Request, res: Response) => {
  const result = await BannerService.updateBanner(req.params.id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Banner updated successfully",
    data: result,
  });
});

const deleteBanner = catchAsync(async (req: Request, res: Response) => {
  const result = await BannerService.deleteBanner(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Banner deleted successfully",
    data: result,
  });
});

const uploadBannerImage = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "No image file uploaded",
      data: null,
    });
  }

  const imageUrl = `/uploads/${req.file.filename}`;
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Banner image uploaded successfully",
    data: { imageUrl },
  });
});

export const BannerController = {
  createBanner,
  getActiveBanners,
  getAllBannersAdmin,
  getBannerById,
  updateBanner,
  deleteBanner,
  uploadBannerImage,
};
