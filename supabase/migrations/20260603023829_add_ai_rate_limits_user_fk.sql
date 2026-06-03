ALTER TABLE public.ai_rate_limits
  ADD CONSTRAINT ai_rate_limits_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;
