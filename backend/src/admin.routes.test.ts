import { describe, it, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";
import { app } from "./app";

const JWT_SECRET = process.env.JWT_SECRET || "upcreate-dev-insecure-jwt-secret";

function sign(role: UserRole) {
  return jwt.sign(
    { sub: "test-user", role, brandId: null, creatorId: null },
    JWT_SECRET,
    { expiresIn: "1h" },
  );
}

describe("admin routes authz", () => {
  it("returns 401 without token for audit-logs", async () => {
    const res = await request(app).get("/api/v1/admin/audit-logs");
    expect(res.status).toBe(401);
  });

  it("returns 403 for CREATOR token", async () => {
    const res = await request(app)
      .get("/api/v1/admin/audit-logs")
      .set("Authorization", `Bearer ${sign(UserRole.CREATOR)}`);
    expect(res.status).toBe(403);
  });
});
