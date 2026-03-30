import { CreatorScale, Platform } from "@prisma/client";
import { prisma } from "../config/db";
import { AppError } from "../middleware/errorHandler";
import { calculateAccountMetrics, normalizeValue } from "./scoring";

// --- Types ---

type EngagementLabel = "LOW" | "AVERAGE" | "GOOD" | "EXCELLENT";
type ReachLabel = "MINIMAL" | "LOW" | "MEDIUM" | "HIGH";
type ActivityLabel = "INACTIVE" | "LOW" | "MODERATE" | "ACTIVE" | "VERY_ACTIVE";

export interface PlatformScore {
  platform: Platform;
  engagementScore: number;
  intentScore: number;
  platformScore: number;
}

export interface CommerceScoreResult {
  score: number;
  engagementScore: number;
  intentScore: number;
  byPlatform: PlatformScore[];
}

export interface EngagementResult {
  rate: number;
  label: EngagementLabel;
}

export interface ReachResult {
  avgViews: number;
  normalized: number;
  label: ReachLabel;
}

export interface ActivityResult {
  lastPostAt: Date | null;
  postsLast30d: number;
  avgDaysBetweenPosts: number | null;
  label: ActivityLabel;
}

export interface AudienceOverview {
  countries: Record<string, number>;
  ageRanges: Record<string, number>;
  genderSplit: Record<string, number>;
}

export interface RecentContentItem {
  id: string;
  caption: string | null;
  likes: number;
  commentsCount: number;
  views: number;
  postedAt: Date | null;
  mediaType: string | null;
  platform: Platform;
}

export interface IntelligenceProfile {
  creatorId: string;
  commerceScore: CommerceScoreResult;
  engagementQuality: EngagementResult;
  reachPotential: ReachResult;
  creatorScale: CreatorScale | null;
  creatorActivity: ActivityResult;
  recentContent: RecentContentItem[];
  audienceOverview: AudienceOverview | null;
  computedAt: Date;
}

// --- Label helpers ---

function engagementLabel(rate: number): EngagementLabel {
  if (rate > 0.06) return "EXCELLENT";
  if (rate > 0.03) return "GOOD";
  if (rate > 0.01) return "AVERAGE";
  return "LOW";
}

function reachLabel(avgViews: number): ReachLabel {
  if (avgViews > 50_000) return "HIGH";
  if (avgViews > 10_000) return "MEDIUM";
  if (avgViews > 1_000) return "LOW";
  return "MINIMAL";
}

