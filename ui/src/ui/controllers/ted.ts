import type { GatewayBrowserClient } from "../gateway.ts";
import type {
  TedConnectorAuthPollResponse,
  TedConnectorAuthRevokeResponse,
  TedConnectorAuthStartResponse,
  TedEodDigestResponse,
  TedJobCardImpactPreview,
  TedIntakeRecommendation,
  TedJobCardDetail,
  TedKpiSuggestion,
  LlmProviderName,
  TedLlmProviderConfig,
  TedLlmRoutingPolicy,
  TedLlmProviderTestResponse,
  TedWorkflowRegistryResponse,
  TedWorkflowRunsResponse,
  TedWorkflowDefinition,
  TedMemoryPreferencesResponse,
  TedMemoryExportResponse,
  TedMcpTrustPolicy,
  TedSetupStateResponse,
  TedGraphDeltaStatusResponse,
  TedGraphDeltaRunResponse,
  TedEvalMatrixConfigResponse,
  TedEvalMatrixRunResponse,
  TedFrictionSummaryResponse,
  TedFrictionRunsResponse,
  TedOutcomesDashboardResponse,
  TedOutcomesFrictionTrendsResponse,
  TedOutcomesJobResponse,
  TedReplayCorpusResponse,
  TedReplayRunResponse,
  TedReplayRunsResponse,
  TedMailListResponse,
  TedMailMessage,
  TedMorningBriefResponse,
  TedMeetingUpcomingResponse,
  TedCommitmentsListResponse,
  TedActionsListResponse,
  TedWaitingForListResponse,
  TedTrustMetricsResponse,
  TedDeepWorkMetricsResponse,
  TedDraftQueueResponse,
  TedEventLogStatsResponse,
  TedPolicyDocument,
  TedPolicyImpactPreview,
  TedPolicyKey,
  TedSourceDocument,
  TedDealFull,
  TedDealSummary,
  TedWorkbenchSnapshot,
  TedPlannerListResponse,
  TedPlannerTasksResponse,
  TedTodoListsResponse,
  TedTodoTasksResponse,
  TedSyncReconciliationResponse,
  TedSyncProposalsResponse,
  TedCommitmentExtractionResponse,
  TedImprovementProposal,
  TedImprovementProposalsResponse,
  TedImprovementGenerateResponse,
  TedImprovementApplyResponse,
  TedTrustAutonomyEvaluation,
  TedFailureAggregationResponse,
  TedExternalMcpServersResponse,
  TedExternalMcpToolsResponse,
  TedExternalMcpServerTestResponse,
  TedMcpExternalAdmissionResponse,
  TedMcpExternalRevalidationStatusResponse,
} from "../types.ts";

const TED_REQUEST_TIMEOUT_MS = 12_000;

async function requestTedWithTimeout<T>(
  client: GatewayBrowserClient,
  method: string,
  params: Record<string, unknown>,
): Promise<T> {
  const requestPromise = client.request<T>(method, params);
  const timeoutPromise = new Promise<never>((_, reject) => {
    const timer = setTimeout(() => {
      reject(
        new Error(
          `Ted request timed out after ${TED_REQUEST_TIMEOUT_MS / 1000}s. Reconnect from Overview and retry.`,
        ),
      );
    }, TED_REQUEST_TIMEOUT_MS);
    // avoid keeping event loop alive from timeout handle
    timer.unref?.();
  });
  return Promise.race([requestPromise, timeoutPromise]);
}

export type TedWorkbenchState = {
  client: GatewayBrowserClient | null;
  connected: boolean;
  tedLoading: boolean;
  tedSnapshot: TedWorkbenchSnapshot | null;
  tedError: string | null;
  tedRoleCardJson: string;
  tedRoleCardBusy: boolean;
  tedRoleCardResult: string | null;
  tedRoleCardError: string | null;
  tedProofBusyKey: string | null;
  tedProofResult: string | null;
  tedProofError: string | null;
  tedJobCardDetailLoading: boolean;
  tedJobCardDetail: TedJobCardDetail | null;
  tedJobCardDetailError: string | null;
  tedJobCardEditorMarkdown: string;
  tedJobCardSaveBusy: boolean;
  tedJobCardSaveError: string | null;
  tedJobCardSaveResult: string | null;
  tedJobCardPreviewBusy: boolean;
  tedJobCardPreviewError: string | null;
  tedJobCardPreview: TedJobCardImpactPreview | null;
  tedJobCardKpiSuggestBusy: boolean;
  tedJobCardKpiSuggestError: string | null;
  tedJobCardKpiSuggestion: TedKpiSuggestion | null;
  tedRecommendationBusyId: string | null;
  tedRecommendationError: string | null;
  tedIntakeTitle: string;
  tedIntakeOutcome: string;
  tedIntakeJobFamily: string;
  tedIntakeRiskLevel: string;
  tedIntakeAutomationLevel: string;
  tedIntakeBusy: boolean;
  tedIntakeError: string | null;
  tedIntakeRecommendation: TedIntakeRecommendation | null;
  tedIntakeSaveBusy: boolean;
  tedIntakeSaveError: string | null;
  tedIntakeSaveResult: Record<string, unknown> | null;
  tedThresholdManual: string;
  tedThresholdApprovalAge: string;
  tedThresholdTriageEod: string;
  tedThresholdBlockedExplainability: string;
  tedThresholdAcknowledgeRisk: boolean;
  tedThresholdBusy: boolean;
  tedThresholdError: string | null;
  tedThresholdResult: string | null;
  tedSourceDocLoading: boolean;
  tedSourceDocError: string | null;
  tedSourceDoc: TedSourceDocument | null;
  tedPolicyLoading: boolean;
  tedPolicyError: string | null;
  tedPolicyDoc: TedPolicyDocument | null;
  tedPolicyPreviewBusy: boolean;
  tedPolicyPreviewError: string | null;
  tedPolicyPreview: TedPolicyImpactPreview | null;
  tedPolicySaveBusy: boolean;
  tedPolicySaveError: string | null;
  tedPolicySaveResult: string | null;
  tedConnectorAuthBusyProfile: string | null;
  tedConnectorAuthError: string | null;
  tedConnectorAuthResult: string | null;
  tedConnectorDeviceCodeByProfile: Record<string, string>;
  tedMailLoading: boolean;
  tedMailMessages: TedMailMessage[];
  tedMailError: string | null;
  tedMailFolder: string;
  tedMorningBriefLoading: boolean;
  tedMorningBrief: TedMorningBriefResponse | null;
  tedMorningBriefError: string | null;
  tedEodDigestLoading: boolean;
  tedEodDigest: TedEodDigestResponse | null;
  tedEodDigestError: string | null;
  tedDealListLoading: boolean;
  tedDealList: TedDealSummary[];
  tedDealListError: string | null;
  tedDealDetailLoading: boolean;
  tedDealDetail: TedDealFull | null;
  tedDealDetailError: string | null;
  tedDealActionBusy: boolean;
  tedDealActionError: string | null;
  tedDealActionResult: string | null;
  tedLlmProviderConfig: TedLlmProviderConfig | null;
  tedLlmProviderLoading: boolean;
  tedLlmProviderError: string | null;
  tedLlmRoutingPolicy: TedLlmRoutingPolicy | null;
  tedLlmRoutingPolicyLoading: boolean;
  tedLlmRoutingPolicyError: string | null;
  tedLlmRoutingPolicySaveBusy: boolean;
  tedLlmRoutingPolicySaveError: string | null;
  tedLlmRoutingPolicySaveResult: string | null;
  tedLlmProviderTestBusy: boolean;
  tedLlmProviderTestError: string | null;
  tedLlmProviderTestResult: TedLlmProviderTestResponse | null;
  tedWorkflows: TedWorkflowRegistryResponse | null;
  tedWorkflowsLoading: boolean;
  tedWorkflowsError: string | null;
  tedWorkflowMutationBusy: boolean;
  tedWorkflowMutationError: string | null;
  tedWorkflowMutationResult: string | null;
  tedWorkflowRuns: TedWorkflowRunsResponse | null;
  tedWorkflowRunsLoading: boolean;
  tedWorkflowRunsError: string | null;
  tedWorkflowRunBusy: boolean;
  tedWorkflowRunError: string | null;
  tedWorkflowRunResult: Record<string, unknown> | null;
  tedMemoryPreferences: TedMemoryPreferencesResponse | null;
  tedMemoryPreferencesLoading: boolean;
  tedMemoryPreferencesError: string | null;
  tedMemoryMutationBusy: boolean;
  tedMemoryMutationError: string | null;
  tedMemoryMutationResult: string | null;
  tedMemoryExport: TedMemoryExportResponse | null;
  tedMemoryExportLoading: boolean;
  tedMemoryExportError: string | null;
  tedMcpTrustPolicy: TedMcpTrustPolicy | null;
  tedMcpTrustPolicyLoading: boolean;
  tedMcpTrustPolicyError: string | null;
  tedMcpTrustPolicySaveBusy: boolean;
  tedMcpTrustPolicySaveError: string | null;
  tedMcpTrustPolicySaveResult: string | null;
  tedMcpToolPolicyBusy: boolean;
  tedMcpToolPolicyError: string | null;
  tedMcpToolPolicyResult: string | null;
  tedSetupState: TedSetupStateResponse | null;
  tedSetupStateLoading: boolean;
  tedSetupStateError: string | null;
  tedSetupSaveBusy: boolean;
  tedSetupSaveError: string | null;
  tedSetupSaveResult: string | null;
  tedMcpExternalAdmission: TedMcpExternalAdmissionResponse | null;
  tedMcpExternalAdmissionLoading: boolean;
  tedMcpExternalAdmissionError: string | null;
  tedMcpExternalRevalidationStatus: TedMcpExternalRevalidationStatusResponse | null;
  tedMcpExternalRevalidationStatusLoading: boolean;
  tedMcpExternalRevalidationStatusError: string | null;
  tedMcpExternalRevalidateBusy: boolean;
  tedMcpExternalRevalidateError: string | null;
  tedMcpExternalRevalidateResult: Record<string, unknown> | null;
  tedGraphDeltaStatus: TedGraphDeltaStatusResponse | null;
  tedGraphDeltaStatusLoading: boolean;
  tedGraphDeltaStatusError: string | null;
  tedGraphDeltaRunBusy: boolean;
  tedGraphDeltaRunError: string | null;
  tedGraphDeltaRunResult: TedGraphDeltaRunResponse | null;
  tedEvalMatrix: TedEvalMatrixConfigResponse | null;
  tedEvalMatrixLoading: boolean;
  tedEvalMatrixError: string | null;
  tedEvalMatrixSaveBusy: boolean;
  tedEvalMatrixSaveError: string | null;
  tedEvalMatrixSaveResult: string | null;
  tedEvalMatrixRunBusy: boolean;
  tedEvalMatrixRunError: string | null;
  tedEvalMatrixRunResult: TedEvalMatrixRunResponse | null;
  tedFrictionSummary: TedFrictionSummaryResponse | null;
  tedFrictionSummaryLoading: boolean;
  tedFrictionSummaryError: string | null;
  tedFrictionRuns: TedFrictionRunsResponse | null;
  tedFrictionRunsLoading: boolean;
  tedFrictionRunsError: string | null;
  tedOutcomesDashboard: TedOutcomesDashboardResponse | null;
  tedOutcomesDashboardLoading: boolean;
  tedOutcomesDashboardError: string | null;
  tedOutcomesFrictionTrends: TedOutcomesFrictionTrendsResponse | null;
  tedOutcomesFrictionTrendsLoading: boolean;
  tedOutcomesFrictionTrendsError: string | null;
  tedOutcomesJob: TedOutcomesJobResponse | null;
  tedOutcomesJobLoading: boolean;
  tedOutcomesJobError: string | null;
  tedReplayCorpus: TedReplayCorpusResponse | null;
  tedReplayCorpusLoading: boolean;
  tedReplayCorpusError: string | null;
  tedReplayRunBusy: boolean;
  tedReplayRunError: string | null;
  tedReplayRunResult: TedReplayRunResponse | null;
  tedReplayRuns: TedReplayRunsResponse | null;
  tedReplayRunsLoading: boolean;
  tedReplayRunsError: string | null;
  // Phase 6: Meetings + Commitments + GTD
  tedMeetingsUpcoming: TedMeetingUpcomingResponse | null;
  tedMeetingsLoading: boolean;
  tedMeetingsError: string | null;
  tedCommitments: TedCommitmentsListResponse | null;
  tedCommitmentsLoading: boolean;
  tedCommitmentsError: string | null;
  tedActions: TedActionsListResponse | null;
  tedActionsLoading: boolean;
  tedActionsError: string | null;
  tedWaitingFor: TedWaitingForListResponse | null;
  tedWaitingForLoading: boolean;
  tedWaitingForError: string | null;
  // Phase 8: Trust + Deep Work
  tedTrustMetrics: TedTrustMetricsResponse | null;
  tedTrustMetricsLoading: boolean;
  tedTrustMetricsError: string | null;
  tedDeepWorkMetrics: TedDeepWorkMetricsResponse | null;
  tedDeepWorkMetricsLoading: boolean;
  tedDeepWorkMetricsError: string | null;
  // Draft Queue (JC-089f)
  tedDraftQueue: TedDraftQueueResponse | null;
  tedDraftQueueLoading: boolean;
  tedDraftQueueError: string | null;
  // Event Log Stats (JC-087e)
  tedEventLogStats: TedEventLogStatsResponse | null;
  tedEventLogStatsLoading: boolean;
  tedEventLogStatsError: string | null;
  // Planner
  tedPlannerPlans: TedPlannerListResponse | null;
  tedPlannerPlansLoading: boolean;
  tedPlannerPlansError: string | null;
  tedPlannerTasks: TedPlannerTasksResponse | null;
  tedPlannerTasksLoading: boolean;
  tedPlannerTasksError: string | null;
  // To Do
  tedTodoLists: TedTodoListsResponse | null;
  tedTodoListsLoading: boolean;
  tedTodoListsError: string | null;
  tedTodoTasks: TedTodoTasksResponse | null;
  tedTodoTasksLoading: boolean;
  tedTodoTasksError: string | null;
  // Sync
  tedSyncReconciliation: TedSyncReconciliationResponse | null;
  tedSyncReconciliationLoading: boolean;
  tedSyncReconciliationError: string | null;
  tedSyncProposals: TedSyncProposalsResponse | null;
  tedSyncProposalsLoading: boolean;
  tedSyncProposalsError: string | null;
  tedSyncApproveBusy: string | null;
  tedSyncApproveError: string | null;
  tedSyncApproveResult: string | null;
  tedSyncRejectBusy: string | null;
  tedSyncRejectError: string | null;
  tedSyncRejectResult: string | null;
  // Extraction
  tedExtractionResult: TedCommitmentExtractionResponse | null;
  tedExtractionLoading: boolean;
  tedExtractionError: string | null;
  // Improvement Proposals (Codex Builder Lane)
  tedImprovementProposals: TedImprovementProposal[];
  tedImprovementProposalsLoading: boolean;
  tedImprovementProposalsError: string | null;
  tedImprovementCreateBusy: boolean;
  tedImprovementCreateError: string | null;
  tedImprovementCreateResult: string | null;
  tedImprovementReviewBusy: boolean;
  tedImprovementReviewError: string | null;
  tedImprovementReviewResult: string | null;
  // Trust Autonomy Evaluation
  tedTrustAutonomy: TedTrustAutonomyEvaluation | null;
  tedTrustAutonomyLoading: boolean;
  tedTrustAutonomyError: string | null;
  // Improvement Proposals — apply + generate state
  tedImprovementApplyBusy: boolean;
  tedImprovementApplyError: string | null;
  tedImprovementApplyResult: string | null;
  tedImprovementGenerateBusy: boolean;
  tedImprovementGenerateError: string | null;
  tedImprovementGenerateResult: TedImprovementGenerateResponse | null;
  // Failure Aggregation
  tedFailureAggregation: TedFailureAggregationResponse | null;
  tedFailureAggregationLoading: boolean;
  tedFailureAggregationError: string | null;
  // Builder Lane (BL-010)
  tedBuilderLanePatterns: Record<string, unknown> | null;
  tedBuilderLanePatternsLoading: boolean;
  tedBuilderLanePatternsError: string | null;
  tedBuilderLaneStatus: Record<string, unknown> | null;
  tedBuilderLaneStatusLoading: boolean;
  tedBuilderLaneMetrics: Record<string, unknown> | null;
  tedBuilderLaneMetricsLoading: boolean;
  tedBuilderLaneRevertBusy: boolean;
  tedBuilderLaneRevertError: string | null;
  tedBuilderLaneRevertResult: string | null;
  tedBuilderLaneGenerateBusy: boolean;
  tedBuilderLaneCalibrationBusy: boolean;
  // JC-110: Architecture closure — draft submit-review + deep work session
  tedDraftSubmitReviewLoading: boolean;
  tedDraftSubmitReviewError: string | null;
  tedDeepWorkSessionLoading: boolean;
  tedDeepWorkSessionError: string | null;
  tedDeepWorkSessionResult: Record<string, unknown> | null;
  tedGraphSyncStatusLoading: boolean;
  tedGraphSyncStatusError: string | null;
  tedGraphSyncStatusResult: Record<string, unknown> | null;
  // Ingestion
  tedIngestionStatusLoading: boolean;
  tedIngestionStatusError: string | null;
  tedIngestionStatus: Record<string, unknown> | null;
  tedIngestionRunBusy: boolean;
  tedIngestionRunError: string | null;
  tedIngestionRunResult: Record<string, unknown> | null;
  // Discovery
  tedDiscoveryStatusLoading: boolean;
  tedDiscoveryStatusError: string | null;
  tedDiscoveryStatus: Record<string, unknown> | null;
  tedDiscoveryRunBusy: boolean;
  tedDiscoveryRunError: string | null;
  tedDiscoveryRunResult: Record<string, unknown> | null;
  // External MCP connections
  tedExternalMcpServers: TedExternalMcpServersResponse | null;
  tedExternalMcpServersLoading: boolean;
  tedExternalMcpServersError: string | null;
  tedExternalMcpTools: TedExternalMcpToolsResponse | null;
  tedExternalMcpToolsLoading: boolean;
  tedExternalMcpToolsError: string | null;
  tedExternalMcpTestResult: TedExternalMcpServerTestResponse | null;
  tedExternalMcpTestBusyServerId: string | null;
  tedExternalMcpTestError: string | null;
  tedExternalMcpMutationBusy: boolean;
  tedExternalMcpMutationError: string | null;
  tedExternalMcpMutationResult: string | null;
  // SharePoint state
  tedSharePointSites: Array<{
    id: string;
    displayName: string;
    webUrl: string;
    name: string;
  }> | null;
  tedSharePointSitesLoading: boolean;
  tedSharePointSitesError: string | null;
  tedSharePointDrives: Array<{
    id: string;
    name: string;
    driveType: string;
    webUrl: string;
    description: string | null;
  }> | null;
  tedSharePointDrivesLoading: boolean;
  tedSharePointDrivesError: string | null;
  tedSharePointItems: Array<{
    id: string;
    name: string;
    size: number;
    lastModifiedDateTime: string;
    webUrl: string;
    isFolder: boolean;
    mimeType: string | null;
    createdBy: string | null;
    lastModifiedBy: string | null;
    parentPath: string | null;
  }> | null;
  tedSharePointItemsLoading: boolean;
  tedSharePointItemsError: string | null;
  tedSharePointItemsPath: string;
  tedSharePointSearchResults: Array<{
    id: string;
    name: string;
    size: number;
    lastModifiedDateTime: string;
    webUrl: string;
    isFolder: boolean;
    mimeType: string | null;
    createdBy: string | null;
    lastModifiedBy: string | null;
    parentPath: string | null;
  }> | null;
  tedSharePointSearchLoading: boolean;
  tedSharePointSearchError: string | null;
  tedSharePointUploadResult: string | null;
  tedSharePointUploadLoading: boolean;
  tedSharePointUploadError: string | null;
  tedSharePointFolderResult: string | null;
  tedSharePointFolderLoading: boolean;
  tedSharePointFolderError: string | null;
  tedSharePointSelectedProfile: string;
  tedSharePointSelectedSiteId: string;
  tedSharePointSelectedDriveId: string;
  tedSharePointSearchQuery: string;
  // C12-004: Stale deal owners
  tedStaleDealsList: import("../types.ts").TedStaleDeal[];
  tedStaleDealsLoading: boolean;
  tedStaleDealsError: string | null;
  // C12-011: Deal retrospective
  tedDealRetrospective: import("../types.ts").TedDealRetrospective | null;
  tedDealRetrospectiveLoading: boolean;
  tedDealRetrospectiveError: string | null;
  // Self-Healing Dashboard
  selfHealingStatus: Record<string, unknown> | null;
  selfHealingStatusLoading: boolean;
  selfHealingStatusError: string | null;
  correctionTaxonomy: Record<string, unknown> | null;
  correctionTaxonomyLoading: boolean;
  correctionTaxonomyError: string | null;
  engagementInsights: Record<string, unknown> | null;
  engagementInsightsLoading: boolean;
  engagementInsightsError: string | null;
  noiseLevel: Record<string, unknown> | null;
  noiseLevelLoading: boolean;
  noiseLevelError: string | null;
  autonomyStatus: Record<string, unknown> | null;
  autonomyStatusLoading: boolean;
  autonomyStatusError: string | null;
  // Sprint 2 (SDD 72): Evaluation Pipeline
  tedEvaluationStatus: Record<string, unknown> | null;
  tedEvaluationStatusLoading: boolean;
  tedEvaluationStatusError: string | null;
  tedEvaluationRunBusy: boolean;
  tedEvaluationRunError: string | null;
  tedEvaluationRunResult: Record<string, unknown> | null;
  tedQaDashboard: Record<string, unknown> | null;
  tedQaDashboardLoading: boolean;
  tedQaDashboardError: string | null;
  tedCanaryRunBusy: boolean;
  tedCanaryRunError: string | null;
  tedCanaryRunResult: Record<string, unknown> | null;
};

