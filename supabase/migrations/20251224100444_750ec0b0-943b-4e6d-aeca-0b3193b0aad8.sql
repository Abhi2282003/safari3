-- Create tickets table
CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ticket_no TEXT NOT NULL UNIQUE,
  booking_date_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  journey_date DATE NOT NULL,
  passenger_name TEXT NOT NULL,
  passenger_phone TEXT NOT NULL,
  passenger_address TEXT,
  tours_to TEXT NOT NULL,
  no_of_tourist INTEGER NOT NULL DEFAULT 1,
  seat_no TEXT,
  rep_time TEXT,
  dep_time TEXT,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  surcharges DECIMAL(10,2) DEFAULT 0,
  travels_name TEXT,
  bus_name TEXT,
  bus_no TEXT,
  branch TEXT,
  booked_by TEXT,
  with_family BOOLEAN DEFAULT false,
  collection_status TEXT NOT NULL DEFAULT 'Unpaid' CHECK (collection_status IN ('Paid', 'Unpaid')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  received_by_name TEXT NOT NULL,
  payment_mode TEXT NOT NULL CHECK (payment_mode IN ('Cash', 'UPI', 'Card', 'Other')),
  paid_amount DECIMAL(10,2) NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create receivers table (booked by persons)
CREATE TABLE public.receivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create travels table (travel companies with commission)
CREATE TABLE public.travels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  commission_percent DECIMAL(5,2) NOT NULL DEFAULT 10,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create company settings table
CREATE TABLE public.company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT 'ROYAL TRAVELS',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  logo_url TEXT,
  footer_note TEXT DEFAULT 'Wish you a Happy Journey!',
  ticket_width INTEGER DEFAULT 280,
  ticket_height INTEGER DEFAULT 140,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ticket counter table for generating ticket numbers
CREATE TABLE public.ticket_counters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  counter_date DATE NOT NULL,
  counter_value INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, counter_date)
);

-- Enable RLS on all tables
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_counters ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tickets
CREATE POLICY "Users can view their own tickets" ON public.tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own tickets" ON public.tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tickets" ON public.tickets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tickets" ON public.tickets FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for payments
CREATE POLICY "Users can view their own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own payments" ON public.payments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own payments" ON public.payments FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for receivers
CREATE POLICY "Users can view their own receivers" ON public.receivers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own receivers" ON public.receivers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own receivers" ON public.receivers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own receivers" ON public.receivers FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for travels
CREATE POLICY "Users can view their own travels" ON public.travels FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own travels" ON public.travels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own travels" ON public.travels FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own travels" ON public.travels FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for company_settings
CREATE POLICY "Users can view their own settings" ON public.company_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own settings" ON public.company_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON public.company_settings FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for ticket_counters
CREATE POLICY "Users can view their own counters" ON public.ticket_counters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own counters" ON public.ticket_counters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own counters" ON public.ticket_counters FOR UPDATE USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_company_settings_updated_at BEFORE UPDATE ON public.company_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for tickets table
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;