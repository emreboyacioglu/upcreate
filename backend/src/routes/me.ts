import { Router } from "express";
import { UserRole } from "@prisma/client";
import { prisma } from "../config/db";
import { authenticateOptional, requireAuth } from "../middleware/auth";
import { dashboardService } from "../business/DashboardService";
import { AppError } from "../middleware/errorHandler";

export const meRouter = Router();

meRouter.use(authenticateOptional);
meRouter.use(requireAuth);

meRouter.get("/dashboard", async (req, res, next) => {
  try {
    const { role, creatorId, brandId } = req.user!;

    if (role === UserRole.ADMIN) {
      const data = await dashboardService.adminDashboard();
      return res.json(data);
    }

    if (role === UserRole.CREATOR) {
      if (!creatorId) throw new AppError(400, "Creator profile not linked");
      const data = await dashboardService.creatorDashboard(creatorId);
      return res.json(data);
    }

    if (role === UserRole.BRAND) {
      if (!brandId) throw new AppError(400, "Brand profile not linked");
      const activeCampaigns = await prisma.campaign.count({ where: { brandId, status: "ACTIVE" } });
      return res.json({ kpis: { activeCampaigns }, message: "Brand dashboard coming soon" });
    }

    throw new AppError(400, "Unknown role");
  } catch (err) {
    next(err);
  }
});

meRouter.get("/campaigns", async (req, res, next) => {
  try {
    const { role, creatorId, brandId } = req.user!;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

    if (role === UserRole.ADMIN) {
      const [data, total] = await Promise.all([
        prisma.campaign.findMany({
          include: { brand: true, _count: { select: { creators: true } } },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.campaign.count(),
      ]);
      return res.json({ data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    }

    if (role === UserRole.CREATOR && creatorId) {
      const where = { creatorId };
      const [pairings, total] = await Promise.all([
        prisma.campaignCreator.findMany({
          where,
          include: {
            campaign: { include: { brand: { select: { id: true, name: true } } } },
            contents: { select: { id: true, status: true } },
            affiliateLinks: { select: { id: true, code: true } },
          },
          orderBy: { invitedAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.campaignCreator.count({ where }),
      ]);
      return res.json({ data: pairings, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    }

    if (role === UserRole.BRAND && brandId) {
      const where = { brandId };
      const [data, total] = await Promise.all([
        prisma.campaign.findMany({
          where,
          include: { brand: true, _count: { select: { creators: true } } },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.campaign.count({ where }),
      ]);
      return res.json({ data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    }

    return res.json({ data: [], meta: { page, limit, total: 0, totalPages: 0 } });
  } catch (err) {
    next(err);
  }
});

meRouter.get("/campaign-creators", async (req, res, next) => {
  try {
    const { role, creatorId } = req.user!;

    if (role !== UserRole.CREATOR && role !== UserRole.ADMIN) {
      throw new AppError(403, "Only creators and admins can access this");
    }

    const where = role === UserRole.ADMIN ? {} : { creatorId: creatorId! };
    const pairings = await prisma.campaignCreator.findMany({
      where,
      include: {
        campaign: { include: { brand: { select: { id: true, name: true } } } },
        creator: { select: { id: true, name: true } },
        contents: { select: { id: true, status: true, submittedAt: true } },
        affiliateLinks: { select: { id: true, code: true, active: true } },
      },
      orderBy: { invitedAt: "desc" },
    });

    return res.json({ data: pairings });
  } catch (err) {
    next(err);
  }
});
