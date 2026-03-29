import { Router } from "express";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { validate } from "../middleware/validate";
import { campaignService, contentService, affiliateService } from "../business";
import { authenticateOptional, requireAuth, requireRole } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

export const campaignCreatorsRouter = Router();

campaignCreatorsRouter.use(authenticateOptional);

const decisionSchema = z.object({
  accept: z.boolean(),
});

const submitContentSchema = z
  .object({
    storageUrl: z.string().url().optional(),
    assetKey: z.string().min(1).optional(),
    mimeType: z.string().max(200).optional(),
  })
  .refine((b) => Boolean(b.storageUrl || b.assetKey), {
    message: "Provide storageUrl or assetKey",
  });

const affiliateLinkSchema = z.object({
  destinationUrl: z.string().url(),
  code: z.string().min(2).max(64).optional(),
});

const conversionSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number(),
  currency: z.string().max(8).optional(),
});

function assertCreator(req: import("express").Request, creatorId: string) {
  if (req.user?.role === UserRole.ADMIN) return;
  if (req.user?.role === UserRole.CREATOR && req.user.creatorId === creatorId) return;
  throw new AppError(403, "Not allowed to act as this creator");
}

function assertBrandForCampaign(req: import("express").Request, brandId: string) {
  if (req.user?.role === UserRole.ADMIN) return;
  if (req.user?.role === UserRole.BRAND && req.user.brandId === brandId) return;
  throw new AppError(403, "Not allowed to act for this brand");
}

campaignCreatorsRouter.patch(
  "/:id/creator-response",
  requireAuth,
  validate(decisionSchema),
  async (req, res, next) => {
    try {
      const cc = await campaignService.getCampaignCreator(req.params.id as string);
      assertCreator(req, cc.creatorId);
      const updated = await campaignService.creatorRespond(cc.id, req.body.accept);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },
);

campaignCreatorsRouter.patch(
  "/:id/brand-response",
  requireAuth,
  validate(decisionSchema),
  async (req, res, next) => {
    try {
      const cc = await campaignService.getCampaignCreator(req.params.id as string);
      assertBrandForCampaign(req, cc.campaign.brandId);
      const updated = await campaignService.brandRespond(cc.id, req.body.accept);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },
);

campaignCreatorsRouter.patch("/:id/publish", requireAuth, async (req, res, next) => {
  try {
    const cc = await campaignService.getCampaignCreator(req.params.id as string);
    assertBrandForCampaign(req, cc.campaign.brandId);
    const updated = await campaignService.publishPairing(cc.id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

campaignCreatorsRouter.patch("/:id/complete", requireAuth, async (req, res, next) => {
  try {
    const cc = await campaignService.getCampaignCreator(req.params.id as string);
    assertBrandForCampaign(req, cc.campaign.brandId);
    const updated = await campaignService.completePairing(cc.id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

campaignCreatorsRouter.get("/:id/contents", async (req, res, next) => {
  try {
    const list = await contentService.listByCampaignCreator(req.params.id as string);
    res.json({ data: list });
  } catch (err) {
    next(err);
  }
});

campaignCreatorsRouter.post(
  "/:id/contents",
  requireAuth,
  validate(submitContentSchema),
  async (req, res, next) => {
    try {
      const cc = await campaignService.getCampaignCreator(req.params.id as string);
      assertCreator(req, cc.creatorId);
      const row = await contentService.submit(cc.id, req.body);
      res.status(201).json(row);
    } catch (err) {
      next(err);
    }
  },
);

campaignCreatorsRouter.post(
  "/:id/affiliate-links",
  requireAuth,
  validate(affiliateLinkSchema),
  async (req, res, next) => {
    try {
      const cc = await campaignService.getCampaignCreator(req.params.id as string);
      assertCreator(req, cc.creatorId);
      const link = await affiliateService.createLink(cc.id, req.body.destinationUrl, req.body.code);
      res.status(201).json(link);
    } catch (err) {
      next(err);
    }
  },
);

campaignCreatorsRouter.post(
  "/affiliate-links/:linkId/conversions",
  requireAuth,
  requireRole(UserRole.ADMIN, UserRole.BRAND),
  validate(conversionSchema),
  async (req, res, next) => {
    try {
      const link = await affiliateService.getById(req.params.linkId as string);
      assertBrandForCampaign(req, link.campaignCreator.campaign.brandId);
      const conv = await affiliateService.recordConversion(
        link.id,
        req.body.orderId,
        req.body.amount,
        req.body.currency,
      );
      res.status(201).json(conv);
    } catch (err) {
      next(err);
    }
  },
);
