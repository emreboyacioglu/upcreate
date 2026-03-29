import { CampaignContentStatus } from "@prisma/client";
import { prisma } from "../config/db";
import { AppError } from "../middleware/errorHandler";
import { campaignService } from "./CampaignService";

export interface SubmitContentInput {
  storageUrl?: string;
  assetKey?: string;
  mimeType?: string;
}

export class ContentService {
  async listByCampaignCreator(campaignCreatorId: string) {
    await campaignService.getCampaignCreator(campaignCreatorId);
    return prisma.campaignContent.findMany({
      where: { campaignCreatorId },
      orderBy: { submittedAt: "desc" },
    });
  }

  async submit(campaignCreatorId: string, input: SubmitContentInput) {
    await campaignService.markContentSubmitted(campaignCreatorId);

    return prisma.campaignContent.create({
      data: {
        campaignCreatorId,
        storageUrl: input.storageUrl,
        assetKey: input.assetKey,
        mimeType: input.mimeType,
        status: CampaignContentStatus.PENDING_BRAND_REVIEW,
      },
    });
  }

  async review(
    contentId: string,
    action: "approve" | "reject" | "revision",
    reviewNote?: string,
  ) {
    const content = await prisma.campaignContent.findUnique({
      where: { id: contentId },
      include: { campaignCreator: true },
    });
    if (!content) throw new AppError(404, "Content submission not found");
    if (content.status !== CampaignContentStatus.PENDING_BRAND_REVIEW) {
      throw new AppError(400, "Content is not pending brand review");
    }

    const ccId = content.campaignCreatorId;

    if (action === "approve") {
      await prisma.campaignContent.update({
        where: { id: contentId },
        data: {
          status: CampaignContentStatus.APPROVED,
          reviewedAt: new Date(),
          reviewNote: reviewNote ?? null,
        },
      });
      await campaignService.markContentApproved(ccId);
      return prisma.campaignContent.findUnique({ where: { id: contentId } });
    }

    if (action === "revision") {
      await prisma.campaignContent.update({
        where: { id: contentId },
        data: {
          status: CampaignContentStatus.REVISION_REQUESTED,
          reviewedAt: new Date(),
          reviewNote: reviewNote ?? null,
        },
      });
      await campaignService.markContentRevisionRequested(ccId);
      return prisma.campaignContent.findUnique({ where: { id: contentId } });
    }

    // reject
    return prisma.campaignContent.update({
      where: { id: contentId },
      data: {
        status: CampaignContentStatus.REJECTED,
        reviewedAt: new Date(),
        reviewNote: reviewNote ?? null,
      },
    });
  }
}

export const contentService = new ContentService();
