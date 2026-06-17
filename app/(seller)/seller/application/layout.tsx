import { headers } from "next/headers";
import { redirect, isRedirectError } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Special layout override for /seller/application.
 * Allows both "buyer" (provisional sellers) and "seller" roles,
 * as long as the user has a SellerProfile.
 */
export default async function SellerApplicationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });

    if (!session?.user) {
      redirect("/login?callbackUrl=/seller/application");
    }

    // Check that user has a SellerProfile (provisional or approved)
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!profile) {
      redirect("/register/seller");
    }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("Seller application layout check failed:", error);
    redirect("/login");
  }

  return <>{children}</>;
}
