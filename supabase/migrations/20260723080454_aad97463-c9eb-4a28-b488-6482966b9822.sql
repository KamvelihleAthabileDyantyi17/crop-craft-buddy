
-- Chat threads and messages
CREATE TABLE public.chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field TEXT,
  crop TEXT,
  topic TEXT,
  urgency TEXT,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_threads TO anon, authenticated;
GRANT ALL ON public.chat_threads TO service_role;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public all" ON public.chat_threads FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO anon, authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public all" ON public.chat_messages FOR ALL USING (true) WITH CHECK (true);

-- Task planner
CREATE TABLE public.task_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  input_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_batches TO anon, authenticated;
GRANT ALL ON public.task_batches TO service_role;
ALTER TABLE public.task_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public all" ON public.task_batches FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.task_batches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT,
  day TEXT NOT NULL,
  day_order INT NOT NULL DEFAULT 0,
  priority TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO anon, authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public all" ON public.tasks FOR ALL USING (true) WITH CHECK (true);

-- Research notes
CREATE TABLE public.research_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  source_text TEXT NOT NULL,
  summary TEXT,
  insights JSONB,
  actions JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.research_notes TO anon, authenticated;
GRANT ALL ON public.research_notes TO service_role;
ALTER TABLE public.research_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public all" ON public.research_notes FOR ALL USING (true) WITH CHECK (true);

-- Meeting notes
CREATE TABLE public.meeting_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  source_text TEXT NOT NULL,
  summary TEXT,
  action_items JSONB,
  decisions JSONB,
  deadlines JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_notes TO anon, authenticated;
GRANT ALL ON public.meeting_notes TO service_role;
ALTER TABLE public.meeting_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public all" ON public.meeting_notes FOR ALL USING (true) WITH CHECK (true);

-- Emails
CREATE TABLE public.emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief TEXT NOT NULL,
  tone TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emails TO anon, authenticated;
GRANT ALL ON public.emails TO service_role;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public all" ON public.emails FOR ALL USING (true) WITH CHECK (true);
