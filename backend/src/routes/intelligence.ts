import { Router } from "express";
import { intelligenceService } from "../services/IntelligenceService";
import { analyzeCreatorComments } from "../services/commentAnalysis";
import { authenticateOptional, requireAuth, requireRole } from "../middleware/auth";

export const intelligenceRouter = Router();

intelligenceRouter.use(authenticateOptional, requireAuth, requireRole("ADMIN"));

/** Full intelligence profile (read from DB, fast) */
intelligenceRouter.get("/:creatorId/profile", async (req, res, next) => {
  try {
    const profile = await intelligenceService.getIntelligenceProfile(req.params.creatorId);
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

/** Recompute all metrics (slower, writes to DB) */
intelligenceRouter.post("/:creatorId/compute", async (req, res, next) => {
  try {
    const profile = await intelligenceService.computeAll(req.params.creatorId);
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

/** Creator activity detail */
intelligenceRouter.get("/:creatorId/activity", async (req, res, next) => {
  try {
    const activity = await intelligenceService.computeCreatorActivity(req.params.creatorId);
    res.json(activity);
  } catch (err) {
    next(err);
  }
});

/** Recent content posts */
intelligenceRouter.get("/:creatorId/content", async (req, res, next) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const content = await intelligenceService.getRecentContent(req.params.creatorId, limit);
    res.json({ data: content });
  } catch (err) {
    next(err);
  }
});

/** Get comment analysis insights */
intelligenceRouter.get("/:creatorId/comments", async (req, res, next) => {
  try {
    const insights = await intelligenceService.computeCommentInsights(req.params.creatorId);
    res.json(insights ?? { totalAnalyzed: 0, overallSentiment: 0, overallSentimentLabel: "NEUTRAL", purchaseIntentRate: 0, audienceEngagementDepth: 0, uniqueCommenters: 0, topCommenters: [] });
  } catch (err) {
    next(err);
  }
});

/** Re-analyze all comments for a creator (runs sentiment + intent analysis) */
intelligenceRouter.post("/:creatorId/analyze-comments", async (req, res, next) => {
  try {
    const insights = await analyzeCreatorComments(req.params.creatorId);
    res.json(insights);
  } catch (err) {
    next(err);
  }
});

/** Save/update audience JSON */
intelligenceRouter.post("/:creatorId/audience", async (req, res, next) => {
  try {
    const { audienceJson } = req.body;
    if (!audienceJson || typeof audienceJson !== "string") {
      return res.status(400).json({ error: "audienceJson string is required" });
    }
    const updated = await intelligenceService.saveAudienceData(req.params.creatorId, audienceJson);
    res.json({ message: "Audience data saved", creatorId: updated.id });
  } catch (err) {
    next(err);
  }
});
