CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Speed indexes
CREATE INDEX IF NOT EXISTS idx_seat_bookings_agent_status ON public.seat_bookings (user_id, agent_id, agent_collection_status);
CREATE INDEX IF NOT EXISTS idx_seat_bookings_date_bus ON public.seat_bookings (user_id, journey_date, bus_name);
CREATE INDEX IF NOT EXISTS idx_tickets_booking_dt ON public.tickets (user_id, booking_date_time);
CREATE INDEX IF NOT EXISTS idx_acp_agent_date ON public.agent_collection_payments (user_id, agent_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_luggage_date_bus ON public.luggage_bookings (user_id, journey_date, bus_name);

-- Owner security
CREATE TABLE public.owner_security (
  user_id uuid PRIMARY KEY,
  password_hash text NOT NULL,
  failed_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.owner_security TO service_role;
ALTER TABLE public.owner_security ENABLE ROW LEVEL SECURITY;
-- no client policies: accessed only through security definer functions

CREATE OR REPLACE FUNCTION public.verify_owner_password(_password text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE r public.owner_security;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_admin');
  END IF;
  SELECT * INTO r FROM public.owner_security ORDER BY updated_at DESC LIMIT 1;
  IF r IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_set'); END IF;
  IF r.locked_until IS NOT NULL AND r.locked_until > now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'locked', 'locked_until', r.locked_until);
  END IF;
  IF r.password_hash = crypt(_password, r.password_hash) THEN
    UPDATE public.owner_security SET failed_attempts = 0, locked_until = NULL WHERE user_id = r.user_id;
    RETURN jsonb_build_object('ok', true);
  END IF;
  UPDATE public.owner_security
    SET failed_attempts = CASE WHEN failed_attempts + 1 >= 5 THEN 0 ELSE failed_attempts + 1 END,
        locked_until = CASE WHEN failed_attempts + 1 >= 5 THEN now() + interval '15 minutes' ELSE NULL END
    WHERE user_id = r.user_id;
  RETURN jsonb_build_object('ok', false, 'error', 'wrong');
END $$;

CREATE OR REPLACE FUNCTION public.set_owner_password(_current text, _new text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v jsonb;
BEGIN
  IF length(coalesce(_new,'')) < 6 THEN RETURN jsonb_build_object('ok', false, 'error', 'too_short'); END IF;
  v := public.verify_owner_password(_current);
  IF NOT (v->>'ok')::boolean THEN RETURN v; END IF;
  UPDATE public.owner_security SET password_hash = crypt(_new, gen_salt('bf')), updated_at = now();
  RETURN jsonb_build_object('ok', true);
END $$;

REVOKE ALL ON FUNCTION public.verify_owner_password(text) FROM public, anon;
REVOKE ALL ON FUNCTION public.set_owner_password(text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.verify_owner_password(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_owner_password(text, text) TO authenticated;

-- Read-only per-agent totals
CREATE OR REPLACE FUNCTION public.agent_pending_totals()
RETURNS TABLE(agent_id uuid, pending numeric, collected numeric, original numeric, pending_count bigint)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT agent_id,
    sum(CASE WHEN agent_collection_status <> 'collected' THEN amount_from_agent ELSE 0 END),
    sum(CASE WHEN agent_collection_status = 'collected' THEN coalesce(original_amount_from_agent, amount_from_agent) ELSE 0 END),
    sum(coalesce(original_amount_from_agent, amount_from_agent)),
    count(*) FILTER (WHERE agent_collection_status <> 'collected')
  FROM public.seat_bookings WHERE agent_id IS NOT NULL GROUP BY agent_id
$$;

-- Companies and buses
CREATE TABLE public.bus_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  number_prefix text,
  default_layout_id uuid,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bus_companies TO authenticated;
GRANT ALL ON public.bus_companies TO service_role;
ALTER TABLE public.bus_companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed in read companies" ON public.bus_companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage companies" ON public.bus_companies FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

ALTER TABLE public.buses ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.bus_companies(id);
ALTER TABLE public.buses ADD COLUMN IF NOT EXISTS layout_id uuid;
ALTER TABLE public.buses ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE public.seat_bookings ADD COLUMN IF NOT EXISTS bus_id uuid;
ALTER TABLE public.luggage_bookings ADD COLUMN IF NOT EXISTS bus_id uuid;
ALTER TABLE public.bus_schedules ADD COLUMN IF NOT EXISTS bus_id uuid;

-- Seat layouts
CREATE TABLE public.seat_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid REFERENCES public.bus_companies(id),
  name text NOT NULL,
  rows integer NOT NULL,
  cols integer NOT NULL,
  total_berths integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.seat_layout_cells (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  layout_id uuid NOT NULL REFERENCES public.seat_layouts(id) ON DELETE CASCADE,
  grid_row integer NOT NULL,
  grid_col integer NOT NULL,
  cell_type text NOT NULL DEFAULT 'berth',
  deck text,
  label text,
  seat_number integer
);
CREATE TABLE public.bus_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  bus_id uuid NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
  layout_id uuid NOT NULL REFERENCES public.seat_layouts(id),
  valid_from date NOT NULL DEFAULT '2000-01-01'
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seat_layouts, public.seat_layout_cells, public.bus_layouts TO authenticated;
GRANT ALL ON public.seat_layouts, public.seat_layout_cells, public.bus_layouts TO service_role;
ALTER TABLE public.seat_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seat_layout_cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_layouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read layouts" ON public.seat_layouts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage layouts" ON public.seat_layouts FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Read layout cells" ON public.seat_layout_cells FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage layout cells" ON public.seat_layout_cells FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Read bus layouts" ON public.bus_layouts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage bus layouts" ON public.bus_layouts FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Booking types and commission rules
CREATE TABLE public.booking_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  key text NOT NULL,
  name text NOT NULL,
  colour text,
  needs_agent boolean NOT NULL DEFAULT false,
  creates_collection boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.commission_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid REFERENCES public.bus_companies(id),
  bus_id uuid REFERENCES public.buses(id),
  agent_id uuid REFERENCES public.agents(id),
  booking_type_id uuid REFERENCES public.booking_types(id),
  is_luggage boolean NOT NULL DEFAULT false,
  total_percent numeric NOT NULL DEFAULT 0,
  our_percent numeric NOT NULL DEFAULT 0,
  agent_percent numeric NOT NULL DEFAULT 0,
  owner_gets boolean NOT NULL DEFAULT true,
  collect_from_party boolean NOT NULL DEFAULT false,
  valid_from date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_types, public.commission_rules TO authenticated;
GRANT ALL ON public.booking_types, public.commission_rules TO service_role;
ALTER TABLE public.booking_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read booking types" ON public.booking_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage booking types" ON public.booking_types FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins read rules" ON public.commission_rules FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage rules" ON public.commission_rules FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

ALTER TABLE public.seat_bookings ADD COLUMN IF NOT EXISTS booking_type_id uuid;
ALTER TABLE public.seat_bookings ADD COLUMN IF NOT EXISTS passenger_phone text;
ALTER TABLE public.seat_bookings ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.luggage_bookings ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS show_ticket_screens boolean;