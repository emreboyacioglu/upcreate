import { Router } from "express";
import { affiliateService } from "../business";
import { authenticateOptional, requireAuth, requireRole } from "../middleware/auth";

export const trackingRouter = Router();

trackingRouter.use(authenticateOptional, requireAuth);

trackingRouter.get("/overview", requireRole("ADMIN"), async (_req, res, next) => {
  try {
    const result = await affiliateService.platformOverview();
    res.json(result);
  } catch (err) {
    next(err);
  }
});
