import prisma from "../../config/prisma";
import ApiError from "../../utils/ApiError";
import paginationHelper from "../../helpers/paginationHelper";
import { User, UserRole, UserStatus } from "@prisma/client";

interface IUserFilters {
  searchTerm?: string;
  status?: UserStatus;
  role?: UserRole;
  isDeleted?: boolean;
}

interface IPaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      profileImage: true,
      isDeleted: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new ApiError(404, "User profile not found");
  }

  return user;
};

const updateProfile = async (
  userId: string,
  payload: { name?: string; email?: string; phone?: string; profileImage?: string }
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Check unique constraints if email or phone is updated
  if (payload.email && payload.email !== user.email) {
    const existing = await prisma.user.findUnique({
      where: { email: payload.email.toLowerCase() },
    });
    if (existing) {
      throw new ApiError(409, "Email is already taken by another account");
    }
  }

  if (payload.phone && payload.phone !== user.phone) {
    const existing = await prisma.user.findUnique({
      where: { phone: payload.phone },
    });
    if (existing) {
      throw new ApiError(409, "Phone number is already taken by another account");
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      name: payload.name?.trim() || user.name,
      email: payload.email?.toLowerCase().trim() || user.email,
      phone: payload.phone?.trim() || user.phone,
      profileImage: payload.profileImage || user.profileImage,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      profileImage: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updated;
};

const getAllUsers = async (
  filters: IUserFilters,
  paginationOptions: IPaginationOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(paginationOptions);

  const andConditions: any[] = [];

  if (filters.searchTerm) {
    andConditions.push({
      OR: [
        { name: { contains: filters.searchTerm, mode: "insensitive" } },
        { email: { contains: filters.searchTerm, mode: "insensitive" } },
        { phone: { contains: filters.searchTerm, mode: "insensitive" } },
      ],
    });
  }

  if (filters.status) {
    andConditions.push({ status: filters.status });
  }

  if (filters.role) {
    andConditions.push({ role: filters.role });
  }

  if (typeof filters.isDeleted === "boolean") {
    andConditions.push({ isDeleted: filters.isDeleted });
  }

  const whereCondition = andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.user.findMany({
    where: whereCondition,
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      isDeleted: true,
      profileImage: true,
      orders: {
        select: {
          total: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
  });

  const formattedUsers = result.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    isDeleted: user.isDeleted,
    profileImage: user.profileImage,
    totalOrders: user.orders?.length || 0,
    totalSpent: user.orders?.reduce((sum, o) => sum + o.total, 0) || 0,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }));

  const total = await prisma.user.count({
    where: whereCondition,
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: formattedUsers,
  };
};

const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      isDeleted: true,
      profileImage: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

const updateUserStatus = async (id: string, status: UserStatus) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { status },
    select: {
      id: true,
      name: true,
      status: true,
      isDeleted: true,
    },
  });

  return updated;
};

const softDeleteUser = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isDeleted: true },
    select: {
      id: true,
      name: true,
      isDeleted: true,
    },
  });

  return updated;
};

const restoreUser = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isDeleted: false },
    select: {
      id: true,
      name: true,
      isDeleted: true,
    },
  });

  return updated;
};

export const UserService = {
  getMe,
  updateProfile,
  getAllUsers,
  getUserById,
  updateUserStatus,
  softDeleteUser,
  restoreUser,
};

export default UserService;
