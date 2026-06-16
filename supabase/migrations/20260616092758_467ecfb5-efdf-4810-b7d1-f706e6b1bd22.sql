CREATE TABLE public.luggage_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  destination text NOT NULL,
  rate numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, destination)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.luggage_rates TO authenticated;
GRANT ALL ON public.luggage_rates TO service_role;

ALTER TABLE public.luggage_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage their luggage rates"
ON public.luggage_rates
FOR ALL
TO authenticated
USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_luggage_rates_updated_at
BEFORE UPDATE ON public.luggage_rates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();