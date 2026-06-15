import { auth } from "./auth";

export class AuthError extends Error {
  constructor(public code: string, public status: number) {
    super(code);
    this.name = "AuthError";
  }
}

/**
 * Validates the session via database lookup and enforces role-based access.
 * This is the AUTHORITATIVE security gate — replaces the removed middleware RBAC.
 * MUST be called in every Route Handler and Server Action serving protected resources.
 */
export async function requireRole(
  requestOrHeaders: Request | Headers,
  ...roles: string[]
): Promise<{ user: { id: string; role: string; email: string } }> {
  const requestHeaders = requestOrHeaders instanceof Headers 
    ? requestOrHeaders 
    : requestOrHeaders.headers;

  const session = await auth.api.getSession({ headers: requestHeaders });
  
  if (!session?.user) {
    throw new AuthError("UNAUTHENTICATED", 401);
  }
  
  const userRole = (session.user as { role?: string | null }).role;
  if (!userRole || !roles.includes(userRole)) {
    throw new AuthError("FORBIDDEN", 403);
  }
  
  return { 
    user: session.user as { id: string; role: string; email: string } 
  };
}

