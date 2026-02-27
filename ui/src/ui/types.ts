export type ChannelsStatusSnapshot = {
  ts: number;
  channelOrder: string[];
  channelLabels: Record<string, string>;
  channelDetailLabels?: Record<string, string>;
  channelSystemImages?: Record<string, string>;
  channelMeta?: ChannelUiMetaEntry[];
  channels: Record<string, unknown>;
  channelAccounts: Record<string, ChannelAccountSnapshot[]>;
  channelDefaultAccountId: Record<string, string>;
};

export type ChannelUiMetaEntry = {
  id: string;
  label: string;
  detailLabel: string;
  systemImage?: string;
};

export const CRON_CHANNEL_LAST = "last";

export type ChannelAccountSnapshot = {
  accountId: string;
  name?: string | null;
  enabled?: boolean | null;
  configured?: boolean | null;
  linked?: boolean | null;
  running?: boolean | null;
  connected?: boolean | null;
  reconnectAttempts?: number | null;
  lastConnectedAt?: number | null;
  lastError?: string | null;
  lastStartAt?: number | null;
  lastStopAt?: number | null;
  lastInboundAt?: number | null;
  lastOutboundAt?: number | null;
  lastProbeAt?: number | null;
  mode?: string | null;
  dmPolicy?: string | null;
  allowFrom?: string[] | null;
  tokenSource?: string | null;
  botTokenSource?: string | null;
  appTokenSource?: string | null;
  credentialSource?: string | null;
  audienceType?: string | null;
  audience?: string | null;
  webhookPath?: string | null;
  webhookUrl?: string | null;
  baseUrl?: string | null;
  allowUnmentionedGroups?: boolean | null;
  cliPath?: string | null;
  dbPath?: string | null;
  port?: number | null;
  probe?: unknown;
  audit?: unknown;
  application?: unknown;
};

export type WhatsAppSelf = {
  e164?: string | null;
  jid?: string | null;
};

export type WhatsAppDisconnect = {
  at: number;
  status?: number | null;
  error?: string | null;
  loggedOut?: boolean | null;
};

export type WhatsAppStatus = {
  configured: boolean;
  linked: boolean;
  authAgeMs?: number | null;
  self?: WhatsAppSelf | null;
  running: boolean;
  connected: boolean;
  lastConnectedAt?: number | null;
  lastDisconnect?: WhatsAppDisconnect | null;
  reconnectAttempts: number;
  lastMessageAt?: number | null;
  lastEventAt?: number | null;
  lastError?: string | null;
};

export type TelegramBot = {
  id?: number | null;
  username?: string | null;
};

export type TelegramWebhook = {
  url?: string | null;
  hasCustomCert?: boolean | null;
};

export type TelegramProbe = {
  ok: boolean;
  status?: number | null;
  error?: string | null;
  elapsedMs?: number | null;
  bot?: TelegramBot | null;
  webhook?: TelegramWebhook | null;
};

export type TelegramStatus = {
  configured: boolean;
  tokenSource?: string | null;
  running: boolean;
  mode?: string | null;
  lastStartAt?: number | null;
  lastStopAt?: number | null;
  lastError?: string | null;
  probe?: TelegramProbe | null;
  lastProbeAt?: number | null;
};

export type DiscordBot = {
  id?: string | null;
  username?: string | null;
};

export type DiscordProbe = {
  ok: boolean;
  status?: number | null;
  error?: string | null;
  elapsedMs?: number | null;
  bot?: DiscordBot | null;
};

export type DiscordStatus = {
  configured: boolean;
  tokenSource?: string | null;
  running: boolean;
  lastStartAt?: number | null;
  lastStopAt?: number | null;
  lastError?: string | null;
  probe?: DiscordProbe | null;
  lastProbeAt?: number | null;
};

export type GoogleChatProbe = {
  ok: boolean;
  status?: number | null;
  error?: string | null;
  elapsedMs?: number | null;
};

export type GoogleChatStatus = {
  configured: boolean;
  credentialSource?: string | null;
  audienceType?: string | null;
  audience?: string | null;
  webhookPath?: string | null;
  webhookUrl?: string | null;
  running: boolean;
  lastStartAt?: number | null;
  lastStopAt?: number | null;
  lastError?: string | null;
  probe?: GoogleChatProbe | null;
  lastProbeAt?: number | null;
};

export type SlackBot = {
  id?: string | null;
  name?: string | null;
};

export type SlackTeam = {
  id?: string | null;
  name?: string | null;
};

export type SlackProbe = {
  ok: boolean;
  status?: number | null;
  error?: string | null;
  elapsedMs?: number | null;
  bot?: SlackBot | null;
  team?: SlackTeam | null;
};

export type SlackStatus = {
  configured: boolean;
  botTokenSource?: string | null;
  appTokenSource?: string | null;
  running: boolean;
  lastStartAt?: number | null;
  lastStopAt?: number | null;
  lastError?: string | null;
  probe?: SlackProbe | null;
  lastProbeAt?: number | null;
};

export type SignalProbe = {
  ok: boolean;
  status?: number | null;
  error?: string | null;
  elapsedMs?: number | null;
  version?: string | null;
};

export type SignalStatus = {
  configured: boolean;
  baseUrl: string;
  running: boolean;
  lastStartAt?: number | null;
  lastStopAt?: number | null;
  lastError?: string | null;
  probe?: SignalProbe | null;
  lastProbeAt?: number | null;
};

export type IMessageProbe = {
  ok: boolean;
  error?: string | null;
};

export type IMessageStatus = {
  configured: boolean;
  running: boolean;
  lastStartAt?: number | null;
  lastStopAt?: number | null;
  lastError?: string | null;
  cliPath?: string | null;
  dbPath?: string | null;
  probe?: IMessageProbe | null;
  lastProbeAt?: number | null;
};

export type NostrProfile = {
  name?: string | null;
  displayName?: string | null;
  about?: string | null;
  picture?: string | null;
  banner?: string | null;
  website?: string | null;
  nip05?: string | null;
  lud16?: string | null;
};

export type NostrStatus = {
  configured: boolean;
  publicKey?: string | null;
  running: boolean;
  lastStartAt?: number | null;
  lastStopAt?: number | null;
  lastError?: string | null;
  profile?: NostrProfile | null;
};

export type MSTeamsProbe = {
  ok: boolean;
  error?: string | null;
  appId?: string | null;
};

export type MSTeamsStatus = {
  configured: boolean;
  running: boolean;
  lastStartAt?: number | null;
  lastStopAt?: number | null;
  lastError?: string | null;
  port?: number | null;
  probe?: MSTeamsProbe | null;
  lastProbeAt?: number | null;
};

export type ConfigSnapshotIssue = {
  path: string;
  message: string;
};

