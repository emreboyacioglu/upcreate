import bcrypt from "bcryptjs";
import { UserRole, BrandStatus, CreatorLifecycleStatus } from "@prisma/client";
import { prisma } from "../config/db";
import { AppError } from "../middleware/errorHandler";
const SALT_ROUNDS = 10;

export interface CreateAppUserByAdminInput {
  email: string;
  password: string;
  role: UserRole;
  brandName?: string;
  creatorName?: string;
  brandExtras?: {
    website?: string;
    category?: string;
    industry?: string;
    notes?: string;
    status?: BrandStatus;
    country?: string;
    taxId?: string;
    contactPhone?: string;
  };
  creatorExtras?: {
    bio?: string;
    status?: CreatorLifecycleStatus;
    phone?: string;
    country?: string;
    categories?: string[];
  };
}

export class AdminProvisioningService {
  async createAppUser(input: CreateAppUserByAdminInput) {
    const email = input.email.trim().toLowerCase();
    const existing = await prisma.appUser.findUnique({ where: { email } });
    if (existing) throw new AppError(409, "Email already registered");

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    if (input.role === UserRole.BRAND) {
      const name = input.brandName?.trim() || "New brand";
      const brand = await prisma.brand.create({
        data: {
          name,
          email,
          website: input.brandExtras?.website,
          category: input.brandExtras?.category,
          industry: input.brandExtras?.industry,
          notes: input.brandExtras?.notes,
          status: input.brandExtras?.status ?? BrandStatus.ONBOARDING,
          country: input.brandExtras?.country,
          taxId: input.brandExtras?.taxId,
          contactPhone: input.brandExtras?.contactPhone,
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
      return { user, brand, creator: null };
    }

    if (input.role === UserRole.CREATOR) {
      const name = input.creatorName?.trim() || "New creator";
      const creator = await prisma.creator.create({
        data: {
          name,
          email,
          bio: input.creatorExtras?.bio,
          status: input.creatorExtras?.status ?? CreatorLifecycleStatus.PENDING_VERIFICATION,
          phone: input.creatorExtras?.phone,
          country: input.creatorExtras?.country,
          categories: input.creatorExtras?.categories ?? [],
        },
      });
      const user = await prisma.appUser.create({
        data: {
          email,
          passwordHash,
          role: UserRole.CREATOR,
          creatorId: creator.id,
        },
      });
      return { user, brand: null, creator };
    }

    if (input.role === UserRole.ADMIN) {
      const user = await prisma.appUser.create({
        data: { email, passwordHash, role: UserRole.ADMIN },
      });
      return { user, brand: null, creator: null };
    }

    throw new AppError(400, "Invalid role");
  }

  async updateAppUserPassword(userId: string, newPassword: string) {
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    return prisma.appUser.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async listAppUsers(page = 1, limit = 50) {
    const p = Math.max(1, page);
    const l = Math.min(100, Math.max(1, limit));
    const [data, total] = await Promise.all([
      prisma.appUser.findMany({
        select: {
          id: true,
          email: true,
          role: true,
          brandId: true,
          creatorId: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (p - 1) * l,
        take: l,
      }),
      prisma.appUser.count(),
    ]);
    return { data, meta: { page: p, limit: l, total, totalPages: Math.ceil(total / l) } };
  }
}

export const adminProvisioningService = new AdminProvisioningService();
