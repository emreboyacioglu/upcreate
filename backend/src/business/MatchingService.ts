import { CreatorScale, Platform } from "@prisma/client";
import { prisma } from "../config/db";
import { AppError } from "../middleware/errorHandler";
import { calculateCommerceScore } from "../services/scoring";

function scaleFromFollowers(totalFollowers: number): CreatorScale {
  if (totalFollowers < 10_000) return CreatorScale.NANO;
  if (totalFollowers < 100_000) return CreatorScale.MICRO;
  return CreatorScale.MID;
}

/** Simple 0–1 fit from brand category vs account content topics (token overlap). */
function topicOverlapScore(brandCategory: string | null | undefined, topics: string[]): number {
  if (!brandCategory || topics.length === 0) return 0.3;
  const cat = brandCategory.toLowerCase().split(/[\s&,]+/).filter(Boolean);
  const topicSet = new Set(topics.map((t) => t.toLowerCase()));
  let hits = 0;
  for (const c of cat) {
    if (topicSet.has(c) || [...topicSet].some((t) => t.includes(c) || c.includes(t))) hits++;
  }
  return Math.min(1, 0.2 + hits * 0.25);
}

export class MatchingService {
  async refreshCreatorIntelligence(creatorId: string) {
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      include: { accounts: { include: { metrics: true, posts: true } } },
    });
    if (!creator) throw new AppError(404, "Creator not found");

    const totalFollowers = creator.accounts.reduce((s, a) => s + a.followerCount, 0);
    const creatorScale = scaleFromFollowers(totalFollowers);

    let lastPostAt: Date | null = null;
    for (const acc of creator.accounts) {
      for (const p of acc.posts) {
        if (p.postedAt && (!lastPostAt || p.postedAt > lastPostAt)) lastPostAt = p.postedAt;
      }
    }

    await prisma.creator.update({
      where: { id: creatorId },
      data: { creatorScale, lastPostAt },
    });

    await calculateCommerceScore(creatorId);
    return prisma.creator.findUnique({
      where: { id: creatorId },
      include: { accounts: { include: { metrics: true } }, commerceScore: true },
    });
  }

  async computeAndStoreBrandCreatorFit(brandId: string, creatorId: string) {
    const [brand, creator] = await Promise.all([
      prisma.brand.findUnique({ where: { id: brandId } }),
      prisma.creator.findUnique({
        where: { id: creatorId },
        include: { accounts: { include: { metrics: true } }, commerceScore: true },
      }),
    ]);
    if (!brand) throw new AppError(404, "Brand not found");
    if (!creator) throw new AppError(404, "Creator not found");

    const allTopics = creator.accounts.flatMap((a) => a.metrics?.contentTopics ?? []);
    const commerce = creator.commerceScore?.commerceScore ?? 0;
    const fitTopics = topicOverlapScore(brand.category, allTopics);
    const score = Math.min(1, fitTopics * 0.5 + commerce * 0.5);

    return prisma.brandCreatorFit.upsert({
      where: { brandId_creatorId: { brandId, creatorId } },
      create: { brandId, creatorId, score },
      update: { score, computedAt: new Date() },
    });
  }

  async suggestions(
    campaignId: string,
    opts: { platform?: Platform; minCommerceScore?: number; limit?: number } = {},
  ) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { brand: true, creators: { select: { creatorId: true } } },
    });
    if (!campaign) throw new AppError(404, "Campaign not found");

    const excludedIds = campaign.creators.map((c) => c.creatorId);
    const limit = Math.min(50, Math.max(1, opts.limit ?? 20));
    const minScore = opts.minCommerceScore ?? 0;

    const creators = await prisma.creator.findMany({
      where: {
        ...(excludedIds.length > 0 ? { id: { notIn: excludedIds } } : {}),
        ...(opts.platform
          ? { accounts: { some: { platform: opts.platform } } }
          : {}),
      },
      include: {
        accounts: { include: { metrics: true } },
        commerceScore: true,
      },
    });

    const scored = await Promise.all(
      creators.map(async (c) => {
        const fit = await this.computeAndStoreBrandCreatorFit(campaign.brandId, c.id);
        const commerce = c.commerceScore?.commerceScore ?? 0;
        if (commerce < minScore) return null;
        return {
          creator: c,
          fitScore: fit.score,
          commerceScore: commerce,
          rank: fit.score * 0.6 + commerce * 0.4,
        };
      }),
    );

    return scored
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.rank - a.rank)
      .slice(0, limit);
  }
}

export const matchingService = new MatchingService();
