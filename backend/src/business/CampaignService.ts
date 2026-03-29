import { CampaignCreatorStatus, CampaignStatus, WorkflowScope } from "@prisma/client";
import { prisma } from "../config/db";
import { AppError } from "../middleware/errorHandler";
import { workflowEngineService } from "./WorkflowEngineService";

export interface CreateCampaignInput {
  brandId: string;
  title: string;
  budget?: number;
  brief?: string;
  productInfo?: string;
  commissionRate?: number;
  startsAt?: Date;
  endsAt?: Date;
}

export interface ListCampaignsOptions {
  page?: number;
  limit?: number;
  status?: string;
  brandId?: string;
}

export class CampaignService {
  async list(options: ListCampaignsOptions = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));

    const where: Record<string, unknown> = {};
    if (options.status && Object.values(CampaignStatus).includes(options.status as CampaignStatus)) {
      where.status = options.status;
    }
    if (options.brandId) {
      where.brandId = options.brandId;
    }

    const [data, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        include: { brand: true, creators: { include: { creator: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.campaign.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        brand: true,
        creators: {
          include: {
            creator: { include: { accounts: { include: { metrics: true } }, commerceScore: true } },
            transactions: true,
            contents: true,
            affiliateLinks: true,
          },
        },
      },
    });
    if (!campaign) throw new AppError(404, "Campaign not found");
    return campaign;
  }

  async create(input: CreateCampaignInput) {
    const brand = await prisma.brand.findUnique({ where: { id: input.brandId } });
    if (!brand) throw new AppError(404, "Brand not found");

    return prisma.campaign.create({
      data: input,
      include: { brand: true },
    });
  }

  async update(id: string, input: Partial<CreateCampaignInput>) {
    await this.assertExists(id);
    return prisma.campaign.update({
      where: { id },
      data: input,
      include: { brand: true },
    });
  }

  async delete(id: string) {
    await this.assertExists(id);
    await prisma.campaign.delete({ where: { id } });
    return { message: "Campaign deleted" };
  }

  async transitionStatus(id: string, newStatus: CampaignStatus) {
    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) throw new AppError(404, "Campaign not found");

    await workflowEngineService.assertTransition(
      WorkflowScope.CAMPAIGN,
      campaign.status,
      newStatus,
    );

    return prisma.campaign.update({
      where: { id },
      data: { status: newStatus },
      include: { brand: true },
    });
  }

  /**
   * Admin recommends a creator (pairing_first). Campaign must be ACTIVE.
   * Backward compatible alias: inviteCreator.
   */
  async recommendCreator(campaignId: string, creatorId: string) {
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new AppError(404, "Campaign not found");
    if (campaign.status !== CampaignStatus.ACTIVE) {
      throw new AppError(400, "Can only recommend creators when campaign is ACTIVE");
    }

    const creator = await prisma.creator.findUnique({ where: { id: creatorId } });
    if (!creator) throw new AppError(404, "Creator not found");

    const existing = await prisma.campaignCreator.findUnique({
      where: { campaignId_creatorId: { campaignId, creatorId } },
    });
    if (existing) throw new AppError(409, "Creator already paired with this campaign");

    return prisma.campaignCreator.create({
      data: {
        campaignId,
        creatorId,
        status: CampaignCreatorStatus.AWAITING_CREATOR,
      },
      include: { creator: true, campaign: true },
    });
  }

  async inviteCreator(campaignId: string, creatorId: string) {
    return this.recommendCreator(campaignId, creatorId);
  }

  async getCampaignCreator(id: string) {
    const row = await prisma.campaignCreator.findUnique({
      where: { id },
      include: { campaign: true, creator: true },
    });
    if (!row) throw new AppError(404, "Campaign creator pairing not found");
    return row;
  }

  private async assertCcTransition(current: CampaignCreatorStatus, next: CampaignCreatorStatus) {
    await workflowEngineService.assertTransition(WorkflowScope.CAMPAIGN_CREATOR, current, next);
  }

  async creatorRespond(campaignCreatorId: string, accept: boolean) {
    const cc = await this.getCampaignCreator(campaignCreatorId);
    if (cc.status !== CampaignCreatorStatus.AWAITING_CREATOR) {
      throw new AppError(400, "Creator decision only allowed in AWAITING_CREATOR");
    }
    const next = accept ? CampaignCreatorStatus.AWAITING_BRAND : CampaignCreatorStatus.CREATOR_DECLINED;
    await this.assertCcTransition(cc.status, next);

    return prisma.campaignCreator.update({
      where: { id: campaignCreatorId },
      data: {
        status: next,
        respondedAt: new Date(),
      },
      include: { creator: true, campaign: { include: { brand: true } } },
    });
  }

  async brandRespond(campaignCreatorId: string, accept: boolean) {
    const cc = await this.getCampaignCreator(campaignCreatorId);
    if (cc.status !== CampaignCreatorStatus.AWAITING_BRAND) {
      throw new AppError(400, "Brand decision only allowed in AWAITING_BRAND");
    }
    const next = accept ? CampaignCreatorStatus.MATCHED : CampaignCreatorStatus.BRAND_DECLINED;
    await this.assertCcTransition(cc.status, next);

    return prisma.campaignCreator.update({
      where: { id: campaignCreatorId },
      data: { status: next, respondedAt: new Date() },
      include: { creator: true, campaign: { include: { brand: true } } },
    });
  }

  /** After content approved — mark as published. */
  async publishPairing(campaignCreatorId: string) {
    const cc = await this.getCampaignCreator(campaignCreatorId);
    await this.assertCcTransition(cc.status, CampaignCreatorStatus.PUBLISHED);
    return prisma.campaignCreator.update({
      where: { id: campaignCreatorId },
      data: { status: CampaignCreatorStatus.PUBLISHED },
      include: { creator: true, campaign: true },
    });
  }

  async completePairing(campaignCreatorId: string) {
    const cc = await this.getCampaignCreator(campaignCreatorId);
    await this.assertCcTransition(cc.status, CampaignCreatorStatus.COMPLETED);
    return prisma.campaignCreator.update({
      where: { id: campaignCreatorId },
      data: { status: CampaignCreatorStatus.COMPLETED },
      include: { creator: true, campaign: true },
    });
  }

  /** Internal: move CC to CONTENT_SUBMITTED when creator submits content. */
  async markContentSubmitted(campaignCreatorId: string) {
    const cc = await this.getCampaignCreator(campaignCreatorId);
    if (
      cc.status !== CampaignCreatorStatus.MATCHED &&
      cc.status !== CampaignCreatorStatus.CONTENT_REVISION_REQUESTED &&
      cc.status !== CampaignCreatorStatus.CONTENT_SUBMITTED
    ) {
      throw new AppError(400, "Cannot submit content in current pairing status");
    }
    if (cc.status === CampaignCreatorStatus.CONTENT_SUBMITTED) {
      return cc;
    }
    await this.assertCcTransition(cc.status, CampaignCreatorStatus.CONTENT_SUBMITTED);
    return prisma.campaignCreator.update({
      where: { id: campaignCreatorId },
      data: { status: CampaignCreatorStatus.CONTENT_SUBMITTED },
      include: { creator: true, campaign: true },
    });
  }

  async markContentApproved(campaignCreatorId: string) {
    const cc = await this.getCampaignCreator(campaignCreatorId);
    await this.assertCcTransition(cc.status, CampaignCreatorStatus.CONTENT_APPROVED);
    return prisma.campaignCreator.update({
      where: { id: campaignCreatorId },
      data: { status: CampaignCreatorStatus.CONTENT_APPROVED },
      include: { creator: true, campaign: true },
    });
  }

  async markContentRevisionRequested(campaignCreatorId: string) {
    const cc = await this.getCampaignCreator(campaignCreatorId);
    await this.assertCcTransition(cc.status, CampaignCreatorStatus.CONTENT_REVISION_REQUESTED);
    return prisma.campaignCreator.update({
      where: { id: campaignCreatorId },
      data: { status: CampaignCreatorStatus.CONTENT_REVISION_REQUESTED },
      include: { creator: true, campaign: true },
    });
  }

  private async assertExists(id: string) {
    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) throw new AppError(404, "Campaign not found");
    return campaign;
  }
}

export const campaignService = new CampaignService();
