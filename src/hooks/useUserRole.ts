import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'admin' | 'staff' | null;

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchRole() {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .order('role', { ascending: true });
      if (cancelled) return;
      if (error || !data || data.length === 0) {
        setRole('staff'); // default safe role
      } else {
        const roles = data.map((r: { role: string }) => r.role);
        setRole(roles.includes('admin') ? 'admin' : 'staff');
      }
      setLoading(false);
    }
    fetchRole();
    return () => { cancelled = true; };
  }, [user]);

  return { role, loading, isAdmin: role === 'admin', isStaff: role === 'staff' };
}
