import slugify from "slugify";
import prisma from "../../config/prisma";
import ApiError from "../../utils/ApiError";
import { CategoryStatus } from "@prisma/client";

const createCategory = async (payload: {
  name: string;
  parentCategory?: string;
  status?: CategoryStatus;
}) => {
  const existing = await prisma.category.findUnique({
    where: { name: payload.name },
  });

  if (existing) {
    throw new ApiError(400, `Category with name "${payload.name}" already exists`);
  }

  let slug = slugify(payload.name, { lower: true, strict: true });
  const existingSlug = await prisma.category.findUnique({
    where: { slug },
  });
  if (existingSlug) {
    slug = `${slug}-${Date.now().toString().slice(-4)}`;
  }

  const category = await prisma.category.create({
    data: {
      name: payload.name,
      slug,
      parentCategory: payload.parentCategory || "Men",
      status: payload.status || CategoryStatus.ACTIVE,
    },
  });

  return category;
};

const getAllCategories = async (query?: { status?: CategoryStatus; search?: string }) => {
  const where: any = {};
  if (query?.status) {
    where.status = query.status;
  }
  if (query?.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { slug: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const categories = await prisma.category.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    parentCategory: cat.parentCategory,
    status: cat.status,
    itemCount: cat._count.products,
    createdAt: cat.createdAt,
    updatedAt: cat.updatedAt,
  }));
};

const getCategoryById = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  return {
    ...category,
    itemCount: category._count.products,
  };
};

const updateCategory = async (
  id: string,
  payload: { name?: string; parentCategory?: string; status?: CategoryStatus }
) => {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "Category not found");
  }

  const updateData: any = { ...payload };

  if (payload.name && payload.name !== existing.name) {
    let slug = slugify(payload.name, { lower: true, strict: true });
    const slugExists = await prisma.category.findFirst({
      where: { slug, NOT: { id } },
    });
    if (slugExists) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }
    updateData.slug = slug;
  }

  const updated = await prisma.category.update({
    where: { id },
    data: updateData,
  });

  return updated;
};

const deleteCategory = async (id: string) => {
  const existing = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });

  if (!existing) {
    throw new ApiError(404, "Category not found");
  }

  if (existing._count.products > 0) {
    throw new ApiError(
      400,
      `Cannot delete category "${existing.name}" because it contains ${existing._count.products} products. Reassign or delete products first.`
    );
  }

  await prisma.category.delete({ where: { id } });

  return existing;
};

export const CategoryService = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
