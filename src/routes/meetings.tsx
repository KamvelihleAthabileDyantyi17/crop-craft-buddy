import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppLayout } from "@/components/AppLayout";
import { Card, Button, Textarea, Input, Label, ErrorText, Loader } from "@/components/ui-bits";
import { summarizeMeeting, listMeetingNotes } from "@/lib/ai.functions";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/meetings")({
  head: () => ({
    meta: [
      { title: "Meeting Notes | Agri-Assist" },
      { name: "description", content: "Turn farm meeting notes into summaries, action items, and deadlines." },
      { property: "og:title", content: "Meeting Notes | Agri-Assist" },
      { property: "og:description", content: "Turn farm meeting notes into summaries, action items, and deadlines." },
    ],
  }),
  component: MeetingsPage,
});

type Note = {
  id: string;
  title: string | null;
  summary: string | null;
  action_items: Array<{ task: string; owner: string; due: string }> | null;
  decisions: string[] | null;
  deadlines: Array<{ what: string; when: string }> | null;
  created_at: string;
};

function MeetingsPage() {
  const summarize = useServerFn(summarizeMeeting);
  const list = useServerFn(listMeetingNotes);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [current, setCurrent] = useState<Note | null>(null);
  const [history, setHistory] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const loadHistory = () => {
    list().then((data) => setHistory((data as Note[]) ?? []));
  };
  useEffect(loadHistory, []);

  const run = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setErr("");
    try {
      const res = await summarize({ data: { title, text } });
      setCurrent({
        id: res.id,
        title: title || res.summary.slice(0, 60),
        summary: res.summary,
        action_items: res.action_items,
        decisions: res.decisions,
        deadlines: res.deadlines,
        created_at: new Date().toISOString(),
      });
      loadHistory();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't summarize that — try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="Meeting Notes">
      <Card className="mb-4">
        <Label>Meeting title (optional)</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Weekly farm operations sync" />
        <div className="mt-4">
          <Label>Paste your meeting notes</Label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste notes here…"
            className="min-h-48"
          />
        </div>
        <div className="flex justify-end mt-3">
          <Button onClick={run} disabled={loading || !text.trim()}>
            <Sparkles className="w-4 h-4" /> Summarize
          </Button>
        </div>
        {loading && <div className="mt-3"><Loader label="Summarizing…" /></div>}
        <ErrorText>{err}</ErrorText>
      </Card>

      {current && <MeetingCard note={current} />}

      {history.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-3">Recent meetings</h2>
          <div className="space-y-3">
            {history.map((n) => (
              <Card key={n.id}>
                <button onClick={() => setCurrent(n)} className="text-left w-full">
                  <div className="font-medium">{n.title || "Untitled"}</div>
                  <div className="text-xs text-[color:var(--faint)] mt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                  <p className="text-sm text-[color:var(--soft)] mt-2 line-clamp-2">{n.summary}</p>
                </button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function MeetingCard({ note }: { note: Note }) {
  return (
    <Card>
      <h2 className="text-xl font-semibold mb-3">{note.title}</h2>
      <section className="mb-4">
        <h3 className="text-sm font-semibold text-[color:var(--soft)] uppercase tracking-wide mb-2">Summary</h3>
        <p className="text-base leading-relaxed">{note.summary}</p>
      </section>
      <section className="mb-4">
        <h3 className="text-sm font-semibold text-[color:var(--soft)] uppercase tracking-wide mb-2">Action items</h3>
        <ul className="space-y-2">
          {(note.action_items ?? []).map((a, i) => (
            <li key={i} className="rounded-[10px] border border-border bg-[color:var(--surface-alt)] p-3">
              <div className="font-medium">{a.task}</div>
              <div className="text-xs text-[color:var(--soft)] mt-1">
                {a.owner && <>Owner: <span className="text-foreground">{a.owner}</span> · </>}
                {a.due && <>Due: <span className="text-foreground">{a.due}</span></>}
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="mb-4">
        <h3 className="text-sm font-semibold text-[color:var(--soft)] uppercase tracking-wide mb-2">Decisions</h3>
        <ul className="space-y-2">
          {(note.decisions ?? []).map((d, i) => (
            <li key={i} className="flex gap-2"><span className="text-primary">✓</span><span>{d}</span></li>
          ))}
        </ul>
      </section>
      <section>
        <h3 className="text-sm font-semibold text-[color:var(--soft)] uppercase tracking-wide mb-2">Deadlines</h3>
        <ul className="space-y-2">
          {(note.deadlines ?? []).map((d, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-[color:var(--amber)]">◈</span>
              <span><span className="font-medium">{d.what}</span> — <span className="text-[color:var(--soft)]">{d.when}</span></span>
            </li>
          ))}
        </ul>
      </section>
    </Card>
  );
}