export type ConfigSnapshot = {
  path?: string | null;
  exists?: boolean | null;
  raw?: string | null;
  hash?: string | null;
  parsed?: unknown;
  valid?: boolean | null;
  config?: Record<string, unknown> | null;
  issues?: ConfigSnapshotIssue[] | null;
};

export type ConfigUiHint = {
  label?: string;
  help?: string;
  group?: string;
  order?: number;
  advanced?: boolean;
  sensitive?: boolean;
  placeholder?: string;
  itemTemplate?: unknown;
};

export type ConfigUiHints = Record<string, ConfigUiHint>;

export type ConfigSchemaResponse = {
  schema: unknown;
  uiHints: ConfigUiHints;
  version: string;
  generatedAt: string;
};

export type PresenceEntry = {
  instanceId?: string | null;
  host?: string | null;
  ip?: string | null;
  version?: string | null;
  platform?: string | null;
  deviceFamily?: string | null;
  modelIdentifier?: string | null;
  roles?: string[] | null;
  scopes?: string[] | null;
  mode?: string | null;
  lastInputSeconds?: number | null;
  reason?: string | null;
  text?: string | null;
  ts?: number | null;
};

export type GatewaySessionsDefaults = {
  model: string | null;
  contextTokens: number | null;
};

export type GatewayAgentRow = {
  id: string;
  name?: string;
  identity?: {
    name?: string;
    theme?: string;
    emoji?: string;
    avatar?: string;
    avatarUrl?: string;
  };
};

export type AgentsListResult = {
  defaultId: string;
  mainKey: string;
  scope: string;
  agents: GatewayAgentRow[];
};

export type AgentIdentityResult = {
  agentId: string;
  name: string;
  avatar: string;
  emoji?: string;
};

export type AgentFileEntry = {
  name: string;
  path: string;
  missing: boolean;
  size?: number;
  updatedAtMs?: number;
  content?: string;
};

export type AgentsFilesListResult = {
  agentId: string;
  workspace: string;
  files: AgentFileEntry[];
};

export type AgentsFilesGetResult = {
  agentId: string;
  workspace: string;
  file: AgentFileEntry;
};

export type AgentsFilesSetResult = {
  ok: true;
  agentId: string;
  workspace: string;
  file: AgentFileEntry;
};

export type GatewaySessionRow = {
  key: string;
  kind: "direct" | "group" | "global" | "unknown";
  label?: string;
  displayName?: string;
  surface?: string;
  subject?: string;
  room?: string;
  space?: string;
  updatedAt: number | null;
  sessionId?: string;
  systemSent?: boolean;
  abortedLastRun?: boolean;
  thinkingLevel?: string;
  verboseLevel?: string;
  reasoningLevel?: string;
  elevatedLevel?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  model?: string;
  modelProvider?: string;
  contextTokens?: number;
};

export type SessionsListResult = {
  ts: number;
  path: string;
  count: number;
  defaults: GatewaySessionsDefaults;
  sessions: GatewaySessionRow[];
};

export type SessionsPatchResult = {
  ok: true;
  path: string;
  key: string;
  entry: {
    sessionId: string;
    updatedAt?: number;
    thinkingLevel?: string;
    verboseLevel?: string;
    reasoningLevel?: string;
    elevatedLevel?: string;
  };
};

export type {
  CostUsageDailyEntry,
  CostUsageSummary,
  SessionsUsageEntry,
  SessionsUsageResult,
  SessionsUsageTotals,
  SessionUsageTimePoint,
  SessionUsageTimeSeries,
} from "./usage-types.ts";

export type CronSchedule =
  | { kind: "at"; at: string }
  | { kind: "every"; everyMs: number; anchorMs?: number }
  | { kind: "cron"; expr: string; tz?: string };

export type CronSessionTarget = "main" | "isolated";
export type CronWakeMode = "next-heartbeat" | "now";

export type CronPayload =
  | { kind: "systemEvent"; text: string }
  | {
      kind: "agentTurn";
      message: string;
      thinking?: string;
      timeoutSeconds?: number;
    };

export type CronDelivery = {
  mode: "none" | "announce" | "webhook";
  channel?: string;
  to?: string;
  bestEffort?: boolean;
};

export type CronJobState = {
  nextRunAtMs?: number;
  runningAtMs?: number;
  lastRunAtMs?: number;
  lastStatus?: "ok" | "error" | "skipped";
  lastError?: string;
  lastDurationMs?: number;
};

export type CronJob = {
  id: string;
  agentId?: string;
  name: string;
  description?: string;
  enabled: boolean;
  deleteAfterRun?: boolean;
  createdAtMs: number;
  updatedAtMs: number;
  schedule: CronSchedule;
  sessionTarget: CronSessionTarget;
  wakeMode: CronWakeMode;
  payload: CronPayload;
  delivery?: CronDelivery;
  state?: CronJobState;
};

export type CronStatus = {
  enabled: boolean;
  jobs: number;
  nextWakeAtMs?: number | null;
};

export type CronRunLogEntry = {
  ts: number;
  jobId: string;
  status: "ok" | "error" | "skipped";
  durationMs?: number;
  error?: string;
  summary?: string;
  sessionId?: string;
  sessionKey?: string;
};

export type SkillsStatusConfigCheck = {
  path: string;
  satisfied: boolean;
};

export type SkillInstallOption = {
  id: string;
  kind: "brew" | "node" | "go" | "uv";
  label: string;
  bins: string[];
};

export type SkillStatusEntry = {
  name: string;
  description: string;
  source: string;
  filePath: string;
  baseDir: string;
  skillKey: string;
  bundled?: boolean;
  primaryEnv?: string;
  emoji?: string;
  homepage?: string;
  always: boolean;
  disabled: boolean;
  blockedByAllowlist: boolean;
  eligible: boolean;
  requirements: {
    bins: string[];
    env: string[];
    config: string[];
    os: string[];
  };
  missing: {
    bins: string[];
    env: string[];
    config: string[];
    os: string[];
  };
  configChecks: SkillsStatusConfigCheck[];
  install: SkillInstallOption[];
};

export type SkillStatusReport = {
  workspaceDir: string;
  managedSkillsDir: string;
  skills: SkillStatusEntry[];
};

export type StatusSummary = Record<string, unknown>;

export type HealthSnapshot = Record<string, unknown>;

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

export type LogEntry = {
  raw: string;
  time?: string | null;
  level?: LogLevel | null;
  subsystem?: string | null;
  message?: string | null;
  meta?: Record<string, unknown> | null;
};

export type TedRecommendation = {
  id: string;
  severity: "info" | "warn" | "critical";
  message: string;
  next_step: string;
  decision: "pending" | "approved" | "dismissed";
};

