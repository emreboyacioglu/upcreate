import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";
import { app } from "./app";
import { IngestionError, checkTokenHealth } from "./services/ingestion";

const JWT_SECRET = process.env.JWT_SECRET || "upcreate-dev-insecure-jwt-secret";

function sign(role: UserRole) {
  return jwt.sign(
    { sub: "test-user", role, brandId: null, creatorId: null },
    JWT_SECRET,
    { expiresIn: "1h" },
  );
}

describe("ingestion routes", () => {
  describe("POST /creators/ingest-all-connected", () => {
    it("returns 401 without token", async () => {
      const res = await request(app).post("/api/v1/creators/ingest-all-connected");
      expect(res.status).toBe(401);
    });

    it("returns 403 for CREATOR token", async () => {
      const res = await request(app)
        .post("/api/v1/creators/ingest-all-connected")
        .set("Authorization", `Bearer ${sign(UserRole.CREATOR)}`);
      expect(res.status).toBe(403);
    });

    it("does not return 401 or 403 for ADMIN token", async () => {
      const res = await request(app)
        .post("/api/v1/creators/ingest-all-connected")
        .set("Authorization", `Bearer ${sign(UserRole.ADMIN)}`);
      expect([401, 403]).not.toContain(res.status);
    });
  });

  describe("GET /creators/ig-token-status", () => {
    it("returns 401 without token", async () => {
      const res = await request(app).get("/api/v1/creators/ig-token-status");
      expect(res.status).toBe(401);
    });

    it("returns 403 for CREATOR token", async () => {
      const res = await request(app)
        .get("/api/v1/creators/ig-token-status")
        .set("Authorization", `Bearer ${sign(UserRole.CREATOR)}`);
      expect(res.status).toBe(403);
    });

    it("does not return 401 or 403 for ADMIN token", async () => {
      const res = await request(app)
        .get("/api/v1/creators/ig-token-status")
        .set("Authorization", `Bearer ${sign(UserRole.ADMIN)}`);
      expect([401, 403]).not.toContain(res.status);
    });
  });
});

describe("IngestionError", () => {
  it("creates error with correct code for TOKEN_EXPIRED", () => {
    const err = new IngestionError("Token expired", "TOKEN_EXPIRED");
    expect(err.name).toBe("IngestionError");
    expect(err.code).toBe("TOKEN_EXPIRED");
    expect(err.message).toBe("Token expired");
  });

  it("creates error with correct code for RATE_LIMITED", () => {
    const err = new IngestionError("Rate limited", "RATE_LIMITED");
    expect(err.code).toBe("RATE_LIMITED");
  });

  it("creates error with correct code for NOT_FOUND", () => {
    const err = new IngestionError("Not found", "NOT_FOUND");
    expect(err.code).toBe("NOT_FOUND");
  });

  it("creates error with correct code for CONFIG_ERROR", () => {
    const err = new IngestionError("No token", "CONFIG_ERROR");
    expect(err.code).toBe("CONFIG_ERROR");
  });
});

describe("checkTokenHealth", () => {
  it("returns valid:false when INSTAGRAM_ACCESS_TOKEN is not set", async () => {
    const original = process.env.INSTAGRAM_ACCESS_TOKEN;
    delete process.env.INSTAGRAM_ACCESS_TOKEN;
    try {
      const result = await checkTokenHealth();
      expect(result.valid).toBe(false);
      expect(result.code).toBe("CONFIG_ERROR");
    } finally {
      if (original) process.env.INSTAGRAM_ACCESS_TOKEN = original;
    }
  });
});
