
DROP POLICY IF EXISTS "public all" ON public.chat_messages;
DROP POLICY IF EXISTS "public all" ON public.chat_threads;
DROP POLICY IF EXISTS "public all" ON public.emails;
DROP POLICY IF EXISTS "public all" ON public.meeting_notes;
DROP POLICY IF EXISTS "public all" ON public.research_notes;
DROP POLICY IF EXISTS "public all" ON public.stock_entries;
DROP POLICY IF EXISTS "public all" ON public.task_batches;
DROP POLICY IF EXISTS "public all" ON public.tasks;

REVOKE ALL ON public.chat_messages FROM anon, authenticated;
REVOKE ALL ON public.chat_threads FROM anon, authenticated;
REVOKE ALL ON public.emails FROM anon, authenticated;
REVOKE ALL ON public.meeting_notes FROM anon, authenticated;
REVOKE ALL ON public.research_notes FROM anon, authenticated;
REVOKE ALL ON public.stock_entries FROM anon, authenticated;
REVOKE ALL ON public.task_batches FROM anon, authenticated;
REVOKE ALL ON public.tasks FROM anon, authenticated;

GRANT ALL ON public.chat_messages TO service_role;
GRANT ALL ON public.chat_threads TO service_role;
GRANT ALL ON public.emails TO service_role;
GRANT ALL ON public.meeting_notes TO service_role;
GRANT ALL ON public.research_notes TO service_role;
GRANT ALL ON public.stock_entries TO service_role;
GRANT ALL ON public.task_batches TO service_role;
GRANT ALL ON public.tasks TO service_role;
