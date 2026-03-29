import type { CreatorLifecycleStatus, Prisma } from "@prisma/client";
import { WorkflowScope } from "@prisma/client";
import { prisma } from "../config/db";
import { AppError } from "../middleware/errorHandler";
import { workflowEngineService } from "./WorkflowEngineService";

interface CreateCreatorInput {
  name: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  creatorScale?: "NANO" | "MICRO" | "MID";
  status?: CreatorLifecycleStatus;
  phone?: string;
  country?: string;
  categories?: string[];
  metadata?: Prisma.InputJsonValue;
  verificationNotes?: string;
}

interface AddAccountInput {
  platform: "INSTAGRAM" | "TIKTOK";
  username: string;
  profileUrl?: string;
  followerCount?: number;
  isConnected?: boolean;
}

interface UpdatePaymentInfoInput {
  bankName?: string;
  iban?: string;
  accountHolder?: string;
  taxId?: string;
  notes?: string;
}

interface ListCreatorsOptions {
  page?: number;
  limit?: number;
  platform?: string;
  sort?: string;
  search?: string;
}

export class CreatorService {
  async list(options: ListCreatorsOptions = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));

    const where: any = {};
    if (options.platform && (options.platform === "INSTAGRAM" || options.platform === "TIKTOK")) {
      where.accounts = { some: { platform: options.platform } };
    }
    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: "insensitive" } },
        { email: { contains: options.search, mode: "insensitive" } },
        { accounts: { some: { username: { contains: options.search, mode: "insensitive" } } } },
      ];
    }

    const orderBy: any[] =
      options.sort === "commerceScore"
        ? [{ commerceScore: { commerceScore: "desc" } }]
        : [{ createdAt: "desc" }];

    const [data, total] = await Promise.all([
      prisma.creator.findMany({
        where,
        include: {
          accounts: { include: { metrics: true } },
          commerceScore: true,
          paymentInfo: true,
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.creator.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: string) {
    const creator = await prisma.creator.findUnique({
      where: { id },
      include: {
        accounts: {
          include: {
            metrics: true,
            posts: { orderBy: { postedAt: "desc" }, take: 10 },
          },
        },
        commerceScore: true,
        paymentInfo: true,
        campaigns: {
          include: {
            campaign: { include: { brand: true } },
            transactions: true,
          },
        },
      },
    });

    if (!creator) throw new AppError(404, "Creator not found");
    return creator;
  }

  async create(input: CreateCreatorInput) {
    if (input.email) {
      const existing = await prisma.creator.findUnique({ where: { email: input.email } });
      if (existing) throw new AppError(409, "Creator with this email already exists");
    }
    const { metadata, creatorScale, ...rest } = input;
    return prisma.creator.create({
      data: {
        ...rest,
        creatorScale: creatorScale ?? undefined,
        metadata: metadata === undefined ? undefined : (metadata as Prisma.InputJsonValue),
      },
    });
  }

  async update(id: string, input: Partial<CreateCreatorInput>) {
    const current = await this.assertExists(id);
    if (input.status !== undefined && input.status !== current.status) {
      await workflowEngineService.assertTransition(WorkflowScope.CREATOR, current.status, input.status);
    }
    return prisma.creator.update({ where: { id }, data: input as Prisma.CreatorUpdateInput });
  }

  async transitionStatus(id: string, newStatus: CreatorLifecycleStatus) {
    const current = await this.assertExists(id);
    await workflowEngineService.assertTransition(WorkflowScope.CREATOR, current.status, newStatus);
    return prisma.creator.update({
      where: { id },
      data: { status: newStatus },
    });
  }

  async delete(id: string) {
    await this.assertExists(id);
    await prisma.creator.delete({ where: { id } });
    return { message: "Creator deleted" };
  }

  async addAccount(creatorId: string, input: AddAccountInput) {
    await this.assertExists(creatorId);

    const existing = await prisma.socialAccount.findUnique({
      where: { platform_username: { platform: input.platform, username: input.username } },
    });
    if (existing) throw new AppError(409, "Account with this platform/username already exists");

    return prisma.socialAccount.create({
      data: { creatorId, ...input },
    });
  }

  async removeAccount(creatorId: string, accountId: string) {
    const account = await prisma.socialAccount.findFirst({
      where: { id: accountId, creatorId },
    });
    if (!account) throw new AppError(404, "Account not found for this creator");
    await prisma.socialAccount.delete({ where: { id: accountId } });
    return { message: "Account removed" };
  }

  async updatePaymentInfo(creatorId: string, input: UpdatePaymentInfoInput) {
    await this.assertExists(creatorId);
    return prisma.paymentInfo.upsert({
      where: { creatorId },
      update: input,
      create: { creatorId, ...input },
    });
  }

  async getPaymentInfo(creatorId: string) {
    await this.assertExists(creatorId);
    return prisma.paymentInfo.findUnique({ where: { creatorId } });
  }

  private async assertExists(id: string) {
    const creator = await prisma.creator.findUnique({ where: { id } });
    if (!creator) throw new AppError(404, "Creator not found");
    return creator;
  }
}

export const creatorService = new CreatorService();
