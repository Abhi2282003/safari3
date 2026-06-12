import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface StaffMember {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  active: boolean;
}

export function useStaffMember() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) { setStaff(null); setLoading(false); return; }
      setLoading(true);
      const { data } = await supabase
        .from('staff_members')
        .select('id, user_id, username, full_name, active')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      setStaff((data as StaffMember) || null);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  return { staff, loading };
}
