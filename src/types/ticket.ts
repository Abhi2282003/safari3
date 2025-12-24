export interface Ticket {
  id: string;
  ticketNo: string;
  bookingDateTime: string;
  journeyDate: string;
  passengerName: string;
  passengerPhone: string;
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
}

export interface Payment {
  id: string;
  ticketId: string;
  receivedByName: string;
  paymentMode: 'Cash' | 'UPI' | 'Card' | 'Other';
  paidAmount: number;
  paidAt: string;
}

export interface ReceiverName {
  id: string;
  name: string;
  active: boolean;
}

export interface TravelsConfig {
  id: string;
  name: string;
  commissionPercent: number;
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
  travels?: TravelsConfig[];
}

export interface TicketWithPayment extends Ticket {
  payment?: Payment;
}
