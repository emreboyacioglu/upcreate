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

describe("matching overview routes", () => {
  it("returns 401 without token", async () => {
    const res = await request(app).get("/api/v1/matching/overview");
    expect(res.status).toBe(401);
  });

  it("returns 403 for CREATOR token", async () => {
    const res = await request(app)
      .get("/api/v1/matching/overview")
      .set("Authorization", `Bearer ${sign(UserRole.CREATOR)}`);
    expect(res.status).toBe(403);
  });

  it("does not return 401 or 403 for ADMIN token", async () => {
    const res = await request(app)
      .get("/api/v1/matching/overview")
      .set("Authorization", `Bearer ${sign(UserRole.ADMIN)}`);
    expect([401, 403]).not.toContain(res.status);
  });
});
