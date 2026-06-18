CREATE TABLE public.luggage_parties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  party_name TEXT NOT NULL,
  destination TEXT NOT NULL,
  item_name TEXT NOT NULL,
  rate NUMERIC NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, party_name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.luggage_parties TO authenticated;
GRANT ALL ON public.luggage_parties TO service_role;

ALTER TABLE public.luggage_parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own luggage parties"
ON public.luggage_parties FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_luggage_parties_updated_at
BEFORE UPDATE ON public.luggage_parties
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();