-- Create luggage_bookings table for tracking luggage with 30% profit
CREATE TABLE public.luggage_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  journey_date DATE NOT NULL,
  bus_name TEXT NOT NULL,
  destination TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  our_earning NUMERIC NOT NULL DEFAULT 0,
  amount_to_owner NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.luggage_bookings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own luggage_bookings" 
ON public.luggage_bookings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own luggage_bookings" 
ON public.luggage_bookings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own luggage_bookings" 
ON public.luggage_bookings FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own luggage_bookings" 
ON public.luggage_bookings FOR DELETE 
USING (auth.uid() = user_id);

-- Add update trigger
CREATE TRIGGER update_luggage_bookings_updated_at
BEFORE UPDATE ON public.luggage_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();