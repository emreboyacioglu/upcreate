import type { Request } from "express";
import { auditLogService } from "../business/AuditLogService";

/**
 * Best-effort audit line; never throws to client.
 */
export async function logAudit(
  req: Request,
  action: string,
  entityType: string,
  entityId?: string | null,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const user = req.user;
  if (!user) return;
  try {
    await auditLogService.append({
      actorUserId: user.sub,
      actorRole: user.role,
      action,
      entityType,
      entityId: entityId ?? null,
      metadata,
      ip: req.ip || req.socket.remoteAddress || null,
    });
  } catch (e) {
    console.error("[audit] append failed:", e);
  }
}
