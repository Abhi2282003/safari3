import { fetchAll } from '@/lib/fetchAll';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { toast } from 'sonner';

export interface Ticket {
  id: string;
  ticketNo: string;
  bookingDateTime: string;
  journeyDate: string;
  passengerName: string;
  passengerPhone: string;
  pickup?: string;
  toursTo: string;
  noOfTourist: number;
  seatNo?: string;
  repTime?: string;
  depTime?: string;
  amount: number;
  surcharges?: number;
  travelsName?: string;
  busName?: string;
  busNo?: string;
  branch?: string;
  bookedBy?: string;
  withFamily?: boolean;
  collectionStatus: 'Paid' | 'Unpaid';
  paymentMode?: 'Cash' | 'UPI' | 'Card' | 'Other';
}

export interface Payment {
  id: string;
  ticketId: string;
  receivedByName: string;
  paymentMode: 'Cash' | 'UPI' | 'Card' | 'Other';
  paidAmount: number;
  paidAt: string;
}

export interface TicketWithPayment extends Ticket {
  payment?: Payment;
}

export interface TravelsConfig {
  id: string;
  name: string;
  commissionPercent: number;
  active: boolean;
}

export interface ReceiverName {
  id: string;
  name: string;
  active: boolean;
}

export interface PickupLocation {
  id: string;
  name: string;
  active: boolean;
}

export interface CompanySettings {
  name: string;
  address: string;
  phone: string;
  logoUrl?: string;
  footerNote: string;
  ticketWidth?: number;
  ticketHeight?: number;
}

// Generate ticket number using database function
export async function generateTicketNo(): Promise<string> {
  const { data, error } = await supabase.rpc('next_ticket_no');
  if (error) throw error;
  return data as string;
}

// Get next ticket number (preview without incrementing)
export async function getNextTicketNumber(userId: string): Promise<string> {
  const today = format(new Date(), 'yyyyMMdd');
  
  // Use the global counter date (1970-01-01) as set in the database function
  const { data: existing } = await supabase
    .from('ticket_counters')
    .select('counter_value')
    .eq('user_id', userId)
    .eq('counter_date', '1970-01-01')
    .maybeSingle();

  const counter = (existing?.counter_value ?? 0) + 1;
  return `ROYAL-${today}-${counter.toString().padStart(4, '0')}`;
}


