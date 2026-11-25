import prisma from "../../config/prisma";
import ApiError from "../../utils/ApiError";

const createBanner = async (payload: {
  title: string;
  titleHighlight?: string;
  subtitle?: string;
  imageUrl: string;
  productId?: string | null;
  ctaText?: string;
  ctaLink?: string | null;
  align?: string;
  isActive?: boolean;
  order?: number;
}) => {
  let productTitle: string | null = null;
  let productPrice: number | null = null;
  let productImage: string | null = null;
  let ctaLink = payload.ctaLink;

  if (payload.productId) {
    const product = await prisma.product?.findUnique({
      where: { id: payload.productId },
    });
    if (product) {
      productTitle = product?.title;
      productPrice = product?.price;
      productImage = product?.imageUrl;
      if (!ctaLink) {
        ctaLink = `/product/${product?.slug || product?.id}`;
      }
    }
  }

  const banner = await prisma.banner.create({
    data: {
      title: payload.title,
      titleHighlight: payload.titleHighlight || "",
      subtitle: payload.subtitle || "",
      imageUrl: payload.imageUrl,
      productId: payload.productId || null,
      productTitle,
      productPrice,
      productImage,
      ctaText: payload.ctaText || "Shop Now",
      ctaLink: ctaLink || null,
      align: payload.align || "left",
      isActive: payload.isActive ?? true,
      order: payload.order ?? 0,
    },
  });

  return banner;
};

const getActiveBanners = async () => {
  const banners = await prisma.banner.findMany({
    where: { isActive: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });
  return banners;
};

const getAllBannersAdmin = async () => {
  const banners = await prisma.banner.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });
  return banners;
};

const getBannerById = async (id: string) => {
  const banner = await prisma.banner.findUnique({ where: { id } });
  if (!banner) {
    throw new ApiError(404, "Banner not found");
  }
  return banner;
};

const updateBanner = async (
  id: string,
  payload: {
    title?: string;
    titleHighlight?: string;
    subtitle?: string;
    imageUrl?: string;
    productId?: string | null;
    ctaText?: string;
    ctaLink?: string | null;
    align?: string;
    isActive?: boolean;
    order?: number;
  }
) => {
  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "Banner not found");
  }

  const updateData: any = { ...payload };

  if (payload.productId !== undefined) {
    if (payload.productId) {
      const product = await prisma.product?.findUnique({
        where: { id: payload.productId },
      });
      if (product) {
        updateData.productTitle = product?.title;
        updateData.productPrice = product?.price;
        updateData.productImage = product?.imageUrl;
        if (!payload.ctaLink) {
          updateData.ctaLink = `/product/${product?.slug || product?.id}`;
        }
      }
    } else {
      updateData.productId = null;
      updateData.productTitle = null;
      updateData.productPrice = null;
      updateData.productImage = null;
    }
  }

  const updated = await prisma.banner.update({
    where: { id },
    data: updateData,
  });

  return updated;
};

const deleteBanner = async (id: string) => {
  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "Banner not found");
  }

  await prisma.banner.delete({ where: { id } });
  return existing;
};

export const BannerService = {
  createBanner,
  getActiveBanners,
  getAllBannersAdmin,
  getBannerById,
  updateBanner,
  deleteBanner,
};
