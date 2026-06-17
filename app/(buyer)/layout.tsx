import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { auth } from "@/lib/auth";

export default async function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });

    if (!session?.user) {
      const pathname = reqHeaders.get("x-invoke-path") || "";
      const callbackQuery = pathname ? `?callbackUrl=${encodeURIComponent(pathname)}` : "";
      redirect(`/login${callbackQuery}`);
    }

    if (session.user.role !== "buyer") {
      redirect("/unauthorized");
    }

    if (!session.user.emailVerified) {
      redirect("/login?error=unauthorized");
    }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("Buyer layout session check failed:", error);
    // If the database check throws a connection failure, send to login page gracefully
    redirect("/login?error=unauthorized");
  }

  return <>{children}</>;
}
