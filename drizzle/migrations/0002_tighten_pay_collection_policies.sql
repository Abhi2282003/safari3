DROP POLICY IF EXISTS "Authenticated can update pay collection entries" ON public.pay_collection_entries;
DROP POLICY IF EXISTS "Authenticated can view all pay collection entries" ON public.pay_collection_entries;
DROP POLICY IF EXISTS "Users manage own pay collection entries" ON public.pay_collection_entries;
CREATE POLICY "Staff can view pay collection entries" ON public.pay_collection_entries FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff can update pay collection entries" ON public.pay_collection_entries FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff manage own pay collection entries" ON public.pay_collection_entries FOR ALL TO authenticated
  USING (auth.uid() = user_id AND (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin')))
  WITH CHECK (auth.uid() = user_id AND (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin')));