export async function loadTedWorkbench(state: TedWorkbenchState) {
  if (!state.client || !state.connected) {
    return;
  }
  if (state.tedLoading) {
    return;
  }

  state.tedLoading = true;
  state.tedError = null;
  try {
    const payload = await requestTedWithTimeout<TedWorkbenchSnapshot>(
      state.client,
      "ted.workbench",
      {},
    );
    state.tedSnapshot = payload;
    const gates = state.tedSnapshot.threshold_controls?.effective;
    if (gates) {
      state.tedThresholdManual = String(gates.manual_minutes_per_day_max);
      state.tedThresholdApprovalAge = String(gates.approval_queue_oldest_minutes_max);
      state.tedThresholdTriageEod = String(gates.unresolved_triage_eod_max);
      state.tedThresholdBlockedExplainability = String(
        gates.blocked_actions_missing_explainability_max,
      );
    }
    // Auto-load deals and commitments in parallel after workbench snapshot
    void loadTedDealList(state);
    void loadTedCommitments(state);
  } catch (error) {
    state.tedError = String(error);
  } finally {
    state.tedLoading = false;
  }
}

export async function validateTedRoleCard(state: TedWorkbenchState) {
  if (!state.client || !state.connected || state.tedRoleCardBusy) {
    return;
  }
  state.tedRoleCardBusy = true;
  state.tedRoleCardError = null;
  state.tedRoleCardResult = null;
  try {
    const parsed = JSON.parse(state.tedRoleCardJson) as Record<string, unknown>;
    const response = await requestTedWithTimeout<Record<string, unknown>>(
      state.client,
      "ted.governance.rolecards.validate",
      {
        role_card: parsed,
      },
    );
    state.tedRoleCardResult = JSON.stringify(response, null, 2);
  } catch (error) {
    state.tedRoleCardError = String(error);
  } finally {
    state.tedRoleCardBusy = false;
  }
}

export async function runTedProof(state: TedWorkbenchState, proofScript: string) {
  if (!state.client || !state.connected || state.tedProofBusyKey) {
    return;
  }
  state.tedProofBusyKey = proofScript;
  state.tedProofError = null;
  state.tedProofResult = null;
  try {
    const response = await requestTedWithTimeout<Record<string, unknown>>(
      state.client,
      "ted.jobcards.proof.run",
      {
        proof_script: proofScript,
      },
    );
    state.tedProofResult = JSON.stringify(response, null, 2);
  } catch (error) {
    state.tedProofError = String(error);
  } finally {
    state.tedProofBusyKey = null;
  }
}

export async function loadTedJobCardDetail(state: TedWorkbenchState, id: string) {
  if (!state.client || !state.connected || state.tedJobCardDetailLoading) {
    return;
  }
  state.tedJobCardDetailLoading = true;
  state.tedJobCardDetailError = null;
  try {
    const response = await requestTedWithTimeout<TedJobCardDetail>(
      state.client,
      "ted.jobcards.detail",
      {
        id,
      },
    );
    state.tedJobCardDetail = response;
    state.tedJobCardEditorMarkdown = response.markdown;
    state.tedJobCardKpiSuggestion = null;
    state.tedJobCardKpiSuggestError = null;
  } catch (error) {
    state.tedJobCardDetailError = String(error);
  } finally {
    state.tedJobCardDetailLoading = false;
  }
}

export async function suggestTedJobCardKpis(state: TedWorkbenchState) {
  if (
    !state.client ||
    !state.connected ||
    state.tedJobCardKpiSuggestBusy ||
    !state.tedJobCardDetail
  ) {
    return;
  }
  state.tedJobCardKpiSuggestBusy = true;
  state.tedJobCardKpiSuggestError = null;
  try {
    const response = await requestTedWithTimeout<TedKpiSuggestion>(
      state.client,
      "ted.jobcards.suggest_kpis",
      {
        id: state.tedJobCardDetail.id,
      },
    );
    state.tedJobCardKpiSuggestion = response;
  } catch (error) {
    state.tedJobCardKpiSuggestError = String(error);
  } finally {
    state.tedJobCardKpiSuggestBusy = false;
  }
}

export async function saveTedJobCardDetail(state: TedWorkbenchState) {
  if (!state.client || !state.connected || state.tedJobCardSaveBusy || !state.tedJobCardDetail) {
    return;
  }
  state.tedJobCardSaveBusy = true;
  state.tedJobCardSaveError = null;
  state.tedJobCardSaveResult = null;
  try {
    const response = await requestTedWithTimeout<Record<string, unknown>>(
      state.client,
      "ted.jobcards.update",
      {
        id: state.tedJobCardDetail.id,
        markdown: state.tedJobCardEditorMarkdown,
      },
    );
    state.tedJobCardSaveResult = JSON.stringify(response, null, 2);
    await loadTedJobCardDetail(state, state.tedJobCardDetail.id);
    await loadTedWorkbench(state);
  } catch (error) {
    state.tedJobCardSaveError = String(error);
  } finally {
    state.tedJobCardSaveBusy = false;
  }
}

export async function previewTedJobCardUpdate(state: TedWorkbenchState) {
  if (!state.client || !state.connected || state.tedJobCardPreviewBusy || !state.tedJobCardDetail) {
    return;
  }
  state.tedJobCardPreviewBusy = true;
  state.tedJobCardPreviewError = null;
  try {
    const response = await requestTedWithTimeout<TedJobCardImpactPreview>(
      state.client,
      "ted.jobcards.preview_update",
      {
        id: state.tedJobCardDetail.id,
        markdown: state.tedJobCardEditorMarkdown,
      },
    );
    state.tedJobCardPreview = response;
  } catch (error) {
    state.tedJobCardPreviewError = String(error);
  } finally {
    state.tedJobCardPreviewBusy = false;
  }
}

export async function decideTedRecommendation(
  state: TedWorkbenchState,
  id: string,
  decision: "approved" | "dismissed",
) {
  if (!state.client || !state.connected || state.tedRecommendationBusyId) {
    return;
  }
  state.tedRecommendationBusyId = id;
  state.tedRecommendationError = null;
  try {
    await requestTedWithTimeout<Record<string, unknown>>(
      state.client,
      "ted.recommendations.decide",
      {
        id,
        decision,
      },
    );
    await loadTedWorkbench(state);
  } catch (error) {
    state.tedRecommendationError = String(error);
  } finally {
    state.tedRecommendationBusyId = null;
  }
}

