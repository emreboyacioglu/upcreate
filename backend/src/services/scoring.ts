import { prisma } from "../config/db";

export function normalizeValue(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

export async function calculateAccountMetrics(accountId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const account = await prisma.socialAccount.findUniqueOrThrow({
    where: { id: accountId },
  });

  let posts = await prisma.contentPost.findMany({
    where: { accountId, postedAt: { gte: thirtyDaysAgo } },
  });

  // Fallback: if no recent posts, use the most recent 20 overall
  if (posts.length === 0) {
    posts = await prisma.contentPost.findMany({
      where: { accountId },
      orderBy: { postedAt: "desc" },
      take: 20,
    });
  }

  if (posts.length === 0) {
    return prisma.accountMetrics.upsert({
      where: { accountId },
      update: {
        avgLikes30d: 0,
        avgComments30d: 0,
        avgViews30d: 0,
        engagementRate: 0,
        calculatedAt: new Date(),
      },
      create: {
        accountId,
        avgLikes30d: 0,
        avgComments30d: 0,
        avgViews30d: 0,
        engagementRate: 0,
      },
    });
  }

  const totalLikes = posts.reduce((sum, p) => sum + p.likes, 0);
  const totalComments = posts.reduce((sum, p) => sum + p.commentsCount, 0);
  const totalViews = posts.reduce((sum, p) => sum + p.views, 0);

  const avgLikes30d = totalLikes / posts.length;
  const avgComments30d = totalComments / posts.length;
  const avgViews30d = totalViews / posts.length;

  const engagementRate =
    account.followerCount > 0 ? (avgLikes30d + avgComments30d) / account.followerCount : 0;

  return prisma.accountMetrics.upsert({
    where: { accountId },
    update: {
      avgLikes30d,
      avgComments30d,
      avgViews30d,
      engagementRate,
      calculatedAt: new Date(),
    },
    create: {
      accountId,
      avgLikes30d,
      avgComments30d,
      avgViews30d,
      engagementRate,
    },
  });
}

export async function calculateCommerceScore(creatorId: string) {
  const accounts = await prisma.socialAccount.findMany({
    where: { creatorId },
  });

  for (const account of accounts) {
    await calculateAccountMetrics(account.id);
  }

  const accountsWithMetrics = await prisma.socialAccount.findMany({
    where: { creatorId },
    include: { metrics: true },
  });

  const totalFollowers = accountsWithMetrics.reduce((sum, a) => sum + a.followerCount, 0);

  let weightedEngagement = 0;
  if (totalFollowers > 0) {
    for (const a of accountsWithMetrics) {
      const rate = a.metrics?.engagementRate ?? 0;
      weightedEngagement += rate * a.followerCount;
    }
    weightedEngagement /= totalFollowers;
  }

  const allMetrics = await prisma.accountMetrics.findMany({
    select: { avgViews30d: true },
  });
  const allViews = allMetrics.map((m) => m.avgViews30d);
  const minViews = Math.min(...allViews, 0);
  const maxViews = Math.max(...allViews, 1);

  const totalAvgViews = accountsWithMetrics.reduce(
    (sum, a) => sum + (a.metrics?.avgViews30d ?? 0),
    0
  );
  const normalizedViews = normalizeValue(totalAvgViews, minViews, maxViews);

  const engagementScore = 0.5 * weightedEngagement + 0.5 * normalizedViews;

  let intentScore = 0;
  const connectedAccounts = accountsWithMetrics.filter((a) => a.isConnected);
  if (connectedAccounts.length > 0) {
    const connectedIds = connectedAccounts.map((a) => a.id);
    const posts = await prisma.contentPost.findMany({
      where: { accountId: { in: connectedIds } },
    });
    const totalComments = posts.reduce((sum, p) => sum + p.commentsCount, 0);
    const totalLikes = posts.reduce((sum, p) => sum + p.likes, 0);
    const totalEngagement = totalComments + totalLikes;
    intentScore = totalEngagement > 0 ? totalComments / totalEngagement : 0;
  }

  const commerceScore = 0.6 * engagementScore + 0.4 * intentScore;

  return prisma.commerceScore.upsert({
    where: { creatorId },
    update: {
      engagementScore,
      intentScore,
      commerceScore,
      calculatedAt: new Date(),
    },
    create: {
      creatorId,
      engagementScore,
      intentScore,
      commerceScore,
    },
  });
}
