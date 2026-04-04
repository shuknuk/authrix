import type { RuntimeBridge } from "@/types/runtime";
import { resolveRuntimeProvider } from "./config";
import { createMockBridge } from "./mock-bridge";
import { createOpenClawBridge } from "./openclaw-bridge";
import { createPersistentRuntimeBridge } from "./persistent-bridge";

let _bridge: RuntimeBridge | null = null;
let _baseBridge: RuntimeBridge | null = null;

export function getBaseRuntimeBridge(): RuntimeBridge {
  if (!_baseBridge) {
    _baseBridge =
      resolveRuntimeProvider() === "openclaw"
        ? createOpenClawBridge()
        : createMockBridge();
  }

  return _baseBridge;
}

export function getRuntimeBridge(): RuntimeBridge {
  if (!_bridge) {
    _bridge = createPersistentRuntimeBridge(getBaseRuntimeBridge());
  }

  return _bridge;
}

export function getBaseRuntimeBridge(): RuntimeBridge {
  return getRuntimeBridge();
}

export function resetRuntimeBridge(): void {
  _bridge = null;
}

export function setRuntimeBridge(bridge: RuntimeBridge): void {
  _baseBridge = bridge;
  _bridge = bridge;
}

export function resetRuntimeBridge(): void {
  _baseBridge = null;
  _bridge = null;
}
