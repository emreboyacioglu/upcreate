import { prisma } from "../config/db";
import type { UserRole } from "@prisma/client";

export class DashboardService {
  async adminDashboard() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalCreators,
      totalBrands,
      activeCampaigns,
      totalCampaigns,
      totalClicks,
      pendingReviewCount,
      pendingTransactionCount,
    ] = await Promise.all([
      prisma.creator.count(),
      prisma.brand.count(),
      prisma.campaign.count({ where: { status: "ACTIVE" } }),
      prisma.campaign.count(),
      prisma.clickEvent.count(),
      prisma.campaignContent.count({ where: { status: "PENDING_BRAND_REVIEW" } }),
      prisma.transaction.count({ where: { status: "PENDING" } }),
    ]);

    const revenueAgg = await prisma.conversion.aggregate({ _sum: { amount: true } });
    const totalRevenue = revenueAgg._sum.amount || 0;

    const paidAgg = await prisma.transaction.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true },
    });
    const totalPaid = paidAgg._sum.amount || 0;

    const campaignsByStatus = await prisma.campaign.groupBy({
      by: ["status"],
      _count: true,
    });

    const recentTransactions = await prisma.transaction.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        campaignCreator: {
          include: {
            campaign: { select: { id: true, title: true } },
            creator: { select: { id: true, name: true } },
          },
        },
      },
    });

    const pendingPairings = await prisma.campaignCreator.findMany({
      where: { status: { in: ["AWAITING_CREATOR", "AWAITING_BRAND"] } },
      include: {
        campaign: { select: { id: true, title: true } },
        creator: { select: { id: true, name: true } },
      },
      orderBy: { invitedAt: "desc" },
      take: 20,
    });

    const recentContents = await prisma.campaignContent.findMany({
      take: 10,
      orderBy: { submittedAt: "desc" },
      include: {
        campaignCreator: {
          include: {
            campaign: { select: { id: true, title: true } },
            creator: { select: { id: true, name: true } },
          },
        },
      },
    });

    const topCreators = await prisma.creator.findMany({
      take: 5,
      include: {
        commerceScore: true,
        accounts: { select: { platform: true, followerCount: true } },
      },
      orderBy: { commerceScore: { commerceScore: "desc" } },
    });

    const activeCampaignsList = await prisma.campaign.findMany({
      where: { status: "ACTIVE" },
      include: {
        brand: { select: { id: true, name: true } },
        _count: { select: { creators: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return {
      kpis: {
        totalCreators,
        totalBrands,
        activeCampaigns,
        totalCampaigns,
        totalRevenue,
        totalPaid,
        totalClicks,
        pendingReviewCount,
        pendingTransactionCount,
      },
      campaignsByStatus: campaignsByStatus.map((c) => ({
        status: c.status,
        count: c._count,
      })),
      topCreators: topCreators.map((c) => ({
        id: c.id,
        name: c.name,
        commerceScore: c.commerceScore?.commerceScore ?? 0,
        totalFollowers: c.accounts.reduce((s, a) => s + a.followerCount, 0),
        scale: c.creatorScale,
      })),
      activeCampaignsList: activeCampaignsList.map((c) => ({
        id: c.id,
        title: c.title,
        brand: c.brand,
        budget: c.budget,
        commissionRate: c.commissionRate,
        creatorsCount: c._count.creators,
        startsAt: c.startsAt,
        endsAt: c.endsAt,
      })),
      pendingPairings,
      recentContents,
      recentTransactions,
    };
  }

  async creatorDashboard(creatorId: string) {
    const [activePairings, totalPairings] = await Promise.all([
      prisma.campaignCreator.count({
        where: {
          creatorId,
          status: { notIn: ["CREATOR_DECLINED", "BRAND_DECLINED", "COMPLETED"] },
        },
      }),
      prisma.campaignCreator.count({ where: { creatorId } }),
    ]);

    const earningsAgg = await prisma.transaction.aggregate({
      where: { campaignCreator: { creatorId }, status: "PAID" },
      _sum: { amount: true },
    });
    const totalEarnings = earningsAgg._sum.amount || 0;

    const pendingAgg = await prisma.transaction.aggregate({
      where: { campaignCreator: { creatorId }, status: { in: ["PENDING", "APPROVED"] } },
      _sum: { amount: true },
    });
    const pendingPayments = pendingAgg._sum.amount || 0;

    const contentSubmittedCount = await prisma.campaignContent.count({
      where: { campaignCreator: { creatorId } },
    });

    const myPairings = await prisma.campaignCreator.findMany({
      where: { creatorId },
      include: {
        campaign: {
          include: { brand: { select: { id: true, name: true } } },
        },
      },
      orderBy: { invitedAt: "desc" },
      take: 20,
    });

    const recentTransactions = await prisma.transaction.findMany({
      where: { campaignCreator: { creatorId } },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        campaignCreator: {
          include: { campaign: { select: { id: true, title: true } } },
        },
      },
    });

    return {
      kpis: {
        activeCampaigns: activePairings,
        totalCampaigns: totalPairings,
        totalEarnings,
        pendingPayments,
        contentSubmittedCount,
      },
      myPairings,
      recentTransactions,
    };
  }
}

export const dashboardService = new DashboardService();
