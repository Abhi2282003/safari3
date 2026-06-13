import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'admin' | 'staff' | null;

let cachedRoleUserId: string | null = null;
let cachedRole: AppRole = null;

export function useUserRole() {
  const { user } = useAuth();
  const hasCachedRole = !!user && cachedRoleUserId === user.id && cachedRole !== null;
  const [role, setRole] = useState<AppRole>(hasCachedRole ? cachedRole : null);
  const [loading, setLoading] = useState(!hasCachedRole);

  useEffect(() => {
    let cancelled = false;
    async function fetchRole() {
      if (!user) {
        cachedRoleUserId = null;
        cachedRole = null;
        setRole(null);
        setLoading(false);
        return;
      }
      if (cachedRoleUserId === user.id && cachedRole !== null) {
        setRole(cachedRole);
        setLoading(false);
        return;
      }
      setRole(null);
      setLoading(true);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .order('role', { ascending: true });
      if (cancelled) return;
      let nextRole: AppRole;
      if (error || !data || data.length === 0) {
        nextRole = 'staff'; // default safe role
      } else {
        const roles = data.map((r: { role: string }) => r.role);
        nextRole = roles.includes('admin') ? 'admin' : 'staff';
      }
      cachedRoleUserId = user.id;
      cachedRole = nextRole;
      setRole(nextRole);
      setLoading(false);
    }
    fetchRole();
    return () => { cancelled = true; };
  }, [user]);

  const waitingForRole = !!user && !hasCachedRole && role === null;
  const effectiveRole = hasCachedRole ? cachedRole : waitingForRole ? null : role;
  const effectiveLoading = loading || waitingForRole;

  return {
    role: effectiveRole,
    loading: effectiveLoading,
    isAdmin: effectiveRole === 'admin',
    isStaff: effectiveRole === 'staff',
  };
}
