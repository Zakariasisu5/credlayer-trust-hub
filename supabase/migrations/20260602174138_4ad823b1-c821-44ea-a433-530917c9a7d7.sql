
CREATE TABLE IF NOT EXISTS public.agent_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  permission_key text NOT NULL,
  label text NOT NULL,
  description text NOT NULL DEFAULT '',
  scope text NOT NULL DEFAULT 'read',
  granted boolean NOT NULL DEFAULT false,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (wallet_address, permission_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_permissions TO anon, authenticated;
GRANT ALL ON public.agent_permissions TO service_role;
ALTER TABLE public.agent_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_permissions read" ON public.agent_permissions FOR SELECT USING (true);
CREATE POLICY "agent_permissions write" ON public.agent_permissions FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.verifiable_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id text NOT NULL UNIQUE,
  subject_wallet text NOT NULL,
  issuer text NOT NULL DEFAULT 'did:credlayer:issuer',
  trust_score integer NOT NULL,
  risk_level text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  credential_hash text NOT NULL,
  signature text,
  onchain_tx text,
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  revoked_at timestamptz
);

CREATE INDEX IF NOT EXISTS verifiable_credentials_subject_idx ON public.verifiable_credentials (subject_wallet);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.verifiable_credentials TO anon, authenticated;
GRANT ALL ON public.verifiable_credentials TO service_role;
ALTER TABLE public.verifiable_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vc read" ON public.verifiable_credentials FOR SELECT USING (true);
CREATE POLICY "vc write" ON public.verifiable_credentials FOR ALL USING (true) WITH CHECK (true);
