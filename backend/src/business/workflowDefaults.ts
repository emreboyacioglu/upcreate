import { CampaignCreatorStatus, CampaignStatus, WorkflowScope } from "@prisma/client";

/** Serializable workflow shape stored in WorkflowDefinition.definition */
export interface WorkflowDefinitionPayload {
  states: string[];
  transitions: Record<string, string[]>;
  layout?: { nodes: unknown[]; edges: unknown[] };
}

export const DEFAULT_CAMPAIGN_WORKFLOW: WorkflowDefinitionPayload = {
  states: Object.values(CampaignStatus),
  transitions: {
    [CampaignStatus.DRAFT]: [CampaignStatus.ACTIVE],
    [CampaignStatus.ACTIVE]: [CampaignStatus.PAUSED, CampaignStatus.COMPLETED, CampaignStatus.CANCELLED],
    [CampaignStatus.PAUSED]: [CampaignStatus.ACTIVE, CampaignStatus.COMPLETED, CampaignStatus.CANCELLED],
    [CampaignStatus.COMPLETED]: [],
    [CampaignStatus.CANCELLED]: [],
  },
};

export const DEFAULT_CAMPAIGN_CREATOR_WORKFLOW: WorkflowDefinitionPayload = {
  states: Object.values(CampaignCreatorStatus),
  transitions: {
    [CampaignCreatorStatus.AWAITING_CREATOR]: [
      CampaignCreatorStatus.CREATOR_DECLINED,
      CampaignCreatorStatus.AWAITING_BRAND,
    ],
    [CampaignCreatorStatus.CREATOR_DECLINED]: [],
    [CampaignCreatorStatus.AWAITING_BRAND]: [
      CampaignCreatorStatus.BRAND_DECLINED,
      CampaignCreatorStatus.MATCHED,
    ],
    [CampaignCreatorStatus.BRAND_DECLINED]: [],
    [CampaignCreatorStatus.MATCHED]: [CampaignCreatorStatus.CONTENT_SUBMITTED],
    [CampaignCreatorStatus.CONTENT_SUBMITTED]: [
      CampaignCreatorStatus.CONTENT_APPROVED,
      CampaignCreatorStatus.CONTENT_REVISION_REQUESTED,
    ],
    [CampaignCreatorStatus.CONTENT_APPROVED]: [CampaignCreatorStatus.PUBLISHED],
    [CampaignCreatorStatus.CONTENT_REVISION_REQUESTED]: [CampaignCreatorStatus.CONTENT_SUBMITTED],
    [CampaignCreatorStatus.PUBLISHED]: [CampaignCreatorStatus.COMPLETED],
    [CampaignCreatorStatus.COMPLETED]: [],
  },
};

/** Brand lifecycle — enum BrandStatus */
export const DEFAULT_BRAND_WORKFLOW: WorkflowDefinitionPayload = {
  states: ["ONBOARDING", "ACTIVE", "SUSPENDED", "CHURNED"],
  transitions: {
    ONBOARDING: ["ACTIVE"],
    ACTIVE: ["SUSPENDED", "CHURNED"],
    SUSPENDED: ["ACTIVE"],
    CHURNED: [],
  },
};

/** Creator lifecycle — enum CreatorLifecycleStatus */
export const DEFAULT_CREATOR_WORKFLOW: WorkflowDefinitionPayload = {
  states: ["PENDING_VERIFICATION", "ACTIVE", "SUSPENDED"],
  transitions: {
    PENDING_VERIFICATION: ["ACTIVE"],
    ACTIVE: ["SUSPENDED"],
    SUSPENDED: ["ACTIVE"],
  },
};

export const DEFAULTS_BY_SCOPE: Record<WorkflowScope, WorkflowDefinitionPayload> = {
  [WorkflowScope.CAMPAIGN]: DEFAULT_CAMPAIGN_WORKFLOW,
  [WorkflowScope.CAMPAIGN_CREATOR]: DEFAULT_CAMPAIGN_CREATOR_WORKFLOW,
  [WorkflowScope.BRAND]: DEFAULT_BRAND_WORKFLOW,
  [WorkflowScope.CREATOR]: DEFAULT_CREATOR_WORKFLOW,
};
