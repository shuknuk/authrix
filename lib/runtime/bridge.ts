import type { RuntimeBridge } from "@/types/runtime";
import { createMockBridge } from "./mock-bridge";

let _bridge: RuntimeBridge | null = null;

export function getRuntimeBridge(): RuntimeBridge {
  if (!_bridge) {
    // MVP: use mock bridge. Swap this for real OpenClaw bridge later.
    _bridge = createMockBridge();
  }
  return _bridge;
}

export function setRuntimeBridge(bridge: RuntimeBridge): void {
  _bridge = bridge;
}
