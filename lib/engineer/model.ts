import { getDefaultModelForAgent } from "@/lib/models/registry";
import { getModelProvider } from "@/lib/models/provider";

export interface EngineerEditableFile {
  path: string;
  content: string;
}

export interface EngineerEditProposal {
  plan: string[];
  needsClarification?: boolean;
  clarifyingQuestion?: string;
  edits: Array<{
    path: string;
    content: string;
    summary: string;
  }>;
  commitMessage?: string;
  prTitle?: string;
  prBody?: string;
  summary?: string;
}

export async function generateEngineerEditProposal(input: {
  repository: string;
  request: string;
  files: EngineerEditableFile[];
  packageScripts: string[];
  failedChecks?: string[];
}): Promise<EngineerEditProposal> {
  const provider = getModelProvider();
  if (!provider.configured) {
    throw new Error(
      "Authrix Engineer requires a configured model provider to generate code edits."
    );
  }

  const model = getDefaultModelForAgent("engineer");
  const result = await provider.chat({
    model,
    format: "json",
    temperature: 0.15,
    messages: [
      {
        role: "system",
        content: buildEngineerSystemPrompt(input.files),
      },
      {
        role: "user",
        content: JSON.stringify(
          {
            repository: input.repository,
            request: input.request,
            packageScripts: input.packageScripts,
            failedChecks: input.failedChecks ?? [],
            files: input.files,
          },
          null,
          2
        ),
      },
    ],
  });

  const parsed = safeParseJson(result.content);
  const edits = readArray(parsed, "edits")
    .map((entry) => ({
      path: readString(entry, "path") ?? "",
      content: readString(entry, "content") ?? "",
      summary: readString(entry, "summary") ?? "Updated by Authrix Engineer.",
    }))
    .filter(
      (entry) =>
        entry.path &&
        entry.content &&
        input.files.some((file) => file.path === entry.path)
    );

  return {
    plan: readStringArray(parsed, "plan"),
    needsClarification: readBoolean(parsed, "needsClarification"),
    clarifyingQuestion: readString(parsed, "clarifyingQuestion"),
    edits,
    commitMessage: readString(parsed, "commitMessage"),
    prTitle: readString(parsed, "prTitle"),
    prBody: readString(parsed, "prBody"),
    summary: readString(parsed, "summary"),
  };
}

function buildEngineerSystemPrompt(files: EngineerEditableFile[]): string {
  return [
    "You are the Authrix Engineer specialist working on a startup codebase.",
    "Return JSON only.",
    "Use only the files provided by the user payload. Do not invent new file paths.",
    "If the request cannot be completed safely from the provided files, set needsClarification=true and provide clarifyingQuestion.",
    'Return keys: plan, needsClarification, clarifyingQuestion, edits, commitMessage, prTitle, prBody, summary.',
    "plan must be an array of short strings.",
    "edits must be an array of objects with path, content, and summary.",
    "content must be the full final file contents for that path.",
    "Keep edits minimal, coherent, and production-ready.",
    `The only editable file paths are: ${files.map((file) => file.path).join(", ") || "(none)"}.`,
  ].join(" ");
}

function safeParseJson(value: string): Record<string, unknown> {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function readArray(input: Record<string, unknown>, key: string): Record<string, unknown>[] {
  const value = input[key];
  return Array.isArray(value) ? value.filter(isObject) : [];
}

function readStringArray(input: Record<string, unknown>, key: string): string[] {
  const value = input[key];
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : [];
}

function readString(input: Record<string, unknown>, key: string): string | undefined {
  const value = input[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function readBoolean(input: Record<string, unknown>, key: string): boolean | undefined {
  const value = input[key];
  return typeof value === "boolean" ? value : undefined;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
