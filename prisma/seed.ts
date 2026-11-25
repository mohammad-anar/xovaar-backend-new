import bcrypt from "bcryptjs";
import prisma from "../src/config/prisma";

async function main() {
  console.log("🌱 [Seed] Checking default admin user and settings...");

  const adminEmail = "ai.anarul4232@gmail.com";
  const existingAdmin = await prisma.user.findFirst({
    where: {
      OR: [{ email: adminEmail }, { role: "ADMIN" }],
    },
  });

  if (!existingAdmin) {
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
    console.log("✅ [Seed] Default admin created: ai.anarul4232@gmail.com / 12345678");
  } else {
    // Ensure credentials match user specification
    const hashedPassword = await bcrypt.hash("12345678", 12);
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        name: "Xovaar Admin",
        email: adminEmail,
        password: hashedPassword,
        isDefaultPassword: false,
        role: "ADMIN",
        status: "ACTIVE",
      },
    });
    console.log("ℹ️ [Seed] Admin account updated: ai.anarul4232@gmail.com / 12345678");
  }

  const existingSettings = await prisma.settings.findFirst();
  if (!existingSettings) {
    await prisma.settings.create({
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
        adminEmail: adminEmail,
      },
    });
    console.log("✅ [Seed] Default settings created.");
  }

  // Ensure counters exist
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

  console.log("✅ [Seed] Completed successfully.");
}

main()
  .catch((e) => {
    console.error("❌ [Seed] Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