function activityLabel(postsLast30d: number, lastPostAt: Date | null): ActivityLabel {
  if (postsLast30d === 0) {
    if (!lastPostAt) return "INACTIVE";
    const daysSinceLastPost = (Date.now() - lastPostAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceLastPost > 60 ? "INACTIVE" : "LOW";
  }
  if (postsLast30d >= 8) return "VERY_ACTIVE";
  if (postsLast30d >= 4) return "ACTIVE";
  if (postsLast30d >= 2) return "MODERATE";
  return "LOW";
}

function scaleFromFollowers(totalFollowers: number): CreatorScale {
  if (totalFollowers < 10_000) return CreatorScale.NANO;
  if (totalFollowers < 100_000) return CreatorScale.MICRO;
  return CreatorScale.MID;
}

// --- Service ---

export class IntelligenceService {
  /** Compute commerce score per-platform, then average */
  async computeCommerceScore(creatorId: string): Promise<CommerceScoreResult> {
    const accounts = await prisma.socialAccount.findMany({ where: { creatorId } });

    // Refresh account metrics first
    for (const account of accounts) {
      await calculateAccountMetrics(account.id);
    }

    const accountsWithMetrics = await prisma.socialAccount.findMany({
      where: { creatorId },
      include: { metrics: true, posts: true },
    });

    // Global view normalization bounds
    const allMetrics = await prisma.accountMetrics.findMany({ select: { avgViews30d: true } });
    const allViews = allMetrics.map((m) => m.avgViews30d);
    const minViews = Math.min(...allViews, 0);
    const maxViews = Math.max(...allViews, 1);

    // Group accounts by platform
    const byPlatform = new Map<Platform, typeof accountsWithMetrics>();
    for (const acc of accountsWithMetrics) {
      const list = byPlatform.get(acc.platform) ?? [];
      list.push(acc);
      byPlatform.set(acc.platform, list);
    }

    const platformScores: PlatformScore[] = [];

    for (const [platform, platformAccounts] of byPlatform) {
      const totalFollowers = platformAccounts.reduce((s, a) => s + a.followerCount, 0);

      // Weighted engagement rate across accounts on this platform
      let engagementRate = 0;
      if (totalFollowers > 0) {
        for (const a of platformAccounts) {
          const rate = a.metrics?.engagementRate ?? 0;
          engagementRate += rate * a.followerCount;
        }
        engagementRate /= totalFollowers;
      }

      // Normalized views for this platform
      const platformAvgViews = platformAccounts.reduce(
        (s, a) => s + (a.metrics?.avgViews30d ?? 0),
        0,
      );
      const normalizedViews = normalizeValue(platformAvgViews, minViews, maxViews);

      // Step 1: Engagement Score
      const engagementScore = 0.5 * engagementRate + 0.5 * normalizedViews;

      // Step 2: Intent Score (comment ratio as proxy — keyword-based is optional in MVP)
      let intentScore = 0;
      const connectedAccounts = platformAccounts.filter((a) => a.isConnected);
      if (connectedAccounts.length > 0) {
        const posts = connectedAccounts.flatMap((a) => a.posts);
        const totalComments = posts.reduce((s, p) => s + p.commentsCount, 0);
        const totalLikes = posts.reduce((s, p) => s + p.likes, 0);
        const totalEngagement = totalComments + totalLikes;
        intentScore = totalEngagement > 0 ? totalComments / totalEngagement : 0;
      }

      // Step 3: Platform Score
      const platformScore = 0.6 * engagementScore + 0.4 * intentScore;

      platformScores.push({ platform, engagementScore, intentScore, platformScore });
    }

    // Step 4: Final Commerce Score = average of platform scores
    const finalScore =
      platformScores.length > 0
        ? platformScores.reduce((s, p) => s + p.platformScore, 0) / platformScores.length
        : 0;

    const avgEngagement =
      platformScores.length > 0
        ? platformScores.reduce((s, p) => s + p.engagementScore, 0) / platformScores.length
        : 0;

    const avgIntent =
      platformScores.length > 0
        ? platformScores.reduce((s, p) => s + p.intentScore, 0) / platformScores.length
        : 0;

    // Persist
    await prisma.commerceScore.upsert({
      where: { creatorId },
      update: {
        engagementScore: avgEngagement,
        intentScore: avgIntent,
        commerceScore: finalScore,
        calculatedAt: new Date(),
      },
      create: {
        creatorId,
        engagementScore: avgEngagement,
        intentScore: avgIntent,
        commerceScore: finalScore,
      },
    });

    return { score: finalScore, engagementScore: avgEngagement, intentScore: avgIntent, byPlatform: platformScores };
  }

  /** Compute engagement quality from weighted engagement rate */
  async computeEngagementQuality(creatorId: string): Promise<EngagementResult> {
    const accounts = await prisma.socialAccount.findMany({
      where: { creatorId },
      include: { metrics: true },
    });

    const totalFollowers = accounts.reduce((s, a) => s + a.followerCount, 0);
    let rate = 0;
    if (totalFollowers > 0) {
      for (const a of accounts) {
        rate += (a.metrics?.engagementRate ?? 0) * a.followerCount;
      }
      rate /= totalFollowers;
    }

    return { rate, label: engagementLabel(rate) };
  }

  /** Compute reach potential from average views */
  async computeReachPotential(creatorId: string): Promise<ReachResult> {
    const accounts = await prisma.socialAccount.findMany({
      where: { creatorId },
      include: { metrics: true },
    });

    const avgViews = accounts.reduce((s, a) => s + (a.metrics?.avgViews30d ?? 0), 0);

    const allMetrics = await prisma.accountMetrics.findMany({ select: { avgViews30d: true } });
    const allV = allMetrics.map((m) => m.avgViews30d);
    const normalized = normalizeValue(avgViews, Math.min(...allV, 0), Math.max(...allV, 1));

    return { avgViews, normalized, label: reachLabel(avgViews) };
  }

  /** Compute and persist creator scale */
  async computeCreatorScale(creatorId: string): Promise<CreatorScale> {
    const accounts = await prisma.socialAccount.findMany({ where: { creatorId } });
    const totalFollowers = accounts.reduce((s, a) => s + a.followerCount, 0);
    const scale = scaleFromFollowers(totalFollowers);

    await prisma.creator.update({
      where: { id: creatorId },
      data: { creatorScale: scale },
    });

    return scale;
  }

  /** Compute creator activity metrics */
  async computeCreatorActivity(creatorId: string): Promise<ActivityResult> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const accounts = await prisma.socialAccount.findMany({
      where: { creatorId },
      include: {
        posts: {
          where: { postedAt: { gte: thirtyDaysAgo } },
          orderBy: { postedAt: "desc" },
        },
      },
    });

    const recentPosts = accounts.flatMap((a) => a.posts);
    const postsLast30d = recentPosts.length;

    // Find overall last post
    const allPosts = await prisma.contentPost.findMany({
      where: { account: { creatorId } },
      orderBy: { postedAt: "desc" },
      take: 1,
      select: { postedAt: true },
    });
    const lastPostAt = allPosts[0]?.postedAt ?? null;

    // Avg days between posts
    let avgDaysBetweenPosts: number | null = null;
    if (postsLast30d >= 2) {
      const sorted = recentPosts
        .filter((p) => p.postedAt)
        .sort((a, b) => (a.postedAt!.getTime() - b.postedAt!.getTime()));
      let totalGap = 0;
      for (let i = 1; i < sorted.length; i++) {
        totalGap += (sorted[i].postedAt!.getTime() - sorted[i - 1].postedAt!.getTime()) / (1000 * 60 * 60 * 24);
      }
      avgDaysBetweenPosts = Math.round((totalGap / (sorted.length - 1)) * 10) / 10;
    }

    // Persist lastPostAt
    if (lastPostAt) {
      await prisma.creator.update({
        where: { id: creatorId },
        data: { lastPostAt },
      });
    }

    return {
      lastPostAt,
      postsLast30d,
      avgDaysBetweenPosts,
      label: activityLabel(postsLast30d, lastPostAt),
    };
  }

  /** Parse audience data from Creator.audienceJson */
  async parseAudienceData(creatorId: string): Promise<AudienceOverview | null> {
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      select: { audienceJson: true },
    });

    if (!creator?.audienceJson) return null;

    try {
      const data = typeof creator.audienceJson === "string"
        ? JSON.parse(creator.audienceJson)
        : creator.audienceJson;

      return {
        countries: data.countries ?? {},
        ageRanges: data.ageRanges ?? data.age_ranges ?? {},
        genderSplit: data.genderSplit ?? data.gender_split ?? {},
      };
    } catch {
      return null;
    }
  }

  /** Get recent content posts */
  async getRecentContent(creatorId: string, limit = 10): Promise<RecentContentItem[]> {
    const posts = await prisma.contentPost.findMany({
      where: { account: { creatorId } },
      orderBy: { postedAt: "desc" },
      take: limit,
      include: { account: { select: { platform: true } } },
    });

    return posts.map((p) => ({
      id: p.id,
      caption: p.caption,
      likes: p.likes,
      commentsCount: p.commentsCount,
      views: p.views,
      postedAt: p.postedAt,
      mediaType: p.mediaType,
      platform: p.account.platform,
    }));
  }

  /** Save/update audience JSON */
  async saveAudienceData(creatorId: string, audienceJson: string) {
    // Validate it's valid JSON
    try {
      JSON.parse(audienceJson);
    } catch {
      throw new AppError(400, "Invalid audience JSON");
    }

    return prisma.creator.update({
      where: { id: creatorId },
      data: { audienceJson },
    });
  }

  /** Compute ALL intelligence and return full profile */
  async computeAll(creatorId: string): Promise<IntelligenceProfile> {
    const creator = await prisma.creator.findUnique({ where: { id: creatorId } });
    if (!creator) throw new AppError(404, "Creator not found");

    const [commerceScore, engagementQuality, reachPotential, creatorScale, creatorActivity, recentContent, audienceOverview] =
      await Promise.all([
        this.computeCommerceScore(creatorId),
        this.computeEngagementQuality(creatorId),
        this.computeReachPotential(creatorId),
        this.computeCreatorScale(creatorId),
        this.computeCreatorActivity(creatorId),
        this.getRecentContent(creatorId),
        this.parseAudienceData(creatorId),
      ]);

    return {
      creatorId,
      commerceScore,
      engagementQuality,
      reachPotential,
      creatorScale,
      creatorActivity,
      recentContent,
      audienceOverview,
      computedAt: new Date(),
    };
  }

  /** Get intelligence profile (read from DB, no recompute) */
  async getIntelligenceProfile(creatorId: string): Promise<IntelligenceProfile> {
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      include: {
        accounts: { include: { metrics: true, posts: { orderBy: { postedAt: "desc" }, take: 10 } } },
        commerceScore: true,
      },
    });
    if (!creator) throw new AppError(404, "Creator not found");

    const totalFollowers = creator.accounts.reduce((s, a) => s + a.followerCount, 0);

    // Engagement quality from stored metrics
    let engRate = 0;
    if (totalFollowers > 0) {
      for (const a of creator.accounts) {
        engRate += (a.metrics?.engagementRate ?? 0) * a.followerCount;
      }
      engRate /= totalFollowers;
    }

    // Reach from stored metrics
    const avgViews = creator.accounts.reduce((s, a) => s + (a.metrics?.avgViews30d ?? 0), 0);

    // Activity from stored posts
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentPostsCount = creator.accounts.reduce(
      (s, a) => s + a.posts.filter((p) => p.postedAt && p.postedAt >= thirtyDaysAgo).length,
      0,
    );

    // Recent content
    const allPosts = creator.accounts
      .flatMap((a) => a.posts.map((p) => ({ ...p, platform: a.platform })))
      .sort((a, b) => (b.postedAt?.getTime() ?? 0) - (a.postedAt?.getTime() ?? 0))
      .slice(0, 10);

    // Audience
    let audienceOverview: AudienceOverview | null = null;
    if (creator.audienceJson) {
      try {
        const data = typeof creator.audienceJson === "string"
          ? JSON.parse(creator.audienceJson)
          : creator.audienceJson;
        audienceOverview = {
          countries: data.countries ?? {},
          ageRanges: data.ageRanges ?? data.age_ranges ?? {},
          genderSplit: data.genderSplit ?? data.gender_split ?? {},
        };
      } catch { /* ignore */ }
    }

    // Platform-level commerce breakdown
    const byPlatformMap = new Map<Platform, { engRate: number; views: number; followers: number }>();
    for (const a of creator.accounts) {
      const existing = byPlatformMap.get(a.platform);
      if (existing) {
        existing.engRate += (a.metrics?.engagementRate ?? 0) * a.followerCount;
        existing.views += a.metrics?.avgViews30d ?? 0;
        existing.followers += a.followerCount;
      } else {
        byPlatformMap.set(a.platform, {
          engRate: (a.metrics?.engagementRate ?? 0) * a.followerCount,
          views: a.metrics?.avgViews30d ?? 0,
          followers: a.followerCount,
        });
      }
    }

    return {
      creatorId,
      commerceScore: {
        score: creator.commerceScore?.commerceScore ?? 0,
        engagementScore: creator.commerceScore?.engagementScore ?? 0,
        intentScore: creator.commerceScore?.intentScore ?? 0,
        byPlatform: [],
      },
      engagementQuality: { rate: engRate, label: engagementLabel(engRate) },
      reachPotential: { avgViews, normalized: 0, label: reachLabel(avgViews) },
      creatorScale: creator.creatorScale,
      creatorActivity: {
        lastPostAt: creator.lastPostAt,
        postsLast30d: recentPostsCount,
        avgDaysBetweenPosts: null,
        label: activityLabel(recentPostsCount, creator.lastPostAt),
      },
      recentContent: allPosts.map((p) => ({
        id: p.id,
        caption: p.caption,
        likes: p.likes,
        commentsCount: p.commentsCount,
        views: p.views,
        postedAt: p.postedAt,
        mediaType: p.mediaType,
        platform: p.platform,
      })),
      audienceOverview,
      computedAt: creator.commerceScore?.calculatedAt ?? new Date(),
    };
  }
}

export const intelligenceService = new IntelligenceService();
