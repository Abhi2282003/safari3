CREATE OR REPLACE FUNCTION public.apply_agent_payment(
  _full_ids uuid[],
  _partials jsonb,
  _zero_amount boolean,
  _agent_id uuid,
  _new_advance numeric,
  _party_key text,
  _amount_paid numeric,
  _received_by text,
  _payment_mode text,
  _notes text
) RETURNS uuid
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE p jsonb; pay_id uuid;
BEGIN
  IF coalesce(array_length(_full_ids, 1), 0) > 0 THEN
    UPDATE public.seat_bookings
      SET agent_collection_status = 'collected', collected_at = now(),
          amount_from_agent = CASE WHEN _zero_amount THEN 0 ELSE amount_from_agent END
      WHERE id = ANY(_full_ids);
  END IF;
  FOR p IN SELECT * FROM jsonb_array_elements(coalesce(_partials, '[]'::jsonb)) LOOP
    UPDATE public.seat_bookings SET amount_from_agent = (p->>'amount_from_agent')::numeric WHERE id = (p->>'id')::uuid;
  END LOOP;
  IF _agent_id IS NOT NULL AND _new_advance IS NOT NULL THEN
    UPDATE public.agents SET advance_balance = _new_advance WHERE id = _agent_id;
  END IF;
  IF _amount_paid > 0 THEN
    INSERT INTO public.agent_collection_payments(user_id, agent_id, party_key, amount_paid, received_by, payment_mode, notes)
    VALUES (auth.uid(), _agent_id, _party_key, _amount_paid, _received_by, _payment_mode, _notes)
    RETURNING id INTO pay_id;
  END IF;
  RETURN pay_id;
END $$;
REVOKE ALL ON FUNCTION public.apply_agent_payment(uuid[], jsonb, boolean, uuid, numeric, text, numeric, text, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.apply_agent_payment(uuid[], jsonb, boolean, uuid, numeric, text, numeric, text, text, text) TO authenticated;