export async function runTedIntakeRecommendation(state: TedWorkbenchState) {
  if (!state.client || !state.connected || state.tedIntakeBusy) {
    return;
  }
  state.tedIntakeBusy = true;
  state.tedIntakeError = null;
  try {
    const response = await requestTedWithTimeout<TedIntakeRecommendation>(
      state.client,
      "ted.intake.recommend",
      {
        title: state.tedIntakeTitle,
        outcome: state.tedIntakeOutcome,
        job_family: state.tedIntakeJobFamily,
        risk_level: state.tedIntakeRiskLevel,
        automation_level: state.tedIntakeAutomationLevel,
      },
    );
    state.tedIntakeRecommendation = response;
  } catch (error) {
    state.tedIntakeError = String(error);
  } finally {
    state.tedIntakeBusy = false;
  }
}

export async function saveTedIntakeJobCard(state: TedWorkbenchState): Promise<void> {
  if (!state.client || !state.connected || state.tedIntakeSaveBusy) {
    return;
  }
  if (!state.tedIntakeRecommendation) {
    state.tedIntakeSaveError = "Run the intake recommendation first.";
    return;
  }
  state.tedIntakeSaveBusy = true;
  state.tedIntakeSaveError = null;
  state.tedIntakeSaveResult = null;
  try {
    const result = await requestTedWithTimeout<Record<string, unknown>>(
      state.client,
      "ted.intake.create",
      {
        title: state.tedIntakeTitle,
        outcome: state.tedIntakeOutcome,
        job_family: state.tedIntakeJobFamily,
        risk_level: state.tedIntakeRiskLevel,
        automation_level: state.tedIntakeAutomationLevel,
        priority: state.tedIntakeRecommendation.priority,
        release_target: state.tedIntakeRecommendation.release_target,
        governance_tier: state.tedIntakeRecommendation.governance_tier,
        suggested_path: state.tedIntakeRecommendation.suggested_path,
        recommended_kpis: state.tedIntakeRecommendation.recommended_kpis,
        hard_bans: state.tedIntakeRecommendation.hard_bans,
        draft_markdown: state.tedIntakeRecommendation.draft_markdown,
      },
    );
    state.tedIntakeSaveResult = result;
    // Clear the form after successful save
    state.tedIntakeTitle = "";
    state.tedIntakeOutcome = "";
    state.tedIntakeJobFamily = "MNT";
    state.tedIntakeRiskLevel = "medium";
    state.tedIntakeAutomationLevel = "draft-only";
    state.tedIntakeRecommendation = null;
    // Reload workbench to reflect the new job card
    await loadTedWorkbench(state);
  } catch (error) {
    state.tedIntakeSaveError =
      (error instanceof Error ? error.message : String(error)) || "Failed to create job card";
  } finally {
    state.tedIntakeSaveBusy = false;
  }
}

export async function applyTedThresholds(state: TedWorkbenchState, reset = false) {
  if (!state.client || !state.connected || state.tedThresholdBusy) {
    return;
  }
  state.tedThresholdBusy = true;
  state.tedThresholdError = null;
  state.tedThresholdResult = null;
  try {
    const response = await requestTedWithTimeout<Record<string, unknown>>(
      state.client,
      "ted.gates.set",
      {
        reset,
        acknowledge_risk: state.tedThresholdAcknowledgeRisk,
        overrides: reset
          ? undefined
          : {
              manual_minutes_per_day_max: Number.parseInt(state.tedThresholdManual, 10),
              approval_queue_oldest_minutes_max: Number.parseInt(state.tedThresholdApprovalAge, 10),
              unresolved_triage_eod_max: Number.parseInt(state.tedThresholdTriageEod, 10),
              blocked_actions_missing_explainability_max: Number.parseInt(
                state.tedThresholdBlockedExplainability,
                10,
              ),
            },
      },
    );
    const maybeResponse = response as { ok?: boolean; warning?: string };
    if (maybeResponse.ok === false) {
      state.tedThresholdError =
        maybeResponse.warning ??
        "Threshold update blocked. Acknowledge risk to apply relaxed thresholds.";
      state.tedThresholdResult = JSON.stringify(maybeResponse, null, 2);
      return;
    }
    state.tedThresholdResult = JSON.stringify(response, null, 2);
    await loadTedWorkbench(state);
  } catch (error) {
    state.tedThresholdError = String(error);
  } finally {
    state.tedThresholdBusy = false;
  }
}

export async function loadTedSourceDocument(
  state: TedWorkbenchState,
  key: "job_board" | "promotion_policy" | "value_friction" | "interrogation_cycle",
) {
  if (!state.client || !state.connected || state.tedSourceDocLoading) {
    return;
  }
  state.tedSourceDocLoading = true;
  state.tedSourceDocError = null;
  try {
    const response = await requestTedWithTimeout<TedSourceDocument>(state.client, "ted.docs.read", {
      key,
    });
    state.tedSourceDoc = response;
  } catch (error) {
    state.tedSourceDocError = String(error);
  } finally {
    state.tedSourceDocLoading = false;
  }
}

export async function loadTedPolicyDocument(state: TedWorkbenchState, key: TedPolicyKey) {
  if (!state.client || !state.connected || state.tedPolicyLoading) {
    return;
  }
  state.tedPolicyLoading = true;
  state.tedPolicyError = null;
  state.tedPolicyPreview = null;
  state.tedPolicyPreviewError = null;
  state.tedPolicySaveResult = null;
  state.tedPolicySaveError = null;
  try {
    const response = await requestTedWithTimeout<TedPolicyDocument>(
      state.client,
      "ted.policy.read",
      { key },
    );
    state.tedPolicyDoc = response;
  } catch (error) {
    state.tedPolicyError = String(error);
  } finally {
    state.tedPolicyLoading = false;
  }
}

export async function previewTedPolicyUpdate(state: TedWorkbenchState) {
  if (!state.client || !state.connected || state.tedPolicyPreviewBusy || !state.tedPolicyDoc) {
    return;
  }
  state.tedPolicyPreviewBusy = true;
  state.tedPolicyPreviewError = null;
  try {
    const response = await requestTedWithTimeout<TedPolicyImpactPreview>(
      state.client,
      "ted.policy.preview_update",
      {
        key: state.tedPolicyDoc.key,
        config: state.tedPolicyDoc.config,
      },
    );
    state.tedPolicyPreview = response;
  } catch (error) {
    state.tedPolicyPreviewError = String(error);
  } finally {
    state.tedPolicyPreviewBusy = false;
  }
}

export async function saveTedPolicyUpdate(state: TedWorkbenchState) {
  if (!state.client || !state.connected || state.tedPolicySaveBusy || !state.tedPolicyDoc) {
    return;
  }
  state.tedPolicySaveBusy = true;
  state.tedPolicySaveError = null;
  state.tedPolicySaveResult = null;
  try {
    const response = await requestTedWithTimeout<Record<string, unknown>>(
      state.client,
      "ted.policy.update",
      {
        key: state.tedPolicyDoc.key,
        config: state.tedPolicyDoc.config,
      },
    );
    state.tedPolicySaveResult = JSON.stringify(response, null, 2);
    await loadTedPolicyDocument(state, state.tedPolicyDoc.key);
    await loadTedWorkbench(state);
  } catch (error) {
    state.tedPolicySaveError = String(error);
  } finally {
    state.tedPolicySaveBusy = false;
  }
}

export async function startTedConnectorAuth(
  state: TedWorkbenchState,
  profileId: "olumie" | "everest",
) {
  if (!state.client || !state.connected || state.tedConnectorAuthBusyProfile) {
    return;
  }
  state.tedConnectorAuthBusyProfile = profileId;
  state.tedConnectorAuthError = null;
  state.tedConnectorAuthResult = null;
  try {
    const response = await requestTedWithTimeout<TedConnectorAuthStartResponse>(
      state.client,
      "ted.integrations.graph.auth.start",
      {
        profile_id: profileId,
      },
    );
    if (typeof response.device_code === "string" && response.device_code.trim().length > 0) {
      state.tedConnectorDeviceCodeByProfile = {
        ...state.tedConnectorDeviceCodeByProfile,
        [profileId]: response.device_code,
      };
    }
    state.tedConnectorAuthResult = JSON.stringify(response, null, 2);
    await loadTedWorkbench(state);
  } catch (error) {
    state.tedConnectorAuthError = String(error);
  } finally {
    state.tedConnectorAuthBusyProfile = null;
  }
}

export async function pollTedConnectorAuth(
  state: TedWorkbenchState,
  profileId: "olumie" | "everest",
) {
  if (!state.client || !state.connected || state.tedConnectorAuthBusyProfile) {
    return;
  }
  const deviceCode = state.tedConnectorDeviceCodeByProfile[profileId];
  if (!deviceCode) {
    state.tedConnectorAuthError =
      "No device code for this profile yet. Start sign-in first, then run Check sign-in.";
    return;
  }
  state.tedConnectorAuthBusyProfile = profileId;
  state.tedConnectorAuthError = null;
  state.tedConnectorAuthResult = null;
  try {
    const response = await requestTedWithTimeout<TedConnectorAuthPollResponse>(
      state.client,
      "ted.integrations.graph.auth.poll",
      {
        profile_id: profileId,
        device_code: deviceCode,
      },
    );
    state.tedConnectorAuthResult = JSON.stringify(response, null, 2);
    await loadTedWorkbench(state);
  } catch (error) {
    state.tedConnectorAuthError = String(error);
  } finally {
    state.tedConnectorAuthBusyProfile = null;
  }
}

export async function revokeTedConnectorAuth(
  state: TedWorkbenchState,
  profileId: "olumie" | "everest",
) {
  if (!state.client || !state.connected || state.tedConnectorAuthBusyProfile) {
    return;
  }
  state.tedConnectorAuthBusyProfile = profileId;
  state.tedConnectorAuthError = null;
  state.tedConnectorAuthResult = null;
  try {
    const response = await requestTedWithTimeout<TedConnectorAuthRevokeResponse>(
      state.client,
      "ted.integrations.graph.auth.revoke",
      {
        profile_id: profileId,
      },
    );
    state.tedConnectorAuthResult = JSON.stringify(response, null, 2);
    const nextCodes = { ...state.tedConnectorDeviceCodeByProfile };
    delete nextCodes[profileId];
    state.tedConnectorDeviceCodeByProfile = nextCodes;
    await loadTedWorkbench(state);
  } catch (error) {
    state.tedConnectorAuthError = String(error);
  } finally {
    state.tedConnectorAuthBusyProfile = null;
  }
}

export async function loadTedMail(state: TedWorkbenchState, profileId?: string, folder?: string) {
  if (!state.client || !state.connected || state.tedMailLoading) {
    return;
  }
  state.tedMailLoading = true;
  state.tedMailError = null;
  try {
    const params: Record<string, unknown> = {
      profile_id: profileId || "olumie",
      top: 25,
      filter: "all",
    };
    if (folder) {
      params.folder = folder;
    }
    const response = await requestTedWithTimeout<TedMailListResponse>(
      state.client,
      "ted.mail.list",
      params,
    );
    state.tedMailMessages = response.messages;
    state.tedMailFolder = response.folder;
  } catch (error) {
    state.tedMailError = String(error);
  } finally {
    state.tedMailLoading = false;
  }
}

export async function loadTedMorningBrief(state: TedWorkbenchState) {
  if (!state.client || !state.connected || state.tedMorningBriefLoading) {
    return;
  }
  state.tedMorningBriefLoading = true;
  state.tedMorningBriefError = null;
  try {
    const response = await requestTedWithTimeout<TedMorningBriefResponse>(
      state.client,
      "ted.reporting.morning_brief",
      {},
    );
    state.tedMorningBrief = response;
  } catch (error) {
    state.tedMorningBriefError = String(error);
  } finally {
    state.tedMorningBriefLoading = false;
  }
}

export async function loadTedEodDigest(state: TedWorkbenchState) {
  if (!state.client || !state.connected || state.tedEodDigestLoading) {
    return;
  }
  state.tedEodDigestLoading = true;
  state.tedEodDigestError = null;
  try {
    const response = await requestTedWithTimeout<TedEodDigestResponse>(
      state.client,
      "ted.reporting.eod_digest",
      {},
    );
    state.tedEodDigest = response;
  } catch (error) {
    state.tedEodDigestError = String(error);
  } finally {
    state.tedEodDigestLoading = false;
  }
}

export async function loadTedDealList(state: TedWorkbenchState) {
  if (!state.client || !state.connected || state.tedDealListLoading) {
    return;
  }
  state.tedDealListLoading = true;
  state.tedDealListError = null;
  try {
    const response = await requestTedWithTimeout<{ deals: TedDealSummary[] }>(
      state.client,
      "ted.deals.list",
      {},
    );
    state.tedDealList = Array.isArray(response.deals) ? response.deals : [];
  } catch (error) {
    state.tedDealListError = String(error);
  } finally {
    state.tedDealListLoading = false;
  }
}

export async function loadTedDealDetail(state: TedWorkbenchState, dealId: string) {
  if (!state.client || !state.connected || state.tedDealDetailLoading) {
    return;
  }
  state.tedDealDetailLoading = true;
  state.tedDealDetailError = null;
  try {
    const response = await requestTedWithTimeout<TedDealFull>(state.client, "ted.deals.get", {
      deal_id: dealId,
    });
    state.tedDealDetail = response;
  } catch (error) {
    state.tedDealDetailError = String(error);
  } finally {
    state.tedDealDetailLoading = false;
  }
}

export async function updateTedDeal(
  state: TedWorkbenchState,
  dealId: string,
  fields: Record<string, unknown>,
) {
  if (!state.client || !state.connected || state.tedDealActionBusy) {
    return;
  }
  state.tedDealActionBusy = true;
  state.tedDealActionError = null;
  state.tedDealActionResult = null;
  try {
    const response = await requestTedWithTimeout<{ updated: boolean; deal_id: string }>(
      state.client,
      "ted.deals.update",
      { deal_id: dealId, ...fields },
    );
    state.tedDealActionResult = response.updated ? "Deal updated" : "Update failed";
    if (response.updated) {
      await loadTedDealDetail(state, dealId);
      await loadTedDealList(state);
    }
  } catch (error) {
    state.tedDealActionError = String(error);
  } finally {
    state.tedDealActionBusy = false;
  }
}

