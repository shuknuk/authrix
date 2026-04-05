"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { ApprovalRequest } from "@/types/authrix";

interface ApprovalContextValue {
  requestApproval: (request: ApprovalRequest) => void;
}

const ApprovalContext = createContext<ApprovalContextValue | null>(null);

export function ApprovalModalProvider({
  actorName,
  children,
}: {
  actorName: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [activeRequest, setActiveRequest] = useState<ApprovalRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const value = useMemo<ApprovalContextValue>(
    () => ({
      requestApproval(request) {
        setError(null);
        setActiveRequest(request);
      },
    }),
    [],
  );

  async function approve() {
    if (!activeRequest) {
      return;
    }

    setError(null);

    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...activeRequest,
          approved: true,
          actor: actorName,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Approval execution failed.");
      }

      setActiveRequest(null);
      startTransition(() => router.refresh());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The action could not be executed.",
      );
    }
  }

  return (
    <ApprovalContext.Provider value={value}>
      {children}
      {activeRequest ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(17,33,50,0.36)] p-4 backdrop-blur-sm">
          <div className="authrix-card w-full max-w-2xl rounded-[1.75rem] p-6">
            <p className="authrix-kicker text-danger">Approval required</p>
            <h2 className="mt-4 text-2xl font-semibold text-foreground">
              {activeRequest.label}
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted">
              {activeRequest.justification}
            </p>

            <div className="mt-5 rounded-[1.25rem] border border-line bg-[rgba(17,33,50,0.04)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                Minimal execution payload
              </p>
              <pre className="mt-3 overflow-auto text-xs leading-6 text-foreground">
                {JSON.stringify(activeRequest.payload, null, 2)}
              </pre>
            </div>

            {error ? (
              <p className="mt-4 rounded-2xl bg-[rgba(165,63,63,0.12)] px-4 py-3 text-sm text-danger">
                {error}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setError(null);
                  setActiveRequest(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={approve} disabled={isPending}>
                {isPending ? "Executing..." : "Approve and execute"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </ApprovalContext.Provider>
  );
}

export function useApprovalModal() {
  const context = useContext(ApprovalContext);

  if (!context) {
    throw new Error("useApprovalModal must be used inside ApprovalModalProvider");
  }

  return context;
}
