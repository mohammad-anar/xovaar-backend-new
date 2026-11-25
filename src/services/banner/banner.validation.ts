import { z } from "zod";

const createBannerZodSchema = z.object({
  body: z.object({
    title: z.string({ required_error: "Banner title is required" }).min(2),
    titleHighlight: z.string().default(""),
    subtitle: z.string().default(""),
    imageUrl: z.string({ required_error: "Banner image URL is required" }),
    productId: z.string().optional().nullable(),
    ctaText: z.string().default("Shop Now"),
    ctaLink: z.string().optional().nullable(),
    align: z.enum(["left", "right"]).default("left"),
    isActive: z.boolean().default(true),
    order: z.number().int().default(0),
  }),
});

const updateBannerZodSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    titleHighlight: z.string().optional(),
    subtitle: z.string().optional(),
    imageUrl: z.string().optional(),
    productId: z.string().optional().nullable(),
    ctaText: z.string().optional(),
    ctaLink: z.string().optional().nullable(),
    align: z.enum(["left", "right"]).optional(),
    isActive: z.boolean().optional(),
    order: z.number().int().optional(),
  }),
});

export const BannerValidation = {
  createBannerZodSchema,
  updateBannerZodSchema,
};
