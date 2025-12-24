CREATE OR REPLACE FUNCTION public.next_ticket_no()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_date date := current_date;
  v_counter integer;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.ticket_counters (user_id, counter_date, counter_value)
  VALUES (v_user_id, v_date, 1)
  ON CONFLICT (user_id, counter_date)
  DO UPDATE SET counter_value = public.ticket_counters.counter_value + 1
  RETURNING counter_value INTO v_counter;

  RETURN 'ROYAL-' || to_char(v_date, 'YYYYMMDD') || '-' || lpad(v_counter::text, 4, '0');
END;
$$;
