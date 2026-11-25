import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ProductService } from "./product?.service";

const createProduct = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductService.createProduct(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Product created successfully",
    data: result,
  });
});

const getAllProducts = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductService.getAllProducts(req.query as any);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Products retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getNewArrivals = catchAsync(async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 8;
  const result = await ProductService.getNewArrivals(limit);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "New arrivals retrieved successfully",
    data: result,
  });
});

const getProductBySlugOrId = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductService.getProductBySlugOrId(req.params.slugOrId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Product retrieved successfully",
    data: result,
  });
});

const updateProduct = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductService.updateProduct(req.params.id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Product updated successfully",
    data: result,
  });
});

const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductService.deleteProduct(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Product deleted successfully",
    data: result,
  });
});

const uploadProductImage = catchAsync(async (req: Request, res: Response) => {
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
    message: "Image uploaded successfully",
    data: { imageUrl },
  });
});

export const ProductController = {
  createProduct,
  getAllProducts,
  getNewArrivals,
  getProductBySlugOrId,
  updateProduct,
  deleteProduct,
  uploadProductImage,
};
