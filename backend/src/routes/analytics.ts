import { Router } from "express";
import { analyticsService } from "../business";

export const analyticsRouter = Router();

analyticsRouter.get("/overview", async (_req, res, next) => {
  try {
    const result = await analyticsService.overview();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

analyticsRouter.get("/creators/top", async (req, res, next) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const result = await analyticsService.topCreators(limit);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

analyticsRouter.get("/campaigns/:id/performance", async (req, res, next) => {
  try {
    const result = await analyticsService.campaignPerformance(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

analyticsRouter.get("/creators/:id/earnings", async (req, res, next) => {
  try {
    const from = req.query.from ? new Date(req.query.from as string) : undefined;
    const to = req.query.to ? new Date(req.query.to as string) : undefined;
    const result = await analyticsService.creatorEarnings(req.params.id, { from, to });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

analyticsRouter.get("/brands/:id/spending", async (req, res, next) => {
  try {
    const result = await analyticsService.brandSpending(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
