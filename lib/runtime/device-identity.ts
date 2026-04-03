import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { resolveAuthrixDataPath } from "@/lib/security/paths";

export interface RuntimeDeviceIdentity {
  deviceId: string;
  publicKeyPem: string;
  privateKeyPem: string;
}

type StoredRuntimeDeviceIdentity = RuntimeDeviceIdentity & {
  version: 1;
  createdAtMs: number;
};

const DEVICE_IDENTITY_PATH = resolveAuthrixDataPath("runtime-identity", "device.json");
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

export function loadOrCreateRuntimeDeviceIdentity(): RuntimeDeviceIdentity {
  try {
    if (fs.existsSync(DEVICE_IDENTITY_PATH)) {
      const raw = fs.readFileSync(DEVICE_IDENTITY_PATH, "utf8");
      const parsed = JSON.parse(raw) as Partial<StoredRuntimeDeviceIdentity>;

      if (
        parsed?.version === 1 &&
        typeof parsed.deviceId === "string" &&
        typeof parsed.publicKeyPem === "string" &&
        typeof parsed.privateKeyPem === "string"
      ) {
        return {
          deviceId: parsed.deviceId,
          publicKeyPem: parsed.publicKeyPem,
          privateKeyPem: parsed.privateKeyPem,
        };
      }
    }
  } catch {
    // Fall through and regenerate a fresh identity.
  }

  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" }).toString();
  const privateKeyPem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  const deviceId = fingerprintPublicKey(publicKeyPem);
  const identity: StoredRuntimeDeviceIdentity = {
    version: 1,
    createdAtMs: Date.now(),
    deviceId,
    publicKeyPem,
    privateKeyPem,
  };

  fs.mkdirSync(path.dirname(DEVICE_IDENTITY_PATH), { recursive: true });
  fs.writeFileSync(DEVICE_IDENTITY_PATH, `${JSON.stringify(identity, null, 2)}\n`, {
    mode: 0o600,
  });

  return {
    deviceId,
    publicKeyPem,
    privateKeyPem,
  };
}

export function buildDeviceAuthPayloadV3(params: {
  deviceId: string;
  clientId: string;
  clientMode: string;
  role: string;
  scopes: string[];
  signedAtMs: number;
  token?: string | null;
  nonce: string;
  platform?: string | null;
  deviceFamily?: string | null;
}): string {
  return [
    "v3",
    params.deviceId,
    params.clientId,
    params.clientMode,
    params.role,
    params.scopes.join(","),
    String(params.signedAtMs),
    params.token ?? "",
    params.nonce,
    normalizeDeviceMetadataForAuth(params.platform),
    normalizeDeviceMetadataForAuth(params.deviceFamily),
  ].join("|");
}

export function signDevicePayload(privateKeyPem: string, payload: string): string {
  const signature = crypto.sign(null, Buffer.from(payload, "utf8"), privateKeyPem);
  return base64UrlEncode(signature);
}

export function publicKeyRawBase64UrlFromPem(publicKeyPem: string): string {
  const key = crypto.createPublicKey(publicKeyPem);
  const spki = key.export({ type: "spki", format: "der" }) as Buffer;
  const raw =
    spki.length === ED25519_SPKI_PREFIX.length + 32 &&
    spki.subarray(0, ED25519_SPKI_PREFIX.length).equals(ED25519_SPKI_PREFIX)
      ? spki.subarray(ED25519_SPKI_PREFIX.length)
      : spki;

  return base64UrlEncode(raw);
}

function normalizeDeviceMetadataForAuth(value: string | null | undefined): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : "";
}

function fingerprintPublicKey(publicKeyPem: string): string {
  const key = crypto.createPublicKey(publicKeyPem);
  const spki = key.export({ type: "spki", format: "der" }) as Buffer;
  const raw =
    spki.length === ED25519_SPKI_PREFIX.length + 32 &&
    spki.subarray(0, ED25519_SPKI_PREFIX.length).equals(ED25519_SPKI_PREFIX)
      ? spki.subarray(ED25519_SPKI_PREFIX.length)
      : spki;

  return crypto.createHash("sha256").update(raw).digest("hex");
}

function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/g, "");
}
