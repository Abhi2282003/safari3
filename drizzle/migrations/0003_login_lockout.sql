CREATE TABLE public.login_attempts (
  username text PRIMARY KEY,
  failed_count int NOT NULL DEFAULT 0,
  locked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.login_attempts TO service_role;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.login_locked_until(_username text)
RETURNS timestamptz LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT locked_until FROM public.login_attempts WHERE username = lower(_username) AND locked_until > now()
$$;

CREATE OR REPLACE FUNCTION public.record_login_attempt(_username text, _success boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _success THEN
    DELETE FROM public.login_attempts WHERE username = lower(_username);
    RETURN;
  END IF;
  INSERT INTO public.login_attempts(username, failed_count, updated_at)
  VALUES (lower(_username), 1, now())
  ON CONFLICT (username) DO UPDATE SET
    failed_count = CASE WHEN login_attempts.locked_until IS NOT NULL AND login_attempts.locked_until <= now() THEN 1 ELSE login_attempts.failed_count + 1 END,
    locked_until = CASE WHEN login_attempts.locked_until IS NOT NULL AND login_attempts.locked_until <= now() THEN NULL ELSE login_attempts.locked_until END,
    updated_at = now();
  UPDATE public.login_attempts SET locked_until = now() + interval '15 minutes', failed_count = 0
  WHERE username = lower(_username) AND failed_count >= 5;
END $$;

GRANT EXECUTE ON FUNCTION public.login_locked_until(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_login_attempt(text, boolean) TO anon, authenticated;