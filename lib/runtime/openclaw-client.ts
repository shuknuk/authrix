import { randomUUID } from "node:crypto";
import packageJson from "@/package.json";
import type { OpenClawRuntimeConfig } from "./config";

const OPENCLAW_PROTOCOL_VERSION = 3;
const CONNECT_TIMEOUT_MS = 5_000;
const DEFAULT_SCOPES = ["operator.read", "operator.write"];

type PendingRequest = {
  expectFinal: boolean;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  timeoutId: NodeJS.Timeout | null;
};

type OpenClawEventFrame = {
  type: "event";
  event: string;
  payload?: unknown;
};

type OpenClawResponseFrame = {
  type: "res";
  id: string;
  ok: boolean;
  payload?: unknown;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};

type OpenClawRequestFrame = {
  type: "req";
  id: string;
  method: string;
  params?: unknown;
};

export interface OpenClawHelloOk {
  type: "hello-ok";
  protocol: number;
  server: {
    version: string;
    connId: string;
  };
  features: {
    methods: string[];
    events: string[];
  };
  policy?: {
    maxPayload?: number;
    maxBufferedBytes?: number;
    tickIntervalMs?: number;
  };
}

export interface OpenClawGatewayConnection {
  hello: OpenClawHelloOk;
  request<T>(
    method: string,
    params?: unknown,
    options?: { expectFinal?: boolean; timeoutMs?: number | null }
  ): Promise<T>;
  close(): Promise<void>;
}

export class OpenClawGatewayRequestError extends Error {
  readonly code?: string;
  readonly details?: unknown;

  constructor(message: string, options?: { code?: string; details?: unknown }) {
    super(message);
    this.name = "OpenClawGatewayRequestError";
    this.code = options?.code;
    this.details = options?.details;
  }
}

