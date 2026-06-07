
-- api_keys: remove public SELECT (key_hash exposure)
DROP POLICY IF EXISTS "anyone can view api keys" ON public.api_keys;

-- agent_permissions: drop permissive policies; server functions use service role
DROP POLICY IF EXISTS "agent_permissions read" ON public.agent_permissions;
DROP POLICY IF EXISTS "agent_permissions write" ON public.agent_permissions;

-- verifiable_credentials: drop permissive policies; server functions use service role
DROP POLICY IF EXISTS "vc read" ON public.verifiable_credentials;
DROP POLICY IF EXISTS "vc write" ON public.verifiable_credentials;

-- Ensure RLS remains enabled (default-deny posture; service_role still bypasses)
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifiable_credentials ENABLE ROW LEVEL SECURITY;
