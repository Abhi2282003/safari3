
CREATE TABLE public.bus_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  journey_date date NOT NULL,
  bus_name text NOT NULL,
  driver_name text,
  departure_time text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, journey_date, bus_name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bus_schedules TO authenticated;
GRANT ALL ON public.bus_schedules TO service_role;

ALTER TABLE public.bus_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own bus schedules"
  ON public.bus_schedules
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_bus_schedules_updated_at
  BEFORE UPDATE ON public.bus_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
