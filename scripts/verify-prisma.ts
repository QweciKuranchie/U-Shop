import { prisma } from "../lib/prisma";

async function verify() {
  try {
    // Run one read query
    await prisma.user.findFirst();
    console.log("✅ Connected");
  } catch (error) {
    console.error("❌ Connection failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
