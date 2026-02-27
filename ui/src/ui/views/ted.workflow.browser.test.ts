import { render } from "lit";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { TedViewProps } from "./ted.ts";
import { renderExecutionWavesControlCard } from "./ted.ts";

function createExecutionWaveProps() {
  return {
    llmRoutingPolicy: null,
    llmRoutingPolicyLoading: false,
    llmRoutingPolicyError: null,
    llmRoutingPolicySaveBusy: false,
    llmRoutingPolicySaveError: null,
    llmRoutingPolicySaveResult: null,
    llmProviderTestBusy: false,
    llmProviderTestError: null,
    llmProviderTestResult: null,
    workflows: null,
    workflowsLoading: false,
    workflowsError: null,
    workflowMutationBusy: false,
    workflowMutationError: null,
    workflowMutationResult: null,
    workflowRuns: null,
    workflowRunsLoading: false,
    workflowRunsError: null,
    workflowRunBusy: false,
    workflowRunError: null,
    workflowRunResult: null,
    workflowLintLoading: false,
    workflowLintError: null,
    workflowLintResult: null,
    memoryPreferences: null,
    memoryPreferencesLoading: false,
    memoryPreferencesError: null,
    memoryMutationBusy: false,
    memoryMutationError: null,
    memoryMutationResult: null,
    memoryExport: null,
    memoryExportLoading: false,
    memoryExportError: null,
    mcpTrustPolicy: null,
    mcpTrustPolicyLoading: false,
    mcpTrustPolicyError: null,
    mcpTrustPolicySaveBusy: false,
    mcpTrustPolicySaveError: null,
    mcpTrustPolicySaveResult: null,
    mcpToolPolicyBusy: false,
    mcpToolPolicyError: null,
    mcpToolPolicyResult: null,
    setupState: null,
    setupStateLoading: false,
    setupStateError: null,
    setupSaveBusy: false,
    setupSaveError: null,
    setupSaveResult: null,
    graphDeltaStatus: null,
    graphDeltaStatusLoading: false,
    graphDeltaStatusError: null,
    graphDeltaRunBusy: false,
    graphDeltaRunError: null,
    graphDeltaRunResult: null,
    evalMatrix: null,
    evalMatrixLoading: false,
    evalMatrixError: null,
    evalMatrixSaveBusy: false,
    evalMatrixSaveError: null,
    evalMatrixSaveResult: null,
    evalMatrixRunBusy: false,
    evalMatrixRunError: null,
    evalMatrixRunResult: null,
    frictionSummary: null,
    frictionSummaryLoading: false,
    frictionSummaryError: null,
    frictionRuns: null,
    frictionRunsLoading: false,
    frictionRunsError: null,
    outcomesDashboard: null,
    outcomesDashboardLoading: false,
    outcomesDashboardError: null,
    outcomesFrictionTrends: null,
    outcomesFrictionTrendsLoading: false,
    outcomesFrictionTrendsError: null,
    outcomesJob: null,
    outcomesJobLoading: false,
    outcomesJobError: null,
    replayCorpus: null,
    replayCorpusLoading: false,
    replayCorpusError: null,
    replayRunBusy: false,
    replayRunError: null,
    replayRunResult: null,
    replayRuns: null,
    replayRunsLoading: false,
    replayRunsError: null,
    onLoadLlmRoutingPolicy: vi.fn(),
    onSaveLlmRoutingPolicy: vi.fn(),
    onTestLlmProvider: vi.fn(),
    onLoadWorkflows: vi.fn(),
    onUpsertWorkflow: vi.fn(),
    onLintWorkflow: vi.fn(),
    onRemoveWorkflow: vi.fn(),
    onRunWorkflow: vi.fn(),
    onLoadWorkflowRuns: vi.fn(),
    onLoadMemoryPreferences: vi.fn(),
    onUpsertMemoryPreference: vi.fn(),
    onForgetMemoryPreference: vi.fn(),
    onExportMemoryPreferences: vi.fn(),
    onLoadMcpTrustPolicy: vi.fn(),
    onSaveMcpTrustPolicy: vi.fn(),
    onSetMcpToolPolicy: vi.fn(),
    onLoadSetupState: vi.fn(),
    onSaveSetupGraphProfile: vi.fn(),
    onLoadGraphDeltaStatus: vi.fn(),
    onRunGraphDelta: vi.fn(),
    onLoadEvalMatrix: vi.fn(),
    onSaveEvalMatrix: vi.fn(),
    onRunEvalMatrix: vi.fn(),
    onLoadFrictionSummary: vi.fn(),
    onLoadFrictionRuns: vi.fn(),
    onLoadOutcomesDashboard: vi.fn(),
    onLoadOutcomesFrictionTrends: vi.fn(),
    onLoadOutcomesJob: vi.fn(),
    onLoadReplayCorpus: vi.fn(),
    onRunReplay: vi.fn(),
    onLoadReplayRuns: vi.fn(),
  } as unknown as TedViewProps;
}

