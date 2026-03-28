import { engineerAgent } from "./engineer";
import { taskAgent } from "./task";
import { devopsAgent } from "./devops";
import type { EngineerAgentInput, TaskAgentInput, DevOpsAgentInput } from "@/types/agents";

export { engineerAgent } from "./engineer";
export { taskAgent } from "./task";
export { devopsAgent } from "./devops";

/**
 * Generic agent dispatcher used by the mock runtime bridge.
 * Routes agent execution by ID to the appropriate function.
 */
export async function runAgent(agentId: string, input: unknown): Promise<unknown> {
  switch (agentId) {
    case "engineer":
      return engineerAgent(input as EngineerAgentInput);
    case "task":
      return taskAgent(input as TaskAgentInput);
    case "devops":
      return devopsAgent(input as DevOpsAgentInput);
    default:
      throw new Error(`Unknown agent: ${agentId}`);
  }
}
