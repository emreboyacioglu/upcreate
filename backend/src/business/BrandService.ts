import type { BrandStatus, Prisma } from "@prisma/client";
import { WorkflowScope } from "@prisma/client";
import { prisma } from "../config/db";
import { AppError } from "../middleware/errorHandler";
import { workflowEngineService } from "./WorkflowEngineService";

interface CreateBrandInput {
  name: string;
  email: string;
  website?: string;
  category?: string;
  industry?: string;
  notes?: string;
  status?: BrandStatus;
  country?: string;
  taxId?: string;
  contactPhone?: string;
  billingAddress?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
}

interface ListBrandsOptions {
  page?: number;
  limit?: number;
  search?: string;
}

export class BrandService {
  async list(options: ListBrandsOptions = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));

    const where: any = {};
    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: "insensitive" } },
        { email: { contains: options.search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.brand.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.brand.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: string) {
    const brand = await prisma.brand.findUnique({
      where: { id },
      include: { campaigns: { include: { creators: true } } },
    });
    if (!brand) throw new AppError(404, "Brand not found");
    return brand;
  }

  async create(input: CreateBrandInput) {
    const existing = await prisma.brand.findUnique({ where: { email: input.email } });
    if (existing) throw new AppError(409, "Brand with this email already exists");
    const { billingAddress, metadata, ...rest } = input;
    return prisma.brand.create({
      data: {
        ...rest,
        billingAddress: billingAddress === undefined ? undefined : (billingAddress as Prisma.InputJsonValue),
        metadata: metadata === undefined ? undefined : (metadata as Prisma.InputJsonValue),
      },
    });
  }

  async update(id: string, input: Partial<CreateBrandInput>) {
    const current = await this.assertExists(id);
    if (input.status !== undefined && input.status !== current.status) {
      await workflowEngineService.assertTransition(WorkflowScope.BRAND, current.status, input.status);
    }
    return prisma.brand.update({ where: { id }, data: input as Prisma.BrandUpdateInput });
  }

  async transitionStatus(id: string, newStatus: BrandStatus) {
    const current = await this.assertExists(id);
    await workflowEngineService.assertTransition(WorkflowScope.BRAND, current.status, newStatus);
    return prisma.brand.update({
      where: { id },
      data: { status: newStatus },
    });
  }

  async delete(id: string) {
    await this.assertExists(id);
    await prisma.brand.delete({ where: { id } });
    return { message: "Brand deleted" };
  }

  private async assertExists(id: string) {
    const brand = await prisma.brand.findUnique({ where: { id } });
    if (!brand) throw new AppError(404, "Brand not found");
    return brand;
  }
}

export const brandService = new BrandService();
