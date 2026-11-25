import { z } from "zod";

const createCategoryZodSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Category name is required" }).min(2, "Name must be at least 2 characters"),
    parentCategory: z.string().optional().default("Men"),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional().default("ACTIVE"),
  }),
});

const updateCategoryZodSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    parentCategory: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  }),
});

export const CategoryValidation = {
  createCategoryZodSchema,
  updateCategoryZodSchema,
};
