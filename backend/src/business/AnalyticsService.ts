import { prisma } from "../config/db";
import { affiliateService } from "./AffiliateService";

interface DateRange {
  from?: Date;
  to?: Date;
}

export class AnalyticsService {
  async overview() {
    const [totalCreators, totalBrands, totalCampaigns, totalAccounts] = await Promise.all([
      prisma.creator.count(),
      prisma.brand.count(),
      prisma.campaign.count(),
      prisma.socialAccount.count(),
    ]);

    const campaignsByStatus = await prisma.campaign.groupBy({
      by: ["status"],
      _count: true,
    });

    const transactionStats = await prisma.transaction.aggregate({
      _sum: { amount: true },
      _count: true,
    });

    const transactionsByStatus = await prisma.transaction.groupBy({
      by: ["status"],
      _sum: { amount: true },
      _count: true,
    });

    return {
      totals: {
        creators: totalCreators,
        brands: totalBrands,
        campaigns: totalCampaigns,
        socialAccounts: totalAccounts,
      },
      campaignsByStatus: campaignsByStatus.map((c) => ({ status: c.status, count: c._count })),
      transactions: {
        totalAmount: transactionStats._sum.amount || 0,
        totalCount: transactionStats._count,
        byStatus: transactionsByStatus.map((t) => ({
          status: t.status,
          amount: t._sum.amount || 0,
          count: t._count,
        })),
      },
    };
  }

  async topCreators(limit: number = 10) {
    return prisma.creator.findMany({
      include: {
        accounts: { include: { metrics: true } },
        commerceScore: true,
      },
      orderBy: { commerceScore: { commerceScore: "desc" } },
      take: limit,
    });
  }

  async campaignPerformance(campaignId: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        brand: true,
        creators: {
          include: {
            creator: { include: { accounts: { include: { metrics: true } }, commerceScore: true } },
            transactions: true,
          },
        },
      },
    });

    if (!campaign) return null;

    const totalSpent = campaign.creators.reduce((sum, cc) => {
      return (
        sum +
        cc.transactions
          .filter((t) => t.status === "PAID" || t.status === "APPROVED")
          .reduce((s, t) => s + t.amount, 0)
      );
    }, 0);

    const totalPending = campaign.creators.reduce((sum, cc) => {
      return (
        sum +
        cc.transactions
          .filter((t) => t.status === "PENDING")
          .reduce((s, t) => s + t.amount, 0)
      );
    }, 0);

    return {
      campaign,
      metrics: {
        creatorsCount: campaign.creators.length,
        totalSpent,
        totalPending,
        budgetRemaining: (campaign.budget || 0) - totalSpent,
      },
    };
  }

  async creatorEarnings(creatorId: string, range?: DateRange) {
    const where: any = {
      campaignCreator: { creatorId },
    };
    if (range?.from || range?.to) {
      where.createdAt = {};
      if (range.from) where.createdAt.gte = range.from;
      if (range.to) where.createdAt.lte = range.to;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        campaignCreator: {
          include: {
            campaign: {
              select: { id: true, title: true, brand: { select: { id: true, name: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalEarned = transactions
      .filter((t) => t.status === "PAID")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPending = transactions
      .filter((t) => t.status === "PENDING" || t.status === "APPROVED")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      transactions,
      summary: { totalEarned, totalPending, transactionCount: transactions.length },
    };
  }

  async brandSpending(brandId: string) {
    const campaigns = await prisma.campaign.findMany({
      where: { brandId },
      include: {
        creators: {
          include: { transactions: true },
        },
      },
    });

    const totalSpent = campaigns.reduce((sum, c) => {
      return (
        sum +
        c.creators.reduce((s, cc) => {
          return (
            s +
            cc.transactions
              .filter((t) => t.status === "PAID")
              .reduce((ts, t) => ts + t.amount, 0)
          );
        }, 0)
      );
    }, 0);

    const campaignSummaries = campaigns.map((c) => {
      const spent = c.creators.reduce((s, cc) => {
        return (
          s +
          cc.transactions
            .filter((t) => t.status === "PAID" || t.status === "APPROVED")
            .reduce((ts, t) => ts + t.amount, 0)
        );
      }, 0);
      return { id: c.id, title: c.title, status: c.status, budget: c.budget, spent };
    });

    return { totalSpent, campaigns: campaignSummaries };
  }

  async affiliateCampaignSummary(campaignId: string) {
    return affiliateService.summaryForCampaign(campaignId);
  }
}

export const analyticsService = new AnalyticsService();
