import slugify from "slugify";
import prisma from "../../config/prisma";
import ApiError from "../../utils/ApiError";

export interface IProductFilterOptions {
  category?: string;
  sub?: string;
  search?: string;
  sort?: string;
  inStock?: string;
  limit?: string;
  page?: string;
}

const generateUniqueSlug = async (title: string, excludeId?: string): Promise<string> => {
  let slug = slugify(title, { lower: true, strict: true, trim: true });
  const existing = await prisma.product?.findFirst({
    where: {
      slug,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });

  if (existing) {
    slug = `${slug}-${Date.now().toString().slice(-4)}`;
  }
  return slug;
};

const createProduct = async (payload: {
  title: string;
  price: number;
  originalPrice?: number | null;
  imageUrl: string;
  images?: string[];
  categoryId: string;
  subCategory: string;
  inStock?: boolean;
  stockQuantity?: number;
  freeDelivery?: boolean;
  description?: string | null;
  sizes?: string[];
  fabricComposition?: string | null;
}) => {
  // Verify category exists
  const category = await prisma.category.findUnique({
    where: { id: payload.categoryId },
  });

  if (!category) {
    throw new ApiError(404, "Selected category not found");
  }

  const slug = await generateUniqueSlug(payload.title);

  const product = await prisma.product?.create({
    data: {
      title: payload.title,
      slug,
      price: payload.price,
      originalPrice: payload.originalPrice ?? null,
      imageUrl: payload.imageUrl,
      images: payload.images && payload.images.length > 0 ? payload.images : [payload.imageUrl],
      categoryId: payload.categoryId,
      subCategory: payload.subCategory,
      inStock: payload.inStock ?? true,
      stockQuantity: payload.stockQuantity ?? 0,
      freeDelivery: payload.freeDelivery ?? false,
      description: payload.description ?? null,
      sizes: payload.sizes && payload.sizes.length > 0 ? payload.sizes : ["S", "M", "L", "XL", "XXL"],
      fabricComposition: payload.fabricComposition ?? null,
    },
    include: {
      category: true,
    },
  });

  return product;
};

const getAllProducts = async (filters: IProductFilterOptions) => {
  const where: any = { isDeleted: false };

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
      { subCategory: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters.category && filters.category !== "All") {
    // Check if category is slug, id, or parentCategory
    where.OR = [
      ...(where.OR || []),
      { category: { slug: { equals: filters.category, mode: "insensitive" } } },
      { category: { name: { equals: filters.category, mode: "insensitive" } } },
      { category: { parentCategory: { equals: filters.category, mode: "insensitive" } } },
    ];
  }

  if (filters.sub && filters.sub !== "All") {
    where.subCategory = { equals: filters.sub, mode: "insensitive" };
  }

  if (filters.inStock !== undefined) {
    where.inStock = filters.inStock === "true";
  }

  let orderBy: any = { createdAt: "desc" };
  if (filters.sort === "price-asc") {
    orderBy = { price: "asc" };
  } else if (filters.sort === "price-desc") {
    orderBy = { price: "desc" };
  } else if (filters.sort === "title-asc") {
    orderBy = { title: "asc" };
  } else if (filters.sort === "new" || filters.sort === "latest") {
    orderBy = { createdAt: "desc" };
  }

  const limit = filters.limit ? parseInt(filters.limit, 10) : 50;
  const page = filters.page ? parseInt(filters.page, 10) : 1;
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    prisma.product?.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        category: true,
      },
    }),
    prisma.product?.count({ where }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: products,
  };
};

const getNewArrivals = async (limit: number = 8) => {
  const products = await prisma.product?.findMany({
    where: { isDeleted: false, inStock: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      category: true,
    },
  });
  return products;
};

const getProductBySlugOrId = async (slugOrId: string) => {
  // Try by slug first
  let product = await prisma.product?.findUnique({
    where: { slug: slugOrId },
    include: { category: true },
  });

  // If not found and is valid 24 hex char Mongo ObjectId, try by id
  if (!product && /^[0-9a-fA-F]{24}$/.test(slugOrId)) {
    product = await prisma.product?.findUnique({
      where: { id: slugOrId },
      include: { category: true },
    });
  }

  if (!product || product?.isDeleted) {
    throw new ApiError(404, "Product not found");
  }

  return product;
};

const updateProduct = async (
  id: string,
  payload: {
    title?: string;
    price?: number;
    originalPrice?: number | null;
    imageUrl?: string;
    images?: string[];
    categoryId?: string;
    subCategory?: string;
    inStock?: boolean;
    stockQuantity?: number;
    freeDelivery?: boolean;
    description?: string | null;
    sizes?: string[];
    fabricComposition?: string | null;
    isDeleted?: boolean;
  }
) => {
  const existing = await prisma.product?.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "Product not found");
  }

  const updateData: any = { ...payload };

  if (payload.title && payload.title !== existing.title) {
    updateData.slug = await generateUniqueSlug(payload.title, id);
  }

  if (payload.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: payload.categoryId },
    });
    if (!category) {
      throw new ApiError(404, "Category not found");
    }
  }

  const updated = await prisma.product?.update({
    where: { id },
    data: updateData,
    include: { category: true },
  });

  return updated;
};

const deleteProduct = async (id: string) => {
  const existing = await prisma.product?.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "Product not found");
  }

  // Soft delete so historical orders maintain consistency
  const deleted = await prisma.product?.update({
    where: { id },
    data: { isDeleted: true },
  });

  return deleted;
};

export const ProductService = {
  createProduct,
  getAllProducts,
  getNewArrivals,
  getProductBySlugOrId,
  updateProduct,
  deleteProduct,
};
