import { TransactionStatus, TransactionType } from "@prisma/client";
import { prisma } from "../config/db";
import { AppError } from "../middleware/errorHandler";

interface CreateTransactionInput {
  campaignCreatorId: string;
  type?: TransactionType;
  amount: number;
  currency?: string;
  description?: string;
}

interface ListTransactionsOptions {
  page?: number;
  limit?: number;
  campaignId?: string;
  creatorId?: string;
  status?: TransactionStatus;
  type?: TransactionType;
}

interface UpdateTransactionStatusInput {
  status: TransactionStatus;
  paidAt?: Date;
}

export class TransactionService {
  async list(options: ListTransactionsOptions = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));

    const where: any = {};
    if (options.status) where.status = options.status;
    if (options.type) where.type = options.type;
    if (options.campaignId) {
      where.campaignCreator = { campaignId: options.campaignId };
    }
    if (options.creatorId) {
      where.campaignCreator = { ...where.campaignCreator, creatorId: options.creatorId };
    }

    const [data, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          campaignCreator: {
            include: {
              creator: { select: { id: true, name: true } },
              campaign: { select: { id: true, title: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: string) {
    const tx = await prisma.transaction.findUnique({
      where: { id },
      include: {
        campaignCreator: {
          include: {
            creator: true,
            campaign: { include: { brand: true } },
          },
        },
      },
    });
    if (!tx) throw new AppError(404, "Transaction not found");
    return tx;
  }

  async create(input: CreateTransactionInput) {
    const cc = await prisma.campaignCreator.findUnique({ where: { id: input.campaignCreatorId } });
    if (!cc) throw new AppError(404, "Campaign-creator link not found");

    return prisma.transaction.create({
      data: {
        campaignCreatorId: input.campaignCreatorId,
        type: input.type || "COMMISSION",
        amount: input.amount,
        currency: input.currency || "TRY",
        description: input.description,
      },
      include: {
        campaignCreator: {
          include: {
            creator: { select: { id: true, name: true } },
            campaign: { select: { id: true, title: true } },
          },
        },
      },
    });
  }

  async updateStatus(id: string, input: UpdateTransactionStatusInput) {
    const tx = await prisma.transaction.findUnique({ where: { id } });
    if (!tx) throw new AppError(404, "Transaction not found");

    const data: any = { status: input.status };
    if (input.status === "PAID") {
      data.paidAt = input.paidAt || new Date();
    }

    return prisma.transaction.update({
      where: { id },
      data,
      include: {
        campaignCreator: {
          include: {
            creator: { select: { id: true, name: true } },
            campaign: { select: { id: true, title: true } },
          },
        },
      },
    });
  }

  async delete(id: string) {
    const tx = await prisma.transaction.findUnique({ where: { id } });
    if (!tx) throw new AppError(404, "Transaction not found");
    if (tx.status === "PAID") throw new AppError(400, "Cannot delete a paid transaction");
    await prisma.transaction.delete({ where: { id } });
    return { message: "Transaction deleted" };
  }
}

export const transactionService = new TransactionService();
