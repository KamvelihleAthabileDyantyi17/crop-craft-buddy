import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// ---------- CHATBOT ----------

const ChatInput = z.object({
  threadId: z.string().uuid().nullable().optional(),
  field: z.string().optional().default(""),
  crop: z.string().optional().default(""),
  topic: z.string().optional().default(""),
  urgency: z.string().optional().default(""),
  message: z.string().min(1),
});

export const chatSend = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ChatInput.parse(data))
  .handler(async ({ data }) => {
    const { callAI, AIGatewayError } = await import("./ai.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let threadId = data.threadId ?? null;
    if (!threadId) {
      const { data: t, error } = await supabaseAdmin
        .from("chat_threads")
        .insert({
          field: data.field,
          crop: data.crop,
          topic: data.topic,
          urgency: data.urgency,
          title: data.topic || data.message.slice(0, 60),
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      threadId = t.id;
    }

    const { data: history } = await supabaseAdmin
      .from("chat_messages")
      .select("role, content")
      .eq("thread_id", threadId)
      .order("created_at");

    await supabaseAdmin.from("chat_messages").insert({
      thread_id: threadId,
      role: "user",
      content: data.message,
    });

    const system = `You are an agricultural advisor for a South African farm team. Give practical, actionable advice about crop health, pests, weather prep, and farm operations. Use plain language. When useful, mention local South African context (climate zones, seasons, common crops like maize, citrus, wine grapes, wheat). Always remind users to verify critical decisions with a local agricultural expert.
Context — Field: ${data.field || "unspecified"}. Crop: ${data.crop || "unspecified"}. Topic: ${data.topic || "unspecified"}. Urgency: ${data.urgency || "unspecified"}.`;

    const messages = [
      { role: "system" as const, content: system },
      ...((history ?? []).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }))),
      { role: "user" as const, content: data.message },
    ];

    try {
      const reply = await callAI(messages);
      await supabaseAdmin.from("chat_messages").insert({
        thread_id: threadId,
        role: "assistant",
        content: reply,
      });
      return { threadId, reply };
    } catch (e) {
      if (e instanceof AIGatewayError) throw new Error(e.message);
      throw e;
    }
  });

export const updateChatMessage = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), content: z.string() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("chat_messages")
      .update({ content: data.content })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- TASK PLANNER ----------

