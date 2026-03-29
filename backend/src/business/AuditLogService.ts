import type { UserRole } from "@prisma/client";
import { prisma } from "../config/db";
import crypto from "crypto";

export interface AppendAuditInput {
  actorUserId?: string | null;
  actorRole: UserRole;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
  requestId?: string | null;
}

function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

export class AuditLogService {
  async append(input: AppendAuditInput) {
    const ipHash = input.ip ? hashIp(input.ip) : null;
    return prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId ?? undefined,
        actorRole: input.actorRole,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? undefined,
        metadata: input.metadata ? (input.metadata as object) : undefined,
        ipHash: ipHash ?? undefined,
        requestId: input.requestId ?? undefined,
      },
    });
  }

  async list(options: {
    page?: number;
    limit?: number;
    actorUserId?: string;
    entityType?: string;
    from?: Date;
    to?: Date;
  }) {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(100, Math.max(1, options.limit ?? 50));
    const where: Record<string, unknown> = {};
    if (options.actorUserId) where.actorUserId = options.actorUserId;
    if (options.entityType) where.entityType = options.entityType;
    if (options.from || options.to) {
      where.createdAt = {};
      if (options.from) (where.createdAt as Record<string, Date>).gte = options.from;
      if (options.to) (where.createdAt as Record<string, Date>).lte = options.to;
    }

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { actor: { select: { id: true, email: true, role: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}

export const auditLogService = new AuditLogService();
