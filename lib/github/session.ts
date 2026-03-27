import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

export interface GitHubOAuthTransaction {
  state: string;
  codeVerifier: string;
  returnTo: string;
  createdAt: string;
}

export interface GitHubSessionData {
  accessToken: string;
  scope?: string;
  tokenType?: string;
  login?: string;
  connectedAt: string;
}

const githubSessionCookie = "authrix_github_session";
const githubOAuthCookie = "authrix_github_oauth";

function getSecretKey() {
  const secret =
    process.env.GITHUB_SESSION_SECRET ?? process.env.AUTH0_SECRET ?? "";

  if (!secret) {
    return null;
  }

  return createHash("sha256").update(secret).digest();
}

function encryptPayload(payload: string) {
  const key = getSecretKey();

  if (!key) {
    throw new Error("Missing GITHUB_SESSION_SECRET or AUTH0_SECRET");
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".");
}

function decryptPayload(payload: string) {
  const key = getSecretKey();

  if (!key) {
    return null;
  }

  const [iv, tag, encrypted] = payload.split(".");

  if (!iv || !tag || !encrypted) {
    return null;
  }

  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(iv, "base64url"),
    );

    decipher.setAuthTag(Buffer.from(tag, "base64url"));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encrypted, "base64url")),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}

async function setEncryptedCookie(name: string, value: unknown, maxAge: number) {
  const store = await cookies();
  store.set(name, encryptPayload(JSON.stringify(value)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

async function getEncryptedCookie<T>(name: string): Promise<T | null> {
  const store = await cookies();
  const raw = store.get(name)?.value;

  if (!raw) {
    return null;
  }

  const decrypted = decryptPayload(raw);

  if (!decrypted) {
    return null;
  }

  try {
    return JSON.parse(decrypted) as T;
  } catch {
    return null;
  }
}

export async function setGitHubOAuthTransaction(value: GitHubOAuthTransaction) {
  await setEncryptedCookie(githubOAuthCookie, value, 60 * 10);
}

export async function getGitHubOAuthTransaction() {
  return getEncryptedCookie<GitHubOAuthTransaction>(githubOAuthCookie);
}

export async function clearGitHubOAuthTransaction() {
  const store = await cookies();
  store.delete(githubOAuthCookie);
}

export async function setGitHubSession(value: GitHubSessionData) {
  await setEncryptedCookie(githubSessionCookie, value, 60 * 60 * 8);
}

export async function getGitHubSession() {
  return getEncryptedCookie<GitHubSessionData>(githubSessionCookie);
}

export async function clearGitHubSession() {
  const store = await cookies();
  store.delete(githubSessionCookie);
}