export type TedJobCardDetail = {
  id: string;
  title: string;
  family: "GOV" | "MNT" | "ING" | "LED" | "OUT";
  operator_summary: string;
  kpi_signals: string[];
  path: string;
  status: "DONE" | "BLOCKED" | "IN_PROGRESS" | "TODO_OR_UNKNOWN";
  dependencies: string[];
  proof_script: string | null;
  outcome: string | null;
  non_negotiables: string[];
  deliverables: string[];
  proof_evidence: string[];
  markdown: string;
};

export type TedIntakeRecommendation = {
  priority: string;
  release_target: string;
  governance_tier: string;
  recommended_kpis: string[];
  hard_bans: string[];
  suggested_dependencies: string[];
  suggested_path: string;
  draft_markdown: string;
};

export type TedSourceDocument = {
  key: "job_board" | "promotion_policy" | "value_friction" | "interrogation_cycle";
  path: string;
  content: string;
};

export type TedKpiSuggestion = {
  id: string;
  family: "GOV" | "MNT" | "ING" | "LED" | "OUT";
  suggestions: string[];
  rationale: string;
};

export type TedJobCardImpactPreview = {
  id: string;
  before: {
    family: "GOV" | "MNT" | "ING" | "LED" | "OUT";
    dependencies: string[];
    kpi_signals: string[];
    proof_script: string | null;
    status: "DONE" | "BLOCKED" | "IN_PROGRESS" | "TODO_OR_UNKNOWN";
  };
  after: {
    family: "GOV" | "MNT" | "ING" | "LED" | "OUT";
    dependencies: string[];
    kpi_signals: string[];
    proof_script: string | null;
    status: "DONE" | "BLOCKED" | "IN_PROGRESS" | "TODO_OR_UNKNOWN";
  };
  impact_summary: string[];
  warnings: string[];
};

export type TedPolicyKey = "job_board" | "promotion_policy" | "value_friction";

export type TedPolicyConfig = {
  objective: string;
  rollout_mode: "conservative" | "balanced" | "aggressive";
  automation_ceiling: "draft-only" | "approval-first" | "limited-auto";
  success_checks: string[];
  guardrails: string[];
  operator_notes: string;
};

export type TedPolicyDocument = {
  key: TedPolicyKey;
  path: string;
  heading: string;
  config: TedPolicyConfig;
};

export type TedPolicyImpactPreview = {
  key: TedPolicyKey;
  path: string;
  impact_summary: string[];
  warnings: string[];
  preview_markdown: string;
};

export type TedConnectorAuthStartResponse = {
  profile_id: "olumie" | "everest";
  device_code?: string;
  user_code?: string;
  verification_uri?: string;
  verification_uri_complete?: string;
  expires_in?: number;
  interval?: number;
  message?: string;
};

export type TedConnectorAuthPollResponse = {
  profile_id: "olumie" | "everest";
  auth_state?: string;
  status?: string;
  message?: string;
  reason_code?: string;
  next_safe_step?: string;
};

export type TedConnectorAuthRevokeResponse = {
  profile_id: "olumie" | "everest";
  ok?: boolean;
  status?: string;
  message?: string;
};

export type TedMailMessage = {
  id: string | null;
  subject: string;
  from: { name: string; address: string };
  received_at: string | null;
  is_read: boolean;
  preview: string;
  has_attachments: boolean;
  importance: string;
};

export type TedMailListResponse = {
  profile_id: string;
  folder: string;
  messages: TedMailMessage[];
  total_count: number | null;
};

export type TedMorningBriefResponse = {
  generated_at: string;
  headline: string;
  summary: string;
  detail: {
    triage_open: number;
    deals_active: number;
    filing_pending_count: number;
    automation_paused: boolean;
  };
  deals_summary: Array<{
    deal_id: string | null;
    deal_name?: string;
    status?: string;
  }>;
  recent_activity: Array<{
    action: string;
    at: string | null;
    summary: string | null;
  }>;
  recommendations: string[];
  source: "template" | "llm" | "hybrid";
};

export type TedEodDigestResponse = {
  generated_at: string;
  date: string;
  headline: string;
  summary: string;
  detail: {
    actions_count: number;
    approvals_count: number;
    blocks_count: number;
    triage_resolved: number;
    triage_still_open: number;
    filing_approved: number;
    filing_pending: number;
  };
  activity_log: Array<{ action: string; count: number }>;
  unresolved: Array<{
    type: string;
    count: number;
    items: Array<Record<string, unknown>>;
  }>;
  source: "template" | "llm" | "hybrid";
};

// ── Meeting + Commitments + GTD Types (Phase 6) ─────────────────────

export interface TedMeetingEvent {
  event_id: string;
  title: string;
  start_time: string;
  end_time: string;
  attendees: Array<{ name: string; email: string; entity: string }>;
  entity: string;
  prep_ready: boolean;
  open_commitments: number;
}

export interface TedMeetingUpcomingResponse {
  meetings: TedMeetingEvent[];
  generated_at: string;
  hours_window: number;
}

export interface TedCommitment {
  id: string;
  who_owes: string;
  who_to: string;
  what: string;
  entity: string;
  deal_id: string | null;
  due_date: string | null;
  status: string;
  follow_up_count: number;
  created_at: string;
}

export interface TedCommitmentsListResponse {
  commitments: TedCommitment[];
  total_count: number;
}

export interface TedGtdAction {
  id: string;
  description: string;
  entity: string;
  deal_id: string | null;
  context: string | null;
  energy: string;
  time_estimate_min: number | null;
  due_date: string | null;
  status: string;
  created_at: string;
}

export interface TedActionsListResponse {
  actions: TedGtdAction[];
  total_count: number;
}

export interface TedWaitingForItem {
  id: string;
  description: string;
  delegated_to: string;
  entity: string;
  expected_by: string | null;
  status: string;
  follow_up_count: number;
  created_at: string;
}

export interface TedWaitingForListResponse {
  waiting_for: TedWaitingForItem[];
  total_count: number;
}

// ── Trust + Deep Work Metrics Types (Phase 8) ───────────────────────

export interface TedTrustMetricsResponse {
  period: string;
  approval_rate: number;
  total_decisions: number;
  approvals: number;
  edits: number;
  time_saved_estimate: string;
  time_saved_minutes: number;
  actions_completed: number;
  commitments_completed: number;
  generated_at: string;
}

export interface TedDeepWorkMetricsResponse {
  period: string;
  deep_work_hours: number;
  target_hours: number;
  adherence_pct: number;
  plans_generated: number;
  actions_completed: number;
  generated_at: string;
}

// ── Draft Queue (JC-089f) ────────────────────────────────────────────

export interface TedDraftQueueResponse {
  drafts: Array<{
    draft_id: string;
    draft_kind: string;
    state: string;
    subject: string;
    to: string;
    content: string;
    from_profile: string | null;
    related_deal_id: string | null;
    related_meeting_id: string | null;
    entity: string | null;
    created_at: string;
    updated_at: string;
  }>;
  count: number;
}

