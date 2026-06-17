import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { auth } from "@/lib/auth";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });

    if (session?.user) {
      const role = session.user.role;
      if (role === "admin") {
        redirect("/admin/dashboard");
      } else if (role === "seller") {
        redirect("/seller/dashboard");
      } else if (role === "rider") {
        redirect("/rider");
      } else {
        redirect("/buyer/dashboard");
      }
    }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("Auth layout session check failed:", error);
  }

  return <>{children}</>;
}
