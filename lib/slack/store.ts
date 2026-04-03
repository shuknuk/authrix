import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolveAuthrixDataPath } from "@/lib/security/paths";
import { getSlackConfig } from "@/lib/slack/config";
import type { AgentId } from "@/types/agents";
import type {
  NormalizedSlackMessage,
  RoutedSlackAgentId,
  SlackBriefingRecord,
  SlackBriefingSchedule,
  SlackConversation,
  SlackDelegationRecord,
  SlackDispatchRecord,
  SlackMessageDispatchResult,
  SlackMessageRecord,
  SlackTaskDispatchRecord,
  SlackWorkspaceState,
} from "@/types/messaging";
import type { RouteDecision } from "@/types/models";
import type { JobState } from "@/types/runtime";

const SLACK_STATE_PATH = resolveAuthrixDataPath("slack-state.json");
const WORKSPACE_ID = "workspace-authrix";

export async function loadSlackWorkspaceState(): Promise<SlackWorkspaceState> {
  try {
    const raw = await readFile(SLACK_STATE_PATH, "utf8");
    return migrateSlackWorkspaceState(JSON.parse(raw) as Partial<SlackWorkspaceState>);
  } catch (error) {
    if (isMissingFileError(error)) {
      return createEmptySlackWorkspaceState();
    }

    throw error;
  }
}

export async function saveSlackWorkspaceState(
  state: SlackWorkspaceState
): Promise<SlackWorkspaceState> {
  const nextState: SlackWorkspaceState = {
    ...state,
    updatedAt: new Date().toISOString(),
  };

  await mkdir(resolveAuthrixDataPath(), { recursive: true });
  await writeFile(SLACK_STATE_PATH, JSON.stringify(nextState, null, 2), "utf8");
  return nextState;
}

