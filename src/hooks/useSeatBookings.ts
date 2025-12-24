import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export type BookingType = 'online' | 'agent' | 'self';

export interface Agent {
  id: string;
  name: string;
  phone?: string;
  active: boolean;
}

export interface SeatBooking {
  id: string;
  ticketId?: string;
  journeyDate: string;
  seatNumber: number;
  bookingType: BookingType;
  agentId?: string;
  agentName?: string;
  bookingAmount: number;
  commissionPercent: number;
  ourEarning: number;
  amountToOwner: number;
  amountFromAgent: number;
  originalAmountFromAgent: number;
  agentCollectionStatus: 'pending' | 'collected' | 'not_applicable';
  collectedAt?: string;
  travelsName?: string;
  destination?: string;
  busName?: string;
  passengerName?: string;
  notes?: string;
  createdAt: string;
}

export interface DailyProfitSummary {
  date: string;
  onlineCount: number;
  onlineProfit: number;
  agentCount: number;
  agentProfit: number;
  selfCount: number;
  selfProfit: number;
  totalProfit: number;
  totalSeats: number;
  pendingCollections: number;
}

// Commission rates
const COMMISSION_RATES = {
  online: 5,    // We earn 5%
  agent: 15,    // Total 15% (10% to agent, 5% to us)
  self: 15,     // We earn full 15%
};

export function calculateBookingAmounts(
  bookingType: BookingType,
  totalAmount: number
) {
  const commissionPercent = COMMISSION_RATES[bookingType];
  const totalCommission = (totalAmount * commissionPercent) / 100;
  
  let ourEarning = 0;
  let amountToOwner = 0;
  let amountFromAgent = 0;

  switch (bookingType) {
    case 'online':
      // We earn 5%
      ourEarning = totalCommission;
      amountToOwner = totalAmount - totalCommission;
      amountFromAgent = 0;
      break;
    case 'agent':
      // Total 15%: 10% to agent, 5% to us
      // Agent collects full amount, keeps 10%, gives us 90%
      ourEarning = (totalAmount * 5) / 100;
      amountToOwner = totalAmount - (totalAmount * 15) / 100;
      amountFromAgent = totalAmount - (totalAmount * 10) / 100; // Agent gives us this (90%)
      break;
    case 'self':
      // We earn 15%
      ourEarning = totalCommission;
      amountToOwner = totalAmount - totalCommission;
      amountFromAgent = 0;
      break;
  }

  return {
    commissionPercent,
    ourEarning,
    amountToOwner,
    amountFromAgent,
  };
}

export function useAgents() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgents = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching agents:', error);
      return;
    }

    setAgents(data.map((a) => ({
      id: a.id,
      name: a.name,
      phone: a.phone || undefined,
      active: a.active ?? true,
    })));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const saveAgent = async (agent: Omit<Agent, 'id'> & { id?: string }) => {
    if (!user) return;

    if (agent.id) {
      await supabase
        .from('agents')
        .update({ name: agent.name, phone: agent.phone, active: agent.active })
        .eq('id', agent.id);
    } else {
      await supabase.from('agents').insert({
        user_id: user.id,
        name: agent.name,
        phone: agent.phone,
        active: agent.active,
      });
    }
    await fetchAgents();
  };

  const deleteAgent = async (id: string) => {
    await supabase.from('agents').delete().eq('id', id);
    await fetchAgents();
  };

  return { agents, loading, fetchAgents, saveAgent, deleteAgent };
}

