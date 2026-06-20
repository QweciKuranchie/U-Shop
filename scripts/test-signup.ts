import "dotenv/config";
import { auth } from "../lib/auth";

async function test() {
  try {
    console.log("Starting mock signup test...");
    const result = await auth.api.signUpEmail({
      body: {
        name: "Test User",
        email: `test-${Date.now()}@example.com`,
        password: "password123",
      },
    });
    console.log("Signup success:", result);
  } catch (error) {
    console.error("Signup failed with error:", error);
  } finally {
    const { prisma } = await import("../lib/prisma");
    await prisma.$disconnect();
  }
}

test();
