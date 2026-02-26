import { describe, expect, it } from "vitest";
import {
  getUnsupportedContextSemantics,
  modelSupportsPreviousResponseId,
} from "./openresponses-http.js";

describe("openresponses context semantics policy", () => {
  it("allows previous_response_id for openclaw models", () => {
    const unsupported = getUnsupportedContextSemantics(
      {
        model: "openclaw",
        input: "hello",
        previous_response_id: "resp_123",
      },
      "openclaw",
    );

    expect(unsupported).toEqual([]);
  });

  it("rejects previous_response_id for non-openclaw models", () => {
    const unsupported = getUnsupportedContextSemantics(
      {
        model: "gpt-4o",
        input: "hello",
        previous_response_id: "resp_123",
      },
      "gpt-4o",
    );

    expect(unsupported).toHaveLength(1);
    expect(unsupported[0]?.field).toBe("previous_response_id");
  });

  it("rejects reasoning, compaction, and truncation controls", () => {
    const unsupported = getUnsupportedContextSemantics(
      {
        model: "openclaw",
        input: "hello",
        reasoning: { effort: "low" },
        context_management: {
          compaction: {
            mode: "auto",
          },
        },
        truncation: "auto",
      },
      "openclaw",
    );

    const fields = unsupported.map((entry) => entry.field);
    expect(fields).toContain("reasoning");
    expect(fields).toContain("context_management.compaction");
    expect(fields).toContain("truncation");
  });

  it("matches model support contract helper", () => {
    expect(modelSupportsPreviousResponseId("openclaw")).toBe(true);
    expect(modelSupportsPreviousResponseId("openclaw:beta")).toBe(true);
    expect(modelSupportsPreviousResponseId("gpt-4o")).toBe(false);
  });
});
