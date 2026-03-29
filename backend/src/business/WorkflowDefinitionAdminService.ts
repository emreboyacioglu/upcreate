import { WorkflowScope } from "@prisma/client";
import { prisma } from "../config/db";
import { AppError } from "../middleware/errorHandler";
import { validateWorkflowPayload } from "./WorkflowEngineService";

export class WorkflowDefinitionAdminService {
  async list(scope?: WorkflowScope) {
    return prisma.workflowDefinition.findMany({
      where: scope ? { scope } : undefined,
      orderBy: [{ scope: "asc" }, { version: "desc" }],
    });
  }

  async getActive(scope: WorkflowScope) {
    const row = await prisma.workflowDefinition.findFirst({
      where: { scope, isActive: true },
      orderBy: { version: "desc" },
    });
    return row;
  }

  /**
   * Create a new version. If setActive, deactivates other rows for this scope and activates this one.
   */
  async createVersion(scope: WorkflowScope, definition: unknown, setActive: boolean) {
    const payload = validateWorkflowPayload(definition);
    const last = await prisma.workflowDefinition.findFirst({
      where: { scope },
      orderBy: { version: "desc" },
    });
    const version = (last?.version ?? 0) + 1;

    if (setActive) {
      await prisma.workflowDefinition.updateMany({
        where: { scope },
        data: { isActive: false },
      });
    }

    return prisma.workflowDefinition.create({
      data: {
        scope,
        version,
        isActive: setActive,
        definition: payload as object,
      },
    });
  }

  async activate(id: string) {
    const row = await prisma.workflowDefinition.findUnique({ where: { id } });
    if (!row) throw new AppError(404, "Workflow definition not found");

    await prisma.workflowDefinition.updateMany({
      where: { scope: row.scope },
      data: { isActive: false },
    });

    return prisma.workflowDefinition.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async delete(id: string) {
    const row = await prisma.workflowDefinition.findUnique({ where: { id } });
    if (!row) throw new AppError(404, "Workflow definition not found");
    if (row.isActive) {
      throw new AppError(400, "Cannot delete active workflow; activate another version first");
    }
    await prisma.workflowDefinition.delete({ where: { id } });
    return { message: "Workflow version deleted" };
  }
}

export const workflowDefinitionAdminService = new WorkflowDefinitionAdminService();
