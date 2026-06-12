
-- Allow all authenticated users to read shared business config lists
CREATE POLICY "All authenticated can read travels"
  ON public.travels FOR SELECT TO authenticated USING (true);
CREATE POLICY "All authenticated can read receivers"
  ON public.receivers FOR SELECT TO authenticated USING (true);
CREATE POLICY "All authenticated can read destination_cities"
  ON public.destination_cities FOR SELECT TO authenticated USING (true);
CREATE POLICY "All authenticated can read pickup_locations"
  ON public.pickup_locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "All authenticated can read buses"
  ON public.buses FOR SELECT TO authenticated USING (true);
