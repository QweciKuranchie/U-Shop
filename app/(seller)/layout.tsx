import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { requireRole, AuthError } from "@/lib/auth-guards";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
      if (isRedirectError(sellerError)) {
        throw sellerError;
      }
      if (!(sellerError instanceof AuthError)) throw sellerError;

      // If UNAUTHENTICATED, always redirect to login
      if (sellerError.code === "UNAUTHENTICATED") {
        redirect("/login?callbackUrl=/seller/dashboard");
      }

      // If FORBIDDEN (user exists but wrong role), check if this is a
      // provisional seller accessing the /seller/application route
      const pathname = reqHeaders.get("x-invoke-path") || "";
      const isApplicationRoute = pathname === "/seller/application" || pathname.startsWith("/seller/application/");

      if (isApplicationRoute) {
        const session = await auth.api.getSession({ headers: reqHeaders });
        if (session?.user) {
          const profile = await prisma.sellerProfile.findUnique({
            where: { userId: session.user.id },
            select: { status: true },
          });

          if (
            profile &&
            (profile.status.startsWith("PENDING_") || profile.status === "REJECTED")
          ) {
            // Provisional seller with pending/rejected application accessing application page — allow through
            return <>{children}</>;
          }
        }
      }

      redirect("/unauthorized");
    }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    if (error instanceof AuthError) {
      redirect("/login");
    }
    console.error("Seller layout check failed:", error);
    redirect("/login");
  }
}