export async function recordSlackDispatch(input: {
  message: NormalizedSlackMessage;
  routedAgentId: RoutedSlackAgentId;
  routeDecision: RouteDecision;
  delegations?: SlackDelegationRecord[];
  taskDispatches?: SlackTaskDispatchRecord[];
  replyText?: string;
  runtime?: {
    sessionId?: string;
    runId?: string;
    runStatus?: JobState;
  };
}): Promise<SlackMessageDispatchResult> {
  const state = await loadSlackWorkspaceState();
  const now = new Date().toISOString();
  const conversation =
    state.conversations.find(
      (entry) =>
        entry.channelId === input.message.channelId && entry.threadTs === input.message.threadTs
    ) ?? createConversation(input.message, input.routedAgentId, now);

  conversation.title = buildConversationTitle(input.message.text);
  conversation.routedAgentId = input.routedAgentId;
  conversation.lastMessageAt = now;
  conversation.updatedAt = now;
  if (input.runtime?.sessionId) {
    conversation.runtimeSessionId = input.runtime.sessionId;
  }
  if (input.runtime?.runId) {
    conversation.runtimeRunCount = incrementRunCount(conversation, input.runtime.runId);
    conversation.runtimeLastRunId = input.runtime.runId;
    conversation.runtimeLastRunStatus = input.runtime.runStatus;
    conversation.runtimeLastRunAt = now;
  }

  const existingConversationIndex = state.conversations.findIndex(
    (entry) => entry.id === conversation.id
  );

  if (existingConversationIndex >= 0) {
    state.conversations[existingConversationIndex] = conversation;
  } else {
    state.conversations.unshift(conversation);
  }

  const incomingMessage: SlackMessageRecord = {
    id: `slack_msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    workspaceId: WORKSPACE_ID,
    conversationId: conversation.id,
    platform: "slack",
    direction: "incoming",
    channelId: input.message.channelId,
    threadTs: input.message.threadTs,
    slackTs: input.message.slackTs,
    senderId: input.message.userId,
    senderLabel: input.message.userId,
    text: input.message.text,
    agentId: input.routedAgentId,
    createdAt: now,
  };

  state.messages.unshift(incomingMessage);
  const delegations = (input.delegations ?? []).map((item) => ({
    ...item,
    conversationId: conversation.id,
    sourceMessageId: incomingMessage.id,
  }));
  const taskDispatches = (input.taskDispatches ?? []).map((item) => ({
    ...item,
    conversationId: conversation.id,
    sourceMessageId: incomingMessage.id,
  }));
  const dispatch: SlackDispatchRecord = {
    id: `slack_dispatch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    workspaceId: WORKSPACE_ID,
    conversationId: conversation.id,
    routedAgentId: input.routedAgentId,
    routeMode: input.routeDecision.mode,
    routeReason: input.routeDecision.reason,
    routeModel: input.routeDecision.model,
    delegationIds: delegations.map((item) => item.id),
    taskDispatchIds: taskDispatches.map((item) => item.id),
    createdAt: now,
    runtimeSessionId: input.runtime?.sessionId,
    runtimeRunId: input.runtime?.runId,
    runtimeRunStatus: input.runtime?.runStatus,
  };
  state.dispatches.unshift(dispatch);
  state.delegations.unshift(...delegations);
  state.taskDispatches.unshift(...taskDispatches);

  let replyMessage: SlackMessageRecord | undefined;
  if (input.replyText) {
    replyMessage = {
      id: `slack_msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      workspaceId: WORKSPACE_ID,
      conversationId: conversation.id,
      platform: "slack",
      direction: "outgoing",
      channelId: input.message.channelId,
      threadTs: input.message.threadTs,
      slackTs: `local_${Date.now()}`,
      senderId: "authrix-bot",
      senderLabel: "Authrix",
      text: input.replyText,
      agentId: input.routedAgentId,
      createdAt: now,
    };

    state.messages.unshift(replyMessage);
  }

  state.messages = state.messages.slice(0, 200);
  state.dispatches = state.dispatches.slice(0, 200);
  state.delegations = state.delegations.slice(0, 200);
  state.taskDispatches = state.taskDispatches.slice(0, 200);
  state.briefings = state.briefings.slice(0, 100);
  state.conversations = state.conversations
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, 40);

  await saveSlackWorkspaceState(state);

  return {
    conversation,
    incomingMessage,
    replyMessage,
    dispatch,
    delegations,
    taskDispatches,
    routedAgentId: input.routedAgentId,
  };
}

export async function findSlackConversationByThread(input: {
  channelId: string;
  threadTs: string;
}): Promise<SlackConversation | null> {
  const state = await loadSlackWorkspaceState();
  return (
    state.conversations.find(
      (conversation) =>
        conversation.channelId === input.channelId && conversation.threadTs === input.threadTs
    ) ?? null
  );
}

export async function appendSlackReplyMessage(input: {
  conversationId: string;
  text: string;
  agentId?: AgentId;
  senderLabel?: string;
  createdAt?: string;
}): Promise<{
  conversation: SlackConversation;
  message: SlackMessageRecord;
}> {
  const state = await loadSlackWorkspaceState();
  const now = input.createdAt ?? new Date().toISOString();
  const conversationIndex = state.conversations.findIndex(
    (conversation) => conversation.id === input.conversationId
  );

  if (conversationIndex === -1) {
    throw new Error(`Slack conversation ${input.conversationId} was not found.`);
  }

  const conversation = {
    ...state.conversations[conversationIndex],
    updatedAt: now,
    lastMessageAt: now,
  };
  const message: SlackMessageRecord = {
    id: `slack_msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    workspaceId: WORKSPACE_ID,
    conversationId: conversation.id,
    platform: "slack",
    direction: "outgoing",
    channelId: conversation.channelId,
    threadTs: conversation.threadTs,
    slackTs: `local_${Date.now()}`,
    senderId: "authrix-bot",
    senderLabel: input.senderLabel ?? "Authrix",
    text: input.text,
    agentId: input.agentId,
    createdAt: now,
  };

  state.conversations[conversationIndex] = conversation;
  state.messages.unshift(message);
  state.messages = state.messages.slice(0, 200);
  state.conversations = state.conversations
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, 40);

  await saveSlackWorkspaceState(state);

  return {
    conversation,
    message,
  };
}

