import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/session";
import { isAuthConfigured } from "@/lib/auth/auth0";
import { getSuggestedTasks, updateTaskRecord } from "@/lib/data/workspace";

export async function GET() {
  if (isAuthConfigured) {
    const session = await getOptionalSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const tasks = await getSuggestedTasks();
  return NextResponse.json({ tasks });
}

export async function PATCH(request: NextRequest) {
  const session = isAuthConfigured ? await getOptionalSession() : null;

  if (isAuthConfigured && !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    id?: string;
    status?: "suggested" | "approved" | "rejected" | "completed";
    suggestedOwner?: string | null;
    dueDate?: string | null;
  };

  if (!body.id) {
    return NextResponse.json({ error: "Task id is required" }, { status: 400 });
  }

  const actor = session?.user.name ?? session?.user.email ?? "current-user";
  const task = await updateTaskRecord(
    body.id,
    {
      status: body.status,
      suggestedOwner: body.suggestedOwner,
      dueDate: body.dueDate,
    },
    actor
  );

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({ task });
}
