import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireRole, AuthError } from "@/lib/auth-guards";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const reqHeaders = await headers();
    await requireRole(reqHeaders, "admin");
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.code === "UNAUTHENTICATED") {
        redirect("/login?callbackUrl=/admin/dashboard");
      }
      if (error.code === "FORBIDDEN") {
        redirect("/unauthorized");
      }
    }
    redirect("/login");
  }

  return <>{children}</>;
}
