import bcrypt from "bcryptjs";
import prisma from "../../config/prisma";
import ApiError from "../../utils/ApiError";
import config from "../../config";

const getSettings = async () => {
  let settings = await prisma.settings.findFirst();
  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        storeName: "XOVAAR",
        storeTagline: "Aura Streetwear & Minimalist Luxury",
        supportEmail: "support@xovaar.com",
        supportPhone: "+880 1700-000000",
        currency: "BDT (৳)",
        insideDhakaShipping: 70,
        outsideDhakaShipping: 130,
        freeShippingThreshold: 2500,
        noticeTicker: "FREE SHIPPING ON ORDERS OVER ৳2,500 | CASH ON DELIVERY AVAILABLE NATIONWIDE",
        adminName: "XOVAAR Admin",
        adminEmail: "admin@xovaar.com",
      },
    });
  }
  return settings;
};

const updateSettings = async (payload: {
  storeName?: string;
  storeTagline?: string;
  supportEmail?: string;
  supportPhone?: string;
  currency?: string;
  insideDhakaShipping?: number;
  outsideDhakaShipping?: number;
  freeShippingThreshold?: number;
  noticeTicker?: string;
}) => {
  const settings = await getSettings();
  const updated = await prisma.settings.update({
    where: { id: settings.id },
    data: payload,
  });
  return updated;
};

const updateAdminProfile = async (
  userId: string,
  payload: {
    name?: string;
    email?: string;
    phone?: string;
    currentPassword?: string;
    newPassword?: string;
  }
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const updateData: any = {};
  if (payload.name) updateData.name = payload.name;
  if (payload.email) updateData.email = payload.email;
  if (payload.phone) updateData.phone = payload.phone;

  if (payload.newPassword) {
    if (!payload.currentPassword) {
      throw new ApiError(400, "Current password is required to set new password");
    }
    const isMatch = await bcrypt.compare(payload.currentPassword, user.password);
    if (!isMatch) {
      throw new ApiError(400, "Current password does not match");
    }
    updateData.password = await bcrypt.hash(payload.newPassword, config.bcrypt_salt_rounds);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
    },
  });

  // Also update Settings table adminName and adminEmail if changed
  if (payload.name || payload.email) {
    const settings = await getSettings();
    await prisma.settings.update({
      where: { id: settings.id },
      data: {
        ...(payload.name ? { adminName: payload.name } : {}),
        ...(payload.email ? { adminEmail: payload.email } : {}),
      },
    });
  }

  return updatedUser;
};

export const SettingsService = {
  getSettings,
  updateSettings,
  updateAdminProfile,
};
