"use client";

import { useState, useTransition } from "react";
import { CardShell } from "@/components/ui/card-shell";
import type { FinanceQuestionAnswer } from "@/types/finance";

const STARTER_QUESTIONS = [
  "What is driving our spend right now?",
  "How much are we spending on OpenAI?",
  "What is the biggest cost risk this week?",
];

interface FinanceQACardProps {
  initialQuestion?: string;
}

export function FinanceQACard({
  initialQuestion = STARTER_QUESTIONS[0],
}: FinanceQACardProps) {
  const [question, setQuestion] = useState(initialQuestion);
  const [answer, setAnswer] = useState<FinanceQuestionAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function askFinanceQuestion(nextQuestion: string): void {
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/agents/costs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: nextQuestion,
          }),
        });
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
          answer?: FinanceQuestionAnswer;
        };

        if (!response.ok || !payload.answer) {
          throw new Error(payload.error ?? "Finance/Ops could not answer that question.");
        }

        setAnswer(payload.answer);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Finance/Ops could not answer that question."
        );
      }
    });
  }

  function handleSubmit(formData: FormData): void {
    const nextQuestion = String(formData.get("question") ?? "").trim();
    if (!nextQuestion) {
      setError("Enter a finance question first.");
      return;
    }

    setQuestion(nextQuestion);
    askFinanceQuestion(nextQuestion);
  }

  return (
    <CardShell
      title="Finance Q&A"
      description="Ask founder-style spend questions in the control tower and get an evidence-backed answer from the current Authrix workspace."
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit(new FormData(event.currentTarget));
        }}
      >
        <textarea
          name="question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          className="min-h-28 w-full rounded-[1.25rem] border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-cyan-300/30 focus:bg-slate-950/70"
          placeholder="Ask Finance/Ops what is driving spend, what changed, or where the risk is."
        />
        <div className="flex flex-wrap gap-2">
          {STARTER_QUESTIONS.map((starter) => (
            <button
              key={starter}
              type="button"
              onClick={() => {
                setQuestion(starter);
                askFinanceQuestion(starter);
              }}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-white/20 hover:bg-white/10"
            >
              {starter}
            </button>
          ))}
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/35 hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Asking Finance/Ops..." : "Ask Finance/Ops"}
        </button>
      </form>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-900/40 bg-red-950/30 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {answer ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                {answer.confidence} confidence
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                {answer.sourceMode}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-100">{answer.answer}</p>
          </div>
          <div className="space-y-3">
            {answer.evidence.map((record) => (
              <div
                key={record.id}
                className="rounded-[1.15rem] border border-white/8 bg-slate-950/45 px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-zinc-100">{record.title}</p>
                  <span className="rounded-full border border-white/8 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                    {record.category}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-400">{record.summary}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </CardShell>
  );
}
