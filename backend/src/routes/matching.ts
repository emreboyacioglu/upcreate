import { Router } from "express";
import { z } from "zod";
import { Platform } from "@prisma/client";
import { matchingService } from "../business";
import { authenticateOptional, requireAuth, requireRole } from "../middleware/auth";

export const matchingRouter = Router();

const overviewQuerySchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(50).optional(),
  status: z.string().optional(),
  campaignId: z.string().uuid().optional(),
});

matchingRouter.get("/overview", authenticateOptional, requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const parsed = overviewQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsed.error.issues.map((e) => ({ path: e.path.join("."), message: e.message })),
      });
    }
    const result = await matchingService.matchingOverview(parsed.data);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

const suggestionsQuerySchema = z.object({
  platform: z.nativeEnum(Platform).optional(),
  minCommerceScore: z.coerce.number().min(0).max(1).optional(),
  limit: z.coerce.number().min(1).max(50).optional(),
});

matchingRouter.get("/campaigns/:campaignId/suggestions", async (req, res, next) => {
  try {
    const parsed = suggestionsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsed.error.issues.map((e) => ({ path: e.path.join("."), message: e.message })),
      });
    }
    const result = await matchingService.suggestions(req.params.campaignId as string, parsed.data);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

matchingRouter.post("/creators/:creatorId/intelligence/refresh", async (req, res, next) => {
  try {
    const updated = await matchingService.refreshCreatorIntelligence(req.params.creatorId as string);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

matchingRouter.post("/brands/:brandId/creators/:creatorId/fit", async (req, res, next) => {
  try {
    const fit = await matchingService.computeAndStoreBrandCreatorFit(
      req.params.brandId as string,
      req.params.creatorId as string,
    );
    res.json(fit);
  } catch (err) {
    next(err);
  }
});
