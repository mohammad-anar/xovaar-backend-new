import prisma from "../../config/prisma";
import ApiError from "../../utils/ApiError";

const getInvoiceByNumber = async (invoiceNumber: string) => {
  const invoice = await prisma.invoice.findUnique({
    where: { invoiceNumber },
    include: {
      order: {
        include: {
          items: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      },
    },
  });

  if (!invoice) {
    throw new ApiError(404, "Invoice not found");
  }

  return invoice;
};

const getInvoiceByOrderId = async (orderId: string) => {
  const invoice = await prisma.invoice.findUnique({
    where: { orderId },
    include: {
      order: {
        include: {
          items: true,
        },
      },
    },
  });

  if (!invoice) {
    throw new ApiError(404, "Invoice for this order not found");
  }

  return invoice;
};

export const InvoiceService = {
  getInvoiceByNumber,
  getInvoiceByOrderId,
};
