import { Router } from "express";
import { z } from "zod";
import { CampaignStatus, UserRole } from "@prisma/client";
import { validate } from "../middleware/validate";
import { campaignService, analyticsService } from "../business";
import { authenticateOptional, requireAuth, requireRole } from "../middleware/auth";
import { logAudit } from "../middleware/auditLog";
import { requireAdminOrCampaignParticipant } from "../middleware/authz";

export const campaignsRouter = Router();

campaignsRouter.use(authenticateOptional);
campaignsRouter.use(requireAuth);

const createCampaignSchema = z.object({
  brandId: z.string().min(1),
  title: z.string().min(1).max(300),
  budget: z.number().positive().optional(),
  brief: z.string().optional(),
  productInfo: z.string().optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
});

const updateCampaignSchema = createCampaignSchema.partial();

const statusTransitionSchema = z.object({
  status: z.nativeEnum(CampaignStatus),
});

const inviteCreatorSchema = z.object({
  creatorId: z.string().min(1),
});

campaignsRouter.get("/", requireRole(UserRole.ADMIN), async (req, res, next) => {
  try {
    const result = await campaignService.list({
      page: parseInt(req.query.page as string) || undefined,
      limit: parseInt(req.query.limit as string) || undefined,
      status: req.query.status as string,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

campaignsRouter.post("/", requireRole(UserRole.ADMIN), validate(createCampaignSchema), async (req, res, next) => {
  try {
    const campaign = await campaignService.create(req.body);
    await logAudit(req, "campaign.create", "Campaign", campaign.id, { title: campaign.title });
    res.status(201).json(campaign);
  } catch (err) {
    next(err);
  }
});

/** Sub-routes before `/:id` so ids like "performance" are not captured incorrectly. */
campaignsRouter.get("/:id/performance", requireAdminOrCampaignParticipant, async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const result = await analyticsService.campaignPerformance(id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

campaignsRouter.get("/:id/affiliate-summary", requireAdminOrCampaignParticipant, async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const result = await analyticsService.affiliateCampaignSummary(id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

campaignsRouter.get("/:id", requireAdminOrCampaignParticipant, async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const campaign = await campaignService.getById(id);
    res.json(campaign);
  } catch (err) {
    next(err);
  }
});

campaignsRouter.put("/:id", requireRole(UserRole.ADMIN), validate(updateCampaignSchema), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const updated = await campaignService.update(id, req.body);
    await logAudit(req, "campaign.update", "Campaign", id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

campaignsRouter.delete("/:id", requireRole(UserRole.ADMIN), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const result = await campaignService.delete(id);
    await logAudit(req, "campaign.delete", "Campaign", id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

campaignsRouter.patch("/:id/status", requireRole(UserRole.ADMIN), validate(statusTransitionSchema), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const updated = await campaignService.transitionStatus(id, req.body.status);
    await logAudit(req, "campaign.status.transition", "Campaign", id, { status: req.body.status });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/** Admin recommends a creator (pairing_first). */
campaignsRouter.post("/:id/recommend", requireRole(UserRole.ADMIN), validate(inviteCreatorSchema), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const row = await campaignService.recommendCreator(id, req.body.creatorId);
    await logAudit(req, "campaign.recommend", "CampaignCreator", row.id, {
      campaignId: id,
      creatorId: req.body.creatorId,
    });
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});

/** @deprecated Use POST /:id/recommend */
campaignsRouter.post("/:id/invite", requireRole(UserRole.ADMIN), validate(inviteCreatorSchema), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const invitation = await campaignService.inviteCreator(id, req.body.creatorId);
    await logAudit(req, "campaign.invite", "CampaignCreator", invitation.id, {
      campaignId: id,
      creatorId: req.body.creatorId,
    });
    res.status(201).json(invitation);
  } catch (err) {
    next(err);
  }
});
