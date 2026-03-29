import { Router } from "express";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { validate } from "../middleware/validate";
import { contentService } from "../business";
import { prisma } from "../config/db";
import { authenticateOptional, requireAuth } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

export const campaignContentsRouter = Router();

campaignContentsRouter.use(authenticateOptional);

const reviewContentSchema = z.object({
  action: z.enum(["approve", "reject", "revision"]),
  reviewNote: z.string().max(2000).optional(),
});

function assertBrandForContent(req: import("express").Request, brandId: string) {
  if (req.user?.role === UserRole.ADMIN) return;
  if (req.user?.role === UserRole.BRAND && req.user.brandId === brandId) return;
  throw new AppError(403, "Not allowed to review this content");
}

campaignContentsRouter.patch(
  "/:id/review",
  requireAuth,
  validate(reviewContentSchema),
  async (req, res, next) => {
    try {
      const content = await prisma.campaignContent.findUnique({
        where: { id: req.params.id as string },
        include: { campaignCreator: { include: { campaign: true } } },
      });
      if (!content) throw new AppError(404, "Content not found");
      assertBrandForContent(req, content.campaignCreator.campaign.brandId);

      const updated = await contentService.review(content.id, req.body.action, req.body.reviewNote);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },
);