// ── Event Log Stats (JC-087e) ────────────────────────────────────────

export interface TedEventLogStatsResponse {
  total_events: number;
  last_event_at: string | null;
  event_type_counts: Record<string, number>;
}

// ── LLM Provider Types (JC-072a) ────────────────────────────────────

export type LlmProviderName =
  | "openai_direct"
  | "azure_openai"
  | "anthropic_direct"
  | "openai_compatible"
  | "copilot_extension"
  | "disabled";

export type TedLlmProviderConfig = {
  default_provider: LlmProviderName;
  default_model: string;
  timeout_ms: number;
  providers: Record<
    string,
    {
      enabled: boolean;
      hipaa_cleared: boolean;
      notes: string;
      api_key_set?: boolean;
      endpoint_set?: boolean;
    }
  >;
  entity_overrides: Record<
    string,
    {
      provider: LlmProviderName | null;
      required_hipaa_cleared?: boolean;
      notes?: string;
    }
  >;
  per_job_overrides: Record<string, { provider: LlmProviderName }>;
};

export type TedNotificationBudgetResponse = {
  budget: {
    daily_push_max: number;
    crisis_override: boolean;
    quiet_hours: { start: string; end: string; timezone: string };
    batch_window_minutes: number;
  };
  onboarding: {
    phase: string | null;
    features: string[];
    push_max?: number;
    day?: number;
  };
  today_count: number;
  today_date: string;
};

export interface TedLlmRoutingPolicy {
  fallback_order: string[];
  per_intent: Record<string, string>;
  per_job: Record<string, string>;
  provider_models: Record<string, string>;
  constraints: {
    enforce_entity_hipaa: boolean;
    deny_unlisted_provider: boolean;
    max_timeout_ms: number;
  };
}

export interface TedLlmProviderTestResponse {
  ok: boolean;
  provider: string;
  model: string | null;
  latency_ms: number;
  usage: Record<string, unknown> | null;
  error: string | null;
  detail: string | null;
  output_preview: string | null;
}

export interface TedWorkflowStep {
  step_id: string;
  kind: "route_call" | "approval_gate" | "condition";
  method?: "GET" | "POST";
  route?: string;
  body?: Record<string, unknown>;
  retry?: { max_attempts?: number; backoff_ms?: number };
  reason?: string;
  expression?: string;
  on_true?: string;
  on_false?: string;
}

export interface TedWorkflowDefinition {
  workflow_id: string;
  name: string;
  enabled: boolean;
  entity: string | null;
  trigger: {
    kind: string;
    schedule?: string;
    timezone?: string;
  };
  steps: TedWorkflowStep[];
  updated_at: string;
}

export interface TedWorkflowRegistryResponse {
  workflows: TedWorkflowDefinition[];
  total_count: number;
  run_count: number;
}

export interface TedWorkflowRunsResponse {
  runs: Array<{
    run_id: string;
    workflow_id: string;
    workflow_name: string;
    dry_run: boolean;
    status: string;
    failed_step_id: string | null;
    started_at: string;
    completed_at: string;
    step_count: number;
    steps: Array<{
      step_id: string;
      kind: string;
      status: string;
      reason?: string;
      error?: string;
      method?: string;
      route?: string;
      duration_ms: number;
      response_keys?: string[];
    }>;
  }>;
  total_count: number;
}

export interface TedWorkflowRiskLintResponse {
  ok: boolean;
  generated_at: string;
  source: "inline" | "registry";
  workflow_id: string;
  workflow_name: string;
  publish_allowed: boolean;
  lint: {
    pass: boolean;
    blocking_count: number;
    warning_count: number;
    summary: string;
  };
  node_annotations: Array<{
    step_id: string;
    index: number;
    kind: string;
    route_key: string | null;
    policy: string | null;
    risk_score: number;
    risk_level: "low" | "medium" | "high";
    publish_blocking: boolean;
    requires_approval_checkpoint: boolean;
    has_approval_checkpoint: boolean;
    risk_reasons: string[];
    explainability: Array<{
      severity: "info" | "warning" | "blocking";
      reason_code: string;
      message: string;
      next_safe_step: string;
    }>;
    predicted_friction: {
      governance_weight: number;
      tool_weight: number;
      context_weight: number;
      total_weight: number;
    };
  }>;
  policy_explainability: Array<{
    step_id: string;
    kind: string;
    severity: "info" | "warning" | "blocking";
    reason_code: string;
    policy: string | null;
    message: string;
    next_safe_step: string;
  }>;
  friction_forecast: {
    predicted_job_friction_score: number;
    governance_block_risk: number;
    tool_failure_risk: number;
    context_miss_risk: number;
    hotspots: Array<{
      driver: string;
      weight: number;
      steps: string[];
      reason_preview: string[];
    }>;
    top_hotspot: string | null;
  };
}

export interface TedMemoryPreferencesResponse {
  preferences: Array<{
    memory_key: string;
    scope: string;
    entity: string | null;
    value: unknown;
    confidence: number | null;
    source: string | null;
    pinned: boolean;
    expires_at: string | null;
    updated_at: string | null;
  }>;
  total_count: number;
}

export interface TedMemoryExportResponse extends TedMemoryPreferencesResponse {
  export_generated_at: string;
  entity: string | null;
}

export interface TedMcpTrustPolicy {
  default_server_trust_tier: "sandboxed" | "trusted_read" | "trusted_write";
  default_tool_action: "read_only" | "approval_required" | "deny";
  trust_tiers: Array<"sandboxed" | "trusted_read" | "trusted_write">;
  tool_actions: Array<"read_only" | "approval_required" | "deny">;
  servers: Record<string, { trust_tier?: "sandboxed" | "trusted_read" | "trusted_write" }>;
  tool_policies: Record<string, "read_only" | "approval_required" | "deny">;
}

export interface TedSetupStateResponse {
  generated_at: string;
  checks: Record<string, string>;
  issues: Array<{
    severity: "error" | "warning" | "info";
    message: string;
    profile_id?: string;
  }>;
  blocking_issues: Array<{
    severity: "error" | "warning" | "info";
    message: string;
    profile_id?: string;
  }>;
  ready: boolean;
  ready_for_live_graph: boolean;
  profiles: Array<{
    profile_id: string;
    configured: boolean;
    authenticated: boolean;
    tenant_id_present: boolean;
    client_id_present: boolean;
    tenant_id_masked: string | null;
    client_id_masked: string | null;
    delegated_scopes_count: number;
    delegated_scopes: string[];
    has_placeholder_values: boolean;
    missing: string[];
    next_action: string;
  }>;
  providers: Array<{
    provider: string;
    enabled: boolean;
    api_key_env: string | null;
    api_key_set: boolean | null;
    endpoint_env: string | null;
    endpoint_set: boolean | null;
  }>;
}

