// Server-only helper for calling the Lovable AI Gateway.
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.6-flash";

export class AIGatewayError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type Message = { role: "system" | "user" | "assistant"; content: string };

export async function callAI(
  messages: Message[],
  opts: { json?: boolean } = {},
): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY not configured");

  const body: Record<string, unknown> = { model: MODEL, messages };
  if (opts.json) body.response_format = { type: "json_object" };

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 429) {
      throw new AIGatewayError(429, "Too many requests right now — try again in a moment.");
    }
    if (res.status === 402) {
      throw new AIGatewayError(402, "AI credits exhausted. Please add credits to continue.");
    }
    throw new AIGatewayError(res.status, `AI request failed: ${text || res.statusText}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content ?? "";
}

export async function callAIJSON<T>(messages: Message[]): Promise<T> {
  const raw = await callAI(messages, { json: true });
  try {
    return JSON.parse(raw) as T;
  } catch {
    // strip code fences if present
    const cleaned = raw.replace(/```json\s*|\s*```/g, "").trim();
    return JSON.parse(cleaned) as T;
  }
}
