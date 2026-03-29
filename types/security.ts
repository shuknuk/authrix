import type { RuntimeProvider } from "@/types/runtime";

export type ActionExecutionTier =
  | "read-only"
  | "product-write"
  | "external-write"
  | "host-level";

export interface ActionPolicy {
  actionKind: string;
  label: string;
  executionTier: ActionExecutionTier;
  requiresApproval: boolean;
  backendMediated: boolean;
  description: string;
}

export interface RuntimeToolPolicyStatus {
  allowedTools: string[];
  blockedTools: string[];
  hostLevelToolsAllowed: boolean;
  mode: "default-deny-host" | "allowlist" | "mixed";
}

export type SecurityGuardrailState = "enabled" | "warning" | "disabled";

export interface SecurityGuardrailStatus {
  id: string;
  label: string;
  state: SecurityGuardrailState;
  message: string;
}

export interface SecurityPosture {
  checkedAt: string;
  deploymentMode: "local-dev" | "worker-box";
  runtimeProvider: RuntimeProvider;
  runtimeConnectScopes: string[];
  runtimeToolPolicy: RuntimeToolPolicyStatus;
  auth0Configured: boolean;
  tokenVaultConfigured: boolean;
  externalWritesEnabled: boolean;
  personalAccessTokenFallbackEnabled: boolean;
  tokenVaultOverrideEnabled: boolean;
  guardrails: SecurityGuardrailStatus[];
  warnings: string[];
}

export type SecurityEventLevel = "info" | "warning" | "critical";

export interface SecurityEvent {
  id: string;
  timestamp: string;
  level: SecurityEventLevel;
  category:
    | "deployment"
    | "runtime_policy"
    | "approval_policy"
    | "credential_policy";
  title: string;
  description: string;
  metadata: Record<string, unknown>;
}
