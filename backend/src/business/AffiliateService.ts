import crypto from "crypto";
import { prisma } from "../config/db";
import { AppError } from "../middleware/errorHandler";
import { campaignService } from "./CampaignService";

function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

export class AffiliateService {
  async createLink(campaignCreatorId: string, destinationUrl: string, code?: string) {
    await campaignService.getCampaignCreator(campaignCreatorId);
    const finalCode =
      code?.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) ||
      crypto.randomBytes(6).toString("hex");

    const existing = await prisma.affiliateLink.findUnique({ where: { code: finalCode } });
    if (existing) throw new AppError(409, "Affiliate code already in use");

    return prisma.affiliateLink.create({
      data: {
        campaignCreatorId,
        code: finalCode,
        destinationUrl,
        active: true,
      },
    });
  }

  async getById(id: string) {
    const link = await prisma.affiliateLink.findUnique({
      where: { id },
      include: { campaignCreator: { include: { campaign: true } } },
    });
    if (!link) throw new AppError(404, "Affiliate link not found");
    return link;
  }

  async getByCode(code: string) {
    const link = await prisma.affiliateLink.findFirst({
      where: { code, active: true },
      include: { campaignCreator: { include: { campaign: true, creator: true } } },
    });
    if (!link) throw new AppError(404, "Affiliate link not found");
    return link;
  }

  async recordClick(code: string, userAgent?: string, ip?: string) {
    const link = await prisma.affiliateLink.findFirst({ where: { code, active: true } });
    if (!link) throw new AppError(404, "Affiliate link not found");

    await prisma.clickEvent.create({
      data: {
        linkId: link.id,
        userAgent: userAgent ?? null,
        ipHash: ip ? hashIp(ip) : null,
      },
    });

    return link;
  }

  async recordConversion(linkId: string, orderId: string, amount: number, currency = "TRY") {
    const link = await prisma.affiliateLink.findUnique({ where: { id: linkId } });
    if (!link) throw new AppError(404, "Affiliate link not found");

    return prisma.conversion.upsert({
      where: { linkId_orderId: { linkId, orderId } },
      create: { linkId, orderId, amount, currency },
      update: { amount, currency, occurredAt: new Date() },
    });
  }

  async platformOverview() {
    const links = await prisma.affiliateLink.findMany({
      include: {
        _count: { select: { clicks: true, conversions: true } },
        conversions: true,
        campaignCreator: {
          include: { campaign: { select: { id: true, title: true } } },
        },
      },
    });

    const byCampaignMap = new Map<
      string,
      { campaignId: string; campaignTitle: string; linkCount: number; clicks: number; conversions: number; revenue: number }
    >();

    let totalClicks = 0;
    let totalConversions = 0;
    let totalRevenue = 0;

    for (const link of links) {
      const clicks = link._count.clicks;
      const convs = link._count.conversions;
      const rev = link.conversions.reduce((s, c) => s + c.amount, 0);

      totalClicks += clicks;
      totalConversions += convs;
      totalRevenue += rev;

      const cId = link.campaignCreator.campaign.id;
      const existing = byCampaignMap.get(cId);
      if (existing) {
        existing.linkCount++;
        existing.clicks += clicks;
        existing.conversions += convs;
        existing.revenue += rev;
      } else {
        byCampaignMap.set(cId, {
          campaignId: cId,
          campaignTitle: link.campaignCreator.campaign.title,
          linkCount: 1,
          clicks,
          conversions: convs,
          revenue: rev,
        });
      }
    }

    return {
      totalLinks: links.length,
      totalClicks,
      totalConversions,
      totalRevenue,
      byCampaign: Array.from(byCampaignMap.values()),
    };
  }

  async summaryForCampaign(campaignId: string) {
    const links = await prisma.affiliateLink.findMany({
      where: { campaignCreator: { campaignId } },
      include: {
        _count: { select: { clicks: true, conversions: true } },
        conversions: true,
      },
    });

    const revenue = links.reduce(
      (sum, l) => sum + l.conversions.reduce((s, c) => s + c.amount, 0),
      0,
    );
    const clicks = links.reduce((sum, l) => sum + l._count.clicks, 0);

    return {
      campaignId,
      linkCount: links.length,
      totalClicks: clicks,
      totalConversions: links.reduce((sum, l) => sum + l._count.conversions, 0),
      revenue,
      links: links.map((l) => ({
        id: l.id,
        code: l.code,
        clicks: l._count.clicks,
        conversions: l._count.conversions,
        revenue: l.conversions.reduce((s, c) => s + c.amount, 0),
      })),
    };
  }
}

export const affiliateService = new AffiliateService();