export async function connectToOpenClawGateway(
  config: OpenClawRuntimeConfig
): Promise<OpenClawGatewayConnection> {
  const WebSocketCtor = globalThis.WebSocket;

  if (typeof WebSocketCtor !== "function") {
    throw new Error(
      "This Node runtime does not expose a WebSocket client. Authrix runtime connectivity requires a WebSocket-capable server runtime."
    );
  }

  const socket = new WebSocketCtor(config.url);
  const pending = new Map<string, PendingRequest>();

  let connectRequestId: string | null = null;
  let connectNonce: string | null = null;
  let settled = false;
  let connectionClosed = false;
  let connectTimeoutId: NodeJS.Timeout | null = null;

  const helloPromise = new Promise<OpenClawHelloOk>((resolve, reject) => {
    const rejectConnection = (error: Error) => {
      if (settled) {
        return;
      }

      settled = true;
      clearConnectTimeout();
      reject(error);
    };

    const resolveConnection = (hello: OpenClawHelloOk) => {
      if (settled) {
        return;
      }

      settled = true;
      clearConnectTimeout();
      resolve(hello);
    };

    const handleOpen = () => {
      clearConnectTimeout();
      connectTimeoutId = setTimeout(() => {
        rejectConnection(new Error("Timed out waiting for the runtime transport challenge."));
      }, CONNECT_TIMEOUT_MS);
      connectTimeoutId.unref?.();
    };

    const handleMessage = (event: MessageEvent<unknown>) => {
      const raw = readSocketMessage(event.data);
      let frame: OpenClawEventFrame | OpenClawResponseFrame;

      try {
        frame = JSON.parse(raw) as OpenClawEventFrame | OpenClawResponseFrame;
      } catch {
        return;
      }

      if (frame.type === "event" && frame.event === "connect.challenge") {
        const payload =
          typeof frame.payload === "object" && frame.payload !== null
            ? (frame.payload as { nonce?: unknown })
            : undefined;
        const nonce =
          typeof payload?.nonce === "string" && payload.nonce.trim().length > 0
            ? payload.nonce.trim()
            : null;

        if (!nonce) {
          rejectConnection(new Error("The runtime transport challenge did not include a nonce."));
          socket.close(1008, "missing connect nonce");
          return;
        }

        connectNonce = nonce;
        sendConnectRequest();
        return;
      }

      if (frame.type !== "res") {
        return;
      }

      const activeRequest = pending.get(frame.id);
      if (!activeRequest) {
        return;
      }

      const payload =
        typeof frame.payload === "object" && frame.payload !== null
          ? (frame.payload as { status?: unknown })
          : undefined;

      if (activeRequest.expectFinal && payload?.status === "accepted") {
        return;
      }

      pending.delete(frame.id);
      if (activeRequest.timeoutId) {
        clearTimeout(activeRequest.timeoutId);
      }

      if (!frame.ok) {
        const error = new OpenClawGatewayRequestError(
          frame.error?.message ?? "Runtime transport request failed.",
          {
            code: frame.error?.code,
            details: frame.error?.details,
          }
        );

        activeRequest.reject(error);

        if (frame.id === connectRequestId) {
          rejectConnection(error);
        }
        return;
      }

      activeRequest.resolve(frame.payload);

      if (frame.id === connectRequestId) {
        resolveConnection(frame.payload as OpenClawHelloOk);
      }
    };

    const handleError = () => {
      rejectConnection(
        new Error(`Could not connect to the configured Authrix runtime endpoint at ${config.url}.`)
      );
    };

    const handleClose = (event: CloseEvent) => {
      connectionClosed = true;
      const description =
        event.reason?.trim() ||
        `The runtime transport closed the connection with code ${event.code}.`;
      const error = new Error(description);

      rejectConnection(error);
      flushPendingRequests(pending, error);
    };

    socket.addEventListener("open", handleOpen, { once: true });
    socket.addEventListener("message", handleMessage);
    socket.addEventListener("error", handleError);
    socket.addEventListener("close", handleClose, { once: true });
  });

  const hello = await helloPromise;

  return {
    hello,
    request,
    async close() {
      if (
        connectionClosed ||
        socket.readyState === WebSocketCtor.CLOSED ||
        socket.readyState === WebSocketCtor.CLOSING
      ) {
        return;
      }

      await new Promise<void>((resolve) => {
        const timeoutId = setTimeout(resolve, 1_000);
        timeoutId.unref?.();

        socket.addEventListener(
          "close",
          () => {
            clearTimeout(timeoutId);
            resolve();
          },
          { once: true }
        );

        socket.close(1000, "Authrix runtime adapter done");
      });
    },
  };

  function clearConnectTimeout() {
    if (connectTimeoutId) {
      clearTimeout(connectTimeoutId);
      connectTimeoutId = null;
    }
  }

  function sendConnectRequest() {
    if (connectRequestId || !connectNonce) {
      return;
    }

    connectRequestId = sendRequest<OpenClawHelloOk>("connect", {
      minProtocol: OPENCLAW_PROTOCOL_VERSION,
      maxProtocol: OPENCLAW_PROTOCOL_VERSION,
      client: {
        id: "authrix",
        displayName: "Authrix Runtime Adapter",
        version: packageJson.version,
        platform: process.platform,
        mode: "backend",
        instanceId: randomUUID(),
      },
      role: "operator",
      scopes: DEFAULT_SCOPES,
      auth:
        config.token || config.password
          ? {
              token: config.token,
              password: config.password,
            }
          : undefined,
    }).id;
  }

  function request<T>(
    method: string,
    params?: unknown,
    options?: { expectFinal?: boolean; timeoutMs?: number | null }
  ): Promise<T> {
    if (socket.readyState !== WebSocketCtor.OPEN) {
      throw new Error("The Authrix runtime transport is not connected.");
    }

    return sendRequest<T>(method, params, options).promise;
  }

  function sendRequest<T>(
    method: string,
    params?: unknown,
    options?: { expectFinal?: boolean; timeoutMs?: number | null }
  ): { id: string; promise: Promise<T> } {
    const id = randomUUID();
    const frame: OpenClawRequestFrame = {
      type: "req",
      id,
      method,
      params,
    };

    const timeoutMs =
      options?.timeoutMs === null
        ? null
        : typeof options?.timeoutMs === "number"
          ? Math.max(1, Math.floor(options.timeoutMs))
          : config.timeoutMs;

    const promise = new Promise<T>((resolve, reject) => {
      const timeoutId =
        timeoutMs === null
          ? null
          : setTimeout(() => {
              pending.delete(id);
              reject(
                new Error(
                  `Runtime transport request timed out for "${method}" after ${timeoutMs}ms.`
                )
              );
            }, timeoutMs);

      timeoutId?.unref?.();

      pending.set(id, {
        expectFinal: options?.expectFinal === true,
        resolve: (value) => resolve(value as T),
        reject,
        timeoutId,
      });
    });

    socket.send(JSON.stringify(frame));

    return { id, promise };
  }
}

export async function withOpenClawGateway<T>(
  config: OpenClawRuntimeConfig,
  run: (connection: OpenClawGatewayConnection) => Promise<T>
): Promise<T> {
  const connection = await connectToOpenClawGateway(config);

  try {
    return await run(connection);
  } finally {
    await connection.close();
  }
}

function flushPendingRequests(
  pending: Map<string, PendingRequest>,
  error: Error
) {
  for (const [id, request] of pending.entries()) {
    if (request.timeoutId) {
      clearTimeout(request.timeoutId);
    }
    request.reject(error);
    pending.delete(id);
  }
}

function readSocketMessage(data: unknown): string {
  if (typeof data === "string") {
    return data;
  }

  if (data instanceof ArrayBuffer) {
    return Buffer.from(data).toString("utf8");
  }

  if (ArrayBuffer.isView(data)) {
    return Buffer.from(data.buffer, data.byteOffset, data.byteLength).toString(
      "utf8"
    );
  }

  return String(data);
}
