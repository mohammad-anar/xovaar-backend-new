import express from "express";
import { InvoiceController } from "./invoice.controller";
import { cacheMiddleware } from "../../middlewares/cache";

const router = express.Router();

router.get("/:invoiceNumber", cacheMiddleware(120), InvoiceController.getInvoiceByNumber);
router.get("/order/:orderId", cacheMiddleware(120), InvoiceController.getInvoiceByOrderId);

export default router;