export async function recordSlackRuntimeRunUpdate(input: {
  conversationId: string;
  agentId: RoutedSlackAgentId;
  runId: string;
  status: JobState;
  sessionId?: string;
  outputSummary?: string;
  error?: string;
  replyText?: string;
  createdAt?: string;
}): Promise<{
  conversation: SlackConversation;
  outgoingMessage?: SlackMessageRecord;
}> {
  const state = await loadSlackWorkspaceState();
  const now = input.createdAt ?? new Date().toISOString();
  const conversationIndex = state.conversations.findIndex(
    (conversation) => conversation.id === input.conversationId
  );

  if (conversationIndex === -1) {
    throw new Error(`Slack conversation ${input.conversationId} was not found.`);
  }

  const conversation = {
    ...state.conversations[conversationIndex],
    updatedAt: now,
    runtimeSessionId: input.sessionId ?? state.conversations[conversationIndex].runtimeSessionId,
    runtimeLastRunId: input.runId,
    runtimeLastRunStatus: input.status,
    runtimeLastRunAt: now,
  };

  let outgoingMessage: SlackMessageRecord | undefined;
  if (input.replyText) {
    conversation.lastMessageAt = now;
    outgoingMessage = {
      id: `slack_msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      workspaceId: WORKSPACE_ID,
      conversationId: conversation.id,
      platform: "slack",
      direction: "outgoing",
      channelId: conversation.channelId,
      threadTs: conversation.threadTs,
      slackTs: `local_${Date.now()}`,
      senderId: "authrix-bot",
      senderLabel: "Authrix",
      text: input.replyText,
      agentId: input.agentId,
      createdAt: now,
    };

    state.messages.unshift(outgoingMessage);
  }

  state.conversations[conversationIndex] = conversation;

  const dispatchIndex = state.dispatches.findIndex(
    (dispatch) =>
      dispatch.runtimeRunId === input.runId || dispatch.conversationId === input.conversationId
  );
  if (dispatchIndex >= 0) {
    state.dispatches[dispatchIndex] = {
      ...state.dispatches[dispatchIndex],
      runtimeSessionId: input.sessionId ?? state.dispatches[dispatchIndex].runtimeSessionId,
      runtimeRunId: input.runId,
      runtimeRunStatus: input.status,
    };
  }

  state.messages = state.messages.slice(0, 200);
  state.conversations = state.conversations
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, 40);

  await saveSlackWorkspaceState(state);

  return {
    conversation,
    outgoingMessage,
  };
}

export async function listSlackBriefingSchedules(): Promise<SlackBriefingSchedule[]> {
  const state = await loadSlackWorkspaceState();
  return state.briefingSchedules.map(cloneValue);
}

export async function listSlackBriefings(limit = 10): Promise<SlackBriefingRecord[]> {
  const state = await loadSlackWorkspaceState();
  return state.briefings.slice(0, limit).map(cloneValue);
}

export async function saveSlackBriefingRun(input: {
  scheduleId: string;
  title: string;
  body: string;
  deliveryStatus: SlackBriefingRecord["deliveryStatus"];
  targetChannelId?: string;
  deliveredAt?: string;
  relatedRecordIds: string[];
  error?: string;
}): Promise<{
  schedule: SlackBriefingSchedule;
  record: SlackBriefingRecord;
  outgoingMessage?: SlackMessageRecord;
}> {
  const state = await loadSlackWorkspaceState();
  const schedule = state.briefingSchedules.find((entry) => entry.id === input.scheduleId);
  if (!schedule) {
    throw new Error(`Slack briefing schedule ${input.scheduleId} was not found.`);
  }

  const createdAt = new Date().toISOString();
  const record: SlackBriefingRecord = {
    id: `slack_briefing_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    workspaceId: WORKSPACE_ID,
    scheduleId: schedule.id,
    title: input.title,
    body: input.body,
    deliveryStatus: input.deliveryStatus,
    targetChannelId: input.targetChannelId,
    relatedRecordIds: [...input.relatedRecordIds],
    createdAt,
    deliveredAt: input.deliveredAt,
    error: input.error,
  };

  schedule.lastRunAt = createdAt;
  schedule.nextRunAt = computeNextRunAt(schedule.cadence, createdAt);
  state.briefings.unshift(record);

  let outgoingMessage: SlackMessageRecord | undefined;
  if (input.targetChannelId) {
    const conversation =
      state.conversations.find((entry) => entry.channelId === input.targetChannelId) ??
      createSystemConversation(input.targetChannelId, schedule.title, createdAt);

    const existingConversationIndex = state.conversations.findIndex(
      (entry) => entry.id === conversation.id
    );
    if (existingConversationIndex >= 0) {
      conversation.updatedAt = createdAt;
      conversation.lastMessageAt = createdAt;
      state.conversations[existingConversationIndex] = conversation;
    } else {
      state.conversations.unshift(conversation);
    }

    outgoingMessage = {
      id: `slack_msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      workspaceId: WORKSPACE_ID,
      conversationId: conversation.id,
      platform: "slack",
      direction: "outgoing",
      channelId: input.targetChannelId,
      threadTs: conversation.threadTs,
      slackTs: `briefing_${Date.now()}`,
      senderId: "authrix-bot",
      senderLabel: "Authrix",
      text: `${record.title}\n\n${record.body}`,
      agentId: "workflow",
      createdAt,
    };

    state.messages.unshift(outgoingMessage);
  }

  state.messages = state.messages.slice(0, 200);
  state.briefings = state.briefings.slice(0, 100);
  state.conversations = state.conversations
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, 40);

  await saveSlackWorkspaceState(state);

  return {
    schedule: cloneValue(schedule),
    record,
    outgoingMessage,
  };
}

function createEmptySlackWorkspaceState(): SlackWorkspaceState {
  const now = new Date().toISOString();
  const config = getSlackConfig();
  return {
    workspaceId: WORKSPACE_ID,
    updatedAt: now,
    conversations: [],
    messages: [],
    dispatches: [],
    delegations: [],
    taskDispatches: [],
    briefingSchedules: [
      {
        id: "briefing-daily-ops",
        workspaceId: WORKSPACE_ID,
        title: "Daily Ops Briefing",
        cadence: "daily",
        audienceLabel: "Leadership",
        status: "active",
        targetChannelId: config.defaultChannelId,
        createdAt: now,
        nextRunAt: computeNextRunAt("daily", now),
      },
      {
        id: "briefing-weekly-exec",
        workspaceId: WORKSPACE_ID,
        title: "Weekly Executive Briefing",
        cadence: "weekly",
        audienceLabel: "Founders",
        status: "active",
        targetChannelId: config.defaultChannelId,
        createdAt: now,
        nextRunAt: computeNextRunAt("weekly", now),
      },
    ],
    briefings: [],
  };
}

function createConversation(
  message: NormalizedSlackMessage,
  routedAgentId: RoutedSlackAgentId,
  now: string
): SlackConversation {
  return {
    id: `slack_convo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    workspaceId: WORKSPACE_ID,
    platform: "slack",
    channelId: message.channelId,
    threadTs: message.threadTs,
    title: buildConversationTitle(message.text),
    status: "active",
    routedAgentId,
    createdAt: now,
    updatedAt: now,
    lastMessageAt: now,
  };
}

function createSystemConversation(
  channelId: string,
  title: string,
  now: string
): SlackConversation {
  return {
    id: `slack_convo_system_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    workspaceId: WORKSPACE_ID,
    platform: "slack",
    channelId,
    threadTs: `briefing_${Date.now()}`,
    title,
    status: "active",
    routedAgentId: "workflow",
    createdAt: now,
    updatedAt: now,
    lastMessageAt: now,
  };
}

function buildConversationTitle(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > 72 ? `${normalized.slice(0, 69)}...` : normalized || "Slack request";
}

function incrementRunCount(conversation: SlackConversation, runId: string): number {
  if (conversation.runtimeLastRunId === runId) {
    return conversation.runtimeRunCount ?? 1;
  }

  return (conversation.runtimeRunCount ?? 0) + 1;
}

function migrateSlackWorkspaceState(
  state: Partial<SlackWorkspaceState>
): SlackWorkspaceState {
  const empty = createEmptySlackWorkspaceState();

  return {
    workspaceId: state.workspaceId ?? empty.workspaceId,
    updatedAt: state.updatedAt ?? empty.updatedAt,
    conversations: state.conversations ?? empty.conversations,
    messages: state.messages ?? empty.messages,
    dispatches: state.dispatches ?? [],
    delegations: state.delegations ?? [],
    taskDispatches: state.taskDispatches ?? [],
    briefingSchedules:
      state.briefingSchedules && state.briefingSchedules.length > 0
        ? state.briefingSchedules
        : empty.briefingSchedules,
    briefings: state.briefings ?? [],
  };
}

function computeNextRunAt(cadence: "daily" | "weekly", from: string): string {
  const date = new Date(from);
  date.setUTCDate(date.getUTCDate() + (cadence === "daily" ? 1 : 7));
  return date.toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ENOENT"
  );
}
