import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LuggageRate {
  id: string;
  destination: string;
  itemName: string;
  rate: number;
}

export function useLuggageRates() {
  const { user } = useAuth();
  const [rates, setRates] = useState<LuggageRate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRates = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('luggage_rates')
        .select('*')
        .eq('user_id', user.id)
        .order('destination', { ascending: true });
      if (error) throw error;
      setRates(
        (data || []).map((r: any) => ({
          id: r.id,
          destination: r.destination,
          itemName: r.item_name || 'Default',
          rate: Number(r.rate),
        }))
      );
    } catch (e) {
      console.error('Error fetching luggage rates', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const upsertRate = async (destination: string, itemName: string, rate: number) => {
    if (!user) throw new Error('Not authenticated');
    const { error } = await supabase
      .from('luggage_rates')
      .upsert(
        { user_id: user.id, destination, item_name: itemName, rate } as any,
        { onConflict: 'user_id,destination,item_name' }
      );
    if (error) throw error;
    await fetchRates();
  };

  const deleteRate = async (id: string) => {
    const { error } = await supabase.from('luggage_rates').delete().eq('id', id);
    if (error) throw error;
    await fetchRates();
  };

  const getRateFor = (destination: string, itemName?: string): number => {
    if (itemName) {
      const r = rates.find((x) => x.destination === destination && x.itemName === itemName);
      if (r) return r.rate;
    }
    const r = rates.find((x) => x.destination === destination);
    return r ? r.rate : 0;
  };

  const getItemsFor = (destination: string): LuggageRate[] => {
    return rates.filter((x) => x.destination === destination);
  };

  return { rates, loading, fetchRates, upsertRate, deleteRate, getRateFor, getItemsFor };
}
