CREATE TABLE public.agent_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  action text NOT NULL,
  status text NOT NULL DEFAULT 'success',
  message text NOT NULL DEFAULT '',
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX agent_activity_log_wallet_created_idx
  ON public.agent_activity_log (wallet_address, created_at DESC);

GRANT ALL ON public.agent_activity_log TO service_role;

ALTER TABLE public.agent_activity_log ENABLE ROW LEVEL SECURITY;
-- No public policies: all access flows through server functions using service role.
