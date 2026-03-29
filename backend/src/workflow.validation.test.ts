import { describe, it, expect } from "vitest";
import { validateWorkflowPayload, workflowEngineService } from "./business/WorkflowEngineService";
import { AppError } from "./middleware/errorHandler";
import { WorkflowScope } from "@prisma/client";

describe("validateWorkflowPayload", () => {
  it("accepts valid transitions referencing only declared states", () => {
    const def = validateWorkflowPayload({
      states: ["A", "B"],
      transitions: { A: ["B"], B: [] },
    });
    expect(def.states).toEqual(["A", "B"]);
  });

  it("rejects transition from unknown state", () => {
    expect(() =>
      validateWorkflowPayload({
        states: ["A"],
        transitions: { B: ["A"] },
      }),
    ).toThrow(AppError);
  });

  it("rejects transition to unknown state", () => {
    expect(() =>
      validateWorkflowPayload({
        states: ["A", "B"],
        transitions: { A: ["C"] },
      }),
    ).toThrow(AppError);
  });
});

describe("workflowEngineService.canTransition", () => {
  it("allows DRAFT -> ACTIVE for default campaign workflow", () => {
    const ok = workflowEngineService.canTransition(WorkflowScope.CAMPAIGN, "DRAFT", "ACTIVE");
    expect(ok).toBe(true);
  });

  it("disallows invalid campaign jump", () => {
    const ok = workflowEngineService.canTransition(WorkflowScope.CAMPAIGN, "DRAFT", "COMPLETED");
    expect(ok).toBe(false);
  });
});
