import type { RuntimeBridge } from "@/types/runtime";
import { resolveRuntimeProvider } from "./config";
import { createMockBridge } from "./mock-bridge";
import { createOpenClawBridge } from "./openclaw-bridge";

let _bridge: RuntimeBridge | null = null;

export function getRuntimeBridge(): RuntimeBridge {
  if (!_bridge) {
    _bridge =
      resolveRuntimeProvider() === "openclaw"
        ? createOpenClawBridge()
        : createMockBridge();
  }
  return _bridge;
}

export function setRuntimeBridge(bridge: RuntimeBridge): void {
  _bridge = bridge;
}
