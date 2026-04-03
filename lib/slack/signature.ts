import crypto from "node:crypto";

export function verifySlackSignature(input: {
  signingSecret: string;
  timestamp: string | null;
  signature: string | null;
  body: string;
}): boolean {
  if (!input.signingSecret || !input.timestamp || !input.signature) {
    return false;
  }

  const fiveMinutes = 60 * 5;
  const timestampAge = Math.abs(Math.floor(Date.now() / 1000) - Number(input.timestamp));
  if (!Number.isFinite(timestampAge) || timestampAge > fiveMinutes) {
    return false;
  }

  const base = `v0:${input.timestamp}:${input.body}`;
  const computed =
    "v0=" +
    crypto.createHmac("sha256", input.signingSecret).update(base, "utf8").digest("hex");

  if (computed.length !== input.signature.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(input.signature));
}
