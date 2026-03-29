import { CardShell } from "@/components/ui/card-shell";
import { EmptyState } from "@/components/ui/empty-state";
import type { MeetingArtifact } from "@/types/domain";

interface MeetingArtifactsCardProps {
  artifacts: MeetingArtifact[];
  limit?: number;
}

export function MeetingArtifactsCard({
  artifacts,
  limit = 3,
}: MeetingArtifactsCardProps) {
  const visibleArtifacts = artifacts.slice(0, limit);

  return (
    <CardShell
      title="Meeting Intelligence"
      description="Structured outputs created from persisted meeting notes and transcripts."
    >
      {visibleArtifacts.length === 0 ? (
        <EmptyState
          title="No meeting artifacts yet"
          description="Once meeting sources are processed, Authrix will publish summaries, action items, and open questions here."
        />
      ) : (
        <div className="space-y-3">
          {visibleArtifacts.map((artifact) => (
            <div
              key={artifact.id}
              className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-zinc-200">{artifact.title}</p>
                <span className="text-[11px] text-zinc-600">
                  {new Date(artifact.generatedAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-zinc-400">{artifact.summary}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-zinc-600">
                <span>{artifact.decisions.length} decisions</span>
                <span>{artifact.actionItems.length} action items</span>
                <span>{artifact.openQuestions.length} open questions</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </CardShell>
  );
}
