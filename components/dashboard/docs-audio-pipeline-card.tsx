import { CardShell } from "@/components/ui/card-shell";
import type { AudioTranscriptionStatus } from "@/lib/docs/audio";
import type { SourceDocument } from "@/types/domain";
import type { ReactNode } from "react";

interface DocsAudioPipelineCardProps {
  status: AudioTranscriptionStatus;
  documents: SourceDocument[];
  limit?: number;
}

export function DocsAudioPipelineCard({
  status,
  documents,
  limit = 3,
}: DocsAudioPipelineCardProps) {
  const uploads = documents
    .filter((document) => document.metadata.uploadKind === "audio")
    .slice(0, limit);

  return (
    <CardShell
      title="Docs Audio Intake"
      description="Upload meeting audio to the controlled backend route and let Docs turn it into a durable transcript, artifact, and optional workflow handoff."
      badge={
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${
            status.mode === "webhook" || status.mode === "openai"
              ? "bg-green-900/30 text-green-300"
              : "bg-amber-900/30 text-amber-300"
          }`}
        >
          {status.mode}
        </span>
      }
    >
      <div className="space-y-3">
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3">
          <p className="text-sm font-medium text-zinc-200">POST /api/source-documents/audio</p>
          <p className="mt-2 text-xs leading-5 text-zinc-400">{status.description}</p>
          <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-zinc-500">
            <span>Accepts multipart audio uploads</span>
            <span>Persists files to .authrix-data</span>
            <span>Workflow handoff is explicit</span>
            {status.model ? <span>Model: {status.model}</span> : null}
          </div>
        </div>

        {uploads.length > 0 ? (
          uploads.map((document) => (
            <div
              key={document.id}
              className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-zinc-200">{document.title}</p>
                <span className="text-[11px] text-zinc-600">
                  {new Date(document.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge>{String(document.metadata.transcriptionMode ?? "unknown")}</Badge>
                <Badge>{String(document.metadata.transcriptionProvider ?? "unknown")}</Badge>
                <Badge>
                  {document.metadata.workflowHandoffRequested === false
                    ? "docs only"
                    : "workflow handoff"}
                </Badge>
              </div>
              {typeof document.metadata.audioOriginalName === "string" ? (
                <p className="mt-3 text-[11px] text-zinc-500">
                  File: {document.metadata.audioOriginalName}
                </p>
              ) : null}
              {typeof document.metadata.transcriptionFallbackReason === "string" &&
              document.metadata.transcriptionFallbackReason ? (
                <p className="mt-3 rounded-lg border border-amber-900/40 bg-amber-950/40 px-3 py-2 text-xs leading-5 text-amber-200">
                  Fallback: {document.metadata.transcriptionFallbackReason}
                </p>
              ) : null}
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 px-4 py-6">
            <p className="text-sm text-zinc-200">No audio uploads yet.</p>
            <p className="mt-2 text-xs leading-5 text-zinc-500">
              Once a meeting audio file is uploaded, Authrix will persist the file, generate a
              transcript, and record the resulting docs artifact here.
            </p>
          </div>
        )}
      </div>
    </CardShell>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
      {children}
    </span>
  );
}
