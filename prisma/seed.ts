/// <reference types="node" />
/// <reference types="node" />
import { seedAdmin } from "../src/helpers/seedHelper";
import prisma from "../src/config/prisma";

async function main() {
  console.log("🌱 [Seed] Running manual database seeder...");
  await seedAdmin();
  console.log("✅ [Seed] Completed successfully.");
}

main()
  .catch(async (e) => {
    console.error("❌ [Seed] Error seeding database:", e);
    await prisma.$disconnect();
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
