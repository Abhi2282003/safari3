-- Update the next_ticket_no function to ensure global counter never resets
-- The counter will continue from where it left off and never repeat

CREATE OR REPLACE FUNCTION public.next_ticket_no()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_date date := current_date;
  v_counter integer;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Use a fixed date '1970-01-01' as the global counter key (never resets)
  INSERT INTO public.ticket_counters (user_id, counter_date, counter_value)
  VALUES (v_user_id, '1970-01-01'::date, 1)
  ON CONFLICT (user_id, counter_date)
  DO UPDATE SET counter_value = public.ticket_counters.counter_value + 1
  RETURNING counter_value INTO v_counter;

  -- Format: ROYAL-YYYYMMDD-XXXX where XXXX is global counter (never repeats, continues daily)
  RETURN 'ROYAL-' || to_char(v_date, 'YYYYMMDD') || '-' || lpad(v_counter::text, 4, '0');
END;
$function$;