export async function loadTedStaleDeals(state: TedWorkbenchState, days?: number): Promise<void> {
  if (!state.client || !state.connected || state.tedStaleDealsLoading) {
    return;
  }
  state.tedStaleDealsLoading = true;
  state.tedStaleDealsError = null;
  try {
    const result = await requestTedWithTimeout<import("../types.ts").TedStaleDealResponse>(
      state.client,
      "ted.deals.stale_owners",
      { days: days ?? 7 },
    );
    state.tedStaleDealsList = result?.stale_deals ?? [];
  } catch (err: unknown) {
    state.tedStaleDealsError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedStaleDealsLoading = false;
  }
}

export async function generateTedDealRetrospective(
  state: TedWorkbenchState,
  dealId: string,
): Promise<void> {
  if (!state.client || !state.connected || state.tedDealRetrospectiveLoading) {
    return;
  }
  state.tedDealRetrospectiveLoading = true;
  state.tedDealRetrospectiveError = null;
  try {
    const result = await requestTedWithTimeout<{
      retrospective: import("../types.ts").TedDealRetrospective;
    }>(state.client, "ted.deals.retrospective", { deal_id: dealId });
    state.tedDealRetrospective = result?.retrospective ?? null;
  } catch (err: unknown) {
    state.tedDealRetrospectiveError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedDealRetrospectiveLoading = false;
  }
}

export async function loadTedLlmProvider(state: TedWorkbenchState) {
  if (!state.client || !state.connected || state.tedLlmProviderLoading) {
    return;
  }
  state.tedLlmProviderLoading = true;
  state.tedLlmProviderError = null;
  try {
    const response = await requestTedWithTimeout<TedLlmProviderConfig>(
      state.client,
      "ted.llm.provider.get",
      {},
    );
    state.tedLlmProviderConfig = response;
  } catch (error) {
    state.tedLlmProviderError = String(error);
  } finally {
    state.tedLlmProviderLoading = false;
  }
}

export async function updateTedLlmProvider(
  state: TedWorkbenchState,
  newDefault: LlmProviderName,
  perJobOverrides?: Record<string, { provider: LlmProviderName }>,
) {
  if (!state.client || !state.connected || state.tedLlmProviderLoading) {
    return;
  }
  state.tedLlmProviderLoading = true;
  state.tedLlmProviderError = null;
  try {
    const params: Record<string, unknown> = { default_provider: newDefault };
    if (perJobOverrides) {
      params.per_job_overrides = perJobOverrides;
    }
    await requestTedWithTimeout<Record<string, unknown>>(
      state.client,
      "ted.llm.provider.set",
      params,
    );
    await loadTedLlmProvider(state);
  } catch (error) {
    state.tedLlmProviderError = String(error);
  } finally {
    state.tedLlmProviderLoading = false;
  }
}

export async function loadTedLlmRoutingPolicy(state: TedWorkbenchState) {
  if (!state.client || !state.connected || state.tedLlmRoutingPolicyLoading) {
    return;
  }
  state.tedLlmRoutingPolicyLoading = true;
  state.tedLlmRoutingPolicyError = null;
  try {
    const response = await requestTedWithTimeout<TedLlmRoutingPolicy>(
      state.client,
      "ted.llm.routing.get",
      {},
    );
    state.tedLlmRoutingPolicy = response;
  } catch (error) {
    state.tedLlmRoutingPolicyError = String(error);
  } finally {
    state.tedLlmRoutingPolicyLoading = false;
  }
}

export async function saveTedLlmRoutingPolicy(
  state: TedWorkbenchState,
  payload: Record<string, unknown>,
) {
  if (!state.client || !state.connected || state.tedLlmRoutingPolicySaveBusy) {
    return;
  }
  state.tedLlmRoutingPolicySaveBusy = true;
  state.tedLlmRoutingPolicySaveError = null;
  state.tedLlmRoutingPolicySaveResult = null;
  try {
    await requestTedWithTimeout<Record<string, unknown>>(
      state.client,
      "ted.llm.routing.set",
      payload,
    );
    state.tedLlmRoutingPolicySaveResult = "Routing policy updated";
    await loadTedLlmRoutingPolicy(state);
  } catch (error) {
    state.tedLlmRoutingPolicySaveError = String(error);
  } finally {
    state.tedLlmRoutingPolicySaveBusy = false;
  }
}

export async function testTedLlmProvider(
  state: TedWorkbenchState,
  payload: { provider: string; model?: string; prompt?: string; entity?: string },
) {
  if (!state.client || !state.connected || state.tedLlmProviderTestBusy) {
    return;
  }
  state.tedLlmProviderTestBusy = true;
  state.tedLlmProviderTestError = null;
  state.tedLlmProviderTestResult = null;
  try {
    const result = await requestTedWithTimeout<TedLlmProviderTestResponse>(
      state.client,
      "ted.llm.provider.test",
      payload,
    );
    state.tedLlmProviderTestResult = result;
  } catch (error) {
    state.tedLlmProviderTestError = String(error);
  } finally {
    state.tedLlmProviderTestBusy = false;
  }
}

export async function loadTedWorkflowRegistry(state: TedWorkbenchState): Promise<void> {
  if (!state.client || !state.connected || state.tedWorkflowsLoading) {
    return;
  }
  state.tedWorkflowsLoading = true;
  state.tedWorkflowsError = null;
  try {
    const result = await requestTedWithTimeout<TedWorkflowRegistryResponse>(
      state.client,
      "ted.ops.workflows.list",
      {},
    );
    state.tedWorkflows = result;
  } catch (err) {
    state.tedWorkflowsError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedWorkflowsLoading = false;
  }
}

export async function upsertTedWorkflow(
  state: TedWorkbenchState,
  workflow: TedWorkflowDefinition | Record<string, unknown>,
): Promise<void> {
  if (!state.client || !state.connected || state.tedWorkflowMutationBusy) {
    return;
  }
  state.tedWorkflowMutationBusy = true;
  state.tedWorkflowMutationError = null;
  state.tedWorkflowMutationResult = null;
  try {
    await requestTedWithTimeout<Record<string, unknown>>(state.client, "ted.ops.workflows.mutate", {
      action: "upsert",
      workflow,
    });
    state.tedWorkflowMutationResult = "Workflow saved";
    await loadTedWorkflowRegistry(state);
  } catch (err) {
    state.tedWorkflowMutationError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedWorkflowMutationBusy = false;
  }
}

export async function removeTedWorkflow(
  state: TedWorkbenchState,
  workflowId: string,
): Promise<void> {
  if (!state.client || !state.connected || state.tedWorkflowMutationBusy) {
    return;
  }
  state.tedWorkflowMutationBusy = true;
  state.tedWorkflowMutationError = null;
  state.tedWorkflowMutationResult = null;
  try {
    await requestTedWithTimeout<Record<string, unknown>>(state.client, "ted.ops.workflows.mutate", {
      action: "remove",
      workflow_id: workflowId,
    });
    state.tedWorkflowMutationResult = `Workflow removed: ${workflowId}`;
    await loadTedWorkflowRegistry(state);
    await loadTedWorkflowRuns(state);
  } catch (err) {
    state.tedWorkflowMutationError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedWorkflowMutationBusy = false;
  }
}

export async function runTedWorkflow(
  state: TedWorkbenchState,
  workflowId: string,
  dryRun = true,
): Promise<void> {
  if (!state.client || !state.connected || state.tedWorkflowRunBusy) {
    return;
  }
  state.tedWorkflowRunBusy = true;
  state.tedWorkflowRunError = null;
  state.tedWorkflowRunResult = null;
  try {
    const result = await requestTedWithTimeout<Record<string, unknown>>(
      state.client,
      "ted.ops.workflows.run",
      { workflow_id: workflowId, dry_run: dryRun },
    );
    state.tedWorkflowRunResult = result;
    await loadTedWorkflowRuns(state, workflowId);
  } catch (err) {
    state.tedWorkflowRunError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedWorkflowRunBusy = false;
  }
}

export async function loadTedWorkflowRuns(
  state: TedWorkbenchState,
  workflowId?: string,
  limit = 25,
): Promise<void> {
  if (!state.client || !state.connected || state.tedWorkflowRunsLoading) {
    return;
  }
  state.tedWorkflowRunsLoading = true;
  state.tedWorkflowRunsError = null;
  try {
    const result = await requestTedWithTimeout<TedWorkflowRunsResponse>(
      state.client,
      "ted.ops.workflows.runs",
      { workflow_id: workflowId, limit },
    );
    state.tedWorkflowRuns = result;
  } catch (err) {
    state.tedWorkflowRunsError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedWorkflowRunsLoading = false;
  }
}

export async function loadTedMemoryPreferences(
  state: TedWorkbenchState,
  params?: { scope?: string; entity?: string },
): Promise<void> {
  if (!state.client || !state.connected || state.tedMemoryPreferencesLoading) {
    return;
  }
  state.tedMemoryPreferencesLoading = true;
  state.tedMemoryPreferencesError = null;
  try {
    const result = await requestTedWithTimeout<TedMemoryPreferencesResponse>(
      state.client,
      "ted.ops.memory.preferences.list",
      params || {},
    );
    state.tedMemoryPreferences = result;
  } catch (err) {
    state.tedMemoryPreferencesError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedMemoryPreferencesLoading = false;
  }
}

export async function upsertTedMemoryPreference(
  state: TedWorkbenchState,
  payload: Record<string, unknown>,
): Promise<void> {
  if (!state.client || !state.connected || state.tedMemoryMutationBusy) {
    return;
  }
  state.tedMemoryMutationBusy = true;
  state.tedMemoryMutationError = null;
  state.tedMemoryMutationResult = null;
  try {
    await requestTedWithTimeout<Record<string, unknown>>(
      state.client,
      "ted.ops.memory.preferences.upsert",
      payload,
    );
    state.tedMemoryMutationResult = "Memory preference saved";
    await loadTedMemoryPreferences(state);
  } catch (err) {
    state.tedMemoryMutationError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedMemoryMutationBusy = false;
  }
}

export async function forgetTedMemoryPreference(
  state: TedWorkbenchState,
  payload: Record<string, unknown>,
): Promise<void> {
  if (!state.client || !state.connected || state.tedMemoryMutationBusy) {
    return;
  }
  state.tedMemoryMutationBusy = true;
  state.tedMemoryMutationError = null;
  state.tedMemoryMutationResult = null;
  try {
    await requestTedWithTimeout<Record<string, unknown>>(
      state.client,
      "ted.ops.memory.preferences.forget",
      payload,
    );
    state.tedMemoryMutationResult = "Memory preference forgotten";
    await loadTedMemoryPreferences(state);
  } catch (err) {
    state.tedMemoryMutationError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedMemoryMutationBusy = false;
  }
}

export async function exportTedMemoryPreferences(
  state: TedWorkbenchState,
  entity?: string,
): Promise<void> {
  if (!state.client || !state.connected || state.tedMemoryExportLoading) {
    return;
  }
  state.tedMemoryExportLoading = true;
  state.tedMemoryExportError = null;
  try {
    const result = await requestTedWithTimeout<TedMemoryExportResponse>(
      state.client,
      "ted.ops.memory.preferences.export",
      entity ? { entity } : {},
    );
    state.tedMemoryExport = result;
  } catch (err) {
    state.tedMemoryExportError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedMemoryExportLoading = false;
  }
}

export async function loadTedMcpTrustPolicy(state: TedWorkbenchState): Promise<void> {
  if (!state.client || !state.connected || state.tedMcpTrustPolicyLoading) {
    return;
  }
  state.tedMcpTrustPolicyLoading = true;
  state.tedMcpTrustPolicyError = null;
  try {
    const result = await requestTedWithTimeout<TedMcpTrustPolicy>(
      state.client,
      "ted.ops.mcp.trust_policy.get",
      {},
    );
    state.tedMcpTrustPolicy = result;
  } catch (err) {
    state.tedMcpTrustPolicyError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedMcpTrustPolicyLoading = false;
  }
}

export async function saveTedMcpTrustPolicy(
  state: TedWorkbenchState,
  payload: Record<string, unknown>,
): Promise<void> {
  if (!state.client || !state.connected || state.tedMcpTrustPolicySaveBusy) {
    return;
  }
  state.tedMcpTrustPolicySaveBusy = true;
  state.tedMcpTrustPolicySaveError = null;
  state.tedMcpTrustPolicySaveResult = null;
  try {
    await requestTedWithTimeout<Record<string, unknown>>(
      state.client,
      "ted.ops.mcp.trust_policy.set",
      payload,
    );
    state.tedMcpTrustPolicySaveResult = "MCP trust policy updated";
    await loadTedMcpTrustPolicy(state);
  } catch (err) {
    state.tedMcpTrustPolicySaveError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedMcpTrustPolicySaveBusy = false;
  }
}

export async function setTedMcpToolPolicy(
  state: TedWorkbenchState,
  toolAlias: string,
  action: "read_only" | "approval_required" | "deny",
): Promise<void> {
  if (!state.client || !state.connected || state.tedMcpToolPolicyBusy) {
    return;
  }
  state.tedMcpToolPolicyBusy = true;
  state.tedMcpToolPolicyError = null;
  state.tedMcpToolPolicyResult = null;
  try {
    await requestTedWithTimeout<Record<string, unknown>>(
      state.client,
      "ted.ops.mcp.tool_policy.set",
      {
        tool_alias: toolAlias,
        action,
      },
    );
    state.tedMcpToolPolicyResult = `Tool policy updated: ${toolAlias} -> ${action}`;
    await loadTedMcpTrustPolicy(state);
  } catch (err) {
    state.tedMcpToolPolicyError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedMcpToolPolicyBusy = false;
  }
}

export async function loadTedSetupState(state: TedWorkbenchState): Promise<void> {
  if (!state.client || !state.connected || state.tedSetupStateLoading) {
    return;
  }
  state.tedSetupStateLoading = true;
  state.tedSetupStateError = null;
  try {
    const result = await requestTedWithTimeout<TedSetupStateResponse>(
      state.client,
      "ted.ops.setup.state",
      {},
    );
    state.tedSetupState = result;
  } catch (err) {
    state.tedSetupStateError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedSetupStateLoading = false;
  }
}

