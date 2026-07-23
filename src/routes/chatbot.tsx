import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import ReactMarkdown from "react-markdown";
import { AppLayout } from "@/components/AppLayout";
import { Card, Button, Textarea, Input, Select, Label, ErrorText, Loader } from "@/components/ui-bits";
import { chatSend, listChatMessages } from "@/lib/ai.functions";
import { useProvince } from "@/hooks/use-province";
import { Send, MapPin, Sprout, Shield, Leaf } from "lucide-react";

export const Route = createFileRoute("/chatbot")({
  head: () => ({
    meta: [
      { title: "AI Chatbot | Agri-Assist" },
      { name: "description", content: "Ask the farm AI about crop health, pests, and weather prep — with visual answers." },
      { property: "og:title", content: "AI Chatbot | Agri-Assist" },
      { property: "og:description", content: "Ask the farm AI about crop health, pests, and weather prep — with visual answers." },
    ],
  }),
  component: ChatPage,
});

type Msg = { id: string; role: string; content: string };
type Structured = {
  headline: string;
  location: string;
  metrics: Array<{ label: string; value: number; tone: "good" | "warn" | "bad" }>;
  recommendations: { fertilizers: string[]; crop_protection: string[] };
  summary: string[];
};

function tryParse(content: string): Structured | null {
  try {
    const p = JSON.parse(content);
    if (p && typeof p === "object" && "metrics" in p && "recommendations" in p) return p as Structured;
  } catch {}
  return null;
}

function ProgressRing({ value, tone }: { value: number; tone: "good" | "warn" | "bad" }) {
  const v = Math.max(0, Math.min(100, value));
  const color = tone === "good" ? "var(--primary)" : tone === "warn" ? "var(--amber)" : "var(--rust)";
  const r = 30;
  const c = 2 * Math.PI * r;
  const off = c - (v / 100) * c;
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" className="flex-shrink-0">
      <circle cx="40" cy="40" r={r} stroke="var(--border-color)" strokeWidth="8" fill="none" />
      <circle
        cx="40" cy="40" r={r}
        stroke={color} strokeWidth="8" fill="none" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={off}
        transform="rotate(-90 40 40)"
      />
      <text x="40" y="45" textAnchor="middle" fill="var(--foreground)" fontSize="16" fontWeight="600" fontFamily="Commit Mono">
        {v}%
      </text>
    </svg>
  );
}

function StructuredReply({ data }: { data: Structured }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-base font-semibold leading-snug">{data.headline}</p>
        {data.location && (
          <div className="mt-1 inline-flex items-center gap-1 text-xs text-[color:var(--soft)]">
            <MapPin className="w-3 h-3" /> {data.location}
          </div>
        )}
      </div>

      {data.metrics?.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {data.metrics.map((m, i) => (
            <div key={i} className="rounded-[12px] border border-border bg-[color:var(--surface-alt)] p-3 flex items-center gap-3">
              <ProgressRing value={m.value} tone={m.tone} />
              <div className="min-w-0">
                <div className="text-xs text-[color:var(--soft)] uppercase tracking-wide">{m.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(data.recommendations?.fertilizers?.length || data.recommendations?.crop_protection?.length) && (
        <div className="grid md:grid-cols-2 gap-3">
          <div className="rounded-[12px] border border-border bg-[color:var(--surface-alt)] p-4">
            <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
              <Sprout className="w-4 h-4 text-primary" /> Fertilizers
            </div>
            <ul className="space-y-1.5 text-sm text-[color:var(--soft)] list-disc list-inside">
              {data.recommendations.fertilizers.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
          <div className="rounded-[12px] border border-border bg-[color:var(--surface-alt)] p-4">
            <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
              <Shield className="w-4 h-4 text-[color:var(--amber)]" /> Crop protection
            </div>
            <ul className="space-y-1.5 text-sm text-[color:var(--soft)] list-disc list-inside">
              {data.recommendations.crop_protection.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        </div>
      )}

      {data.summary?.length > 0 && (
        <div className="rounded-[12px] border border-border p-4">
          <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
            <Leaf className="w-4 h-4 text-primary" /> Summary
          </div>
          <ul className="space-y-1.5 text-sm text-[color:var(--soft)] list-disc list-inside">
            {data.summary.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function ChatPage() {
  const send = useServerFn(chatSend);
  const listMsgs = useServerFn(listChatMessages);
  const { province } = useProvince();

  const [field, setField] = useState("");
  const [crop, setCrop] = useState("");
  const [topic, setTopic] = useState("");
  const [urgency, setUrgency] = useState("Medium");
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const refresh = async (tid: string) => {
    const data = await listMsgs({ data: { threadId: tid } });
    setMessages((data as Msg[]) ?? []);
  };

  const onSend = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setErr("");
    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [...m, { id: "tmp-" + Date.now(), role: "user", content: userMsg }]);
    try {
      const res = await send({
        data: { threadId, field, crop, topic, urgency, province, message: userMsg },
      });
      setThreadId(res.threadId);
      await refresh(res.threadId);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't send that — try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="AI Chatbot">
      <Card className="mb-4">
        <div className="grid md:grid-cols-4 gap-3">
          <div>
            <Label>Field</Label>
            <Input value={field} onChange={(e) => setField(e.target.value)} placeholder="North paddock" />
          </div>
          <div>
            <Label>Crop</Label>
            <Input value={crop} onChange={(e) => setCrop(e.target.value)} placeholder="Maize" />
          </div>
          <div>
            <Label>Topic</Label>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Leaf spots" />
          </div>
          <div>
            <Label>Urgency</Label>
            <Select value={urgency} onChange={(e) => setUrgency(e.target.value)}>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Urgent</option>
            </Select>
          </div>
        </div>
        <div className="mt-3 text-xs text-[color:var(--faint)] inline-flex items-center gap-1">
          <MapPin className="w-3 h-3" /> Advice tuned to {province}
        </div>
      </Card>

      <div className="space-y-4 mb-4">
        {messages.length === 0 && !loading && (
          <Card>
            <p className="text-[color:var(--soft)] text-center py-8 text-sm">
              Ask a question below — you'll get a visual answer with metrics and next steps.
            </p>
          </Card>
        )}
        {messages.map((m) => {
          if (m.role === "user") {
            return (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-[14px] px-4 py-3 bg-[color:var(--deep-green)] text-foreground text-sm">
                  {m.content}
                </div>
              </div>
            );
          }
          const structured = tryParse(m.content);
          return (
            <div key={m.id} className="accent-card accent-bar-green">
              {structured ? (
                <StructuredReply data={structured} />
              ) : (
                <div className="prose prose-invert max-w-none text-[15px] leading-relaxed">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              )}
            </div>
          );
        })}
        {loading && (
          <Card><Loader label="Thinking…" /></Card>
        )}
        <div ref={endRef} />
      </div>

      <Card>
        <Label>Your question</Label>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. My maize leaves have yellow spots. What should I check?"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSend();
          }}
        />
        <div className="flex justify-end mt-3">
          <Button onClick={onSend} disabled={loading || !input.trim()}>
            <Send className="w-4 h-4" /> Send question
          </Button>
        </div>
        <ErrorText>{err}</ErrorText>
      </Card>
    </AppLayout>
  );
}
