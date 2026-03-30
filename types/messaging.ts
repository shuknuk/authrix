import type { AgentId } from "@/types/agents";
import type { RouteDecision } from "@/types/models";

export type MessagingPlatform = "slack";
export type RoutedSlackAgentId = Exclude<AgentId, "task">;

export interface SlackConversation {
  id: string;
  workspaceId: string;
  platform: MessagingPlatform;
  channelId: string;
  threadTs: string;
  title: string;
  status: "active" | "resolved";
  routedAgentId: AgentId;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
}

export interface SlackMessageRecord {
  id: string;
  workspaceId: string;
  conversationId: string;
  platform: MessagingPlatform;
  direction: "incoming" | "outgoing";
  channelId: string;
  threadTs: string;
  slackTs: string;
  senderId: string;
  senderLabel: string;
  text: string;
  agentId?: AgentId;
  createdAt: string;
}

export interface SlackDispatchRecord {
  id: string;
  workspaceId: string;
  conversationId: string;
  routedAgentId: RoutedSlackAgentId;
  routeMode: RouteDecision["mode"];
  routeReason: string;
  routeModel?: string;
  delegationIds: string[];
  taskDispatchIds: string[];
  createdAt: string;
}

export interface SlackDelegationRecord {
  id: string;
  workspaceId: string;
  conversationId: string;
  sourceMessageId: string;
  parentAgentId: RoutedSlackAgentId;
  delegatedAgentId: RoutedSlackAgentId;
  reason: string;
  status: "delegated" | "completed";
  createdAt: string;
  completedAt?: string;
}

export interface SlackTaskDispatchRecord {
  id: string;
  workspaceId: string;
  conversationId: string;
  sourceMessageId: string;
  workspaceTaskId: string;
  title: string;
  description: string;
  suggestedOwner?: string;
  priority: "low" | "medium" | "high";
  assignedAgentId: RoutedSlackAgentId;
  status: "suggested" | "recorded" | "completed";
  sourceText: string;
  createdAt: string;
}

export interface SlackBriefingSchedule {
  id: string;
  workspaceId: string;
  title: string;
  cadence: "daily" | "weekly";
  audienceLabel: string;
  status: "active" | "paused";
  targetChannelId?: string;
  createdAt: string;
  lastRunAt?: string;
  nextRunAt?: string;
}

export interface SlackBriefingRecord {
  id: string;
  workspaceId: string;
  scheduleId: string;
  title: string;
  body: string;
  deliveryStatus: "generated" | "delivered" | "failed";
  targetChannelId?: string;
  relatedRecordIds: string[];
  createdAt: string;
  deliveredAt?: string;
  error?: string;
}

export interface SlackWorkspaceState {
  workspaceId: string;
  updatedAt: string;
  conversations: SlackConversation[];
  messages: SlackMessageRecord[];
  dispatches: SlackDispatchRecord[];
  delegations: SlackDelegationRecord[];
  taskDispatches: SlackTaskDispatchRecord[];
  briefingSchedules: SlackBriefingSchedule[];
  briefings: SlackBriefingRecord[];
}

export interface NormalizedSlackMessage {
  channelId: string;
  threadTs: string;
  slackTs: string;
  userId: string;
  text: string;
}

export interface SlackMessageDispatchResult {
  conversation: SlackConversation;
  incomingMessage: SlackMessageRecord;
  replyMessage?: SlackMessageRecord;
  dispatch: SlackDispatchRecord;
  delegations: SlackDelegationRecord[];
  taskDispatches: SlackTaskDispatchRecord[];
  routedAgentId: RoutedSlackAgentId;
}