function clickByText(container: HTMLElement, label: string) {
  const button = Array.from(container.querySelectorAll("button")).find(
    (entry) => entry.textContent?.trim() === label,
  );
  expect(button).toBeDefined();
  button?.click();
}

function renderInDocument(props: TedViewProps): HTMLDivElement {
  const container = document.createElement("div");
  document.body.append(container);
  render(renderExecutionWavesControlCard(props), container);
  return container;
}

describe("ted workflow execution controls", () => {
  const originalAlert = window.alert;

  beforeEach(() => {
    window.alert = vi.fn();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    window.alert = originalAlert;
    document.body.innerHTML = "";
  });

  it("loads workflows from the execution control plane", () => {
    const props = createExecutionWaveProps();
    const container = renderInDocument(props);

    clickByText(container, "Workflows");
    expect(props.onLoadWorkflows).toHaveBeenCalledTimes(1);
  });

  it("runs workflow dry-run for selected workflow id", () => {
    const props = createExecutionWaveProps();
    const container = renderInDocument(props);

    const workflowIdInput = container.querySelector<HTMLInputElement>("#ted-wave-workflow-id");
    expect(workflowIdInput).not.toBeNull();
    if (!workflowIdInput) {
      return;
    }
    workflowIdInput.value = "daily-ops-brief";

    clickByText(container, "Run Dry");
    expect(props.onRunWorkflow).toHaveBeenCalledWith("daily-ops-brief", true);
  });

  it("runs risk lint with inline workflow JSON", () => {
    const props = createExecutionWaveProps();
    const container = renderInDocument(props);

    const workflowJson = container.querySelector<HTMLTextAreaElement>("#ted-wave-workflow-json");
    expect(workflowJson).not.toBeNull();
    if (!workflowJson) {
      return;
    }
    workflowJson.value = JSON.stringify(
      {
        workflow_id: "wf-risk-check",
        name: "Risk Check",
        enabled: true,
        trigger: { kind: "manual" },
        steps: [{ step_id: "status", kind: "route_call", method: "GET", route: "/status" }],
      },
      null,
      2,
    );

    clickByText(container, "Risk Lint");
    expect(props.onLintWorkflow).toHaveBeenCalledTimes(1);
    expect(props.onLintWorkflow).toHaveBeenCalledWith(
      expect.objectContaining({
        workflow: expect.objectContaining({ workflow_id: "wf-risk-check" }),
      }),
    );
  });

  it("loads friction summary for selected workflow id", () => {
    const props = createExecutionWaveProps();
    const container = renderInDocument(props);

    const workflowIdInput = container.querySelector<HTMLInputElement>("#ted-wave-outcomes-job-id");
    expect(workflowIdInput).not.toBeNull();
    if (!workflowIdInput) {
      return;
    }
    workflowIdInput.value = "daily-ops-brief";

    clickByText(container, "Friction Summary");
    expect(props.onLoadFrictionSummary).toHaveBeenCalledWith({
      workflow_id: "daily-ops-brief",
      limit: 100,
    });
  });

  it("loads replay corpus and runs replay for adversarial scenarios", () => {
    const props = createExecutionWaveProps();
    const container = renderInDocument(props);

    const replayInclude = container.querySelector<HTMLSelectElement>("#ted-wave-replay-include");
    const replayScenarioIds = container.querySelector<HTMLInputElement>(
      "#ted-wave-replay-scenario-ids",
    );
    expect(replayInclude).not.toBeNull();
    expect(replayScenarioIds).not.toBeNull();
    if (!replayInclude || !replayScenarioIds) {
      return;
    }

    replayInclude.value = "adversarial";
    replayScenarioIds.value = "adversarial_prompt_injection, adversarial_tool_contamination";

    clickByText(container, "Load Corpus");
    expect(props.onLoadReplayCorpus).toHaveBeenCalledWith({
      include: "adversarial",
      limit: 200,
    });

    clickByText(container, "Run Replay");
    expect(props.onRunReplay).toHaveBeenCalledWith({
      include: "adversarial",
      scenario_ids: ["adversarial_prompt_injection", "adversarial_tool_contamination"],
    });
  });
});
