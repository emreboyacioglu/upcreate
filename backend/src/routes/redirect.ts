import { Router } from "express";
import { affiliateService } from "../business";

export const redirectRouter = Router();

redirectRouter.get("/:code", async (req, res, next) => {
  try {
    const code = req.params.code as string;
    const ua = req.get("user-agent") ?? undefined;
    const ip = req.ip || req.socket.remoteAddress || undefined;
    const link = await affiliateService.recordClick(code, ua, ip);
    res.redirect(302, link.destinationUrl);
  } catch (err) {
    next(err);
  }
});