export function useSeatBookings() {
  const { user } = useAuth();
  const [seatBookings, setSeatBookings] = useState<SeatBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSeatBookings = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('seat_bookings')
      .select(`
        *,
        agents(name)
      `)
      .eq('user_id', user.id)
      .order('journey_date', { ascending: false });

    if (error) {
      console.error('Error fetching seat bookings:', error);
      setLoading(false);
      return;
    }

    setSeatBookings((data || []).map((s: any) => ({
      id: s.id,
      ticketId: s.ticket_id || undefined,
      journeyDate: s.journey_date,
      seatNumber: s.seat_number,
      bookingType: s.booking_type as BookingType,
      agentId: s.agent_id || undefined,
      agentName: s.agents?.name || undefined,
      bookingAmount: Number(s.booking_amount),
      commissionPercent: Number(s.commission_percent),
      ourEarning: Number(s.our_earning),
      amountToOwner: Number(s.amount_to_owner),
      amountFromAgent: Number(s.amount_from_agent),
      originalAmountFromAgent: Number(s.original_amount_from_agent || s.amount_from_agent),
      agentCollectionStatus: s.agent_collection_status as SeatBooking['agentCollectionStatus'],
      collectedAt: s.collected_at || undefined,
      travelsName: s.travels_name || undefined,
      destination: s.destination || undefined,
      busName: s.bus_name || undefined,
      passengerName: s.passenger_name || undefined,
      notes: s.notes || undefined,
      createdAt: s.created_at,
    })));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSeatBookings();
  }, [fetchSeatBookings]);

  const getSeatsByDate = (date: Date): SeatBooking[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return seatBookings.filter((s) => s.journeyDate === dateStr);
  };

  const saveSeatBooking = async (
    booking: Omit<SeatBooking, 'id' | 'createdAt' | 'agentName'> & { id?: string }
  ) => {
    if (!user) return null;

    const amounts = calculateBookingAmounts(booking.bookingType, booking.bookingAmount);

    const dbBooking = {
      user_id: user.id,
      ticket_id: booking.ticketId || null,
      journey_date: booking.journeyDate,
      seat_number: booking.seatNumber,
      booking_type: booking.bookingType,
      agent_id: booking.agentId || null,
      booking_amount: booking.bookingAmount,
      commission_percent: amounts.commissionPercent,
      our_earning: amounts.ourEarning,
      amount_to_owner: amounts.amountToOwner,
      amount_from_agent: amounts.amountFromAgent,
      original_amount_from_agent: amounts.amountFromAgent,
      agent_collection_status: booking.bookingType === 'agent' ? 'pending' : 'not_applicable',
      travels_name: booking.travelsName || null,
      destination: booking.destination || null,
      bus_name: booking.busName || null,
      passenger_name: booking.passengerName || null,
      notes: booking.notes || null,
    };

    if (booking.id) {
      const { error } = await supabase
        .from('seat_bookings')
        .update(dbBooking as any)
        .eq('id', booking.id);
      
      if (error) throw error;
      await fetchSeatBookings();
      return booking.id;
    } else {
      const { data, error } = await supabase
        .from('seat_bookings')
        .insert(dbBooking as any)
        .select('id')
        .single();
      
      if (error) throw error;
      await fetchSeatBookings();
      return data.id;
    }
  };

  const markCollected = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('seat_bookings')
      .update({
        agent_collection_status: 'collected',
        collected_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
    await fetchSeatBookings();
  };

  const deleteSeatBooking = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('seat_bookings')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await fetchSeatBookings();
  };

  const getPendingCollections = (): SeatBooking[] => {
    return seatBookings.filter(
      (s) => s.bookingType === 'agent' && s.agentCollectionStatus === 'pending'
    );
  };

  const getDailyProfitSummary = (startDate: Date, endDate: Date): DailyProfitSummary[] => {
    const summaries: DailyProfitSummary[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const dateStr = format(current, 'yyyy-MM-dd');
      const dayBookings = seatBookings.filter((s) => s.journeyDate === dateStr);

      const online = dayBookings.filter((s) => s.bookingType === 'online');
      const agent = dayBookings.filter((s) => s.bookingType === 'agent');
      const self = dayBookings.filter((s) => s.bookingType === 'self');

      const pendingCollections = agent
        .filter((s) => s.agentCollectionStatus === 'pending')
        .reduce((sum, s) => sum + s.amountFromAgent, 0);

      summaries.push({
        date: dateStr,
        onlineCount: online.length,
        onlineProfit: online.reduce((sum, s) => sum + s.ourEarning, 0),
        agentCount: agent.length,
        agentProfit: agent.reduce((sum, s) => sum + s.ourEarning, 0),
        selfCount: self.length,
        selfProfit: self.reduce((sum, s) => sum + s.ourEarning, 0),
        totalProfit: dayBookings.reduce((sum, s) => sum + s.ourEarning, 0),
        totalSeats: dayBookings.length,
        pendingCollections,
      });

      current.setDate(current.getDate() + 1);
    }

    return summaries;
  };

  return {
    seatBookings,
    loading,
    fetchSeatBookings,
    getSeatsByDate,
    saveSeatBooking,
    markCollected,
    deleteSeatBooking,
    getPendingCollections,
    getDailyProfitSummary,
  };
}
