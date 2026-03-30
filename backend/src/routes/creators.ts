import { Router } from "express";
import { z } from "zod";
import { UserRole, CreatorLifecycleStatus } from "@prisma/client";
import { validate } from "../middleware/validate";
import { creatorService, analyticsService } from "../business";
import { calculateCommerceScore } from "../services/scoring";
import { ingestInstagram, ingestTikTok, ingestAllConnected } from "../services/ingestion";
import { prisma } from "../config/db";
import { AppError } from "../middleware/errorHandler";
import { authenticateOptional, requireAuth, requireRole } from "../middleware/auth";
import { requireAdmin, requireAdminOrOwnCreator } from "../middleware/authz";
import { logAudit } from "../middleware/auditLog";

export const creatorsRouter = Router();
creatorsRouter.use(authenticateOptional);

const createCreatorSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().optional(),
  bio: z.string().optional(),
  creatorScale: z.enum(["NANO", "MICRO", "MID"]).optional(),
  status: z.nativeEnum(CreatorLifecycleStatus).optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
  categories: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
  verificationNotes: z.string().optional(),
});

const updateCreatorSchema = createCreatorSchema.partial();

const addAccountSchema = z.object({
  platform: z.enum(["INSTAGRAM", "TIKTOK"]),
  username: z.string().min(1).max(100),
  profileUrl: z.string().url().optional(),
  followerCount: z.number().int().min(0).optional(),
  isConnected: z.boolean().optional(),
});

const updatePaymentInfoSchema = z.object({
  bankName: z.string().optional(),
  iban: z.string().optional(),
  accountHolder: z.string().optional(),
  taxId: z.string().optional(),
  notes: z.string().optional(),
});

creatorsRouter.get("/", requireAuth, requireRole(UserRole.ADMIN), async (req, res, next) => {
  try {
    const result = await creatorService.list({
      page: parseInt(req.query.page as string) || undefined,
      limit: parseInt(req.query.limit as string) || undefined,
      platform: req.query.platform as string,
      sort: req.query.sort as string,
      search: req.query.search as string,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

creatorsRouter.post("/ingest-all-connected", requireAuth, requireRole(UserRole.ADMIN), async (req, res, next) => {
  try {
    const platform = req.query.platform as string | undefined;
    const validPlatform = platform === "INSTAGRAM" || platform === "TIKTOK" ? platform : undefined;
    const result = await ingestAllConnected(validPlatform);
    await logAudit(req, "creator.bulk_ingest", "SocialAccount", undefined, { total: result.total, success: result.success });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

creatorsRouter.get("/:id", requireAuth, requireAdminOrOwnCreator, async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const creator = await creatorService.getById(id);
    res.json(creator);
  } catch (err) {
    next(err);
  }
});

creatorsRouter.post("/", requireAuth, requireRole(UserRole.ADMIN), validate(createCreatorSchema), async (req, res, next) => {
  try {
    const creator = await creatorService.create(req.body);
    await logAudit(req, "creator.create", "Creator", creator.id, { name: creator.name });
    res.status(201).json(creator);
  } catch (err) {
    next(err);
  }
});

creatorsRouter.put("/:id", requireAuth, requireAdminOrOwnCreator, validate(updateCreatorSchema), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const body = { ...req.body } as Record<string, unknown>;
    if (req.user?.role === UserRole.CREATOR) {
      delete body.status;
      delete body.metadata;
      delete body.verificationNotes;
    }
    const updated = await creatorService.update(id, body);
    await logAudit(req, "creator.update", "Creator", id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

creatorsRouter.delete("/:id", requireAuth, requireRole(UserRole.ADMIN), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const result = await creatorService.delete(id);
    await logAudit(req, "creator.delete", "Creator", id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

creatorsRouter.post("/:id/accounts", requireAuth, requireAdminOrOwnCreator, validate(addAccountSchema), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const account = await creatorService.addAccount(id, req.body);
    await logAudit(req, "creator.account.add", "SocialAccount", account.id, { creatorId: id });
    res.status(201).json(account);
  } catch (err) {
    next(err);
  }
});

creatorsRouter.delete("/:id/accounts/:accountId", requireAuth, requireAdminOrOwnCreator, async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const accountId = req.params.accountId as string;
    const result = await creatorService.removeAccount(id, accountId);
    await logAudit(req, "creator.account.remove", "SocialAccount", accountId, { creatorId: id });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

creatorsRouter.post("/:id/accounts/:accountId/ingest", requireAuth, requireAdminOrOwnCreator, async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const accountId = req.params.accountId as string;
    const account = await prisma.socialAccount.findFirst({
      where: { id: accountId, creatorId: id },
    });
    if (!account) throw new AppError(404, "Social account not found");

    const result =
      account.platform === "INSTAGRAM"
        ? await ingestInstagram(account.id, account.username)
        : await ingestTikTok(account.id, account.username);

    await logAudit(req, "creator.account.ingest", "SocialAccount", accountId, { creatorId: id });
    res.json(result);
  } catch (err) {
    next(err);
  }
});


creatorsRouter.post("/:id/calculate-score", requireAuth, requireRole(UserRole.ADMIN), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const score = await calculateCommerceScore(id);
    await logAudit(req, "creator.score.calculate", "Creator", id);
    res.json(score);
  } catch (err) {
    next(err);
  }
});

creatorsRouter.put("/:id/payment-info", requireAuth, requireAdminOrOwnCreator, validate(updatePaymentInfoSchema), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const info = await creatorService.updatePaymentInfo(id, req.body);
    await logAudit(req, "creator.payment_info.update", "Creator", id);
    res.json(info);
  } catch (err) {
    next(err);
  }
});

creatorsRouter.get("/:id/payment-info", requireAuth, requireAdminOrOwnCreator, async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const info = await creatorService.getPaymentInfo(id);
    res.json(info);
  } catch (err) {
    next(err);
  }
});

creatorsRouter.get("/:id/earnings", requireAuth, requireAdminOrOwnCreator, async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const from = req.query.from ? new Date(req.query.from as string) : undefined;
    const to = req.query.to ? new Date(req.query.to as string) : undefined;
    const result = await analyticsService.creatorEarnings(id, { from, to });
    res.json(result);
  } catch (err) {
    next(err);
  }
});