export interface TedGraphDeltaStatusResponse {
  strategy: Record<string, unknown>;
  entries: Array<{
    kind: string;
    profile_id: string;
    workload: string;
    timestamp: string;
    next_link: string | null;
    delta_link: string | null;
    value_count: number;
  }>;
  total_count: number;
}

export interface TedGraphDeltaRunResponse {
  ok: boolean;
  profile_id: string;
  workload: string;
  value_count: number;
  timestamp: string;
  next_link: string | null;
  delta_link: string | null;
}

export interface TedEvalMatrixConfigResponse {
  enabled: boolean;
  thresholds: {
    min_pass_rate: number;
    max_p95_latency_ms: number;
    max_cost_usd_per_run: number;
  };
  slices: Array<{
    slice_id: string;
    enabled?: boolean;
    provider?: string;
    model?: string;
    intent?: string;
  }>;
  recent_runs: Array<Record<string, unknown>>;
}

export interface TedEvalMatrixRunResponse {
  generated_at: string;
  total_slices: number;
  passed_slices: number;
  pass_rate: number;
  p95_latency_ms: number;
  threshold_pass: boolean;
  results: Array<{
    slice_id: string;
    provider: string;
    model: string | null;
    intent: string;
    ok: boolean;
    error: string | null;
    latency_ms: number;
    output_chars: number;
  }>;
}

export interface TedFrictionSummaryResponse {
  generated_at: string;
  summary: {
    total_runs: number;
    status_counts: {
      completed: number;
      blocked: number;
      failed: number;
      other: number;
    };
    avg_job_friction_score: number;
    avg_time_to_value_minutes: number;
    avg_operator_load_index: number;
    avg_automation_recovery_rate: number;
    productive_friction_ratio_avg: number;
    harmful_friction_ratio_avg: number;
    friction_totals: {
      wait_ms: number;
      rework_count: number;
      tool_failures: number;
      governance_blocks: number;
      handoff_count: number;
      context_misses: number;
      retry_attempts: number;
      recovered_retries: number;
    };
    top_harmful_drivers: Array<{
      driver: string;
      weight: number;
    }>;
  };
  recent_runs: Array<Record<string, unknown>>;
}

export interface TedFrictionRunsResponse {
  events: Array<{
    kind: string;
    event_id: string;
    timestamp: string;
    category: string;
    severity: string;
    reason: string;
    run_id: string;
    workflow_id: string;
    workflow_name: string;
    step_id: string | null;
    trace_id: string | null;
    dry_run: boolean;
    [key: string]: unknown;
  }>;
  total_count: number;
  filters: {
    workflow_id: string | null;
    run_id: string | null;
    trace_id: string | null;
  };
}

export interface TedOutcomesDashboardResponse {
  generated_at: string;
  workflow_id: string | null;
  workflow_count: number;
  active_workflow_count: number;
  outcome_summary: TedFrictionSummaryResponse["summary"];
  top_harmful_drivers: Array<{
    driver: string;
    weight: number;
  }>;
  recommendation: string;
}

export interface TedOutcomesFrictionTrendsResponse {
  generated_at: string;
  workflow_id: string | null;
  days: number;
  points: Array<{
    day: string;
    run_count: number;
    avg_job_friction_score: number;
    avg_time_to_value_minutes: number;
    failure_rate: number;
  }>;
  total_points: number;
}

export interface TedOutcomesJobResponse {
  generated_at: string;
  job_id: string;
  summary: TedFrictionSummaryResponse["summary"];
  recent_runs: Array<Record<string, unknown>>;
}

export interface TedReplayCorpusResponse {
  generated_at: string;
  version: string;
  release_gate: {
    min_pass_rate: number;
    max_safety_failures: number;
    max_adversarial_failures: number;
  };
  include: "all" | "golden" | "adversarial";
  scenarios: Array<{
    scenario_id: string;
    title: string;
    kind: "golden" | "adversarial";
    job: string;
    attack_type?: string | null;
    expected_output: {
      required_phrases: string[];
      forbidden_phrases: string[];
      sample_output: string;
    };
    expected_trajectory: {
      steps: string[];
      must_not_include: string[];
      required_assertions: string[];
      max_duration_ms: number;
    };
    simulated: {
      actual_output: string;
      actual_steps: string[];
      assertions: Record<string, boolean>;
      duration_ms: number;
    };
  }>;
  total_count: number;
}

export interface TedReplayRunResponse {
  run_id: string;
  corpus_version: string;
  started_at: string;
  completed_at: string;
  include: "all" | "golden" | "adversarial";
  summary: {
    total: number;
    passed: number;
    failed: number;
    pass_rate: number;
    adversarial_total: number;
    adversarial_failures: number;
    safety_failures: number;
    output_failures: number;
    trajectory_failures: number;
  };
  release_gate: {
    pass: boolean;
    blockers: string[];
    thresholds: {
      min_pass_rate: number;
      max_safety_failures: number;
      max_adversarial_failures: number;
    };
    pass_rate: number;
    safety_failures: number;
    adversarial_failures: number;
  };
  results: Array<{
    scenario_id: string;
    title: string;
    kind: "golden" | "adversarial";
    job: string;
    attack_type?: string | null;
    status: "pass" | "fail";
    duration_ms: number;
    output: {
      pass: boolean;
      failures: string[];
    };
    trajectory: {
      pass: boolean;
      failures: string[];
      expected_steps: string[];
      actual_steps: string[];
    };
    safety: {
      pass: boolean;
      failures: string[];
      required_assertions: string[];
      assertions: Record<string, boolean>;
    };
    failure_reasons: string[];
  }>;
}

export interface TedReplayRunsResponse {
  generated_at: string;
  runs: Array<Record<string, unknown>>;
  total_count: number;
  include_details: boolean;
}

export interface TedFeatureHealthResponse {
  generated_at: string;
  lookback_days: number;
  totals: {
    features: number;
    frozen: number;
    escalated: number;
    research_required: number;
    low_usage: number;
  };
  features: Array<{
    feature_id: string;
    name: string;
    plane: string;
    lifecycle_state: string;
    maturity_score: number;
    fragility_score: number;
    previous_fragility_score: number;
    fragility_delta: number;
    qa_refs: number;
    dependency_count: number;
    metrics: {
      replay_failure_ratio: number;
      harmful_friction_ratio: number;
      override_rate: number;
      test_depth_gap: number;
      dependency_volatility: number;
    };
    usage_signals: {
      invocation_count_30d: number;
      adoption_ratio_30d: number;
      success_rate_30d: number | null;
    };
    state: {
      freeze: boolean;
      escalation: boolean;
      low_usage: boolean;
      research_required: boolean;
    };
    recommendations: {
      activation_experiment: string | null;
    };
  }>;
  policy: {
    fragility: Record<string, unknown>;
    usage: Record<string, unknown>;
    research: Record<string, unknown>;
  };
  history?: Array<Record<string, unknown>>;
}

