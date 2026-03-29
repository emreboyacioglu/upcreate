import { Router } from "express";
import { z } from "zod";
import { UserRole, WorkflowScope, BrandStatus, CreatorLifecycleStatus } from "@prisma/client";
import { validate } from "../middleware/validate";
import { authenticateOptional, requireAuth, requireRole } from "../middleware/auth";
import { auditLogService } from "../business/AuditLogService";
import { workflowDefinitionAdminService } from "../business/WorkflowDefinitionAdminService";
import { adminProvisioningService } from "../business/AdminProvisioningService";
import { logAudit } from "../middleware/auditLog";

export const adminRouter = Router();
adminRouter.use(authenticateOptional);
adminRouter.use(requireAuth);
adminRouter.use(requireRole(UserRole.ADMIN));

const auditQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  actorUserId: z.string().optional(),
  entityType: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

adminRouter.get("/audit-logs", async (req, res, next) => {
  try {
    const q = auditQuerySchema.parse(req.query);
    const result = await auditLogService.list({
      page: q.page,
      limit: q.limit,
      actorUserId: q.actorUserId,
      entityType: q.entityType,
      from: q.from,
      to: q.to,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/workflows", async (req, res, next) => {
  try {
    const scope = req.query.scope as WorkflowScope | undefined;
    const data = await workflowDefinitionAdminService.list(scope);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

const createWorkflowSchema = z.object({
  scope: z.nativeEnum(WorkflowScope),
  definition: z.unknown(),
  setActive: z.boolean().optional(),
});

adminRouter.post("/workflows", validate(createWorkflowSchema), async (req, res, next) => {
  try {
    const row = await workflowDefinitionAdminService.createVersion(
      req.body.scope,
      req.body.definition,
      req.body.setActive ?? true,
    );
    await logAudit(req, "workflow.create", "WorkflowDefinition", row.id, {
      scope: row.scope,
      version: row.version,
    });
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});

adminRouter.patch("/workflows/:id/activate", async (req, res, next) => {
  try {
    const wfId = String(req.params.id);
    const row = await workflowDefinitionAdminService.activate(wfId);
    await logAudit(req, "workflow.activate", "WorkflowDefinition", row.id, { scope: row.scope });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

adminRouter.delete("/workflows/:id", async (req, res, next) => {
  try {
    const wfId = String(req.params.id);
    const result = await workflowDefinitionAdminService.delete(wfId);
    await logAudit(req, "workflow.delete", "WorkflowDefinition", wfId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

const createAppUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.nativeEnum(UserRole),
  brandName: z.string().optional(),
  creatorName: z.string().optional(),
  brandExtras: z
    .object({
      website: z.string().url().optional(),
      category: z.string().optional(),
      industry: z.string().optional(),
      notes: z.string().optional(),
      status: z.nativeEnum(BrandStatus).optional(),
      country: z.string().optional(),
      taxId: z.string().optional(),
      contactPhone: z.string().optional(),
    })
    .optional(),
  creatorExtras: z
    .object({
      bio: z.string().optional(),
      status: z.nativeEnum(CreatorLifecycleStatus).optional(),
      phone: z.string().optional(),
      country: z.string().optional(),
      categories: z.array(z.string()).optional(),
    })
    .optional(),
});

adminRouter.post("/app-users", validate(createAppUserSchema), async (req, res, next) => {
  try {
    const result = await adminProvisioningService.createAppUser(req.body);
    const { passwordHash: _p, ...safe } = result.user;
    await logAudit(req, "app_user.create", "AppUser", result.user.id, {
      role: result.user.role,
      brandId: result.brand?.id,
      creatorId: result.creator?.id,
    });
    res.status(201).json({ user: safe, brand: result.brand, creator: result.creator });
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/app-users", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const result = await adminProvisioningService.listAppUsers(page, limit);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

const updatePasswordSchema = z.object({
  password: z.string().min(8),
});

adminRouter.patch("/app-users/:id/password", validate(updatePasswordSchema), async (req, res, next) => {
  try {
    const userId = String(req.params.id);
    await adminProvisioningService.updateAppUserPassword(userId, req.body.password);
    await logAudit(req, "app_user.password_reset", "AppUser", userId);
    res.json({ message: "Password updated" });
  } catch (err) {
    next(err);
  }
});
