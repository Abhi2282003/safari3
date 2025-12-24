import { Ticket, Payment, ReceiverName, CompanySettings, TicketWithPayment, TravelsConfig } from '@/types/ticket';
import { format } from 'date-fns';

const TICKETS_KEY = 'bus_tickets';
const PAYMENTS_KEY = 'bus_payments';
const RECEIVERS_KEY = 'bus_receivers';
const SETTINGS_KEY = 'bus_settings';
const COUNTER_KEY = 'bus_daily_counter';
const TRAVELS_KEY = 'bus_travels';

// Generate unique ticket number
export const generateTicketNo = (): string => {
  const today = format(new Date(), 'yyyyMMdd');
  const counterKey = `${COUNTER_KEY}_${today}`;
  
  const counter = parseInt(localStorage.getItem(counterKey) || '0', 10) + 1;
  localStorage.setItem(counterKey, counter.toString());
  
  return `ROYAL-${today}-${counter.toString().padStart(4, '0')}`;
};

// Tickets
export const getTickets = (): Ticket[] => {
  const data = localStorage.getItem(TICKETS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveTicket = (ticket: Ticket): void => {
  const tickets = getTickets();
  const existingIndex = tickets.findIndex(t => t.id === ticket.id);
  
  if (existingIndex >= 0) {
    tickets[existingIndex] = ticket;
  } else {
    tickets.push(ticket);
  }
  
  localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
};

export const deleteTicket = (id: string): void => {
  const tickets = getTickets().filter(t => t.id !== id);
  localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
  
  // Also delete associated payment
  const payments = getPayments().filter(p => p.ticketId !== id);
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
};

export const getTicketById = (id: string): Ticket | undefined => {
  return getTickets().find(t => t.id === id);
};

// Payments
export const getPayments = (): Payment[] => {
  const data = localStorage.getItem(PAYMENTS_KEY);
  return data ? JSON.parse(data) : [];
};

export const savePayment = (payment: Payment): void => {
  const payments = getPayments();
  const existingIndex = payments.findIndex(p => p.ticketId === payment.ticketId);
  
  if (existingIndex >= 0) {
    payments[existingIndex] = payment;
  } else {
    payments.push(payment);
  }
  
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
};

export const getPaymentByTicketId = (ticketId: string): Payment | undefined => {
  return getPayments().find(p => p.ticketId === ticketId);
};

// Get tickets with payment info
export const getTicketsWithPayments = (): TicketWithPayment[] => {
  const tickets = getTickets();
  const payments = getPayments();
  
  return tickets.map(ticket => ({
    ...ticket,
    payment: payments.find(p => p.ticketId === ticket.id),
  }));
};

// Receivers
export const getReceivers = (): ReceiverName[] => {
  const data = localStorage.getItem(RECEIVERS_KEY);
  if (!data) {
    // Default receivers
    const defaults: ReceiverName[] = [
      { id: '1', name: 'Owner', active: true },
      { id: '2', name: 'Counter1', active: true },
      { id: '3', name: 'Counter2', active: true },
    ];
    localStorage.setItem(RECEIVERS_KEY, JSON.stringify(defaults));
    return defaults;
  }
  return JSON.parse(data);
};

export const saveReceiver = (receiver: ReceiverName): void => {
  const receivers = getReceivers();
  const existingIndex = receivers.findIndex(r => r.id === receiver.id);
  
  if (existingIndex >= 0) {
    receivers[existingIndex] = receiver;
  } else {
    receivers.push(receiver);
  }
  
  localStorage.setItem(RECEIVERS_KEY, JSON.stringify(receivers));
};

export const deleteReceiver = (id: string): void => {
  const receivers = getReceivers().filter(r => r.id !== id);
  localStorage.setItem(RECEIVERS_KEY, JSON.stringify(receivers));
};

// Company Settings
export const getSettings = (): CompanySettings => {
  const data = localStorage.getItem(SETTINGS_KEY);
  if (!data) {
    const defaults: CompanySettings = {
      name: 'ROYAL TRAVELS',
      address: 'Shop No. 5, Bus Stand Complex, Pune - 411001',
      phone: '+91 98765 43210 / +91 98765 43211',
      footerNote: 'Wish you a Happy Journey!',
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaults));
    return defaults;
  }
  return JSON.parse(data);
};

export const saveSettings = (settings: CompanySettings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

// Travels Management
export const getTravels = (): TravelsConfig[] => {
  const data = localStorage.getItem(TRAVELS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveTravels = (travels: TravelsConfig[]): void => {
  localStorage.setItem(TRAVELS_KEY, JSON.stringify(travels));
};

export const addTravel = (travel: TravelsConfig): void => {
  const travels = getTravels();
  travels.push(travel);
  saveTravels(travels);
};

export const updateTravel = (travel: TravelsConfig): void => {
  const travels = getTravels();
  const index = travels.findIndex(t => t.id === travel.id);
  if (index >= 0) {
    travels[index] = travel;
    saveTravels(travels);
  }
};

export const deleteTravel = (id: string): void => {
  const travels = getTravels().filter(t => t.id !== id);
  saveTravels(travels);
};

// Calculate payable amount (base amount minus commission percentage)
export const calculatePayableAmount = (baseAmount: number, commissionPercent: number): number => {
  const commission = (baseAmount * commissionPercent) / 100;
  return baseAmount - commission;
};

// Get tickets by date
export const getTicketsByDate = (date: Date): TicketWithPayment[] => {
  const dateStr = format(date, 'yyyy-MM-dd');
  return getTicketsWithPayments().filter(ticket => {
    const ticketDate = format(new Date(ticket.bookingDateTime), 'yyyy-MM-dd');
    return ticketDate === dateStr;
  });
};

// Stats for dashboard - collection uses travel's commission percentage
export const getDailyStats = (date: Date) => {
  const tickets = getTicketsByDate(date);
  const travels = getTravels();
  
  const totalTickets = tickets.length;
  const paidTickets = tickets.filter(t => t.collectionStatus === 'Paid');
  const unpaidTickets = tickets.filter(t => t.collectionStatus === 'Unpaid');
  
  // Collection uses base amount minus travel's commission percentage
  const totalCollection = paidTickets.reduce((sum, t) => {
    const baseAmount = t.surcharges ? t.amount - t.surcharges : t.amount;
    const ticketTravel = travels.find(tr => tr.name === t.travelsName);
    const commissionPercent = ticketTravel?.commissionPercent ?? 10; // Default 10% for "Other"
    const payable = calculatePayableAmount(baseAmount, commissionPercent);
    return sum + payable;
  }, 0);
  const totalUnpaid = unpaidTickets.reduce((sum, t) => {
    const baseAmount = t.surcharges ? t.amount - t.surcharges : t.amount;
    const ticketTravel = travels.find(tr => tr.name === t.travelsName);
    const commissionPercent = ticketTravel?.commissionPercent ?? 10; // Default 10% for "Other"
    const payable = calculatePayableAmount(baseAmount, commissionPercent);
    return sum + payable;
  }, 0);
  
  return {
    totalTickets,
    totalCollection,
    totalUnpaid,
    paidCount: paidTickets.length,
    unpaidCount: unpaidTickets.length,
  };
};