export interface TedFeatureOpportunitiesResponse {
  generated_at: string;
  total_candidates: number;
  opportunities: Array<{
    feature_id: string;
    name: string;
    plane: string;
    maturity_score: number;
    fragility_score: number;
    adoption_ratio_30d: number;
    invocation_count_30d: number;
    opportunity_score: number;
    observed_friction: string;
    activation_experiment: string;
  }>;
}

// ── Deal Workflow Types ──────────────────────────────────────────────

export type TedDealType = "SNF_ALF" | "SOFTWARE" | "ANCILLARY_HEALTHCARE";

export type TedDealStage =
  | "deal_identified"
  | "nda_signed"
  | "data_room_access"
  | "dd_active"
  | "psa_in_progress"
  | "investor_onboarding"
  | "closing"
  | "closed"
  | "archived";

export type TedDealStatus = "active" | "paused" | "closed" | "archived";

export type TedDealImportantDate = {
  label: string;
  date: string;
  type: "deposit_deadline" | "dd_period_end" | "closing_date" | "psa_milestone" | "custom";
};

export type TedDealInvestor = {
  name: string;
  oig_status: "pending" | "clear" | "hit";
  oig_checked_at: string | null;
  state_exclusion_status: "pending" | "clear" | "hit";
  state_exclusion_checked_at: string | null;
  disclosure_form_sent: boolean;
};

export type TedDealCounselInvoice = {
  amount: number;
  date: string;
  description: string;
};

export type TedDealCounsel = {
  firm_name: string;
  matter: string;
  total_spend: number;
  invoices: TedDealCounselInvoice[];
};

export type TedDealTask = {
  task: string;
  owner: "Clint" | "Isaac" | "Ted";
  status: "open" | "done";
  due_date: string | null;
  created_at: string;
};

export type TedDealChecklistItem = {
  item: string;
  status: "pending" | "complete" | "na";
  notes: string;
};

export type TedDealNote = {
  text: string;
  created_at: string;
  author: string;
};

export type TedDealSummary = {
  deal_id: string;
  deal_name: string;
  deal_type: TedDealType | null;
  stage: TedDealStage;
  status: TedDealStatus;
  entity: string;
  next_milestone: TedDealImportantDate | null;
  updated_at: string;
};

export type TedDealFull = TedDealSummary & {
  important_dates: TedDealImportantDate[];
  investors: TedDealInvestor[];
  outside_counsel: TedDealCounsel[];
  team_tasks: TedDealTask[];
  dd_checklist: TedDealChecklistItem[];
  notes: TedDealNote[];
  created_at: string;
};

export type TedWorkbenchSnapshot = {
  generated_at: string;
  data_sources: {
    job_cards_dir: string | null;
    job_cards_discovered: boolean;
  };
  operator_flow: {
    primary_approval_surface: "ted_workbench";
    secondary_approval_surface: "openclaw_chat";
    draft_review_surface: "ted_run_today_and_openclaw_chat";
    notes: string[];
  };
  integrations: {
    m365_profiles: Array<{
      profile_id: string;
      status: "connected" | "needs_auth" | "misconfigured" | "error";
      auth_store: string | null;
      delegated_scopes_count: number;
      last_error: string | null;
      next_step: string;
    }>;
  };
  sidecar: {
    healthy: boolean;
    status: Record<string, unknown> | null;
    doctor: Record<string, unknown> | null;
    error: string | null;
  };
  job_cards: {
    total: number;
    done: number;
    blocked: number;
    in_progress: number;
    todo_or_unknown: number;
    cards: Array<{
      id: string;
      title: string;
      family: "GOV" | "MNT" | "ING" | "LED" | "OUT";
      operator_summary: string;
      kpi_signals: string[];
      path: string;
      status: "DONE" | "BLOCKED" | "IN_PROGRESS" | "TODO_OR_UNKNOWN";
      dependencies: string[];
      proof_script: string | null;
      promotion_confidence: {
        score: number;
        band: "hold" | "watch" | "progressing" | "ready";
        drivers: string[];
        recommendation_outcomes: {
          approved: number;
          dismissed: number;
        };
      };
    }>;
  };
  friction_kpis: {
    manual_minutes_per_day_max: number;
    approval_queue_oldest_minutes_max: number;
    unresolved_triage_eod_max: number;
    blocked_actions_missing_explainability_max: number;
  };
  threshold_controls: {
    defaults: {
      manual_minutes_per_day_max: number;
      approval_queue_oldest_minutes_max: number;
      unresolved_triage_eod_max: number;
      blocked_actions_missing_explainability_max: number;
    };
    effective: {
      manual_minutes_per_day_max: number;
      approval_queue_oldest_minutes_max: number;
      unresolved_triage_eod_max: number;
      blocked_actions_missing_explainability_max: number;
    };
    overrides: {
      manual_minutes_per_day_max: number | null;
      approval_queue_oldest_minutes_max: number | null;
      unresolved_triage_eod_max: number | null;
      blocked_actions_missing_explainability_max: number | null;
    };
    relaxed: boolean;
    warnings: string[];
    updated_at: string | null;
  };
  policy_impacts: {
    totals_by_policy: {
      job_board: number;
      promotion_policy: number;
      value_friction: number;
    };
    recent: Array<{
      ts: string;
      policy_key: TedPolicyKey;
      risk_direction: "safer" | "riskier" | "neutral";
      changed_fields: string[];
      linked_cards: string[];
      rationale: string;
      expected_kpi_effects: string[];
    }>;
  };
  recommendations: TedRecommendation[];
  recommendation_outcomes: {
    totals: {
      approved: number;
      dismissed: number;
      pending: number;
    };
    recent: Array<{
      id: string;
      decision: "approved" | "dismissed";
      decided_at: string;
      linked_cards: string[];
      rationale: string;
    }>;
  };
  approval_queue: Array<{
    id: string;
    source: "recommendation" | "job_card";
    severity: "info" | "warn" | "critical";
    reason_code: string;
    summary: string;
    next_safe_step: string;
    status: "pending" | "approved" | "dismissed";
  }>;
  approval_ledger: {
    recent: Array<{
      id: string;
      source: "recommendation" | "job_card";
      recommendation_id: string | null;
      decision: "pending" | "approved" | "dismissed";
      reason_code: string;
      summary: string;
      linked_cards: string[];
      linked_card_confidence: Array<{
        card_id: string;
        score: number;
        band: "hold" | "watch" | "progressing" | "ready";
        top_driver: string;
      }>;
      next_safe_step: string;
      decided_at: string | null;
    }>;
  };
  governance_timeline_preview: Array<{
    ts: string;
    action:
      | "proof_run"
      | "recommendation_decision"
      | "threshold_update"
      | "rolecard_validate"
      | "intake_recommend"
      | "jobcard_update";
    outcome: "allowed" | "blocked";
    reason_code: string;
    next_safe_step: string;
  }>;
  kpi_history_preview: Array<{
    ts: string;
    manual_minutes_per_day_max: number;
    approval_queue_oldest_minutes_max: number;
    unresolved_triage_eod_max: number;
    blocked_actions_missing_explainability_max: number;
  }>;
  eval_history_preview: Array<{
    ts: string;
    proof_script: string;
    ok: boolean;
    exit_code: number;
  }>;
  references: {
    job_board: string;
    promotion_policy: string;
    value_friction: string;
    interrogation_cycle: string;
  };
};

