CREATE TABLE public.pay_collection_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ticket_no text NOT NULL,
  travels_name text NOT NULL,
  tours_to text,
  booked_by text,
  amount numeric NOT NULL DEFAULT 0,
  collection_status text NOT NULL DEFAULT 'Unpaid',
  paid_by text,
  receiver_name text,
  receiver_mobile text,
  payment_mode text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pay_collection_entries TO authenticated;
GRANT ALL ON public.pay_collection_entries TO service_role;

ALTER TABLE public.pay_collection_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own pay collection entries"
ON public.pay_collection_entries FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_pay_collection_entries_updated_at
BEFORE UPDATE ON public.pay_collection_entries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();