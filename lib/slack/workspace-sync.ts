import { updatePersistedWorkspaceSnapshot } from "@/lib/data/workspace-store";
import type { AgentId } from "@/types/agents";
import type {
  SlackBriefingRecord,
  SlackMessageDispatchResult,
  SlackMessageRecord,
} from "@/types/messaging";

export async function recordSlackDispatchInWorkspace(
  dispatch: SlackMessageDispatchResult
): Promise<void> {
  await updatePersistedWorkspaceSnapshot((snapshot) => {
    const now = new Date().toISOString();
    const newTasks = dispatch.taskDispatches
      .filter((item) => !snapshot.tasks.some((task) => task.id === item.workspaceTaskId))
      .map((item) => ({
        id: item.workspaceTaskId,
        title: item.title,
        description: item.description,
        priority: item.priority,
        suggestedOwner: item.suggestedOwner,
        source: `Slack: ${dispatch.conversation.title}`,
        sourceAgentId: item.assignedAgentId,
        status: "suggested" as const,
        createdAt: item.createdAt,
      }));
    const nextTimeline = [
      {
        id: `timeline_slack_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type: "slack_message",
        title: `Slack message routed to ${formatAgentLabel(dispatch.routedAgentId)}`,
        description: dispatch.incomingMessage.text,
        source: "slack",
        timestamp: now,
        metadata: {
          channelId: dispatch.incomingMessage.channelId,
          threadTs: dispatch.incomingMessage.threadTs,
          conversationId: dispatch.conversation.id,
          runtimeSessionId: dispatch.dispatch.runtimeSessionId,
          runtimeRunId: dispatch.dispatch.runtimeRunId,
          runtimeRunStatus: dispatch.dispatch.runtimeRunStatus,
        },
        relatedRecordIds: [dispatch.conversation.id, dispatch.incomingMessage.id],
      },
      ...dispatch.delegations.map((delegation) => ({
        id: `timeline_${delegation.id}`,
        type: "delegation",
        title: `Delegated to ${formatAgentLabel(delegation.delegatedAgentId)}`,
        description: delegation.reason,
        source: formatAgentLabel(delegation.parentAgentId),
        timestamp: delegation.createdAt,
        metadata: {
          conversationId: delegation.conversationId,
          delegatedAgentId: delegation.delegatedAgentId,
        },
        relatedRecordIds: [delegation.id, delegation.sourceMessageId],
      })),
      ...dispatch.taskDispatches.map((taskDispatch) => ({
        id: `timeline_${taskDispatch.id}`,
        type: "chat_task_dispatch",
        title: taskDispatch.title,
        description: taskDispatch.description,
        source: "slack",
        timestamp: taskDispatch.createdAt,
        metadata: {
          assignedAgentId: taskDispatch.assignedAgentId,
          suggestedOwner: taskDispatch.suggestedOwner,
          workspaceTaskId: taskDispatch.workspaceTaskId,
        },
        relatedRecordIds: [taskDispatch.id, taskDispatch.workspaceTaskId],
      })),
      ...snapshot.timeline,
    ].slice(0, 120);

    const nextAgentRuns = [
      {
        id: `agent_run_slack_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        workspaceId: snapshot.workspace.id,
        agentId: dispatch.routedAgentId,
        status: "completed" as const,
        startedAt: now,
        completedAt: now,
        inputSummary: dispatch.incomingMessage.text,
        outputSummary:
          dispatch.dispatch.runtimeRunId && dispatch.dispatch.runtimeSessionId
            ? `Slack request queued to ${formatAgentLabel(dispatch.routedAgentId)} in runtime session ${dispatch.dispatch.runtimeSessionId}.`
            : `Slack request routed to ${formatAgentLabel(dispatch.routedAgentId)}.`,
        provider: dispatch.dispatch.runtimeRunId ? ("runtime" as const) : ("local" as const),
        runtimeSessionId: dispatch.dispatch.runtimeSessionId,
        relatedRecordIds: [
          dispatch.conversation.id,
          dispatch.incomingMessage.id,
          ...(dispatch.dispatch.runtimeRunId ? [dispatch.dispatch.runtimeRunId] : []),
        ],
      },
      ...snapshot.agentRuns,
    ].slice(0, 80);

    const nextAuditEvents = [
      {
        id: `audit_slack_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        workspaceId: snapshot.workspace.id,
        action: "slack.message.routed",
        actor: dispatch.incomingMessage.senderLabel,
        target: formatAgentLabel(dispatch.routedAgentId),
        details: `Slack conversation ${dispatch.conversation.id} routed through the messaging layer.`,
        timestamp: now,
        metadata: {
          channelId: dispatch.incomingMessage.channelId,
          threadTs: dispatch.incomingMessage.threadTs,
          runtimeSessionId: dispatch.dispatch.runtimeSessionId,
          runtimeRunId: dispatch.dispatch.runtimeRunId,
          runtimeRunStatus: dispatch.dispatch.runtimeRunStatus,
        },
        relatedRecordIds: [dispatch.conversation.id, dispatch.incomingMessage.id],
      },
      ...dispatch.delegations.map((delegation) => ({
        id: `audit_${delegation.id}`,
        workspaceId: snapshot.workspace.id,
        action: "slack.delegation.created",
        actor: formatAgentLabel(delegation.parentAgentId),
        target: formatAgentLabel(delegation.delegatedAgentId),
        details: delegation.reason,
        timestamp: delegation.createdAt,
        metadata: {
          conversationId: delegation.conversationId,
        },
        relatedRecordIds: [delegation.id, delegation.sourceMessageId],
      })),
      ...dispatch.taskDispatches.map((taskDispatch) => ({
        id: `audit_${taskDispatch.id}`,
        workspaceId: snapshot.workspace.id,
        action: "slack.task_dispatch.created",
        actor: formatAgentLabel(taskDispatch.assignedAgentId),
        target: taskDispatch.workspaceTaskId,
        details: `Chat-native follow-up created: ${taskDispatch.title}`,
        timestamp: taskDispatch.createdAt,
        metadata: {
          conversationId: taskDispatch.conversationId,
          suggestedOwner: taskDispatch.suggestedOwner,
        },
        relatedRecordIds: [taskDispatch.id, taskDispatch.workspaceTaskId],
      })),
      ...snapshot.auditEvents,
    ].slice(0, 120);

    return {
      ...snapshot,
      tasks: [...newTasks, ...snapshot.tasks],
      agentRuns: nextAgentRuns,
      timeline: nextTimeline,
      auditEvents: nextAuditEvents,
    };
  });
}

export async function recordSlackBriefingInWorkspace(
  briefing: SlackBriefingRecord,
  outgoingMessage?: SlackMessageRecord
): Promise<void> {
  await updatePersistedWorkspaceSnapshot((snapshot) => {
    const nextTimeline = [
      {
        id: `timeline_${briefing.id}`,
        type: "slack_briefing",
        title: briefing.title,
        description: briefing.body,
        source: "slack",
        timestamp: briefing.deliveredAt ?? briefing.createdAt,
        metadata: {
          deliveryStatus: briefing.deliveryStatus,
          targetChannelId: briefing.targetChannelId,
        },
        relatedRecordIds: briefing.relatedRecordIds,
      },
      ...snapshot.timeline,
    ].slice(0, 120);

    const nextAuditEvents = [
      {
        id: `audit_${briefing.id}`,
        workspaceId: snapshot.workspace.id,
        action: `slack.briefing.${briefing.deliveryStatus}`,
        actor: "Authrix",
        target: briefing.targetChannelId ?? "slack",
        details: briefing.title,
        timestamp: briefing.deliveredAt ?? briefing.createdAt,
        metadata: {
          scheduleId: briefing.scheduleId,
        },
        relatedRecordIds: briefing.relatedRecordIds,
      },
      ...snapshot.auditEvents,
    ].slice(0, 120);

    const nextAgentRuns = [
      {
        id: `agent_run_${briefing.id}`,
        workspaceId: snapshot.workspace.id,
        agentId: "workflow",
        status: briefing.deliveryStatus === "failed" ? ("failed" as const) : ("completed" as const),
        startedAt: briefing.createdAt,
        completedAt: briefing.deliveredAt ?? briefing.createdAt,
        inputSummary: "Generated a proactive Slack briefing from persisted workspace state.",
        outputSummary: briefing.title,
        provider: "local" as const,
        relatedRecordIds: briefing.relatedRecordIds,
      },
      ...snapshot.agentRuns,
    ].slice(0, 80);

    return {
      ...snapshot,
      timeline: nextTimeline,
      auditEvents: nextAuditEvents,
      agentRuns: nextAgentRuns,
      state: {
        ...snapshot.state,
        refreshedAt: new Date().toISOString(),
      },
    };
  });
}

function formatAgentLabel(agentId: AgentId): string {
  if (agentId === "docs") {
    return "Docs";
  }

  if (agentId === "devops") {
    return "DevOps";
  }

  if (agentId === "workflow") {
    return "Workflow";
  }

  return "Engineer";
}