// ─── Planner Types (Phase 16-21) ───

export interface TedPlannerTask {
  id: string;
  title: string;
  plan_id: string;
  bucket_id: string;
  bucket_name: string | null;
  assigned_to: string[];
  percent_complete: number;
  priority: number;
  due_date: string | null;
  start_date: string | null;
  etag: string;
  entity: string;
  deal_id: string | null;
  created_at: string;
}

export interface TedPlannerBucket {
  id: string;
  name: string;
  plan_id: string;
  tasks_count: number;
}

export interface TedPlannerPlanSummary {
  plan_id: string;
  title: string;
  entity: string;
  buckets: TedPlannerBucket[];
  tasks_total: number;
  tasks_complete: number;
}

export interface TedPlannerListResponse {
  profile_id: string;
  plans: TedPlannerPlanSummary[];
  generated_at: string;
}

export interface TedPlannerTasksResponse {
  profile_id: string;
  plan_id: string;
  bucket_id: string | null;
  tasks: TedPlannerTask[];
  total_count: number;
}

// ─── To Do Types ───

export interface TedTodoTask {
  id: string;
  title: string;
  body: string | null;
  status: string;
  importance: string;
  due_date: string | null;
  list_id: string;
  list_name: string | null;
  linked_resources: Array<{
    id: string;
    application_name: string;
    external_id: string;
    display_name: string;
  }>;
  created_at: string;
  last_modified_at: string;
}

export interface TedTodoListSummary {
  id: string;
  display_name: string;
  is_owner: boolean;
  tasks_count: number;
}

export interface TedTodoListsResponse {
  profile_id: string;
  lists: TedTodoListSummary[];
}

export interface TedTodoTasksResponse {
  profile_id: string;
  list_id: string;
  list_name: string;
  tasks: TedTodoTask[];
  total_count: number;
}

// ─── Sync / Reconciliation Types ───

export interface TedSyncDriftItem {
  source: string;
  target: string;
  local_id: string | null;
  remote_id: string | null;
  field: string;
  local_value: string | null;
  remote_value: string | null;
  recommendation: string;
}

export interface TedSyncProposal {
  proposal_id: string;
  target_system: "planner" | "todo";
  action: "create" | "update" | "complete";
  entity: string;
  local_id: string;
  title: string;
  payload: Record<string, unknown>;
  status: "pending" | "approved" | "executed" | "rejected" | "conflict";
  created_at: string;
  resolved_at: string | null;
}

export interface TedSyncReconciliationResponse {
  profile_id: string;
  drift_items: TedSyncDriftItem[];
  proposed_writes: TedSyncProposal[];
  local_counts: { commitments: number; gtd_actions: number; deal_tasks: number };
  remote_counts: { planner_tasks: number; todo_tasks: number };
  generated_at: string;
}

export interface TedSyncProposalsResponse {
  profile_id: string;
  proposals: TedSyncProposal[];
  total_count: number;
}

// ─── Commitment Extraction Types ───

export interface TedExtractedCommitment {
  who_owes: string;
  who_to: string;
  what: string;
  due_date: string | null;
  confidence: number;
  source_text: string;
}

export interface TedCommitmentExtractionResponse {
  profile_id: string;
  source_email_id: string;
  source_subject: string | null;
  detected: TedExtractedCommitment[];
  generated_at: string;
  extraction_source?: string;
  extraction_status?: "ok" | "none_found" | "extraction_failed";
}

// ─── Improvement Proposal Types (Codex Builder Lane) ───

export interface TedImprovementProposal {
  proposal_id: string;
  type: "contract_update" | "config_update" | "new_validator" | "route_enhancement";
  title: string;
  description: string;
  source: "trust_failure_aggregation" | "operator_feedback" | "learning_modifier";
  status: "proposed" | "reviewed" | "approved" | "applied" | "rejected";
  created_at: string;
  reviewed_at?: string;
  applied_at?: string;
  change_spec: Record<string, unknown>;
  evidence: { failure_count: number; failure_rate: number; sample_failures: string[] };
}

export interface TedImprovementProposalsResponse {
  ok: boolean;
  proposals: TedImprovementProposal[];
  total: number;
}

export interface TedImprovementGenerateResponse {
  ok: boolean;
  generated: boolean;
  reason?: string;
  proposal_text?: string;
  evidence?: {
    total_failures: number;
    failure_by_intent: Record<string, number>;
    top_missing: Record<string, number>;
    top_banned: Record<string, number>;
    sample_failures: Array<{ intent: string; missing: string[]; banned: string[]; ts: string }>;
  };
  source?: "llm" | "template" | "hybrid";
  days?: number;
}

export interface TedImprovementApplyResponse {
  ok: boolean;
  proposal_id: string;
  status: string;
  config_applied: boolean;
  config_key: string | null;
  config_error: string | null;
  applied_at: string;
}

// ─── Trust Autonomy Evaluation Types ───

export interface TedTrustAutonomyEvaluation {
  current_level: string;
  eligible_for_promotion: boolean;
  metrics: {
    validation_pass_rate: number;
    draft_approval_rate: number;
    total_validations: number;
    total_drafts_approved: number;
    consecutive_passes: number;
  };
  promotion_threshold: Record<string, number>;
  recommendation: string;
}

// ─── Failure Aggregation Types ───

export interface TedFailureAggregation {
  period_start: string;
  period_end: string;
  total_failures: number;
  failure_by_intent: Record<string, number>;
  top_banned_phrases: string[];
  top_missing_sections: string[];
  recommendation: string;
}

export interface TedFailureAggregationResponse {
  aggregation: TedFailureAggregation;
  generated_at: string;
}

// JC-110: Architecture closure types

export type TedGraphSyncStatusEntry = {
  kind: string;
  profile_id: string;
  status: string;
  at: string;
};

export type TedGraphSyncStatusResponse = {
  profile_id: string;
  entries: TedGraphSyncStatusEntry[];
  count: number;
};

export type TedTrustFailureReason = {
  count: number;
  missing_sections: Record<string, number>;
  banned_phrases: Record<string, number>;
};

// ─── External MCP Connections Types ───

