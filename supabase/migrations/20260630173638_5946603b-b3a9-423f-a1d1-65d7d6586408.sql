ALTER TABLE public.agent_collection_payments ALTER COLUMN agent_id DROP NOT NULL;
ALTER TABLE public.agent_collection_payments ADD COLUMN IF NOT EXISTS party_key text;