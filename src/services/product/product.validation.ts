import { z } from "zod";

const createProductZodSchema = z.object({
  body: z.object({
    title: z.string({ required_error: "Product title is required" }).min(3, "Title must be at least 3 characters"),
    price: z.number({ required_error: "Price is required" }).positive("Price must be greater than 0"),
    originalPrice: z.number().positive().optional().nullable(),
    imageUrl: z.string({ required_error: "Primary image URL is required" }),
    images: z.array(z.string()).optional().default([]),
    categoryId: z.string({ required_error: "Category ID is required" }),
    subCategory: z.string({ required_error: "SubCategory is required" }),
    inStock: z.boolean().optional().default(true),
    stockQuantity: z.number().int().min(0).optional().default(0),
    freeDelivery: z.boolean().optional().default(false),
    description: z.string().optional().nullable(),
    sizes: z.array(z.string()).optional().default(["S", "M", "L", "XL", "XXL"]),
    fabricComposition: z.string().optional().nullable(),
  }),
});

const updateProductZodSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    price: z.number().positive().optional(),
    originalPrice: z.number().positive().optional().nullable(),
    imageUrl: z.string().optional(),
    images: z.array(z.string()).optional(),
    categoryId: z.string().optional(),
    subCategory: z.string().optional(),
    inStock: z.boolean().optional(),
    stockQuantity: z.number().int().min(0).optional(),
    freeDelivery: z.boolean().optional(),
    description: z.string().optional().nullable(),
    sizes: z.array(z.string()).optional(),
    fabricComposition: z.string().optional().nullable(),
    isDeleted: z.boolean().optional(),
  }),
});

export const ProductValidation = {
  createProductZodSchema,
  updateProductZodSchema,
};
