import type { Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import { prisma } from "../config/db";
import { AppError } from "./errorHandler";

/** Admin, or creator/brand with access to this campaign id */
export async function requireAdminOrCampaignParticipant(req: Request, _res: Response, next: NextFunction) {
  const u = req.user;
  if (!u) return next(new AppError(401, "Unauthorized"));
  if (u.role === UserRole.ADMIN) return next();
  const campaignId = req.params.id as string;
  if (!campaignId) return next(new AppError(400, "Missing campaign id"));
  if (u.role === UserRole.CREATOR && u.creatorId) {
    const row = await prisma.campaignCreator.findFirst({
      where: { campaignId, creatorId: u.creatorId },
    });
    if (row) return next();
  }
  if (u.role === UserRole.BRAND && u.brandId) {
    const camp = await prisma.campaign.findFirst({
      where: { id: campaignId, brandId: u.brandId },
    });
    if (camp) return next();
  }
  return next(new AppError(403, "Forbidden"));
}

/** Admin, or creator accessing their own profile by :id */
export function requireAdminOrOwnCreator(req: Request, _res: Response, next: NextFunction) {
  const u = req.user;
  if (!u) return next(new AppError(401, "Unauthorized"));
  if (u.role === UserRole.ADMIN) return next();
  const id = req.params.id as string;
  if (u.role === UserRole.CREATOR && u.creatorId === id) return next();
  return next(new AppError(403, "Forbidden"));
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const u = req.user;
  if (!u) return next(new AppError(401, "Unauthorized"));
  if (u.role !== UserRole.ADMIN) return next(new AppError(403, "Forbidden"));
  next();
}
