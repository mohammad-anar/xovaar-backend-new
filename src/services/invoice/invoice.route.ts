import express from "express";
import { InvoiceController } from "./invoice.controller";

const router = express.Router();

router.get("/:invoiceNumber", InvoiceController.getInvoiceByNumber);
router.get("/order/:orderId", InvoiceController.getInvoiceByOrderId);

export default router;
