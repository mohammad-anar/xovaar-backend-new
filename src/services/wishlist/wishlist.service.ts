import prisma from "../../config/prisma";
import ApiError from "../../utils/ApiError";

const toggleWishlist = async (userId: string, productId: string) => {
  // Verify product exists
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const existing = await prisma.wishlist.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
  });

  if (existing) {
    await prisma.wishlist.delete({
      where: { id: existing.id },
    });
    return { isWishlisted: false, message: "Removed from wishlist" };
  } else {
    await prisma.wishlist.create({
      data: {
        userId,
        productId,
      },
    });
    return { isWishlisted: true, message: "Added to wishlist" };
  }
};

const getMyWishlist = async (userId: string) => {
  const wishlistItems = await prisma.wishlist.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        include: {
          category: true,
        },
      },
    },
  });

  // Extract products
  return wishlistItems
    .filter((item) => item.product && !item.product.isDeleted)
    .map((item) => item.product);
};

const checkWishlistStatus = async (userId: string, productId: string) => {
  const existing = await prisma.wishlist.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
  });
  return { isWishlisted: !!existing };
};

export const WishlistService = {
  toggleWishlist,
  getMyWishlist,
  checkWishlistStatus,
};