export const planTasks = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ text: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const { callAIJSON, AIGatewayError } = await import("./ai.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const system = `You are a farm operations planner for a South African farm. Given a list of pending tasks, produce a prioritized WEEKLY schedule (Monday to Sunday). Consider urgency, weather sensitivity, dependencies, and daylight. Return STRICT JSON only.

Schema:
{
  "tasks": [
    { "title": string, "notes": string, "day": "Monday"|"Tuesday"|"Wednesday"|"Thursday"|"Friday"|"Saturday"|"Sunday", "day_order": number, "priority": "Urgent"|"High"|"Medium"|"Low" }
  ]
}
Keep titles short and actionable in plain language.`;

    try {
      const parsed = await callAIJSON<{
        tasks: Array<{
          title: string;
          notes?: string;
          day: string;
          day_order?: number;
          priority: string;
        }>;
      }>([
        { role: "system", content: system },
        { role: "user", content: data.text },
      ]);

      const { data: batch, error: bErr } = await supabaseAdmin
        .from("task_batches")
        .insert({ input_text: data.text })
        .select("id")
        .single();
      if (bErr) throw new Error(bErr.message);

      const rows = (parsed.tasks || []).map((t, i) => ({
        batch_id: batch.id,
        title: t.title,
        notes: t.notes ?? "",
        day: t.day,
        day_order: t.day_order ?? i,
        priority: t.priority,
      }));
      if (rows.length) await supabaseAdmin.from("tasks").insert(rows);
      return { batchId: batch.id };
    } catch (e) {
      if (e instanceof AIGatewayError) throw new Error(e.message);
      throw e;
    }
  });

export const updateTask = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().optional(),
        notes: z.string().optional(),
        day: z.string().optional(),
        priority: z.string().optional(),
        done: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...patch } = data;
    const { error } = await supabaseAdmin.from("tasks").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteTask = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("tasks").delete().eq("id", data.id);
    return { ok: true };
  });

// ---------- RESEARCH ----------

export const analyzeResearch = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ title: z.string().optional().default(""), text: z.string().min(1) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { callAIJSON, AIGatewayError } = await import("./ai.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const system = `You are a research analyst for a South African farm. Analyze the provided report, bulletin, or pricing sheet. Return STRICT JSON only.
Any monetary values MUST be shown in South African Rand (R). Never use $ or USD.
Schema:
{
  "summary": string,
  "insights": string[],
  "actions": string[]
}
Keep language plain and practical.`;

    try {
      const parsed = await callAIJSON<{
        summary: string;
        insights: string[];
        actions: string[];
      }>([
        { role: "system", content: system },
        { role: "user", content: data.text },
      ]);
      const { data: row, error } = await supabaseAdmin
        .from("research_notes")
        .insert({
          title: data.title || parsed.summary.slice(0, 60),
          source_text: data.text,
          summary: parsed.summary,
          insights: parsed.insights,
          actions: parsed.actions,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return { id: row.id, ...parsed };
    } catch (e) {
      if (e instanceof AIGatewayError) throw new Error(e.message);
      throw e;
    }
  });

// ---------- MEETING NOTES ----------

export const summarizeMeeting = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ title: z.string().optional().default(""), text: z.string().min(1) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { callAIJSON, AIGatewayError } = await import("./ai.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const system = `You summarize farm team meeting notes. Return STRICT JSON only.
Any money values MUST use South African Rand (R). Never use $.
Schema:
{
  "summary": string,
  "action_items": [{ "task": string, "owner": string, "due": string }],
  "decisions": string[],
  "deadlines": [{ "what": string, "when": string }]
}
Use empty strings for owner/due when not mentioned. Keep it plain-language.`;

    try {
      const parsed = await callAIJSON<{
        summary: string;
        action_items: Array<{ task: string; owner: string; due: string }>;
        decisions: string[];
        deadlines: Array<{ what: string; when: string }>;
      }>([
        { role: "system", content: system },
        { role: "user", content: data.text },
      ]);
      const { data: row, error } = await supabaseAdmin
        .from("meeting_notes")
        .insert({
          title: data.title || parsed.summary.slice(0, 60),
          source_text: data.text,
          summary: parsed.summary,
          action_items: parsed.action_items,
          decisions: parsed.decisions,
          deadlines: parsed.deadlines,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return { id: row.id, ...parsed };
    } catch (e) {
      if (e instanceof AIGatewayError) throw new Error(e.message);
      throw e;
    }
  });

// ---------- EMAIL ----------

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        brief: z.string().min(1),
        tone: z.enum(["Formal", "Friendly", "Persuasive"]),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { callAIJSON, AIGatewayError } = await import("./ai.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const system = `You draft emails for a South African farm business. Any monetary values use South African Rand (R), never $.
Write in the requested tone: ${data.tone}.
Return STRICT JSON only:
{ "subject": string, "body": string }
Use plain language. Keep it professional and readable.`;

    try {
      const parsed = await callAIJSON<{ subject: string; body: string }>([
        { role: "system", content: system },
        { role: "user", content: data.brief },
      ]);
      const { data: row, error } = await supabaseAdmin
        .from("emails")
        .insert({
          brief: data.brief,
          tone: data.tone,
          subject: parsed.subject,
          body: parsed.body,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return { id: row.id, ...parsed };
    } catch (e) {
      if (e instanceof AIGatewayError) throw new Error(e.message);
      throw e;
    }
  });

export const updateEmail = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        subject: z.string().optional(),
        body: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...patch } = data;
    const { error } = await supabaseAdmin.from("emails").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
