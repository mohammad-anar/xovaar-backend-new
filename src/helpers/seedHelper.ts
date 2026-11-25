import bcrypt from "bcryptjs";
import prisma from "../config/prisma";

/**
 * Automatically seeds the initial Super Admin and basic store settings on server start.
 * If an admin already exists in the database, it will NOT re-seed or overwrite credentials.
 */
export const seedAdmin = async () => {
  try {
    const adminEmail = "ai.anarul4232@gmail.com";

    // Check if any admin already exists in the database
    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [{ email: adminEmail }, { role: "ADMIN" }],
      },
    });

    if (existingAdmin) {
      console.log(`ℹ️ [XOVAAR Seed] Admin account already exists (${existingAdmin.email}). Skipping auto-seed.`);
    } else {
      const hashedPassword = await bcrypt.hash("12345678", 12);
      await prisma.user.create({
        data: {
          name: "Xovaar Admin",
          email: adminEmail,
          phone: "+8801700000000",
          password: hashedPassword,
          isDefaultPassword: false,
          role: "ADMIN",
          status: "ACTIVE",
        },
      });
      console.log("✅ [XOVAAR Seed] Default Admin created successfully: ai.anarul4232@gmail.com / 12345678");
    }

    // Ensure default settings exist
    const existingSettings = await prisma.settings.findFirst();
    if (!existingSettings) {
      await prisma.settings.create({
        data: {
          storeName: "XOVAAR",
          storeTagline: "Aura Streetwear & Minimalist Luxury",
          supportEmail: "support@xovaar.com",
          supportPhone: "+880 1620-396130",
          currency: "BDT (৳)",
          insideDhakaShipping: 70,
          outsideDhakaShipping: 130,
          freeShippingThreshold: 3000,
          noticeTicker: "FREE SHIPPING ON ORDERS OVER ৳3,000 | CASH ON DELIVERY AVAILABLE NATIONWIDE",
          adminName: "Xovaar Admin",
          adminEmail: adminEmail,
        },
      });
      console.log("✅ [XOVAAR Seed] Default store settings initialized.");
    }

    // Ensure order and invoice sequence counters exist
    await prisma.counter.upsert({
      where: { name: "order_seq" },
      update: {},
      create: { name: "order_seq", seq: 0 },
    });

    await prisma.counter.upsert({
      where: { name: "invoice_seq" },
      update: {},
      create: { name: "invoice_seq", seq: 0 },
    });
  } catch (seedErr) {
    console.warn("⚠️ [XOVAAR Seed] Auto-seed could not complete (database offline or initializing):", seedErr);
  }
};

export default seedAdmin;
