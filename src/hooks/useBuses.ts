import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BusConfig } from '@/types/ticket';

export function useBuses() {
  const { user } = useAuth();
  const [buses, setBuses] = useState<BusConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBuses = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('buses')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;

      setBuses((data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        active: row.active ?? true,
      })));
    } catch (error) {
      console.error('Error fetching buses:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBuses();
  }, [fetchBuses]);

  return { buses, loading, fetchBuses };
}
