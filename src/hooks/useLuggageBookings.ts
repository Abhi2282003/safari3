import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { fetchAll } from '@/lib/fetchAll';

export interface LuggageBooking {
  id: string;
  journeyDate: string;
  busName: string;
  destination: string;
  itemName?: string;
  partyName?: string;
  quantity: number;
  totalAmount: number;
  ourEarning: number;
  amountToOwner: number;
  notes?: string;
  createdAt: string;
}

const LUGGAGE_PROFIT_PERCENT = 30;

export function calculateLuggageAmounts(totalAmount: number) {
  const ourEarning = totalAmount * (LUGGAGE_PROFIT_PERCENT / 100);
  const amountToOwner = totalAmount - ourEarning;
  return { ourEarning, amountToOwner };
}

export function useLuggageBookings() {
  const { user } = useAuth();
  const [luggageBookings, setLuggageBookings] = useState<LuggageBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLuggageBookings = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await fetchAll<any>(() => supabase
        .from('luggage_bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('journey_date', { ascending: false })
        .order('id'));

      if (error) throw error;

      const mapped: LuggageBooking[] = (data || []).map((row: any) => ({
        id: row.id,
        journeyDate: row.journey_date,
        busName: row.bus_name,
        destination: row.destination,
        itemName: row.item_name || undefined,
        partyName: row.party_name || undefined,
        quantity: row.quantity,
        totalAmount: row.total_amount,
        ourEarning: row.our_earning,
        amountToOwner: row.amount_to_owner,
        notes: row.notes,
        createdAt: row.created_at,
      }));

      setLuggageBookings(mapped);
    } catch (error) {
      console.error('Error fetching luggage bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLuggageBookings();
  }, [fetchLuggageBookings]);

  const mapRow = (row: any): LuggageBooking => ({
    id: row.id,
    journeyDate: row.journey_date,
    busName: row.bus_name,
    destination: row.destination,
    itemName: row.item_name || undefined,
    partyName: row.party_name || undefined,
    quantity: row.quantity,
    totalAmount: row.total_amount,
    ourEarning: row.our_earning,
    amountToOwner: row.amount_to_owner,
    notes: row.notes,
    createdAt: row.created_at,
  });

  const saveLuggageBooking = async (booking: Omit<LuggageBooking, 'id' | 'createdAt'> & { id?: string }) => {
    if (!user) throw new Error('Not authenticated');

    const amounts = calculateLuggageAmounts(booking.totalAmount);

    const payload: any = {
      user_id: user.id,
      journey_date: booking.journeyDate,
      bus_name: booking.busName,
      destination: booking.destination,
      item_name: booking.itemName || null,
      party_name: booking.partyName || null,
      quantity: booking.quantity,
      total_amount: booking.totalAmount,
      our_earning: amounts.ourEarning,
      amount_to_owner: amounts.amountToOwner,
      notes: booking.notes || null,
    };

    if (booking.id) {
      const { data, error } = await supabase
        .from('luggage_bookings')
        .update(payload)
        .eq('id', booking.id)
        .select()
        .single();
      if (error) throw error;
      const updated = mapRow(data);
      setLuggageBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    } else {
      const { data, error } = await supabase
        .from('luggage_bookings')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      const inserted = mapRow(data);
      setLuggageBookings((prev) => [inserted, ...prev]);
    }
  };

  const deleteLuggageBooking = async (id: string) => {
    setLuggageBookings((prev) => prev.filter((b) => b.id !== id));
    const { error } = await supabase
      .from('luggage_bookings')
      .delete()
      .eq('id', id);
    if (error) {
      await fetchLuggageBookings();
      throw error;
    }
  };

  const getLuggageByDateAndBus = (date: Date, busName: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return luggageBookings.filter(
      (b) => b.journeyDate === dateStr && b.busName === busName
    );
  };

  const getLuggageProfitSummary = (startDate: Date, endDate: Date) => {
    const startStr = format(startDate, 'yyyy-MM-dd');
    const endStr = format(endDate, 'yyyy-MM-dd');
    
    const filtered = luggageBookings.filter(
      (b) => b.journeyDate >= startStr && b.journeyDate <= endStr
    );

    // Group by date
    const byDate: { [date: string]: { count: number; totalAmount: number; profit: number } } = {};
    
    filtered.forEach((b) => {
      if (!byDate[b.journeyDate]) {
        byDate[b.journeyDate] = { count: 0, totalAmount: 0, profit: 0 };
      }
      byDate[b.journeyDate].count += b.quantity;
      byDate[b.journeyDate].totalAmount += b.totalAmount;
      byDate[b.journeyDate].profit += b.ourEarning;
    });

    return {
      byDate,
      totals: {
        count: filtered.reduce((sum, b) => sum + b.quantity, 0),
        totalAmount: filtered.reduce((sum, b) => sum + b.totalAmount, 0),
        profit: filtered.reduce((sum, b) => sum + b.ourEarning, 0),
      },
    };
  };

  return {
    luggageBookings,
    loading,
    fetchLuggageBookings,
    saveLuggageBooking,
    deleteLuggageBooking,
    getLuggageByDateAndBus,
    getLuggageProfitSummary,
  };
}
