import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LuggageBooking {
  id: string;
  journeyDate: string;
  busName: string;
  destination: string;
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
      const { data, error } = await supabase
        .from('luggage_bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('journey_date', { ascending: false });

      if (error) throw error;

      const mapped: LuggageBooking[] = (data || []).map((row: any) => ({
        id: row.id,
        journeyDate: row.journey_date,
        busName: row.bus_name,
        destination: row.destination,
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

  const saveLuggageBooking = async (booking: Omit<LuggageBooking, 'id' | 'createdAt'> & { id?: string }) => {
    if (!user) throw new Error('Not authenticated');

    const amounts = calculateLuggageAmounts(booking.totalAmount);

    const payload = {
      user_id: user.id,
      journey_date: booking.journeyDate,
      bus_name: booking.busName,
      destination: booking.destination,
      quantity: booking.quantity,
      total_amount: booking.totalAmount,
      our_earning: amounts.ourEarning,
      amount_to_owner: amounts.amountToOwner,
      notes: booking.notes || null,
    };

    if (booking.id) {
      const { error } = await supabase
        .from('luggage_bookings')
        .update(payload)
        .eq('id', booking.id);
      if (error) throw error;
    } else {
      console.log('Inserting luggage booking:', payload);
      const { data, error } = await supabase
        .from('luggage_bookings')
        .insert(payload)
        .select();
      console.log('Insert result:', { data, error });
      if (error) throw error;
    }

    await fetchLuggageBookings();
  };

  const deleteLuggageBooking = async (id: string) => {
    const { error } = await supabase
      .from('luggage_bookings')
      .delete()
      .eq('id', id);
    if (error) throw error;
    await fetchLuggageBookings();
  };

  const getLuggageByDateAndBus = (date: Date, busName: string) => {
    const dateStr = date.toISOString().split('T')[0];
    return luggageBookings.filter(
      (b) => b.journeyDate === dateStr && b.busName === busName
    );
  };

  const getLuggageProfitSummary = (startDate: Date, endDate: Date) => {
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
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
