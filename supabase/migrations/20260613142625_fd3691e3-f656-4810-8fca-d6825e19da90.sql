
-- Ensure Data API grants exist
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tickets TO authenticated;
GRANT ALL ON public.tickets TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pay_collection_entries TO authenticated;
GRANT ALL ON public.pay_collection_entries TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_members TO authenticated;
GRANT ALL ON public.staff_members TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- Admin override policies: admins can manage everything
DROP POLICY IF EXISTS "Admins manage all tickets" ON public.tickets;
CREATE POLICY "Admins manage all tickets" ON public.tickets
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage all pay collection entries" ON public.pay_collection_entries;
CREATE POLICY "Admins manage all pay collection entries" ON public.pay_collection_entries
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to insert/update/delete staff_members rows (currently only SELECT exists)
DROP POLICY IF EXISTS "Admins manage staff members" ON public.staff_members;
CREATE POLICY "Admins manage staff members" ON public.staff_members
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to insert/update/delete user_roles rows (currently only SELECT exists)
DROP POLICY IF EXISTS "Admins manage user roles" ON public.user_roles;
CREATE POLICY "Admins manage user roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