export interface TedExternalMcpServer {
  server_id: string;
  enabled: boolean;
  transport: "http";
  url: string;
  timeout_ms: number;
  trust_tier?: "sandboxed" | "trusted_read" | "trusted_write";
  auth_token_env?: string;
  auth_token_configured?: boolean;
  auth_header_name?: string;
  description?: string;
  allow_tools: string[];
  deny_tools: string[];
  attestation_status?: "pending" | "attested" | "revoked";
  attested_at?: string | null;
  scope_verified?: string[];
  last_tested_at?: string | null;
  last_test_ok?: boolean | null;
  last_tool_count?: number | null;
}

export interface TedExternalMcpServersResponse {
  servers: TedExternalMcpServer[];
  total_count: number;
  cache_ttl_ms: number;
}

export interface TedExternalMcpToolsResponse {
  tools: Array<{
    local_name: string;
    remote_name: string;
    server_id: string;
    description?: string;
    inputSchema?: Record<string, unknown>;
  }>;
  total_count: number;
  errors: Array<{ server_id: string; error: string; source?: string }>;
  refreshed: boolean;
}

export interface TedExternalMcpServerTestResponse {
  ok: boolean;
  server_id: string;
  stale?: boolean;
  source?: string;
  tool_count?: number;
  tools_preview?: Array<{ local_name: string; remote_name: string }>;
  error?: string;
}

export interface TedMcpExternalAdmissionResponse {
  generated_at: string;
  server_id: string | null;
  admissions: Array<{
    server_id: string;
    enabled: boolean;
    trust_tier: "sandboxed" | "trusted_read" | "trusted_write";
    attestation_status: "pending" | "attested" | "revoked";
    attested_at: string | null;
    scope_verified: string[];
    auth: {
      token_env: string | null;
      token_configured: boolean;
    };
    test_evidence: {
      last_tested_at: string | null;
      last_test_ok: boolean | null;
      last_tool_count: number | null;
    };
    production_ready: boolean;
    blocking_reasons: string[];
    next_actions: string[];
  }>;
  total_count: number;
  ready_count: number;
  blocked_count: number;
}

export interface TedMcpExternalRevalidationStatusResponse {
  generated_at: string;
  has_run: boolean;
  last_run: {
    kind: string;
    at: string;
    server_id: string | null;
    summary: {
      total_servers: number;
      ok: number;
      blocked: number;
      stale_test: number;
    };
    checks: Array<{
      server_id: string;
      status: "ok" | "blocked" | "stale_test";
      production_ready: boolean;
      last_test_age_hours: number | null;
      blocking_reasons: string[];
    }>;
  } | null;
}

// ─── SharePoint Types ───

export interface TedSharePointSite {
  id: string;
  displayName: string;
  webUrl: string;
  name: string;
}

export interface TedSharePointDrive {
  id: string;
  name: string;
  driveType: string;
  webUrl: string;
  description: string | null;
}

export interface TedSharePointItem {
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
}

export interface TedSharePointSitesResponse {
  profile_id: string;
  sites: TedSharePointSite[];
  generated_at: string;
}

export interface TedSharePointDrivesResponse {
  profile_id: string;
  site_id: string;
  drives: TedSharePointDrive[];
  generated_at: string;
}

export interface TedSharePointItemsResponse {
  profile_id: string;
  drive_id: string;
  path: string;
  items: TedSharePointItem[];
  generated_at: string;
}

export interface TedSharePointSearchResponse {
  profile_id: string;
  drive_id: string;
  query: string;
  results: TedSharePointItem[];
  generated_at: string;
}

export interface TedSharePointUploadResponse {
  ok: boolean;
  item: TedSharePointItem | null;
  message: string;
}

export interface TedSharePointFolderResponse {
  ok: boolean;
  item: TedSharePointItem | null;
  message: string;
}

// C12-004: Stale deal owner tracking
export interface TedStaleDeal {
  deal_id: string;
  name: string;
  stage: string;
  last_touched_by: string;
  last_touched_at: string;
  days_since_touch: number;
}

export interface TedStaleDealResponse {
  stale_deals: TedStaleDeal[];
  threshold_days: number;
  checked_at: string;
}

// C12-011: Deal retrospective
export interface TedDealRetrospective {
  deal_id: string;
  generated_at: string;
  source: string;
  total_events: number;
  total_commitments: number;
  commitments_completed: number;
  commitments_open: number;
  total_drafts: number;
  drafts_executed: number;
  drafts_archived: number;
  stage_transitions: { from: string; to: string; at: string }[];
  timeline_days: number;
}

// ── Self-Healing Types (SDD 60) ──────────────────────────────────────

export interface TedCircuitBreakerState {
  workload_group: string;
  state: "closed" | "open" | "half-open";
  failure_rate: number;
  call_count: number;
  slow_call_count: number;
  opened_at: string | null;
  cooldown_ms: number;
  probe_in_flight: boolean;
}

export interface TedProviderHealth {
  provider: string;
  ewma_latency_ms: number;
  ewma_success_rate: number;
  composite_score: number;
  circuit_state: "closed" | "open" | "half-open";
  call_count: number;
  last_fallback_at: string | null;
}

export interface TedConfigDriftStatus {
  file: string;
  hash: string;
  last_checked: string;
  drift_detected: boolean;
  last_reload_at: string | null;
  validation_ok: boolean;
}

export interface TedCompactionResult {
  ledger: string;
  archived: number;
  retained: number;
  archive_path: string;
  archive_hash: string;
}

export interface TedSelfHealingStatus {
  ok: boolean;
  circuit_breakers: TedCircuitBreakerState[];
  provider_health: TedProviderHealth[];
  config_hashes: TedConfigDriftStatus[];
  last_compaction: { ran_at: string | null; results: TedCompactionResult[] };
  proposal_expiry: { expired_count: number; last_run: string | null };
  archive_manifest: { total_archives: number; total_bytes: number };
}

export interface TedEngagementInsights {
  ok: boolean;
  windows: Array<{
    content_type: string;
    optimal_hour: number;
    optimal_day_range: string;
    confidence: number;
    sample_size: number;
    batch_preference: boolean;
    median_read_latency_ms: number;
    median_action_latency_ms: number;
  }>;
}

export interface TedNoiseLevel {
  ok: boolean;
  level: number;
  level_label: string;
  days_in_state: number;
  trigger_signals: string[];
}

export interface TedAutonomyStatus {
  ok: boolean;
  tasks: Array<{
    task_type: string;
    current_level: number;
    correction_rate: number;
    engagement_rate: number;
    executions: number;
    eligible: boolean;
    blocking_reasons: string[];
    shadow_until: string | null;
  }>;
}

export interface TedCorrectionClassification {
  category: string;
  subcategory: string;
  confidence: number;
  evidence: string;
  spans: Array<{ start: number; end: number; type: string }>;
}
