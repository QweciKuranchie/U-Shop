import { NextRequest, NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth-guards";
import { generateKYCPresignedUrl } from "@/lib/s3";

export async function POST(request: NextRequest) {
  try {
    // ── Admin auth gate ───────────────────────────────────────────
    const { user } = await requireRole(request, "admin");

    const body = await request.json();
    const { s3Key } = body;

    if (!s3Key) {
      return NextResponse.json(
        { error: "s3Key is required" },
        { status: 400 }
      );
    }

    // ── Generate presigned URL (also creates KycAccessLog) ────────
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
    const url = await generateKYCPresignedUrl(s3Key, user.id, ipAddress);

    return NextResponse.json({ url });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.status }
      );
    }
    console.error("Presigned URL error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
