import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppLayout } from "@/components/AppLayout";
import { Card, Button, Textarea, Input, Select, Label, PriorityPill, ErrorText, Loader } from "@/components/ui-bits";
import { planTasks, updateTask, deleteTask } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Trash2, Save } from "lucide-react";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "Task Planner | Agri-Assist" },
      { name: "description", content: "Turn pending farm tasks into a prioritized weekly schedule." },
      { property: "og:title", content: "Task Planner | Agri-Assist" },
      { property: "og:description", content: "Turn pending farm tasks into a prioritized weekly schedule." },
    ],
  }),
  component: PlannerPage,
});

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const PRIORITIES = ["Urgent", "High", "Medium", "Low"];

type Task = { id: string; title: string; notes: string | null; day: string; priority: string; done: boolean };

function PlannerPage() {
  const plan = useServerFn(planTasks);
  const update = useServerFn(updateTask);
  const remove = useServerFn(deleteTask);

  const [text, setText] = useState("");
  const [batchId, setBatchId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState<Record<string, Partial<Task>>>({});

  useEffect(() => {
    if (!batchId) return;
    supabase
      .from("tasks")
      .select("id, title, notes, day, priority, done")
      .eq("batch_id", batchId)
      .order("day_order")
      .then(({ data }) => setTasks((data as Task[]) ?? []));
  }, [batchId]);

  const generate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setErr("");
    try {
      const res = await plan({ data: { text } });
      setBatchId(res.batchId);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't generate that — try again.");
    } finally {
      setLoading(false);
    }
  };

  const saveTask = async (t: Task) => {
    const patch = editing[t.id];
    if (!patch) return;
    try {
      await update({ data: { id: t.id, ...patch } });
      setTasks((ts) => ts.map((x) => (x.id === t.id ? { ...x, ...patch } : x)));
      setEditing((e) => {
        const n = { ...e };
        delete n[t.id];
        return n;
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't save task.");
    }
  };

  const removeTask = async (id: string) => {
    await remove({ data: { id } });
    setTasks((ts) => ts.filter((x) => x.id !== id));
  };

  const grouped = DAYS.map((d) => ({ day: d, items: tasks.filter((t) => t.day === d) }));

  return (
    <AppLayout title="Task Planner">
      <Card className="mb-4">
        <Label>Paste your pending tasks</Label>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"e.g.\n- Check irrigation on north field\n- Order fertilizer\n- Fix broken gate\n- Spray citrus for aphids\n..."}
          className="min-h-40"
        />
        <div className="flex justify-end mt-3">
          <Button onClick={generate} disabled={loading || !text.trim()}>
            <Sparkles className="w-4 h-4" /> Generate my schedule
          </Button>
        </div>
        {loading && <div className="mt-3"><Loader label="Building your week…" /></div>}
        <ErrorText>{err}</ErrorText>
      </Card>

      {tasks.length > 0 && (
        <div className="space-y-4">
          {grouped.map(({ day, items }) => (
            <Card key={day}>
              <h2 className="text-lg font-semibold mb-3">{day}</h2>
              {items.length === 0 ? (
                <p className="text-sm text-[color:var(--faint)]">Nothing scheduled.</p>
              ) : (
                <div className="space-y-3">
                  {items.map((t) => {
                    const patch = editing[t.id] ?? {};
                    const title = patch.title ?? t.title;
                    const priority = patch.priority ?? t.priority;
                    const day = patch.day ?? t.day;
                    return (
                      <div key={t.id} className="rounded-[10px] border border-border p-3 bg-[color:var(--surface-alt)]">
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                          <Input
                            value={title}
                            onChange={(e) =>
                              setEditing((s) => ({ ...s, [t.id]: { ...s[t.id], title: e.target.value } }))
                            }
                          />
                          <Select
                            value={priority}
                            onChange={(e) =>
                              setEditing((s) => ({ ...s, [t.id]: { ...s[t.id], priority: e.target.value } }))
                            }
                            className="md:w-36"
                          >
                            {PRIORITIES.map((p) => (
                              <option key={p}>{p}</option>
                            ))}
                          </Select>
                          <Select
                            value={day}
                            onChange={(e) =>
                              setEditing((s) => ({ ...s, [t.id]: { ...s[t.id], day: e.target.value } }))
                            }
                            className="md:w-40"
                          >
                            {DAYS.map((d) => (
                              <option key={d}>{d}</option>
                            ))}
                          </Select>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <PriorityPill priority={priority} />
                          <div className="flex gap-2">
                            {editing[t.id] && (
                              <Button variant="primary" onClick={() => saveTask(t)}>
                                <Save className="w-4 h-4" /> Save
                              </Button>
                            )}
                            <Button variant="ghost" onClick={() => removeTask(t.id)}>
                              <Trash2 className="w-4 h-4" /> Remove
                            </Button>
                          </div>
                        </div>
                        {t.notes && <p className="text-sm text-[color:var(--soft)] mt-2">{t.notes}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
