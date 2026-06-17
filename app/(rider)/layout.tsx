import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireRole, AuthError } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export default async function RiderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const reqHeaders = await headers();
    await requireRole(reqHeaders, "rider");
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.code === "UNAUTHENTICATED") {
        redirect("/login?callbackUrl=/rider");
      }
      if (error.code === "FORBIDDEN") {
        redirect("/unauthorized");
      }
    }
    redirect("/login");
  }

  return <>{children}</>;
}
