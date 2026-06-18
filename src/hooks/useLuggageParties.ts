import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LuggageParty {
  id: string;
  partyName: string;
  destination: string;
  itemName: string;
  rate: number;
  active: boolean;
}

export function useLuggageParties() {
  const { user } = useAuth();
  const [parties, setParties] = useState<LuggageParty[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchParties = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('luggage_parties' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('party_name', { ascending: true });
      if (error) throw error;
      setParties(
        ((data as any[]) || []).map((r) => ({
          id: r.id,
          partyName: r.party_name,
          destination: r.destination,
          itemName: r.item_name,
          rate: Number(r.rate),
          active: r.active,
        }))
      );
    } catch (e) {
      console.error('Error fetching luggage parties', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchParties();
  }, [fetchParties]);

  const saveParty = async (p: Omit<LuggageParty, 'id' | 'active'> & { id?: string; active?: boolean }) => {
    if (!user) throw new Error('Not authenticated');
    const payload: any = {
      user_id: user.id,
      party_name: p.partyName,
      destination: p.destination,
      item_name: p.itemName,
      rate: p.rate,
      active: p.active ?? true,
    };
    if (p.id) {
      const { error } = await supabase.from('luggage_parties' as any).update(payload).eq('id', p.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('luggage_parties' as any).insert(payload);
      if (error) throw error;
    }
    await fetchParties();
  };

  const deleteParty = async (id: string) => {
    const { error } = await supabase.from('luggage_parties' as any).delete().eq('id', id);
    if (error) throw error;
    await fetchParties();
  };

  return { parties, loading, fetchParties, saveParty, deleteParty };
}