export function useTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketWithPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    if (!user) return;
    
    const { data: ticketsData, error } = await fetchAll<any>(() => supabase
      .from('tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('booking_date_time', { ascending: false }));

    if (error) {
      console.error('Error fetching tickets:', error);
      return;
    }

    const { data: paymentsData } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', user.id);

    const ticketsWithPayments: TicketWithPayment[] = (ticketsData || []).map((t) => ({
      id: t.id,
      ticketNo: t.ticket_no,
      bookingDateTime: t.booking_date_time,
      journeyDate: t.journey_date,
      passengerName: t.passenger_name,
      passengerPhone: t.passenger_phone,
      pickup: t.passenger_address || undefined,
      toursTo: t.tours_to,
      noOfTourist: t.no_of_tourist,
      seatNo: t.seat_no || undefined,
      repTime: t.rep_time || undefined,
      depTime: t.dep_time || undefined,
      amount: Number(t.amount),
      surcharges: t.surcharges ? Number(t.surcharges) : undefined,
      travelsName: t.travels_name || undefined,
      busName: t.bus_name || undefined,
      busNo: t.bus_no || undefined,
      branch: t.branch || undefined,
      bookedBy: t.booked_by || undefined,
      withFamily: t.with_family || false,
      collectionStatus: t.collection_status as 'Paid' | 'Unpaid',
      paymentMode: (t as any).payment_mode as Ticket['paymentMode'] || undefined,
      payment: paymentsData?.find((p) => p.ticket_id === t.id)
        ? {
            id: paymentsData.find((p) => p.ticket_id === t.id)!.id,
            ticketId: paymentsData.find((p) => p.ticket_id === t.id)!.ticket_id,
            receivedByName: paymentsData.find((p) => p.ticket_id === t.id)!.received_by_name,
            paymentMode: paymentsData.find((p) => p.ticket_id === t.id)!.payment_mode as Payment['paymentMode'],
            paidAmount: Number(paymentsData.find((p) => p.ticket_id === t.id)!.paid_amount),
            paidAt: paymentsData.find((p) => p.ticket_id === t.id)!.paid_at,
          }
        : undefined,
    }));

    setTickets(ticketsWithPayments);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('tickets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchTickets]);

  const getTicketsByDate = (date: Date): TicketWithPayment[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return tickets.filter((ticket) => {
      const ticketDate = format(new Date(ticket.bookingDateTime), 'yyyy-MM-dd');
      return ticketDate === dateStr;
    });
  };

  const getTicketById = (id: string): TicketWithPayment | undefined => {
    return tickets.find((t) => t.id === id);
  };

  const saveTicket = async (ticket: Omit<Ticket, 'id' | 'ticketNo'> & { id?: string; ticketNo?: string }) => {
    if (!user) return null;

    const ticketNo = ticket.ticketNo || (await generateTicketNo());

    const dbTicket: Record<string, any> = {
      user_id: user.id,
      ticket_no: ticketNo,
      booking_date_time: ticket.bookingDateTime,
      journey_date: ticket.journeyDate,
      passenger_name: ticket.passengerName,
      passenger_phone: ticket.passengerPhone,
      passenger_address: ticket.pickup || null,
      tours_to: ticket.toursTo,
      no_of_tourist: ticket.noOfTourist,
      seat_no: ticket.seatNo || null,
      rep_time: ticket.repTime || null,
      dep_time: ticket.depTime || null,
      amount: ticket.amount,
      surcharges: ticket.surcharges || null,
      travels_name: ticket.travelsName || null,
      bus_name: ticket.busName || null,
      bus_no: ticket.busNo || null,
      branch: ticket.branch || null,
      booked_by: ticket.bookedBy || null,
      with_family: ticket.withFamily || false,
      collection_status: ticket.collectionStatus,
      payment_mode: ticket.paymentMode || null,
    };

    if (ticket.id) {
      const { error } = await supabase
        .from('tickets')
        .update(dbTicket as any)
        .eq('id', ticket.id);
      
      if (error) {
        console.error('Error updating ticket:', error);
        throw error;
      }
      return ticket.id;
    } else {
      const { data, error } = await supabase
        .from('tickets')
        .insert(dbTicket as any)
        .select('id')
        .single();
      
      if (error) {
        console.error('Error creating ticket:', error);
        throw error;
      }
      return data.id;
    }
  };

  const deleteTicket = async (id: string) => {
    if (!user) throw new Error('User not authenticated');
    
    // First delete associated payment (if exists)
    await supabase.from('payments').delete().eq('ticket_id', id).eq('user_id', user.id);
    
    // Then delete the ticket
    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) throw error;
    
    // Refresh tickets after deletion
    await fetchTickets();
  };

  const savePayment = async (payment: Omit<Payment, 'id'>) => {
    if (!user) return;

    const { error: paymentError } = await supabase.from('payments').upsert({
      user_id: user.id,
      ticket_id: payment.ticketId,
      received_by_name: payment.receivedByName,
      payment_mode: payment.paymentMode,
      paid_amount: payment.paidAmount,
      paid_at: payment.paidAt,
    }, { onConflict: 'ticket_id' });

    if (paymentError) throw paymentError;

    const { error: ticketError } = await supabase
      .from('tickets')
      .update({ collection_status: 'Paid' })
      .eq('id', payment.ticketId);

    if (ticketError) throw ticketError;

    await fetchTickets();
  };

  return {
    tickets,
    loading,
    fetchTickets,
    getTicketsByDate,
    getTicketById,
    saveTicket,
    deleteTicket,
    savePayment,
  };
}

export function useReceivers() {
  const { user } = useAuth();
  const [receivers, setReceivers] = useState<ReceiverName[]>([]);

  const fetchReceivers = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('receivers')
      .select('*');


    if (error) {
      console.error('Error fetching receivers:', error);
      return;
    }

    if (data.length === 0) {
      // Create defaults
      const defaults = [
        { user_id: user.id, name: 'Owner', active: true },
        { user_id: user.id, name: 'Counter1', active: true },
        { user_id: user.id, name: 'Counter2', active: true },
      ];
      await supabase.from('receivers').insert(defaults);
      setReceivers(defaults.map((d, i) => ({ id: `default-${i}`, name: d.name, active: d.active })));
      return;
    }

    setReceivers(data.map((r) => ({ id: r.id, name: r.name, active: r.active ?? true })));
  }, [user]);

  useEffect(() => {
    fetchReceivers();
  }, [fetchReceivers]);

  const saveReceiver = async (receiver: Omit<ReceiverName, 'id'> & { id?: string }) => {
    if (!user) return;

    if (receiver.id) {
      await supabase
        .from('receivers')
        .update({ name: receiver.name, active: receiver.active })
        .eq('id', receiver.id);
    } else {
      await supabase.from('receivers').insert({
        user_id: user.id,
        name: receiver.name,
        active: receiver.active,
      });
    }
    await fetchReceivers();
  };

  const deleteReceiver = async (id: string) => {
    await supabase.from('receivers').delete().eq('id', id);
    await fetchReceivers();
  };

  return { receivers, fetchReceivers, saveReceiver, deleteReceiver };
}

