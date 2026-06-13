import { auth } from "./auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function getSession() {
  const h = await headers();
  return await auth.api.getSession({
    headers: h,
  });
}

export async function requireUser() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireRole(allowedRoles: string[]) {
  const session = await requireUser();
  // Better Auth sessions contain a user object.
  // We typecast role to any or check the database-backed custom field.
  const userRole = (session.user as { role?: string }).role || "buyer";
  if (!allowedRoles.includes(userRole)) {
    redirect("/login?error=unauthorized");
  }
  return session;
}
