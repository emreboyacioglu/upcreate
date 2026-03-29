import { WorkflowScope } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../config/db";
import { AppError } from "../middleware/errorHandler";
import { DEFAULTS_BY_SCOPE, type WorkflowDefinitionPayload } from "./workflowDefaults";

const workflowPayloadSchema = z.object({
  states: z.array(z.string().min(1)),
  transitions: z.record(z.string(), z.array(z.string())),
  layout: z
    .object({
      nodes: z.array(z.unknown()),
      edges: z.array(z.unknown()),
    })
    .optional(),
});

export function validateWorkflowPayload(raw: unknown): WorkflowDefinitionPayload {
  const parsed = workflowPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    throw new AppError(400, `Invalid workflow definition: ${parsed.error.message}`);
  }
  const def = parsed.data;
  const stateSet = new Set(def.states);
  for (const [from, targets] of Object.entries(def.transitions)) {
    if (!stateSet.has(from)) {
      throw new AppError(400, `Transition key "${from}" is not in states list`);
    }
    for (const t of targets) {
      if (!stateSet.has(t)) {
        throw new AppError(400, `Invalid transition target "${t}" from "${from}"`);
      }
    }
  }
  return def as WorkflowDefinitionPayload;
}

export class WorkflowEngineService {
  async getDefinition(scope: WorkflowScope): Promise<WorkflowDefinitionPayload> {
    const row = await prisma.workflowDefinition.findFirst({
      where: { scope, isActive: true },
      orderBy: { version: "desc" },
    });
    if (row?.definition) {
      try {
        return validateWorkflowPayload(row.definition);
      } catch {
        /* fall through to default */
      }
    }
    return DEFAULTS_BY_SCOPE[scope];
  }

  canTransition(scope: WorkflowScope, from: string, to: string, def?: WorkflowDefinitionPayload): boolean {
    const d = def ?? DEFAULTS_BY_SCOPE[scope];
    const allowed = d.transitions[from];
    return Array.isArray(allowed) && allowed.includes(to);
  }

  async assertTransition(scope: WorkflowScope, from: string, to: string): Promise<void> {
    const def = await this.getDefinition(scope);
    if (from === to) return;
    if (!this.canTransition(scope, from, to, def)) {
      const allowed = def.transitions[from] ?? [];
      throw new AppError(
        400,
        `Invalid workflow transition (${scope}): ${from} → ${to}. Allowed: ${allowed.join(", ") || "none"}`,
      );
    }
  }
}

export const workflowEngineService = new WorkflowEngineService();