export function useTravels() {
  const { user } = useAuth();
  const [travels, setTravels] = useState<TravelsConfig[]>([]);

  const fetchTravels = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('travels')
      .select('*');

    if (error) {
      console.error('Error fetching travels:', error);
      return;
    }


    setTravels(data.map((t) => ({
      id: t.id,
      name: t.name,
      commissionPercent: Number(t.commission_percent),
      active: t.active ?? true,
    })));
  }, [user]);

  useEffect(() => {
    fetchTravels();
  }, [fetchTravels]);

  const saveTravel = async (travel: Omit<TravelsConfig, 'id'> & { id?: string }) => {
    if (!user) return;

    if (travel.id) {
      await supabase
        .from('travels')
        .update({
          name: travel.name,
          commission_percent: travel.commissionPercent,
          active: travel.active,
        })
        .eq('id', travel.id);
    } else {
      await supabase.from('travels').insert({
        user_id: user.id,
        name: travel.name,
        commission_percent: travel.commissionPercent,
        active: travel.active,
      });
    }
    await fetchTravels();
  };

  const deleteTravel = async (id: string) => {
    await supabase.from('travels').delete().eq('id', id);
    await fetchTravels();
  };

  return { travels, fetchTravels, saveTravel, deleteTravel };
}

export function usePickupLocations() {
  const { user } = useAuth();
  const [pickups, setPickups] = useState<PickupLocation[]>([]);

  const fetchPickups = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('pickup_locations')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching pickup locations:', error);
      return;
    }

    setPickups(data.map((p) => ({
      id: p.id,
      name: p.name,
      active: p.active ?? true,
    })));
  }, [user]);

  useEffect(() => {
    fetchPickups();
  }, [fetchPickups]);

  return { pickups, fetchPickups };
}

export function useSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<CompanySettings>({
    name: 'ROYAL TRAVELS',
    address: '',
    phone: '',
    footerNote: 'Wish you a Happy Journey!',
  });

  const fetchSettings = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching settings:', error);
      return;
    }

    if (data) {
      setSettings({
        name: data.name,
        address: data.address || '',
        phone: data.phone || '',
        logoUrl: data.logo_url || undefined,
        footerNote: data.footer_note || 'Wish you a Happy Journey!',
        ticketWidth: data.ticket_width || 280,
        ticketHeight: data.ticket_height || 140,
      });
    }
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSettings = async (newSettings: CompanySettings) => {
    if (!user) return;

    const { error } = await supabase.from('company_settings').upsert({
      user_id: user.id,
      name: newSettings.name,
      address: newSettings.address,
      phone: newSettings.phone,
      logo_url: newSettings.logoUrl || null,
      footer_note: newSettings.footerNote,
      ticket_width: newSettings.ticketWidth || 280,
      ticket_height: newSettings.ticketHeight || 140,
    }, { onConflict: 'user_id' });

    if (error) throw error;
    setSettings(newSettings);
  };

  return { settings, fetchSettings, saveSettings };
}

// Stats calculation
export function calculateStats(tickets: TicketWithPayment[], travels: TravelsConfig[]) {
  const paidTickets = tickets.filter((t) => t.collectionStatus === 'Paid');
  const unpaidTickets = tickets.filter((t) => t.collectionStatus === 'Unpaid');

  const calculatePayable = (ticket: TicketWithPayment) => {
    const baseAmount = ticket.surcharges ? ticket.amount - ticket.surcharges : ticket.amount;
    const travel = travels.find((t) => t.name === ticket.travelsName);
    const commission = travel?.commissionPercent ?? 10;
    return baseAmount - (baseAmount * commission) / 100;
  };

  return {
    totalTickets: tickets.length,
    totalCollection: paidTickets.reduce((sum, t) => sum + calculatePayable(t), 0),
    totalUnpaid: unpaidTickets.reduce((sum, t) => sum + calculatePayable(t), 0),
    paidCount: paidTickets.length,
    unpaidCount: unpaidTickets.length,
  };
}