export async function saveTedSetupGraphProfile(
  state: TedWorkbenchState,
  payload: {
    profile_id: "olumie" | "everest";
    tenant_id: string;
    client_id: string;
    delegated_scopes: string[];
    clear_auth?: boolean;
  },
): Promise<void> {
  if (!state.client || !state.connected || state.tedSetupSaveBusy) {
    return;
  }
  state.tedSetupSaveBusy = true;
  state.tedSetupSaveError = null;
  state.tedSetupSaveResult = null;
  try {
    await requestTedWithTimeout<Record<string, unknown>>(
      state.client,
      "ted.ops.setup.graph_profile.set",
      payload,
    );
    state.tedSetupSaveResult = `Saved setup profile ${payload.profile_id}`;
    await loadTedSetupState(state);
  } catch (err) {
    state.tedSetupSaveError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedSetupSaveBusy = false;
  }
}

export async function loadTedGraphDeltaStatus(
  state: TedWorkbenchState,
  params?: { profile_id?: string; workload?: string },
): Promise<void> {
  if (!state.client || !state.connected || state.tedGraphDeltaStatusLoading) {
    return;
  }
  state.tedGraphDeltaStatusLoading = true;
  state.tedGraphDeltaStatusError = null;
  try {
    const result = await requestTedWithTimeout<TedGraphDeltaStatusResponse>(
      state.client,
      "ted.ops.graph.delta.status",
      params || {},
    );
    state.tedGraphDeltaStatus = result;
  } catch (err) {
    state.tedGraphDeltaStatusError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedGraphDeltaStatusLoading = false;
  }
}

export async function runTedGraphDelta(
  state: TedWorkbenchState,
  payload: { profile_id?: string; workload?: string },
): Promise<void> {
  if (!state.client || !state.connected || state.tedGraphDeltaRunBusy) {
    return;
  }
  state.tedGraphDeltaRunBusy = true;
  state.tedGraphDeltaRunError = null;
  state.tedGraphDeltaRunResult = null;
  try {
    const result = await requestTedWithTimeout<TedGraphDeltaRunResponse>(
      state.client,
      "ted.ops.graph.delta.run",
      payload,
    );
    state.tedGraphDeltaRunResult = result;
    await loadTedGraphDeltaStatus(state, payload);
  } catch (err) {
    state.tedGraphDeltaRunError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedGraphDeltaRunBusy = false;
  }
}

export async function loadTedEvalMatrix(state: TedWorkbenchState): Promise<void> {
  if (!state.client || !state.connected || state.tedEvalMatrixLoading) {
    return;
  }
  state.tedEvalMatrixLoading = true;
  state.tedEvalMatrixError = null;
  try {
    const result = await requestTedWithTimeout<TedEvalMatrixConfigResponse>(
      state.client,
      "ted.ops.eval.matrix.get",
      {},
    );
    state.tedEvalMatrix = result;
  } catch (err) {
    state.tedEvalMatrixError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedEvalMatrixLoading = false;
  }
}

export async function saveTedEvalMatrix(
  state: TedWorkbenchState,
  payload: Record<string, unknown>,
): Promise<void> {
  if (!state.client || !state.connected || state.tedEvalMatrixSaveBusy) {
    return;
  }
  state.tedEvalMatrixSaveBusy = true;
  state.tedEvalMatrixSaveError = null;
  state.tedEvalMatrixSaveResult = null;
  try {
    await requestTedWithTimeout<Record<string, unknown>>(
      state.client,
      "ted.ops.eval.matrix.set",
      payload,
    );
    state.tedEvalMatrixSaveResult = "Evaluation matrix saved";
    await loadTedEvalMatrix(state);
  } catch (err) {
    state.tedEvalMatrixSaveError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedEvalMatrixSaveBusy = false;
  }
}

export async function runTedEvalMatrix(
  state: TedWorkbenchState,
  payload?: Record<string, unknown>,
): Promise<void> {
  if (!state.client || !state.connected || state.tedEvalMatrixRunBusy) {
    return;
  }
  state.tedEvalMatrixRunBusy = true;
  state.tedEvalMatrixRunError = null;
  state.tedEvalMatrixRunResult = null;
  try {
    const result = await requestTedWithTimeout<TedEvalMatrixRunResponse>(
      state.client,
      "ted.ops.eval.matrix.run",
      payload || {},
    );
    state.tedEvalMatrixRunResult = result;
    await loadTedEvalMatrix(state);
  } catch (err) {
    state.tedEvalMatrixRunError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedEvalMatrixRunBusy = false;
  }
}

export async function loadTedFrictionSummary(
  state: TedWorkbenchState,
  params?: { workflow_id?: string; run_id?: string; trace_id?: string; limit?: number },
): Promise<void> {
  if (!state.client || !state.connected || state.tedFrictionSummaryLoading) {
    return;
  }
  state.tedFrictionSummaryLoading = true;
  state.tedFrictionSummaryError = null;
  try {
    const result = await requestTedWithTimeout<TedFrictionSummaryResponse>(
      state.client,
      "ted.ops.friction.summary",
      params || {},
    );
    state.tedFrictionSummary = result;
  } catch (err) {
    state.tedFrictionSummaryError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedFrictionSummaryLoading = false;
  }
}

export async function loadTedFrictionRuns(
  state: TedWorkbenchState,
  params?: { workflow_id?: string; run_id?: string; trace_id?: string; limit?: number },
): Promise<void> {
  if (!state.client || !state.connected || state.tedFrictionRunsLoading) {
    return;
  }
  state.tedFrictionRunsLoading = true;
  state.tedFrictionRunsError = null;
  try {
    const result = await requestTedWithTimeout<TedFrictionRunsResponse>(
      state.client,
      "ted.ops.friction.runs",
      params || {},
    );
    state.tedFrictionRuns = result;
  } catch (err) {
    state.tedFrictionRunsError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedFrictionRunsLoading = false;
  }
}

export async function loadTedOutcomesDashboard(
  state: TedWorkbenchState,
  params?: { workflow_id?: string; limit?: number },
): Promise<void> {
  if (!state.client || !state.connected || state.tedOutcomesDashboardLoading) {
    return;
  }
  state.tedOutcomesDashboardLoading = true;
  state.tedOutcomesDashboardError = null;
  try {
    const result = await requestTedWithTimeout<TedOutcomesDashboardResponse>(
      state.client,
      "ted.ops.outcomes.dashboard",
      params || {},
    );
    state.tedOutcomesDashboard = result;
  } catch (err) {
    state.tedOutcomesDashboardError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedOutcomesDashboardLoading = false;
  }
}

export async function loadTedOutcomesFrictionTrends(
  state: TedWorkbenchState,
  params?: { workflow_id?: string; days?: number },
): Promise<void> {
  if (!state.client || !state.connected || state.tedOutcomesFrictionTrendsLoading) {
    return;
  }
  state.tedOutcomesFrictionTrendsLoading = true;
  state.tedOutcomesFrictionTrendsError = null;
  try {
    const result = await requestTedWithTimeout<TedOutcomesFrictionTrendsResponse>(
      state.client,
      "ted.ops.outcomes.friction_trends",
      params || {},
    );
    state.tedOutcomesFrictionTrends = result;
  } catch (err) {
    state.tedOutcomesFrictionTrendsError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedOutcomesFrictionTrendsLoading = false;
  }
}

export async function loadTedOutcomesJob(
  state: TedWorkbenchState,
  params: { job_id: string; limit?: number },
): Promise<void> {
  if (!state.client || !state.connected || state.tedOutcomesJobLoading) {
    return;
  }
  state.tedOutcomesJobLoading = true;
  state.tedOutcomesJobError = null;
  try {
    const result = await requestTedWithTimeout<TedOutcomesJobResponse>(
      state.client,
      "ted.ops.outcomes.job",
      params,
    );
    state.tedOutcomesJob = result;
  } catch (err) {
    state.tedOutcomesJobError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedOutcomesJobLoading = false;
  }
}

export async function loadTedReplayCorpus(
  state: TedWorkbenchState,
  params?: { include?: "golden" | "adversarial"; limit?: number },
): Promise<void> {
  if (!state.client || !state.connected || state.tedReplayCorpusLoading) {
    return;
  }
  state.tedReplayCorpusLoading = true;
  state.tedReplayCorpusError = null;
  try {
    const result = await requestTedWithTimeout<TedReplayCorpusResponse>(
      state.client,
      "ted.ops.replay.corpus",
      params || {},
    );
    state.tedReplayCorpus = result;
  } catch (err) {
    state.tedReplayCorpusError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedReplayCorpusLoading = false;
  }
}

export async function runTedReplay(
  state: TedWorkbenchState,
  params?: {
    include?: "golden" | "adversarial";
    scenario_ids?: string[];
    release_gate?: {
      min_pass_rate?: number;
      max_safety_failures?: number;
      max_adversarial_failures?: number;
    };
    simulate?: {
      force_output_failure_ids?: string[];
      force_trajectory_failure_ids?: string[];
      force_safety_failure_ids?: string[];
    };
  },
): Promise<void> {
  if (!state.client || !state.connected || state.tedReplayRunBusy) {
    return;
  }
  state.tedReplayRunBusy = true;
  state.tedReplayRunError = null;
  state.tedReplayRunResult = null;
  try {
    const result = await requestTedWithTimeout<TedReplayRunResponse>(
      state.client,
      "ted.ops.replay.run",
      params || {},
    );
    state.tedReplayRunResult = result;
    await loadTedReplayRuns(state, { limit: 20 });
  } catch (err) {
    state.tedReplayRunError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedReplayRunBusy = false;
  }
}

export async function loadTedReplayRuns(
  state: TedWorkbenchState,
  params?: { limit?: number; include_details?: boolean },
): Promise<void> {
  if (!state.client || !state.connected || state.tedReplayRunsLoading) {
    return;
  }
  state.tedReplayRunsLoading = true;
  state.tedReplayRunsError = null;
  try {
    const result = await requestTedWithTimeout<TedReplayRunsResponse>(
      state.client,
      "ted.ops.replay.runs",
      params || {},
    );
    state.tedReplayRuns = result;
  } catch (err) {
    state.tedReplayRunsError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedReplayRunsLoading = false;
  }
}

export async function loadTedMeetingsUpcoming(state: TedWorkbenchState): Promise<void> {
  if (!state.client || !state.connected || state.tedMeetingsLoading) {
    return;
  }
  state.tedMeetingsLoading = true;
  state.tedMeetingsError = null;
  try {
    const result = await requestTedWithTimeout<TedMeetingUpcomingResponse>(
      state.client,
      "ted.meeting.upcoming",
      {},
    );
    state.tedMeetingsUpcoming = result;
  } catch (err) {
    state.tedMeetingsError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedMeetingsLoading = false;
  }
}

export async function loadTedCommitments(state: TedWorkbenchState): Promise<void> {
  if (!state.client || !state.connected || state.tedCommitmentsLoading) {
    return;
  }
  state.tedCommitmentsLoading = true;
  state.tedCommitmentsError = null;
  try {
    const result = await requestTedWithTimeout<TedCommitmentsListResponse>(
      state.client,
      "ted.commitments.list",
      {},
    );
    state.tedCommitments = result;
  } catch (err) {
    state.tedCommitmentsError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedCommitmentsLoading = false;
  }
}

export async function loadTedActions(state: TedWorkbenchState): Promise<void> {
  if (!state.client || !state.connected || state.tedActionsLoading) {
    return;
  }
  state.tedActionsLoading = true;
  state.tedActionsError = null;
  try {
    const result = await requestTedWithTimeout<TedActionsListResponse>(
      state.client,
      "ted.gtd.actions.list",
      {},
    );
    state.tedActions = result;
  } catch (err) {
    state.tedActionsError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedActionsLoading = false;
  }
}

export async function loadTedWaitingFor(state: TedWorkbenchState): Promise<void> {
  if (!state.client || !state.connected || state.tedWaitingForLoading) {
    return;
  }
  state.tedWaitingForLoading = true;
  state.tedWaitingForError = null;
  try {
    const result = await requestTedWithTimeout<TedWaitingForListResponse>(
      state.client,
      "ted.gtd.waiting_for.list",
      {},
    );
    state.tedWaitingFor = result;
  } catch (err) {
    state.tedWaitingForError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedWaitingForLoading = false;
  }
}

export async function loadTedTrustMetrics(state: TedWorkbenchState): Promise<void> {
  if (!state.client || !state.connected || state.tedTrustMetricsLoading) {
    return;
  }
  state.tedTrustMetricsLoading = true;
  state.tedTrustMetricsError = null;
  try {
    const result = await requestTedWithTimeout<TedTrustMetricsResponse>(
      state.client,
      "ted.reporting.trust_metrics",
      {},
    );
    state.tedTrustMetrics = result;
  } catch (err) {
    state.tedTrustMetricsError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedTrustMetricsLoading = false;
  }
}

export async function loadTedDeepWorkMetrics(state: TedWorkbenchState): Promise<void> {
  if (!state.client || !state.connected || state.tedDeepWorkMetricsLoading) {
    return;
  }
  state.tedDeepWorkMetricsLoading = true;
  state.tedDeepWorkMetricsError = null;
  try {
    const result = await requestTedWithTimeout<TedDeepWorkMetricsResponse>(
      state.client,
      "ted.reporting.deep_work_metrics",
      {},
    );
    state.tedDeepWorkMetrics = result;
  } catch (err) {
    state.tedDeepWorkMetricsError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedDeepWorkMetricsLoading = false;
  }
}

export async function loadTedDraftQueue(state: TedWorkbenchState): Promise<void> {
  if (!state.client || !state.connected || state.tedDraftQueueLoading) {
    return;
  }
  state.tedDraftQueueLoading = true;
  state.tedDraftQueueError = null;
  try {
    const result = await requestTedWithTimeout<TedDraftQueueResponse>(
      state.client,
      "ted.drafts.queue",
      {},
    );
    state.tedDraftQueue = result;
  } catch (e: unknown) {
    state.tedDraftQueueError = e instanceof Error ? e.message : "Failed to load draft queue";
  } finally {
    state.tedDraftQueueLoading = false;
  }
}

