import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireRole, AuthError } from "@/lib/auth-guards";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const reqHeaders = await headers();

    // Try seller role first (normal path)
    try {
      await requireRole(reqHeaders, "seller");
      return <>{children}</>;
    } catch (sellerError) {
      if (!(sellerError instanceof AuthError)) throw sellerError;

      // If UNAUTHENTICATED, always redirect to login
      if (sellerError.code === "UNAUTHENTICATED") {
        redirect("/login?callbackUrl=/seller/dashboard");
      }

      // If FORBIDDEN (user exists but wrong role), check if this is a
      // provisional seller accessing /seller/application
      const session = await auth.api.getSession({ headers: reqHeaders });
      if (session?.user) {
        const profile = await prisma.sellerProfile.findUnique({
          where: { userId: session.user.id },
          select: { id: true },
        });

        if (profile) {
          // Provisional seller with a SellerProfile — allow through
          return <>{children}</>;
        }
      }

      redirect("/unauthorized");
    }
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login");
    }
    throw error; // Re-throw redirect() calls from Next.js
  }
}
