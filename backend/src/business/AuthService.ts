import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";
import { prisma } from "../config/db";
import { AppError } from "../middleware/errorHandler";

const SALT_ROUNDS = 10;

export interface JwtPayload {
  sub: string;
  role: UserRole;
  brandId: string | null;
  creatorId: string | null;
}

export interface RegisterInput {
  email: string;
  password: string;
  role: UserRole;
  /** For BRAND */
  brandName?: string;
  /** For CREATOR */
  creatorName?: string;
  /** Required when role is ADMIN; must match env ADMIN_REGISTER_SECRET */
  adminRegisterSecret?: string;
}

function getJwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) {
    console.warn("JWT_SECRET not set; using insecure dev default");
    return "upcreate-dev-insecure-jwt-secret";
  }
  return s;
}

export class AuthService {
  signToken(payload: JwtPayload): string {
    return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
  }

  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, getJwtSecret()) as JwtPayload;
    } catch {
      throw new AppError(401, "Invalid or expired token");
    }
  }

  async register(input: RegisterInput) {
    const email = input.email.trim().toLowerCase();
    const existing = await prisma.appUser.findUnique({ where: { email } });
    if (existing) throw new AppError(409, "Email already registered");

    if (input.role === UserRole.ADMIN) {
      const expected = process.env.ADMIN_REGISTER_SECRET;
      if (!expected || input.adminRegisterSecret !== expected) {
        throw new AppError(403, "Admin registration not allowed");
      }
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    if (input.role === UserRole.BRAND) {
      const name = input.brandName?.trim() || "New brand";
      const brand = await prisma.brand.create({
        data: {
          name,
          email,
        },
      });
      const user = await prisma.appUser.create({
        data: {
          email,
          passwordHash,
          role: UserRole.BRAND,
          brandId: brand.id,
        },
      });
      return { user, token: this.signToken({ sub: user.id, role: user.role, brandId: brand.id, creatorId: null }) };
    }

    if (input.role === UserRole.CREATOR) {
      const name = input.creatorName?.trim() || "New creator";
      const creator = await prisma.creator.create({
        data: { name, email },
      });
      const user = await prisma.appUser.create({
        data: {
          email,
          passwordHash,
          role: UserRole.CREATOR,
          creatorId: creator.id,
        },
      });
      return {
        user,
        token: this.signToken({ sub: user.id, role: user.role, brandId: null, creatorId: creator.id }),
      };
    }

    // ADMIN
    const user = await prisma.appUser.create({
      data: {
        email,
        passwordHash,
        role: UserRole.ADMIN,
      },
    });
    return {
      user,
      token: this.signToken({ sub: user.id, role: user.role, brandId: null, creatorId: null }),
    };
  }

  async login(email: string, password: string) {
    const user = await prisma.appUser.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user) throw new AppError(401, "Invalid credentials");

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new AppError(401, "Invalid credentials");

    const token = this.signToken({
      sub: user.id,
      role: user.role,
      brandId: user.brandId,
      creatorId: user.creatorId,
    });

    return { user, token };
  }

  async getMe(userId: string) {
    const user = await prisma.appUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        brandId: true,
        creatorId: true,
        createdAt: true,
      },
    });
    if (!user) throw new AppError(404, "User not found");
    return user;
  }
}

export const authService = new AuthService();
