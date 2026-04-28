-- ============================================================
-- 011: Chat threads and messages for NexusAi
-- Run in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.chat_threads (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_subject text NOT NULL,                        -- supabase auth.uid()
  title       text NOT NULL DEFAULT 'New Thread',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id   uuid NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  role        text NOT NULL CHECK (role IN ('user', 'model')),
  content     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_threads_auth ON public.chat_threads(auth_subject);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread ON public.chat_messages(thread_id);

-- RLS
ALTER TABLE public.chat_threads  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "threads: own select"
  ON public.chat_threads FOR SELECT
  USING (auth_subject = auth.uid()::text);

CREATE POLICY "threads: own insert"
  ON public.chat_threads FOR INSERT
  WITH CHECK (auth_subject = auth.uid()::text);

CREATE POLICY "threads: own update"
  ON public.chat_threads FOR UPDATE
  USING (auth_subject = auth.uid()::text);

CREATE POLICY "threads: own delete"
  ON public.chat_threads FOR DELETE
  USING (auth_subject = auth.uid()::text);

CREATE POLICY "messages: own select"
  ON public.chat_messages FOR SELECT
  USING (
    thread_id IN (
      SELECT id FROM public.chat_threads WHERE auth_subject = auth.uid()::text
    )
  );

CREATE POLICY "messages: own insert"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    thread_id IN (
      SELECT id FROM public.chat_threads WHERE auth_subject = auth.uid()::text
    )
  );

CREATE POLICY "messages: own delete"
  ON public.chat_messages FOR DELETE
  USING (
    thread_id IN (
      SELECT id FROM public.chat_threads WHERE auth_subject = auth.uid()::text
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_threads  TO authenticated;
GRANT SELECT, INSERT, DELETE         ON public.chat_messages TO authenticated;
-- Allow anon to insert (unauthenticated chat users)
GRANT SELECT, INSERT ON public.chat_threads  TO anon;
GRANT SELECT, INSERT ON public.chat_messages TO anon;