export async function loadTedEventLogStats(state: TedWorkbenchState): Promise<void> {
  if (!state.client || !state.connected || state.tedEventLogStatsLoading) {
    return;
  }
  state.tedEventLogStatsLoading = true;
  state.tedEventLogStatsError = null;
  try {
    const result = await requestTedWithTimeout<TedEventLogStatsResponse>(
      state.client,
      "ted.events.stats",
      {},
    );
    state.tedEventLogStats = result;
  } catch (err) {
    state.tedEventLogStatsError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedEventLogStatsLoading = false;
  }
}

export async function loadTedPlannerPlans(
  state: TedWorkbenchState,
  profileId = "olumie",
): Promise<void> {
  if (!state.client || !state.connected || state.tedPlannerPlansLoading) {
    return;
  }
  state.tedPlannerPlansLoading = true;
  state.tedPlannerPlansError = null;
  try {
    const result = await requestTedWithTimeout<TedPlannerListResponse>(
      state.client,
      "ted.planner.plans.list",
      { profile_id: profileId },
    );
    state.tedPlannerPlans = result;
  } catch (err) {
    state.tedPlannerPlansError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedPlannerPlansLoading = false;
  }
}

export async function loadTedPlannerTasks(
  state: TedWorkbenchState,
  profileId: string,
  planId: string,
  bucketId?: string,
): Promise<void> {
  if (!state.client || !state.connected || state.tedPlannerTasksLoading) {
    return;
  }
  state.tedPlannerTasksLoading = true;
  state.tedPlannerTasksError = null;
  try {
    const params: Record<string, unknown> = { profile_id: profileId, plan_id: planId };
    if (bucketId) {
      params.bucket_id = bucketId;
    }
    const result = await requestTedWithTimeout<TedPlannerTasksResponse>(
      state.client,
      "ted.planner.tasks.list",
      params,
    );
    state.tedPlannerTasks = result;
  } catch (err) {
    state.tedPlannerTasksError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedPlannerTasksLoading = false;
  }
}

export async function loadTedTodoLists(
  state: TedWorkbenchState,
  profileId = "olumie",
): Promise<void> {
  if (!state.client || !state.connected || state.tedTodoListsLoading) {
    return;
  }
  state.tedTodoListsLoading = true;
  state.tedTodoListsError = null;
  try {
    const result = await requestTedWithTimeout<TedTodoListsResponse>(
      state.client,
      "ted.todo.lists",
      { profile_id: profileId },
    );
    state.tedTodoLists = result;
  } catch (err) {
    state.tedTodoListsError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedTodoListsLoading = false;
  }
}

export async function loadTedTodoTasks(
  state: TedWorkbenchState,
  profileId: string,
  listId: string,
): Promise<void> {
  if (!state.client || !state.connected || state.tedTodoTasksLoading) {
    return;
  }
  state.tedTodoTasksLoading = true;
  state.tedTodoTasksError = null;
  try {
    const result = await requestTedWithTimeout<TedTodoTasksResponse>(
      state.client,
      "ted.todo.tasks.list",
      { profile_id: profileId, list_id: listId },
    );
    state.tedTodoTasks = result;
  } catch (err) {
    state.tedTodoTasksError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedTodoTasksLoading = false;
  }
}

export async function loadTedSyncReconciliation(
  state: TedWorkbenchState,
  profileId = "olumie",
): Promise<void> {
  if (!state.client || !state.connected || state.tedSyncReconciliationLoading) {
    return;
  }
  state.tedSyncApproveResult = null;
  state.tedSyncRejectResult = null;
  state.tedSyncReconciliationLoading = true;
  state.tedSyncReconciliationError = null;
  try {
    const result = await requestTedWithTimeout<TedSyncReconciliationResponse>(
      state.client,
      "ted.sync.reconcile",
      { profile_id: profileId },
    );
    state.tedSyncReconciliation = result;
  } catch (err) {
    state.tedSyncReconciliationError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedSyncReconciliationLoading = false;
  }
}

export async function loadTedSyncProposals(
  state: TedWorkbenchState,
  profileId = "olumie",
): Promise<void> {
  if (!state.client || !state.connected || state.tedSyncProposalsLoading) {
    return;
  }
  state.tedSyncApproveResult = null;
  state.tedSyncRejectResult = null;
  state.tedSyncProposalsLoading = true;
  state.tedSyncProposalsError = null;
  try {
    const result = await requestTedWithTimeout<TedSyncProposalsResponse>(
      state.client,
      "ted.sync.proposals.list",
      { profile_id: profileId },
    );
    state.tedSyncProposals = result;
  } catch (err) {
    state.tedSyncProposalsError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedSyncProposalsLoading = false;
  }
}

export async function approveTedSyncProposal(
  state: TedWorkbenchState,
  profileId: string,
  proposalId: string,
): Promise<void> {
  if (!state.client || !state.connected || state.tedSyncApproveBusy) {
    return;
  }
  state.tedSyncApproveBusy = proposalId;
  state.tedSyncApproveError = null;
  state.tedSyncApproveResult = null;
  try {
    const result = await requestTedWithTimeout<Record<string, unknown>>(
      state.client,
      "ted.sync.proposals.approve",
      { profile_id: profileId, proposal_id: proposalId },
    );
    state.tedSyncApproveResult = JSON.stringify(result, null, 2);
  } catch (err) {
    state.tedSyncApproveError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedSyncApproveBusy = null;
  }
}

export async function rejectTedSyncProposal(
  state: TedWorkbenchState,
  profileId: string,
  proposalId: string,
): Promise<void> {
  if (!state.client || !state.connected || state.tedSyncRejectBusy) {
    return;
  }
  state.tedSyncApproveResult = null;
  state.tedSyncRejectBusy = proposalId;
  state.tedSyncRejectError = null;
  state.tedSyncRejectResult = null;
  try {
    await requestTedWithTimeout<Record<string, unknown>>(
      state.client,
      "ted.sync.proposals.reject",
      { profile_id: profileId, proposal_id: proposalId },
    );
    state.tedSyncRejectResult = "Proposal rejected";
    // Reload proposals to reflect the rejection
    await loadTedSyncProposals(state, profileId);
  } catch (err) {
    state.tedSyncRejectError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedSyncRejectBusy = null;
  }
}

export async function extractTedCommitments(
  state: TedWorkbenchState,
  profileId: string,
  messageId: string,
): Promise<void> {
  if (!state.client || !state.connected || state.tedExtractionLoading) {
    return;
  }
  state.tedExtractionLoading = true;
  state.tedExtractionError = null;
  try {
    const result = await requestTedWithTimeout<TedCommitmentExtractionResponse>(
      state.client,
      "ted.extraction.commitments",
      { profile_id: profileId, message_id: messageId },
    );
    state.tedExtractionResult = result;
  } catch (err) {
    state.tedExtractionError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedExtractionLoading = false;
  }
}

export async function loadTedImprovementProposals(
  app: TedWorkbenchState,
  status?: string,
): Promise<void> {
  if (!app.client || !app.connected || app.tedImprovementProposalsLoading) {
    return;
  }
  app.tedImprovementProposalsLoading = true;
  app.tedImprovementProposalsError = null;
  try {
    const res = await requestTedWithTimeout<TedImprovementProposalsResponse>(
      app.client,
      "ted.improvement.proposals.list",
      { status },
    );
    app.tedImprovementProposals = res?.proposals ?? [];
  } catch (err: unknown) {
    app.tedImprovementProposalsError =
      (err instanceof Error ? err.message : String(err)) || "Failed to load improvement proposals";
  } finally {
    app.tedImprovementProposalsLoading = false;
  }
}

export async function createTedImprovementProposal(
  app: TedWorkbenchState,
  params: {
    title: string;
    type: string;
    description: string;
    source?: string;
    change_spec?: Record<string, unknown>;
    evidence?: Record<string, unknown>;
  },
): Promise<void> {
  if (!app.client || !app.connected || app.tedImprovementCreateBusy) {
    return;
  }
  app.tedImprovementCreateBusy = true;
  app.tedImprovementCreateError = null;
  app.tedImprovementCreateResult = null;
  try {
    const res = await requestTedWithTimeout<{
      ok: boolean;
      proposal?: TedImprovementProposal;
      error?: string;
    }>(app.client, "ted.improvement.proposals.create", params);
    app.tedImprovementCreateResult = res?.ok
      ? `Created: ${res.proposal?.proposal_id}`
      : res?.error || "unknown error";
    if (res?.ok) {
      await loadTedImprovementProposals(app);
    }
  } catch (err: unknown) {
    app.tedImprovementCreateError =
      (err instanceof Error ? err.message : String(err)) || "Failed to create proposal";
  } finally {
    app.tedImprovementCreateBusy = false;
  }
}

export async function reviewTedImprovementProposal(
  app: TedWorkbenchState,
  proposalId: string,
  verdict: string,
  notes?: string,
): Promise<void> {
  if (!app.client || !app.connected || app.tedImprovementReviewBusy) {
    return;
  }
  app.tedImprovementReviewBusy = true;
  app.tedImprovementReviewError = null;
  app.tedImprovementReviewResult = null;
  try {
    const res = await requestTedWithTimeout<{
      ok: boolean;
      proposal_id?: string;
      status?: string;
      error?: string;
    }>(app.client, "ted.improvement.proposals.review", { proposal_id: proposalId, verdict, notes });
    app.tedImprovementReviewResult = res?.ok
      ? `${verdict}: ${proposalId}`
      : res?.error || "unknown error";
    if (res?.ok) {
      await loadTedImprovementProposals(app);
    }
  } catch (err: unknown) {
    app.tedImprovementReviewError =
      (err instanceof Error ? err.message : String(err)) || "Failed to review proposal";
  } finally {
    app.tedImprovementReviewBusy = false;
  }
}

export async function applyTedImprovementProposal(
  app: TedWorkbenchState,
  proposalId: string,
): Promise<void> {
  if (!app.client || !app.connected || app.tedImprovementApplyBusy) {
    return;
  }
  app.tedImprovementApplyBusy = true;
  app.tedImprovementApplyError = null;
  app.tedImprovementApplyResult = null;
  try {
    const res = await requestTedWithTimeout<TedImprovementApplyResponse>(
      app.client,
      "ted.improvement.proposals.apply",
      { proposal_id: proposalId },
    );
    app.tedImprovementApplyResult = res?.ok
      ? `Applied: ${proposalId}${res.config_applied ? ` (config: ${res.config_key})` : ""}`
      : ((res as unknown as Record<string, unknown>)?.error as string) || "unknown error";
    if (res?.ok) {
      await loadTedImprovementProposals(app);
    }
  } catch (err: unknown) {
    app.tedImprovementApplyError =
      (err instanceof Error ? err.message : String(err)) || "Failed to apply proposal";
  } finally {
    app.tedImprovementApplyBusy = false;
  }
}

export async function generateTedImprovementProposal(
  app: TedWorkbenchState,
  days?: number,
): Promise<void> {
  if (!app.client || !app.connected || app.tedImprovementGenerateBusy) {
    return;
  }
  app.tedImprovementGenerateBusy = true;
  app.tedImprovementGenerateError = null;
  app.tedImprovementGenerateResult = null;
  try {
    const res = await requestTedWithTimeout<TedImprovementGenerateResponse>(
      app.client,
      "ted.improvement.proposals.generate",
      { days: days || 30 },
    );
    app.tedImprovementGenerateResult = res ?? null;
  } catch (err: unknown) {
    app.tedImprovementGenerateError =
      (err instanceof Error ? err.message : String(err)) || "Failed to generate proposal";
  } finally {
    app.tedImprovementGenerateBusy = false;
  }
}

export async function loadTedTrustAutonomy(app: TedWorkbenchState): Promise<void> {
  if (!app.client || !app.connected || app.tedTrustAutonomyLoading) {
    return;
  }
  app.tedTrustAutonomyLoading = true;
  app.tedTrustAutonomyError = null;
  try {
    const res = await requestTedWithTimeout<{
      ok: boolean;
      evaluation: TedTrustAutonomyEvaluation;
    }>(app.client, "ted.trust.autonomy.evaluate", {});
    app.tedTrustAutonomy = res?.evaluation ?? null;
  } catch (err: unknown) {
    app.tedTrustAutonomyError =
      (err instanceof Error ? err.message : String(err)) || "Failed to evaluate trust autonomy";
  } finally {
    app.tedTrustAutonomyLoading = false;
  }
}

export async function loadTedFailureAggregation(
  app: TedWorkbenchState,
  days?: number,
): Promise<void> {
  if (!app.client || !app.connected || app.tedFailureAggregationLoading) {
    return;
  }
  app.tedFailureAggregationLoading = true;
  app.tedFailureAggregationError = null;
  try {
    const res = await requestTedWithTimeout<TedFailureAggregationResponse>(
      app.client,
      "ted.improvement.failure_aggregation",
      { days },
    );
    app.tedFailureAggregation = res ?? null;
  } catch (err: unknown) {
    app.tedFailureAggregationError =
      (err instanceof Error ? err.message : String(err)) || "Failed to aggregate failures";
  } finally {
    app.tedFailureAggregationLoading = false;
  }
}

// ─── Builder Lane Controllers (BL-010) ───

export async function loadBuilderLanePatterns(app: TedWorkbenchState): Promise<void> {
  if (!app.client || !app.connected || app.tedBuilderLanePatternsLoading) {
    return;
  }
  app.tedBuilderLanePatternsLoading = true;
  app.tedBuilderLanePatternsError = null;
  try {
    const res = await requestTedWithTimeout<Record<string, unknown>>(
      app.client,
      "ted.builder_lane.patterns",
      {},
    );
    app.tedBuilderLanePatterns = res ?? null;
  } catch (err: unknown) {
    app.tedBuilderLanePatternsError =
      (err instanceof Error ? err.message : String(err)) || "Failed to load patterns";
  } finally {
    app.tedBuilderLanePatternsLoading = false;
  }
}

