
-- Fix mutable search_path on set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Restrict execution of SECURITY DEFINER trigger function
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated, public;

-- Tighten contact_messages insert policy (no longer WITH CHECK (true))
DROP POLICY "Anyone can submit contact messages" ON public.contact_messages;
CREATE POLICY "Valid contact submission" ON public.contact_messages
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(trim(name)) BETWEEN 1 AND 100
    AND char_length(trim(email)) BETWEEN 3 AND 255
    AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND char_length(trim(message)) BETWEEN 1 AND 2000
  );
