CREATE TABLE public.ai_rate_limits (
  user_id uuid NOT NULL,
  window_start timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, window_start)
);

ALTER TABLE public.ai_rate_limits ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.ai_rate_limits FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.check_ai_rate_limit(
  target_user_id uuid,
  max_requests integer DEFAULT 10,
  window_seconds integer DEFAULT 60
)
RETURNS TABLE(allowed boolean, retry_after_seconds integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_window timestamptz;
  current_count integer;
BEGIN
  IF target_user_id IS NULL THEN
    RETURN QUERY SELECT false, window_seconds;
    RETURN;
  END IF;

  current_window :=
    to_timestamp(floor(extract(epoch FROM now()) / window_seconds) * window_seconds);

  INSERT INTO public.ai_rate_limits (
    user_id,
    window_start,
    request_count,
    updated_at
  )
  VALUES (
    target_user_id,
    current_window,
    1,
    now()
  )
  ON CONFLICT (user_id, window_start)
  DO UPDATE SET
    request_count = public.ai_rate_limits.request_count + 1,
    updated_at = now()
  RETURNING request_count INTO current_count;

  RETURN QUERY
  SELECT
    current_count <= max_requests,
    CASE
      WHEN current_count <= max_requests THEN 0
      ELSE greatest(
        1,
        ceil(
          extract(epoch FROM (current_window + make_interval(secs => window_seconds) - now()))
        )::integer
      )
    END;
END;
$$;

REVOKE ALL ON FUNCTION public.check_ai_rate_limit(uuid, integer, integer)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.check_ai_rate_limit(uuid, integer, integer)
  TO service_role;
