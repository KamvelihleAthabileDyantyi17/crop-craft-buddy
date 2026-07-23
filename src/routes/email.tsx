import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppLayout } from "@/components/AppLayout";
import { Card, Button, Textarea, Input, Select, Label, ErrorText, Loader } from "@/components/ui-bits";
import { generateEmail, updateEmail, listEmails } from "@/lib/ai.functions";
import { Sparkles, Copy, RefreshCw, Save } from "lucide-react";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Email Generator | Agri-Assist" },
      { name: "description", content: "Draft farm business emails in the right tone in seconds." },
      { property: "og:title", content: "Email Generator | Agri-Assist" },
      { property: "og:description", content: "Draft farm business emails in the right tone in seconds." },
    ],
  }),
  component: EmailPage,
});

type Email = { id: string; brief: string; tone: string; subject: string; body: string; created_at: string };

function EmailPage() {
  const gen = useServerFn(generateEmail);
  const upd = useServerFn(updateEmail);

  const [brief, setBrief] = useState("");
  const [tone, setTone] = useState<"Formal" | "Friendly" | "Persuasive">("Friendly");
  const [current, setCurrent] = useState<Email | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [history, setHistory] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  const loadHistory = () => {
    supabase
      .from("emails")
      .select("id, brief, tone, subject, body, created_at")
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => setHistory((data as Email[]) ?? []));
  };
  useEffect(loadHistory, []);

  const run = async () => {
    if (!brief.trim()) return;
    setLoading(true);
    setErr("");
    try {
      const res = await gen({ data: { brief, tone } });
      const em: Email = {
        id: res.id,
        brief,
        tone,
        subject: res.subject,
        body: res.body,
        created_at: new Date().toISOString(),
      };
      setCurrent(em);
      setSubject(res.subject);
      setBody(res.body);
      loadHistory();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't generate that — try again.");
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!current) return;
    await upd({ data: { id: current.id, subject, body } });
    setCurrent({ ...current, subject, body });
    loadHistory();
  };

  const copy = async () => {
    await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <AppLayout title="Email Generator">
      <Card className="mb-4">
        <Label>What's the email about?</Label>
        <Textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="e.g. Ask supplier for updated pricing on 500 bags of fertilizer, delivery in two weeks."
        />
        <div className="mt-4">
          <Label>Tone</Label>
          <Select value={tone} onChange={(e) => setTone(e.target.value as typeof tone)}>
            <option>Formal</option>
            <option>Friendly</option>
            <option>Persuasive</option>
          </Select>
        </div>
        <div className="flex justify-end mt-3">
          <Button onClick={run} disabled={loading || !brief.trim()}>
            <Sparkles className="w-4 h-4" /> Generate email
          </Button>
        </div>
        {loading && <div className="mt-3"><Loader label="Writing your email…" /></div>}
        <ErrorText>{err}</ErrorText>
      </Card>

      {current && (
        <Card>
          <Label>Subject</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          <div className="mt-4">
            <Label>Body</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} className="min-h-64" />
          </div>
          <div className="flex flex-wrap gap-2 mt-4 justify-end">
            <Button variant="secondary" onClick={copy}>
              <Copy className="w-4 h-4" /> {copied ? "Copied!" : "Copy"}
            </Button>
            <Button variant="secondary" onClick={run} disabled={loading}>
              <RefreshCw className="w-4 h-4" /> Regenerate
            </Button>
            <Button onClick={save}>
              <Save className="w-4 h-4" /> Save changes
            </Button>
          </div>
        </Card>
      )}

      {history.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-3">Recent emails</h2>
          <div className="space-y-3">
            {history.map((em) => (
              <Card key={em.id}>
                <button
                  onClick={() => {
                    setCurrent(em);
                    setSubject(em.subject);
                    setBody(em.body);
                  }}
                  className="text-left w-full"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium truncate">{em.subject}</div>
                    <span className="pill bg-[color:var(--surface-alt)] border border-border text-[color:var(--soft)] text-xs">
                      {em.tone}
                    </span>
                  </div>
                  <div className="text-xs text-[color:var(--faint)] mt-1">
                    {new Date(em.created_at).toLocaleString()}
                  </div>
                  <p className="text-sm text-[color:var(--soft)] mt-2 line-clamp-2">{em.body}</p>
                </button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
