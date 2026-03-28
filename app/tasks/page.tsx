import type { SuggestedTask } from "@/types/domain";

async function fetchTasks(): Promise<SuggestedTask[]> {
  const res = await fetch("http://localhost:3000/api/agents/tasks", {
    cache: "no-store",
  });
  return res.json();
}

export default async function TasksPage() {
  const tasks = await fetchTasks();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Tasks</h2>
      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    task.priority === "critical"
                      ? "bg-red-500"
                      : task.priority === "high"
                        ? "bg-orange-500"
                        : task.priority === "medium"
                          ? "bg-yellow-500"
                          : "bg-zinc-500"
                  }`}
                />
                <span className="text-sm text-zinc-200 font-medium">
                  {task.title}
                </span>
              </div>
              <span className="text-xs text-zinc-500 capitalize">
                {task.priority}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-2 ml-5">
              {task.description}
            </p>
            <div className="flex gap-4 mt-3 ml-5 text-xs text-zinc-600">
              <span>Agent: {task.sourceAgentId}</span>
              <span>Status: {task.status}</span>
              <span>{task.source}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