export async function loadBuilderLaneStatus(app: TedWorkbenchState): Promise<void> {
  if (!app.client || !app.connected || app.tedBuilderLaneStatusLoading) {
    return;
  }
  app.tedBuilderLaneStatusLoading = true;
  try {
    const res = await requestTedWithTimeout<Record<string, unknown>>(
      app.client,
      "ted.builder_lane.status",
      {},
    );
    app.tedBuilderLaneStatus = res ?? null;
  } catch {
    /* non-fatal */
  } finally {
    app.tedBuilderLaneStatusLoading = false;
  }
}

export async function loadBuilderLaneMetrics(app: TedWorkbenchState): Promise<void> {
  if (!app.client || !app.connected || app.tedBuilderLaneMetricsLoading) {
    return;
  }
  app.tedBuilderLaneMetricsLoading = true;
  try {
    const res = await requestTedWithTimeout<Record<string, unknown>>(
      app.client,
      "ted.builder_lane.improvement_metrics",
      {},
    );
    app.tedBuilderLaneMetrics = res ?? null;
  } catch {
    /* non-fatal */
  } finally {
    app.tedBuilderLaneMetricsLoading = false;
  }
}

export async function generateFromPattern(
  app: TedWorkbenchState,
  domain: string,
  contextBucket?: Record<string, unknown>,
): Promise<void> {
  if (!app.client || !app.connected || app.tedBuilderLaneGenerateBusy) {
    return;
  }
  app.tedBuilderLaneGenerateBusy = true;
  try {
    await requestTedWithTimeout<Record<string, unknown>>(app.client, "ted.builder_lane.generate", {
      domain,
      context_bucket: contextBucket || {},
    });
    await loadTedImprovementProposals(app);
  } catch {
    /* non-fatal */
  } finally {
    app.tedBuilderLaneGenerateBusy = false;
  }
}

export async function revertAppliedProposal(
  app: TedWorkbenchState,
  proposalId: string,
): Promise<void> {
  if (!app.client || !app.connected || app.tedBuilderLaneRevertBusy) {
    return;
  }
  app.tedBuilderLaneRevertBusy = true;
  app.tedBuilderLaneRevertError = null;
  app.tedBuilderLaneRevertResult = null;
  try {
    const res = await requestTedWithTimeout<{ ok: boolean; proposal_id?: string; error?: string }>(
      app.client,
      "ted.builder_lane.revert",
      { proposal_id: proposalId },
    );
    app.tedBuilderLaneRevertResult = res?.ok
      ? `Reverted: ${proposalId}`
      : res?.error || "revert failed";
    if (res?.ok) {
      await loadTedImprovementProposals(app);
    }
  } catch (err: unknown) {
    app.tedBuilderLaneRevertError =
      (err instanceof Error ? err.message : String(err)) || "Failed to revert proposal";
  } finally {
    app.tedBuilderLaneRevertBusy = false;
  }
}

export async function submitCalibrationResponse(
  app: TedWorkbenchState,
  promptId: string,
  response: string,
  domain?: string,
  moment?: string,
): Promise<void> {
  if (!app.client || !app.connected || app.tedBuilderLaneCalibrationBusy) {
    return;
  }
  app.tedBuilderLaneCalibrationBusy = true;
  try {
    await requestTedWithTimeout<Record<string, unknown>>(
      app.client,
      "ted.builder_lane.calibration_response",
      { prompt_id: promptId, response, domain, moment },
    );
  } catch {
    /* non-fatal */
  } finally {
    app.tedBuilderLaneCalibrationBusy = false;
  }
}

export async function submitTedDraftForReviewById(
  state: TedWorkbenchState,
  draftId: string,
): Promise<void> {
  if (!state.client || !state.connected || state.tedDraftSubmitReviewLoading) {
    return;
  }
  state.tedDraftSubmitReviewLoading = true;
  state.tedDraftSubmitReviewError = null;
  try {
    await requestTedWithTimeout<Record<string, unknown>>(state.client, "ted.drafts.submit_review", {
      draft_id: draftId,
    });
    // Refresh draft queue after submit
    await loadTedDraftQueue(state);
  } catch (err) {
    state.tedDraftSubmitReviewError = err instanceof Error ? err.message : "Unknown error";
  } finally {
    state.tedDraftSubmitReviewLoading = false;
  }
}

export async function recordTedDeepWorkSession(
  state: TedWorkbenchState,
  durationMinutes: number,
  label?: string,
  entity?: string,
): Promise<void> {
  if (!state.client || !state.connected || state.tedDeepWorkSessionLoading) {
    return;
  }
  state.tedDeepWorkSessionLoading = true;
  state.tedDeepWorkSessionError = null;
  try {
    const params: Record<string, unknown> = { duration_minutes: durationMinutes };
    if (label) {
      params.label = label;
    }
    if (entity) {
      params.entity = entity;
    }
    const result = await requestTedWithTimeout<Record<string, unknown>>(
      state.client,
      "ted.deep_work.session",
      params,
    );
    state.tedDeepWorkSessionResult = result;
  } catch (err) {
    state.tedDeepWorkSessionError = err instanceof Error ? err.message : "Unknown error";
  } finally {
    state.tedDeepWorkSessionLoading = false;
  }
}

export async function loadTedGraphSyncStatus(
  state: TedWorkbenchState,
  profileId: string,
): Promise<void> {
  if (!state.client || !state.connected || state.tedGraphSyncStatusLoading) {
    return;
  }
  state.tedGraphSyncStatusLoading = true;
  state.tedGraphSyncStatusError = null;
  try {
    const result = await requestTedWithTimeout<Record<string, unknown>>(
      state.client,
      "ted.graph.sync.status",
      { profile_id: profileId },
    );
    state.tedGraphSyncStatusResult = result;
  } catch (err) {
    state.tedGraphSyncStatusError = err instanceof Error ? err.message : "Unknown error";
  } finally {
    state.tedGraphSyncStatusLoading = false;
  }
}

export async function loadTedIngestionStatus(state: TedWorkbenchState): Promise<void> {
  if (!state.client || !state.connected || state.tedIngestionStatusLoading) {
    return;
  }
  state.tedIngestionStatusLoading = true;
  state.tedIngestionStatusError = null;
  try {
    const result = await requestTedWithTimeout<Record<string, unknown>>(
      state.client,
      "ted.ops.ingestion.status",
      {},
    );
    state.tedIngestionStatus = result;
  } catch (err) {
    state.tedIngestionStatusError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedIngestionStatusLoading = false;
  }
}

export async function triggerTedIngestion(state: TedWorkbenchState): Promise<void> {
  if (!state.client || !state.connected || state.tedIngestionRunBusy) {
    return;
  }
  state.tedIngestionRunBusy = true;
  state.tedIngestionRunError = null;
  try {
    const result = await requestTedWithTimeout<Record<string, unknown>>(
      state.client,
      "ted.ops.ingestion.run",
      {},
    );
    state.tedIngestionRunResult = result;
    // Refresh ingestion status after a run
    await loadTedIngestionStatus(state);
  } catch (err) {
    state.tedIngestionRunError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedIngestionRunBusy = false;
  }
}

export async function loadTedDiscoveryStatus(state: TedWorkbenchState): Promise<void> {
  if (!state.client || !state.connected || state.tedDiscoveryStatusLoading) {
    return;
  }
  state.tedDiscoveryStatusLoading = true;
  state.tedDiscoveryStatusError = null;
  try {
    const result = await requestTedWithTimeout<Record<string, unknown>>(
      state.client,
      "ted.ops.onboarding.discovery.status",
      {},
    );
    state.tedDiscoveryStatus = result;
  } catch (err) {
    state.tedDiscoveryStatusError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedDiscoveryStatusLoading = false;
  }
}

export async function triggerTedDiscovery(
  state: TedWorkbenchState,
  profileId: string,
): Promise<void> {
  if (!state.client || !state.connected || state.tedDiscoveryRunBusy) {
    return;
  }
  state.tedDiscoveryRunBusy = true;
  state.tedDiscoveryRunError = null;
  try {
    const result = await requestTedWithTimeout<Record<string, unknown>>(
      state.client,
      "ted.ops.onboarding.discover",
      { profile_id: profileId },
    );
    state.tedDiscoveryRunResult = result;
    // Refresh discovery status after a run
    await loadTedDiscoveryStatus(state);
  } catch (err) {
    state.tedDiscoveryRunError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedDiscoveryRunBusy = false;
  }
}

export async function loadTedMcpExternalAdmission(
  state: TedWorkbenchState,
  serverId?: string,
): Promise<void> {
  if (!state.client || !state.connected || state.tedMcpExternalAdmissionLoading) {
    return;
  }
  state.tedMcpExternalAdmissionLoading = true;
  state.tedMcpExternalAdmissionError = null;
  try {
    const result = await requestTedWithTimeout<TedMcpExternalAdmissionResponse>(
      state.client,
      "ted.ops.mcp.external.admission",
      serverId ? { server_id: serverId } : {},
    );
    state.tedMcpExternalAdmission = result;
  } catch (err) {
    state.tedMcpExternalAdmissionError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedMcpExternalAdmissionLoading = false;
  }
}

export async function loadTedMcpExternalRevalidationStatus(
  state: TedWorkbenchState,
): Promise<void> {
  if (!state.client || !state.connected || state.tedMcpExternalRevalidationStatusLoading) {
    return;
  }
  state.tedMcpExternalRevalidationStatusLoading = true;
  state.tedMcpExternalRevalidationStatusError = null;
  try {
    const result = await requestTedWithTimeout<TedMcpExternalRevalidationStatusResponse>(
      state.client,
      "ted.ops.mcp.external.revalidate.status",
      {},
    );
    state.tedMcpExternalRevalidationStatus = result;
  } catch (err) {
    state.tedMcpExternalRevalidationStatusError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedMcpExternalRevalidationStatusLoading = false;
  }
}

export async function runTedMcpExternalRevalidate(
  state: TedWorkbenchState,
  serverId?: string,
): Promise<void> {
  if (!state.client || !state.connected || state.tedMcpExternalRevalidateBusy) {
    return;
  }
  state.tedMcpExternalRevalidateBusy = true;
  state.tedMcpExternalRevalidateError = null;
  state.tedMcpExternalRevalidateResult = null;
  try {
    const result = await requestTedWithTimeout<Record<string, unknown>>(
      state.client,
      "ted.ops.mcp.external.revalidate",
      serverId ? { server_id: serverId } : {},
    );
    state.tedMcpExternalRevalidateResult = result;
    await loadTedMcpExternalRevalidationStatus(state);
    await loadTedMcpExternalAdmission(state, serverId);
  } catch (err) {
    state.tedMcpExternalRevalidateError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedMcpExternalRevalidateBusy = false;
  }
}

export async function loadTedExternalMcpServers(state: TedWorkbenchState): Promise<void> {
  if (!state.client || !state.connected || state.tedExternalMcpServersLoading) {
    return;
  }
  state.tedExternalMcpServersLoading = true;
  state.tedExternalMcpServersError = null;
  try {
    const result = await requestTedWithTimeout<TedExternalMcpServersResponse>(
      state.client,
      "ted.ops.mcp.external.servers.list",
      {},
    );
    state.tedExternalMcpServers = result;
    await loadTedMcpExternalAdmission(state);
    await loadTedMcpExternalRevalidationStatus(state);
  } catch (err) {
    state.tedExternalMcpServersError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedExternalMcpServersLoading = false;
  }
}

export async function loadTedExternalMcpTools(
  state: TedWorkbenchState,
  params?: { server_id?: string; refresh?: boolean },
): Promise<void> {
  if (!state.client || !state.connected || state.tedExternalMcpToolsLoading) {
    return;
  }
  state.tedExternalMcpToolsLoading = true;
  state.tedExternalMcpToolsError = null;
  try {
    const payload: Record<string, unknown> = {};
    if (params?.server_id) {
      payload.server_id = params.server_id;
    }
    if (params?.refresh) {
      payload.refresh = true;
    }
    const result = await requestTedWithTimeout<TedExternalMcpToolsResponse>(
      state.client,
      "ted.ops.mcp.external.tools.list",
      payload,
    );
    state.tedExternalMcpTools = result;
  } catch (err) {
    state.tedExternalMcpToolsError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedExternalMcpToolsLoading = false;
  }
}

export async function testTedExternalMcpServer(
  state: TedWorkbenchState,
  serverId: string,
): Promise<void> {
  if (!state.client || !state.connected || state.tedExternalMcpTestBusyServerId) {
    return;
  }
  state.tedExternalMcpTestBusyServerId = serverId;
  state.tedExternalMcpTestError = null;
  state.tedExternalMcpTestResult = null;
  try {
    const result = await requestTedWithTimeout<TedExternalMcpServerTestResponse>(
      state.client,
      "ted.ops.mcp.external.server.test",
      { server_id: serverId },
    );
    state.tedExternalMcpTestResult = result;
    await loadTedMcpExternalAdmission(state, serverId);
  } catch (err) {
    state.tedExternalMcpTestError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedExternalMcpTestBusyServerId = null;
  }
}

export async function upsertTedExternalMcpServer(
  state: TedWorkbenchState,
  payload: {
    server_id: string;
    url: string;
    enabled?: boolean;
    timeout_ms?: number;
    auth_token_env?: string;
    auth_header_name?: string;
    description?: string;
    trust_tier?: "sandboxed" | "trusted_read" | "trusted_write";
    allow_tools?: string[];
    deny_tools?: string[];
    attestation_status?: "pending" | "attested" | "revoked";
    attested_at?: string;
    scope_verified?: string[];
  },
): Promise<void> {
  if (!state.client || !state.connected || state.tedExternalMcpMutationBusy) {
    return;
  }
  state.tedExternalMcpMutationBusy = true;
  state.tedExternalMcpMutationError = null;
  state.tedExternalMcpMutationResult = null;
  try {
    await requestTedWithTimeout<Record<string, unknown>>(
      state.client,
      "ted.ops.mcp.external.server.upsert",
      payload,
    );
    state.tedExternalMcpMutationResult = `Saved ${payload.server_id}`;
    await loadTedExternalMcpServers(state);
    await loadTedExternalMcpTools(state, { server_id: payload.server_id, refresh: true });
  } catch (err) {
    state.tedExternalMcpMutationError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedExternalMcpMutationBusy = false;
  }
}

