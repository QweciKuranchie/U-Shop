import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../app/api/health/route";
import { prisma } from "../lib/prisma";

vi.mock("../lib/prisma", () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

describe("Health API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return ok and connected when db ping succeeds", async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue(1);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ status: "ok", db: "connected" });
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  it("should return error and status 503 when db ping fails", async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error("DB Connection timeout"));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data).toEqual({ status: "error", db: "disconnected" });
  });
});
