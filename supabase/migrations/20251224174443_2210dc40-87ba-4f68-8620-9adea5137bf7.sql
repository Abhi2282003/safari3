-- Create booking type enum
CREATE TYPE public.booking_type AS ENUM ('online', 'agent', 'self');

-- Create agents table for tracking agent bookings
CREATE TABLE public.agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on agents
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- RLS policies for agents
CREATE POLICY "Users can view their own agents" ON public.agents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own agents" ON public.agents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own agents" ON public.agents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own agents" ON public.agents FOR DELETE USING (auth.uid() = user_id);

-- Create seat_bookings table for tracking each seat
CREATE TABLE public.seat_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
  journey_date DATE NOT NULL,
  seat_number INTEGER NOT NULL CHECK (seat_number >= 1 AND seat_number <= 36),
  booking_type booking_type NOT NULL DEFAULT 'self',
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  booking_amount NUMERIC NOT NULL DEFAULT 0,
  commission_percent NUMERIC NOT NULL DEFAULT 0,
  our_earning NUMERIC NOT NULL DEFAULT 0,
  amount_to_owner NUMERIC NOT NULL DEFAULT 0,
  amount_from_agent NUMERIC NOT NULL DEFAULT 0,
  agent_collection_status TEXT NOT NULL DEFAULT 'pending' CHECK (agent_collection_status IN ('pending', 'collected', 'not_applicable')),
  collected_at TIMESTAMP WITH TIME ZONE,
  travels_name TEXT,
  bus_name TEXT,
  passenger_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, journey_date, seat_number)
);

-- Enable RLS on seat_bookings
ALTER TABLE public.seat_bookings ENABLE ROW LEVEL SECURITY;

-- RLS policies for seat_bookings
CREATE POLICY "Users can view their own seat_bookings" ON public.seat_bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own seat_bookings" ON public.seat_bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own seat_bookings" ON public.seat_bookings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own seat_bookings" ON public.seat_bookings FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at on seat_bookings
CREATE TRIGGER update_seat_bookings_updated_at
  BEFORE UPDATE ON public.seat_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create agent_collections table for tracking pending collections
CREATE TABLE public.agent_collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  seat_booking_id UUID NOT NULL REFERENCES public.seat_bookings(id) ON DELETE CASCADE,
  amount_due NUMERIC NOT NULL DEFAULT 0,
  amount_collected NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'collected')),
  collected_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on agent_collections
ALTER TABLE public.agent_collections ENABLE ROW LEVEL SECURITY;

-- RLS policies for agent_collections
CREATE POLICY "Users can view their own agent_collections" ON public.agent_collections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own agent_collections" ON public.agent_collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own agent_collections" ON public.agent_collections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own agent_collections" ON public.agent_collections FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at on agent_collections
CREATE TRIGGER update_agent_collections_updated_at
  BEFORE UPDATE ON public.agent_collections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();