export async function removeTedExternalMcpServer(
  state: TedWorkbenchState,
  serverId: string,
): Promise<void> {
  if (!state.client || !state.connected || state.tedExternalMcpMutationBusy) {
    return;
  }
  state.tedExternalMcpMutationBusy = true;
  state.tedExternalMcpMutationError = null;
  state.tedExternalMcpMutationResult = null;
  try {
    await requestTedWithTimeout<Record<string, unknown>>(
      state.client,
      "ted.ops.mcp.external.server.remove",
      { server_id: serverId },
    );
    state.tedExternalMcpMutationResult = `Removed ${serverId}`;
    if (state.tedExternalMcpTestResult?.server_id === serverId) {
      state.tedExternalMcpTestResult = null;
    }
    await loadTedExternalMcpServers(state);
    await loadTedExternalMcpTools(state, { refresh: true });
  } catch (err) {
    state.tedExternalMcpMutationError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedExternalMcpMutationBusy = false;
  }
}

// ─── Self-Healing Dashboard Controllers ───

export async function fetchSelfHealingStatus(state: TedWorkbenchState): Promise<void> {
  if (!state.client || !state.connected || state.selfHealingStatusLoading) {
    return;
  }
  state.selfHealingStatusLoading = true;
  state.selfHealingStatusError = null;
  try {
    const result = await requestTedWithTimeout<Record<string, unknown>>(
      state.client,
      "ted.self_healing.status",
      {},
    );
    state.selfHealingStatus = result;
  } catch (err: unknown) {
    state.selfHealingStatusError =
      (err instanceof Error ? err.message : String(err)) || "Failed to fetch self-healing status";
  } finally {
    state.selfHealingStatusLoading = false;
  }
}

export async function fetchCorrectionTaxonomy(state: TedWorkbenchState): Promise<void> {
  if (!state.client || !state.connected || state.correctionTaxonomyLoading) {
    return;
  }
  state.correctionTaxonomyLoading = true;
  state.correctionTaxonomyError = null;
  try {
    const result = await requestTedWithTimeout<Record<string, unknown>>(
      state.client,
      "ted.self_healing.correction_taxonomy",
      {},
    );
    state.correctionTaxonomy = result;
  } catch (err: unknown) {
    state.correctionTaxonomyError =
      (err instanceof Error ? err.message : String(err)) || "Failed to fetch correction taxonomy";
  } finally {
    state.correctionTaxonomyLoading = false;
  }
}

export async function fetchEngagementInsights(state: TedWorkbenchState): Promise<void> {
  if (!state.client || !state.connected || state.engagementInsightsLoading) {
    return;
  }
  state.engagementInsightsLoading = true;
  state.engagementInsightsError = null;
  try {
    const result = await requestTedWithTimeout<Record<string, unknown>>(
      state.client,
      "ted.self_healing.engagement_insights",
      {},
    );
    state.engagementInsights = result;
  } catch (err: unknown) {
    state.engagementInsightsError =
      (err instanceof Error ? err.message : String(err)) || "Failed to fetch engagement insights";
  } finally {
    state.engagementInsightsLoading = false;
  }
}

export async function fetchNoiseLevel(state: TedWorkbenchState): Promise<void> {
  if (!state.client || !state.connected || state.noiseLevelLoading) {
    return;
  }
  state.noiseLevelLoading = true;
  state.noiseLevelError = null;
  try {
    const result = await requestTedWithTimeout<Record<string, unknown>>(
      state.client,
      "ted.self_healing.noise_level",
      {},
    );
    state.noiseLevel = result;
  } catch (err: unknown) {
    state.noiseLevelError =
      (err instanceof Error ? err.message : String(err)) || "Failed to fetch noise level";
  } finally {
    state.noiseLevelLoading = false;
  }
}

export async function fetchAutonomyStatus(state: TedWorkbenchState): Promise<void> {
  if (!state.client || !state.connected || state.autonomyStatusLoading) {
    return;
  }
  state.autonomyStatusLoading = true;
  state.autonomyStatusError = null;
  try {
    const result = await requestTedWithTimeout<Record<string, unknown>>(
      state.client,
      "ted.self_healing.autonomy_status",
      {},
    );
    state.autonomyStatus = result;
  } catch (err: unknown) {
    state.autonomyStatusError =
      (err instanceof Error ? err.message : String(err)) || "Failed to fetch autonomy status";
  } finally {
    state.autonomyStatusLoading = false;
  }
}

// ─── Evaluation Pipeline Controllers (Sprint 2, SDD 72) ───

export async function loadTedEvaluationStatus(state: TedWorkbenchState): Promise<void> {
  if (!state.client || !state.connected || state.tedEvaluationStatusLoading) {
    return;
  }
  state.tedEvaluationStatusLoading = true;
  state.tedEvaluationStatusError = null;
  try {
    const result = await requestTedWithTimeout<Record<string, unknown>>(
      state.client,
      "ted.ops.evaluation.status",
      {},
    );
    state.tedEvaluationStatus = result;
  } catch (err) {
    state.tedEvaluationStatusError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedEvaluationStatusLoading = false;
  }
}

export async function triggerTedEvaluationRun(state: TedWorkbenchState): Promise<void> {
  if (!state.client || !state.connected || state.tedEvaluationRunBusy) {
    return;
  }
  state.tedEvaluationRunBusy = true;
  state.tedEvaluationRunError = null;
  state.tedEvaluationRunResult = null;
  try {
    const result = await requestTedWithTimeout<Record<string, unknown>>(
      state.client,
      "ted.ops.evaluation.run",
      {},
    );
    state.tedEvaluationRunResult = result;
    // Also refresh the status after running
    state.tedEvaluationStatus = result;
  } catch (err) {
    state.tedEvaluationRunError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedEvaluationRunBusy = false;
  }
}

// ─── QA Dashboard Controller ───

export async function loadTedQaDashboard(state: TedWorkbenchState): Promise<void> {
  if (!state.client || !state.connected || state.tedQaDashboardLoading) {
    return;
  }
  state.tedQaDashboardLoading = true;
  state.tedQaDashboardError = null;
  try {
    const result = await requestTedWithTimeout<Record<string, unknown>>(
      state.client,
      "ted.ops.qa.dashboard",
      {},
    );
    state.tedQaDashboard = result;
  } catch (err) {
    state.tedQaDashboardError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedQaDashboardLoading = false;
  }
}

export async function triggerTedCanaryRun(state: TedWorkbenchState): Promise<void> {
  if (!state.client || !state.connected || state.tedCanaryRunBusy) {
    return;
  }
  state.tedCanaryRunBusy = true;
  state.tedCanaryRunError = null;
  try {
    const result = await requestTedWithTimeout<Record<string, unknown>>(
      state.client,
      "ted.ops.canary.run",
      {},
    );
    state.tedCanaryRunResult = result;
    // Refresh dashboard after canary run
    void loadTedQaDashboard(state);
  } catch (err) {
    state.tedCanaryRunError = err instanceof Error ? err.message : String(err);
  } finally {
    state.tedCanaryRunBusy = false;
  }
}

// ─── SharePoint Controllers ───

export async function loadTedSharePointSites(
  app: TedWorkbenchState & { client: GatewayBrowserClient; connected: boolean },
) {
  if (!app.client || !app.connected || app.tedSharePointSitesLoading) {
    return;
  }
  app.tedSharePointSitesLoading = true;
  app.tedSharePointSitesError = null;
  try {
    const result = await requestTedWithTimeout<{
      sites: Array<{ id: string; displayName: string; webUrl: string; name: string }>;
    }>(app.client, "ted.sharepoint.sites.list", { profile_id: app.tedSharePointSelectedProfile });
    app.tedSharePointSites = result.sites;
  } catch (err) {
    app.tedSharePointSitesError = err instanceof Error ? err.message : String(err);
  } finally {
    app.tedSharePointSitesLoading = false;
  }
}

export async function loadTedSharePointDrives(
  app: TedWorkbenchState & { client: GatewayBrowserClient; connected: boolean },
) {
  if (!app.client || !app.connected || app.tedSharePointDrivesLoading) {
    return;
  }
  if (!app.tedSharePointSelectedSiteId) {
    app.tedSharePointDrivesError = "Select a site first";
    return;
  }
  app.tedSharePointDrivesLoading = true;
  app.tedSharePointDrivesError = null;
  try {
    const result = await requestTedWithTimeout<{
      drives: Array<{
        id: string;
        name: string;
        driveType: string;
        webUrl: string;
        description: string | null;
      }>;
    }>(app.client, "ted.sharepoint.drives.list", {
      profile_id: app.tedSharePointSelectedProfile,
      site_id: app.tedSharePointSelectedSiteId,
    });
    app.tedSharePointDrives = result.drives;
  } catch (err) {
    app.tedSharePointDrivesError = err instanceof Error ? err.message : String(err);
  } finally {
    app.tedSharePointDrivesLoading = false;
  }
}

export async function loadTedSharePointItems(
  app: TedWorkbenchState & { client: GatewayBrowserClient; connected: boolean },
  itemId?: string,
) {
  if (!app.client || !app.connected || app.tedSharePointItemsLoading) {
    return;
  }
  if (!app.tedSharePointSelectedDriveId) {
    app.tedSharePointItemsError = "Select a drive first";
    return;
  }
  app.tedSharePointItemsLoading = true;
  app.tedSharePointItemsError = null;
  try {
    const params: Record<string, string> = {
      profile_id: app.tedSharePointSelectedProfile,
      drive_id: app.tedSharePointSelectedDriveId,
    };
    if (itemId) {
      params.item_id = itemId;
    } else if (app.tedSharePointItemsPath && app.tedSharePointItemsPath !== "/") {
      params.path = app.tedSharePointItemsPath;
    }
    const result = await requestTedWithTimeout<{
      items: Array<{
        id: string;
        name: string;
        size: number;
        lastModifiedDateTime: string;
        webUrl: string;
        isFolder: boolean;
        mimeType: string | null;
        createdBy: string | null;
        lastModifiedBy: string | null;
        parentPath: string | null;
      }>;
      path: string;
    }>(app.client, "ted.sharepoint.items.list", params);
    app.tedSharePointItems = result.items;
    app.tedSharePointItemsPath = result.path || "/";
  } catch (err) {
    app.tedSharePointItemsError = err instanceof Error ? err.message : String(err);
  } finally {
    app.tedSharePointItemsLoading = false;
  }
}

export async function searchTedSharePoint(
  app: TedWorkbenchState & { client: GatewayBrowserClient; connected: boolean },
) {
  if (!app.client || !app.connected || app.tedSharePointSearchLoading) {
    return;
  }
  if (!app.tedSharePointSelectedDriveId) {
    app.tedSharePointSearchError = "Select a drive first";
    return;
  }
  if (!app.tedSharePointSearchQuery.trim()) {
    app.tedSharePointSearchError = "Enter a search query";
    return;
  }
  app.tedSharePointSearchLoading = true;
  app.tedSharePointSearchError = null;
  try {
    const result = await requestTedWithTimeout<{
      results: Array<{
        id: string;
        name: string;
        size: number;
        lastModifiedDateTime: string;
        webUrl: string;
        isFolder: boolean;
        mimeType: string | null;
        createdBy: string | null;
        lastModifiedBy: string | null;
        parentPath: string | null;
      }>;
    }>(app.client, "ted.sharepoint.search", {
      profile_id: app.tedSharePointSelectedProfile,
      drive_id: app.tedSharePointSelectedDriveId,
      query: app.tedSharePointSearchQuery.trim(),
    });
    app.tedSharePointSearchResults = result.results;
  } catch (err) {
    app.tedSharePointSearchError = err instanceof Error ? err.message : String(err);
  } finally {
    app.tedSharePointSearchLoading = false;
  }
}

export async function uploadTedSharePointFile(
  app: TedWorkbenchState & { client: GatewayBrowserClient; connected: boolean },
  fileName: string,
  contentBase64: string,
  contentType: string,
) {
  if (!app.client || !app.connected || app.tedSharePointUploadLoading) {
    return;
  }
  if (!app.tedSharePointSelectedDriveId) {
    app.tedSharePointUploadError = "Select a drive first";
    return;
  }
  app.tedSharePointUploadLoading = true;
  app.tedSharePointUploadError = null;
  app.tedSharePointUploadResult = null;
  try {
    const result = await requestTedWithTimeout<{ ok: boolean; message: string }>(
      app.client,
      "ted.sharepoint.upload",
      {
        profile_id: app.tedSharePointSelectedProfile,
        drive_id: app.tedSharePointSelectedDriveId,
        path: app.tedSharePointItemsPath === "/" ? "" : app.tedSharePointItemsPath,
        file_name: fileName,
        content_base64: contentBase64,
        content_type: contentType,
      },
    );
    app.tedSharePointUploadResult = result.message || "Upload successful";
  } catch (err) {
    app.tedSharePointUploadError = err instanceof Error ? err.message : String(err);
  } finally {
    app.tedSharePointUploadLoading = false;
  }
}

export async function createTedSharePointFolder(
  app: TedWorkbenchState & { client: GatewayBrowserClient; connected: boolean },
  folderName: string,
) {
  if (!app.client || !app.connected || app.tedSharePointFolderLoading) {
    return;
  }
  if (!app.tedSharePointSelectedDriveId) {
    app.tedSharePointFolderError = "Select a drive first";
    return;
  }
  if (!folderName.trim()) {
    app.tedSharePointFolderError = "Folder name is required";
    return;
  }
  app.tedSharePointFolderLoading = true;
  app.tedSharePointFolderError = null;
  app.tedSharePointFolderResult = null;
  try {
    const result = await requestTedWithTimeout<{ ok: boolean; message: string }>(
      app.client,
      "ted.sharepoint.folder.create",
      {
        profile_id: app.tedSharePointSelectedProfile,
        drive_id: app.tedSharePointSelectedDriveId,
        parent_path: app.tedSharePointItemsPath === "/" ? "" : app.tedSharePointItemsPath,
        folder_name: folderName.trim(),
      },
    );
    app.tedSharePointFolderResult = result.message || "Folder created";
  } catch (err) {
    app.tedSharePointFolderError = err instanceof Error ? err.message : String(err);
  } finally {
    app.tedSharePointFolderLoading = false;
  }
}
