import { z } from "zod";

const createOrderZodSchema = z.object({
  body: z.object({
    customerName: z.string({ required_error: "Customer name is required" }).min(2),
    phoneNumber: z.string({ required_error: "Phone number is required" }).min(10),
    deliveryAddress: z.string({ required_error: "Delivery address is required" }).min(5),
    deliveryNote: z.string().optional(),
    deliveryType: z.enum(["inside", "outside"]).default("inside"),
    deliveryFee: z.number().min(0).default(0),
    paymentMethod: z.string().default("COD"),
    isManual: z.boolean().optional().default(false),
    items: z
      .array(
        z.object({
          productId: z.string().optional(),
          title: z.string({ required_error: "Item title is required" }),
          price: z.number({ required_error: "Item price is required" }).positive(),
          imageUrl: z.string().optional(),
          size: z.string().default("M"),
          quantity: z.number().int().positive().default(1),
        })
      )
      .min(1, "At least one item is required in the order"),
  }),
});

const updateOrderStatusZodSchema = z.object({
  body: z.object({
    status: z.enum([
      "PENDING",
      "HOLD",
      "CONFIRMED",
      "MANUAL",
      "PROCESSING",
      "SHIPPED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELED",
      "RETURNED",
    ]),
  }),
});

export const OrderValidation = {
  createOrderZodSchema,
  updateOrderStatusZodSchema,
};
