import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import ReactMarkdown from "react-markdown";
import { AppLayout } from "@/components/AppLayout";
import { Card, Button, Textarea, Input, Select, Label, ErrorText, Loader } from "@/components/ui-bits";
import { chatSend, updateChatMessage } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";
import { Send, Pencil, Check } from "lucide-react";

export const Route = createFileRoute("/chatbot")({
  head: () => ({
    meta: [
      { title: "AI Chatbot | Agri-Assist" },
      { name: "description", content: "Ask the farm AI about crop health, pests, and weather prep." },
      { property: "og:title", content: "AI Chatbot | Agri-Assist" },
      { property: "og:description", content: "Ask the farm AI about crop health, pests, and weather prep." },
    ],
  }),
  component: ChatPage,
});

type Msg = { id: string; role: string; content: string };

function ChatPage() {
  const send = useServerFn(chatSend);
  const updateMsg = useServerFn(updateChatMessage);

  const [field, setField] = useState("");
  const [crop, setCrop] = useState("");
  const [topic, setTopic] = useState("");
  const [urgency, setUrgency] = useState("Medium");
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const refresh = async (tid: string) => {
    const { data } = await supabase
      .from("chat_messages")
      .select("id, role, content")
      .eq("thread_id", tid)
      .order("created_at");
    setMessages((data as Msg[]) ?? []);
  };

  const onSend = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setErr("");
    const userMsg = input.trim();
    setInput("");
    // optimistic
    setMessages((m) => [...m, { id: "tmp-" + Date.now(), role: "user", content: userMsg }]);
    try {
      const res = await send({
        data: { threadId, field, crop, topic, urgency, message: userMsg },
      });
      setThreadId(res.threadId);
      await refresh(res.threadId);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't send that — try again.");
    } finally {
      setLoading(false);
    }
  };

  const saveEdit = async (id: string) => {
    try {
      await updateMsg({ data: { id, content: editText } });
      setMessages((m) => m.map((x) => (x.id === id ? { ...x, content: editText } : x)));
      setEditingId(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't save your edit.");
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
      </Card>

      <Card className="mb-4 min-h-64">
        {messages.length === 0 && !loading && (
          <p className="text-[color:var(--soft)] text-center py-10 text-sm">
            Ask a question below to get started.
          </p>
        )}
        <div className="space-y-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-[14px] px-4 py-3 ${
                  m.role === "user"
                    ? "bg-[color:var(--deep-green)] text-foreground"
                    : "bg-[color:var(--surface-alt)] border border-border"
                }`}
              >
                {editingId === m.id ? (
                  <div className="space-y-2">
                    <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="min-h-24" />
                    <div className="flex gap-2">
                      <Button variant="primary" onClick={() => saveEdit(m.id)}>
                        <Check className="w-4 h-4" /> Save
                      </Button>
                      <Button variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="prose prose-invert max-w-none text-[15px] leading-relaxed">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                    {!m.id.startsWith("tmp-") && (
                      <button
                        onClick={() => {
                          setEditingId(m.id);
                          setEditText(m.content);
                        }}
                        className="mt-2 text-xs text-[color:var(--soft)] hover:text-foreground inline-flex items-center gap-1"
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          {loading && <Loader label="Thinking…" />}
          <div ref={endRef} />
        </div>
      </Card>

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
