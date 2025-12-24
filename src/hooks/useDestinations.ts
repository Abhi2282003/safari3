import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Destination {
  id: string;
  name: string;
  active: boolean;
}

export function useDestinations() {
  const { user } = useAuth();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchDestinations();
  }, [user]);

  const fetchDestinations = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('destination_cities')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;

      setDestinations(
        data?.map((d) => ({
          id: d.id,
          name: d.name,
          active: d.active ?? true,
        })) || []
      );
    } catch (error) {
      console.error('Error fetching destinations:', error);
    } finally {
      setLoading(false);
    }
  };

  const addDestination = async (name: string) => {
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('destination_cities')
      .insert({ user_id: user.id, name, active: true })
      .select()
      .single();

    if (error) throw error;
    setDestinations([...destinations, { id: data.id, name: data.name, active: data.active ?? true }]);
    return data;
  };

  const toggleDestination = async (id: string) => {
    if (!user) throw new Error('Not authenticated');
    const dest = destinations.find((d) => d.id === id);
    if (!dest) return;

    const { error } = await supabase
      .from('destination_cities')
      .update({ active: !dest.active })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    setDestinations(destinations.map((d) => (d.id === id ? { ...d, active: !d.active } : d)));
  };

  const deleteDestination = async (id: string) => {
    if (!user) throw new Error('Not authenticated');
    const { error } = await supabase
      .from('destination_cities')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    setDestinations(destinations.filter((d) => d.id !== id));
  };

  return {
    destinations,
    loading,
    addDestination,
    toggleDestination,
    deleteDestination,
    refetch: fetchDestinations,
  };
}
