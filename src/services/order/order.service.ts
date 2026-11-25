import bcrypt from "bcryptjs";
import { Secret } from "jsonwebtoken";
import config from "../../config";
import jwtHelpers from "../../helpers/jwtHelpers";
import prisma from "../../config/prisma";
import ApiError from "../../utils/ApiError";
import { OrderStatus, InvoiceStatus } from "@prisma/client";
import { initOrderQueue, enqueueOrder } from "../../queues/order.queue";

export interface ICreateOrderPayload {
  userId?: string;
  customerName: string;
  phoneNumber: string;
  deliveryAddress: string;
  deliveryNote?: string;
  deliveryType: "inside" | "outside";
  deliveryFee: number;
  paymentMethod?: string;
  isManual?: boolean;
  items: Array<{
    productId?: string;
    title: string;
    price: number;
    imageUrl?: string;
    size: string;
    quantity: number;
  }>;
}

const getNextSequence = async (counterName: string): Promise<number> => {
  const counter = await prisma.counter.upsert({
    where: { name: counterName },
    update: { seq: { increment: 1 } },
    create: { name: counterName, seq: 1 },
  });
  return counter.seq;
};

const processOrderCreationDirect = async (payload: ICreateOrderPayload) => {
  if (!payload.items || payload.items.length === 0) {
    throw new ApiError(400, "Cannot create order with no items");
  }

  // Calculate subtotal & total
  const subtotal = payload.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryFee = payload.deliveryFee ?? (payload.deliveryType === "outside" ? 130 : 70);
  const total = subtotal + deliveryFee;

  // Generate atomic sequence numbers
  const orderSeq = await getNextSequence("order_seq");
  const invoiceSeq = await getNextSequence("invoice_seq");

  const orderNumber = `XV-${String(orderSeq).padStart(4, "0")}`;
  const invoiceNumber = `INV-${String(invoiceSeq).padStart(4, "0")}`;

  // Handle guest checkout -> auto account creation or linkage
  let resolvedUserId = payload.userId;
  let guestAuthData: any = null;

  if (!resolvedUserId && payload.phoneNumber) {
    const cleanPhone = payload.phoneNumber.trim();
    let user = await prisma.user.findFirst({
      where: { phone: cleanPhone },
    });

    if (!user) {
      const defaultHashedPassword = await bcrypt.hash("12345678", config.bcrypt_salt_rounds);
      user = await prisma.user.create({
        data: {
          name: payload.customerName?.trim() || "Guest Customer",
          phone: cleanPhone,
          password: defaultHashedPassword,
          isDefaultPassword: true,
          role: "CUSTOMER",
          status: "ACTIVE",
        },
      });
    }

    resolvedUserId = user.id;

    const tokenPayload = {
      userId: user.id,
      role: user.role,
      email: user.email,
      phone: user.phone,
    };

    const accessToken = jwtHelpers.createToken(
      tokenPayload,
      config.jwt.access_secret as Secret,
      config.jwt.access_expires_in
    );

    const refreshToken = jwtHelpers.createToken(
      tokenPayload,
      config.jwt.refresh_secret as Secret,
      config.jwt.refresh_expires_in
    );

    guestAuthData = {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        profileImage: user.profileImage,
        isDefaultPassword: user.isDefaultPassword,
      },
    };
  }

  // Create order and invoice
  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: resolvedUserId || null,
      customerName: payload.customerName,
      phoneNumber: payload.phoneNumber,
      deliveryAddress: payload.deliveryAddress,
      deliveryNote: payload.deliveryNote || null,
      deliveryType: payload.deliveryType,
      deliveryFee,
      subtotal,
      total,
      status: payload.isManual ? OrderStatus.MANUAL : OrderStatus.PENDING,
      paymentMethod: payload.paymentMethod || "COD",
      isManual: payload.isManual ?? false,
      items: {
        create: payload.items.map((item) => ({
          productId: item.productId || null,
          title: item.title,
          price: item.price,
          imageUrl: item.imageUrl || null,
          size: item.size || "M",
          quantity: item.quantity || 1,
        })),
      },
      invoice: {
        create: {
          invoiceNumber,
          totalAmount: total,
          status: InvoiceStatus.ISSUED,
        },
      },
    },
    include: {
      items: true,
      invoice: true,
    },
  });

  return {
    ...order,
    auth: guestAuthData,
  };
};

// Initialize BullMQ Queue Worker for atomic order & invoice creation
initOrderQueue(processOrderCreationDirect);

// Enqueue order creation through BullMQ on Redis (with automatic direct fallback)
const createOrder = async (payload: ICreateOrderPayload) => {
  return await enqueueOrder(payload, processOrderCreationDirect);
};

const getAllOrders = async (query?: {
  status?: OrderStatus;
  search?: string;
  isManual?: string;
  page?: string;
  limit?: string;
}) => {
  const where: any = {};

  if (query?.status) {
    where.status = query.status;
  }

  if (query?.isManual !== undefined) {
    where.isManual = query.isManual === "true";
  }

  if (query?.search) {
    where.OR = [
      { orderNumber: { contains: query.search, mode: "insensitive" } },
      { customerName: { contains: query.search, mode: "insensitive" } },
      { phoneNumber: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const limit = query?.limit ? parseInt(query.limit, 10) : 50;
  const page = query?.page ? parseInt(query.page, 10) : 1;
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        items: true,
        invoice: true,
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: orders,
  };
};

const getOrderByNumberOrId = async (orderNumberOrId: string) => {
  let order = await prisma.order.findUnique({
    where: { orderNumber: orderNumberOrId },
    include: {
      items: true,
      invoice: true,
    },
  });

  if (!order && /^[0-9a-fA-F]{24}$/.test(orderNumberOrId)) {
    order = await prisma.order.findUnique({
      where: { id: orderNumberOrId },
      include: {
        items: true,
        invoice: true,
      },
    });
  }

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  return order;
};

const getMyOrders = async (userId: string) => {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
      invoice: true,
    },
  });

  return orders;
};

const updateOrderStatus = async (id: string, status: OrderStatus) => {
  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "Order not found");
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status },
    include: {
      items: true,
      invoice: true,
    },
  });

  // If order is delivered and has invoice, update invoice status to PAID
  if (status === OrderStatus.DELIVERED && updated.invoice) {
    await prisma.invoice.update({
      where: { id: updated.invoice.id },
      data: { status: InvoiceStatus.PAID },
    });
  } else if (status === OrderStatus.CANCELED && updated.invoice) {
    await prisma.invoice.update({
      where: { id: updated.invoice.id },
      data: { status: InvoiceStatus.CANCELED },
    });
  }

  return updated;
};

export const OrderService = {
  createOrder,
  getAllOrders,
  getOrderByNumberOrId,
  getMyOrders,
  updateOrderStatus,
};
