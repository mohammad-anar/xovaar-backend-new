import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { InvoiceService } from "./invoice.service";

const getInvoiceByNumber = catchAsync(async (req: Request, res: Response) => {
  const result = await InvoiceService.getInvoiceByNumber(req.params.invoiceNumber);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Invoice retrieved successfully",
    data: result,
  });
});

const getInvoiceByOrderId = catchAsync(async (req: Request, res: Response) => {
  const result = await InvoiceService.getInvoiceByOrderId(req.params.orderId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Invoice retrieved successfully",
    data: result,
  });
});

export const InvoiceController = {
  getInvoiceByNumber,
  getInvoiceByOrderId,
};
