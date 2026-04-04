import { CardShell } from "@/components/ui/card-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import type { SourceDocument } from "@/types/domain";

interface SourceDocumentsCardProps {
  documents: SourceDocument[];
  limit?: number;
}

export function SourceDocumentsCard({
  documents,
  limit = 4,
}: SourceDocumentsCardProps) {
  const visibleDocuments = documents.slice(0, limit);

  return (
    <CardShell
      title="Meeting Intake"
      description="Persisted notes, transcripts, and uploads that feed the docs and workflow layers."
    >
      {visibleDocuments.length === 0 ? (
        <EmptyState
          title="No meeting sources yet"
          description="Add a transcript or meeting note and Authrix will turn it into artifacts, decisions, and follow-up work."
        />
      ) : (
        <div className="space-y-3">
          {visibleDocuments.map((document) => (
            <div key={document.id} className="authrix-row px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-[var(--foreground)]">{document.title}</p>
                <StatusPill size="sm">
                  {document.documentType}
                </StatusPill>
              </div>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {document.sourceSystem} · {new Date(document.createdAt).toLocaleString()}
              </p>
              <p className="mt-2 text-xs leading-5 text-[var(--muted-foreground)]">
                {document.content.slice(0, 180)}
                {document.content.length > 180 ? "..." : ""}
              </p>
              {document.participants.length > 0 ? (
                <p className="mt-2 text-[11px] text-[var(--muted-foreground)]">
                  Participants: {document.participants.join(", ")}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </CardShell>
  );
}
