import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppLayout } from "@/components/AppLayout";
import { Card, Button, Textarea, Input, Label, ErrorText, Loader } from "@/components/ui-bits";
import { analyzeResearch } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "Research Assistant | Agri-Assist" },
      { name: "description", content: "Summarize agricultural reports, bulletins, and pricing sheets." },
      { property: "og:title", content: "Research Assistant | Agri-Assist" },
      { property: "og:description", content: "Summarize agricultural reports, bulletins, and pricing sheets." },
    ],
  }),
  component: ResearchPage,
});

type Note = {
  id: string;
  title: string | null;
  summary: string | null;
  insights: string[] | null;
  actions: string[] | null;
  created_at: string;
};

function ResearchPage() {
  const analyze = useServerFn(analyzeResearch);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [current, setCurrent] = useState<Note | null>(null);
  const [history, setHistory] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const loadHistory = () => {
    supabase
      .from("research_notes")
      .select("id, title, summary, insights, actions, created_at")
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => setHistory((data as Note[]) ?? []));
  };
  useEffect(loadHistory, []);

  const run = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setErr("");
    try {
      const res = await analyze({ data: { title, text } });
      setCurrent({
        id: res.id,
        title: title || res.summary.slice(0, 60),
        summary: res.summary,
        insights: res.insights,
        actions: res.actions,
        created_at: new Date().toISOString(),
      });
      loadHistory();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't analyze that — try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="Research Assistant">
      <Card className="mb-4">
        <Label>Title (optional)</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Weekly maize pricing bulletin" />
        <div className="mt-4">
          <Label>Paste report, bulletin, or pricing sheet</Label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the text here…"
            className="min-h-48"
          />
        </div>
        <div className="flex justify-end mt-3">
          <Button onClick={run} disabled={loading || !text.trim()}>
            <Sparkles className="w-4 h-4" /> Analyze
          </Button>
        </div>
        {loading && <div className="mt-3"><Loader label="Reading and analyzing…" /></div>}
        <ErrorText>{err}</ErrorText>
      </Card>

      {current && <ResultCard note={current} />}

      {history.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-3">Recent research notes</h2>
          <div className="space-y-3">
            {history.map((n) => (
              <Card key={n.id}>
                <button
                  onClick={() => setCurrent(n)}
                  className="text-left w-full"
                >
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

function ResultCard({ note }: { note: Note }) {
  return (
    <Card>
      <h2 className="text-xl font-semibold mb-3">{note.title || "Analysis"}</h2>
      <section className="mb-4">
        <h3 className="text-sm font-semibold text-[color:var(--soft)] uppercase tracking-wide mb-2">Summary</h3>
        <p className="text-base leading-relaxed">{note.summary}</p>
      </section>
      <section className="mb-4">
        <h3 className="text-sm font-semibold text-[color:var(--soft)] uppercase tracking-wide mb-2">Key insights</h3>
        <ul className="space-y-2">
          {(note.insights ?? []).map((i, idx) => (
            <li key={idx} className="flex gap-2">
              <span className="text-primary">•</span>
              <span>{i}</span>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3 className="text-sm font-semibold text-[color:var(--soft)] uppercase tracking-wide mb-2">Recommended actions</h3>
        <ul className="space-y-2">
          {(note.actions ?? []).map((a, idx) => (
            <li key={idx} className="flex gap-2">
              <span className="text-[color:var(--amber)]">→</span>
              <span>{a}</span>
            </li>
          ))}
        </ul>
      </section>
    </Card>
  );
}
