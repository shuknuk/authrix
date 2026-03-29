export type DeploymentStatus = "ready" | "warning" | "blocked";
export type DeploymentChecklistStatus = "pending" | "in_progress" | "complete";
export type DeploymentSmokeStatus = "passed" | "warning" | "failed";

export interface DeploymentCheck {
  id: string;
  label: string;
  status: DeploymentStatus;
  message: string;
}

export interface DeploymentChecklistItem {
  id: string;
  label: string;
  status: DeploymentChecklistStatus;
  description: string;
}

export interface DeploymentReadinessReport {
  checkedAt: string;
  deploymentMode: "local-dev" | "worker-box";
  overallStatus: DeploymentStatus;
  checks: DeploymentCheck[];
  checklist: DeploymentChecklistItem[];
  nextSteps: string[];
}

export interface DeploymentSmokeTest {
  id: string;
  label: string;
  status: DeploymentSmokeStatus;
  details: string;
}

export interface DeploymentSmokeReport {
  checkedAt: string;
  overallStatus: DeploymentStatus;
  tests: DeploymentSmokeTest[];
  notes: string[];
}
